import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { prisma } from '@/lib/db/client';
import { createLogger } from '@/lib/logger';
import { findByBarcode } from '@/lib/products/barcode-matching';
import type { IngestionProvider, IngestionResult } from './types';

const log = createLogger('ingestion:shufersal');

// ── Types ──

export interface ShufersalItem {
  PriceUpdateDate: string;
  ItemCode: string;
  ItemType: string;
  ItemName: string;
  ManufacturerName: string;
  ManufactureCountry: string;
  ManufacturerItemDescription: string;
  UnitQty: string;
  Quantity: string;
  bIsWeighted: string;
  UnitOfMeasure: string;
  QtyInPackage: string;
  ItemPrice: string;
  UnitOfMeasurePrice: string;
  AllowDiscount: string;
  ItemStatus: string;
}

interface CategoryMatch {
  categorySlug: string;
  attributes: Record<string, string>;
  brand: string | null;
}

interface CategoryMatcher {
  categorySlug: string;
  patterns: RegExp[];
  excludePatterns: RegExp[];
  extractAttributes: (item: ShufersalItem) => Record<string, string>;
}

// ── Brand Mapping ──

const BRAND_MAP: Record<string, string> = {
  'תנובה': 'תנובה',
  'שטראוס': 'שטראוס',
  'טרה': 'טרה',
  'אסם': 'אוסם',
  'אוסם': 'אוסם',
  'סוגת': 'סוגת',
  'סטארקיסט': 'סטארקיסט',
  'דנונה': 'דנונה',
  'יופלה': 'יופלה',
  'טילדה': 'טילדה',
  'ברמן': 'ברמן',
  'לסר': 'לסר',
  'נסטלה': 'נסטלה',
  'עוף הגליל': 'עוף הגליל',
  'עוף טוב': 'עוף טוב',
  'של-י': 'שלי',
  'שלי': 'שלי',
  'עלית': 'עלית',
  'גולדסטאר': 'גולדסטאר',
  'מקבי': 'מקבי',
  'נביעות': 'נביעות',
  'מי עדן': 'מי עדן',
};

export function normalizeBrand(manufacturerName: string, itemName: string): string | null {
  // Try direct match from manufacturer name
  const trimmed = manufacturerName.trim();
  for (const [key, value] of Object.entries(BRAND_MAP)) {
    if (trimmed.includes(key)) {
      return value;
    }
  }

  // Try extracting from item name
  for (const [key, value] of Object.entries(BRAND_MAP)) {
    if (itemName.includes(key)) {
      return value;
    }
  }

  // Return the manufacturer name as-is if non-empty
  if (trimmed.length > 0) {
    return trimmed;
  }

  return null;
}

// ── Category Matchers ──

const CATEGORY_MATCHERS: CategoryMatcher[] = [
  {
    categorySlug: 'milk',
    patterns: [/חלב/],
    excludePatterns: [/שוקולד/, /חלב מרוכז/, /אבקת חלב/, /חלב קוקוס/, /קוטג/, /יוגורט/, /שמנת/, /גבינ/],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Fat percentage
      const fatMatch = name.match(/(\d+)%/);
      if (fatMatch) {
        attrs.fat = `${fatMatch[1]}%`;
      } else if (/דל שומן/.test(name)) {
        attrs.fat = 'דל שומן';
      }

      // Volume in liters
      const volumeL = name.match(/(\d+\.?\d*)\s*ל[יטר']*$/u) || name.match(/(\d+\.?\d*)\s*ל['"]?/);
      if (volumeL) {
        const val = parseFloat(volumeL[1]);
        if (val <= 3) {
          attrs.volume = val === 1 ? '1 ליטר' : val === 2 ? '2 ליטר' : val === 0.5 ? '0.5 ליטר' : `${val} ליטר`;
        }
      }

      // Type
      if (/לקטוז|ללא לקטוז|דל לקטוז/.test(name)) {
        attrs.type = 'ללא לקטוז';
      } else if (/אורגני/.test(name)) {
        attrs.type = 'אורגני';
      } else {
        attrs.type = 'רגיל';
      }

      return attrs;
    },
  },
  {
    categorySlug: 'eggs',
    patterns: [/ביצ/],
    excludePatterns: [/חביתה/, /ביצת שוקולד/, /פסטה/],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Size
      if (/\bXL\b/i.test(name)) {
        attrs.size = 'XL';
      } else if (/\bL\b/.test(name)) {
        attrs.size = 'L';
      } else if (/\bM\b/.test(name)) {
        attrs.size = 'M';
      }

      // Pack count
      const countMatch = name.match(/(\d+)\s*ביצ/) || name.match(/ביצ\S*\s+(\d+)/);
      if (countMatch) {
        const count = parseInt(countMatch[1]);
        if (count === 6 || count === 12) {
          attrs.packCount = String(count);
        }
      }

      // Type
      if (/אורגני/.test(name)) {
        attrs.type = 'אורגני';
      } else if (/חופש/.test(name)) {
        attrs.type = 'חופש';
      } else if (/אומגה/.test(name)) {
        attrs.type = 'רגיל';
      } else {
        attrs.type = 'רגיל';
      }

      return attrs;
    },
  },
  {
    categorySlug: 'cottage-cheese',
    patterns: [/קוטג/],
    excludePatterns: [],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Fat percentage
      const fatMatch = name.match(/(\d+)%/);
      if (fatMatch) {
        attrs.fat = `${fatMatch[1]}%`;
      }

      // Weight
      const weightMatch = name.match(/(\d+)\s*ג/);
      if (weightMatch) {
        const grams = parseInt(weightMatch[1]);
        if (grams <= 200) {
          attrs.weight = '200 גרם';
        } else if (grams <= 250) {
          attrs.weight = '250 גרם';
        } else {
          attrs.weight = '500 גרם';
        }
      }

      return attrs;
    },
  },
  {
    categorySlug: 'yogurt',
    patterns: [/יוגורט/],
    excludePatterns: [],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Fat percentage
      const fatMatch = name.match(/(\d+)%/);
      if (fatMatch) {
        const fat = parseInt(fatMatch[1]);
        if (fat === 0) attrs.fat = '0%';
        else if (fat <= 2) attrs.fat = '2%';
        else if (fat <= 5) attrs.fat = '5%';
        else attrs.fat = `${fat}%`;
      }

      // Weight
      const weightMatch = name.match(/(\d+)\s*גר?/);
      if (weightMatch) {
        const grams = parseInt(weightMatch[1]);
        if (grams <= 150) {
          attrs.weight = '150 גרם';
        } else if (grams <= 200) {
          attrs.weight = '200 גרם';
        } else {
          attrs.weight = '500 גרם';
        }
      }

      // Type
      if (/יווני/.test(name)) {
        attrs.type = 'יווני';
      } else if (/תות|פירות|וניל|אפרסק|דובדבן|בננה/.test(name)) {
        attrs.type = 'פירות';
      } else {
        attrs.type = 'טבעי';
      }

      return attrs;
    },
  },
  {
    categorySlug: 'bread',
    patterns: [/לחם/],
    excludePatterns: [/פירורי לחם/, /לחמניה/, /לחמנייה/, /טוסט/],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Type
      if (/מלא|כוסמין|whole/.test(name)) {
        attrs.type = 'מלא';
      } else if (/שיפון/.test(name)) {
        attrs.type = 'שיפון';
      } else if (/רב.?דגנים|multi/.test(name)) {
        attrs.type = 'רב דגנים';
      } else {
        attrs.type = 'לבן';
      }

      // Weight
      const weightG = name.match(/(\d+)\s*גר/);
      const weightKg = name.match(/(\d+\.?\d*)\s*ק/);
      if (weightG) {
        const grams = parseInt(weightG[1]);
        if (grams <= 500) attrs.weight = '500 גרם';
        else if (grams <= 750) attrs.weight = '750 גרם';
        else attrs.weight = '1 ק״ג';
      } else if (weightKg) {
        attrs.weight = '1 ק״ג';
      }

      return attrs;
    },
  },
  {
    categorySlug: 'rice',
    patterns: [/אורז/],
    excludePatterns: [/חומץ אורז/, /נייר אורז/, /חלב אורז/],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Type
      if (/בסמטי/.test(name)) {
        attrs.type = 'בסמטי';
      } else if (/יסמין/.test(name)) {
        attrs.type = 'יסמין';
      } else if (/חום/.test(name)) {
        attrs.type = 'חום';
      } else if (/תאילנדי|פרסי|לבן/.test(name)) {
        attrs.type = 'לבן';
      } else {
        attrs.type = 'לבן';
      }

      // Weight
      const weightKg = name.match(/(\d+\.?\d*)\s*ק/);
      const weightG = name.match(/(\d+)\s*גר/);
      if (weightKg) {
        const kg = parseFloat(weightKg[1]);
        if (kg <= 0.5) attrs.weight = '500 גרם';
        else if (kg <= 1) attrs.weight = '1 ק״ג';
        else attrs.weight = '2 ק״ג';
      } else if (weightG) {
        const grams = parseInt(weightG[1]);
        if (grams <= 500) attrs.weight = '500 גרם';
        else if (grams <= 1000) attrs.weight = '1 ק״ג';
        else attrs.weight = '2 ק״ג';
      }

      return attrs;
    },
  },
  {
    categorySlug: 'pasta',
    patterns: [/פסטה|ספגטי|פנה|מקרוני|פוזילי|תלתלים|מסולסל/],
    excludePatterns: [/רוטב פסטה/, /תבלין/],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Type
      if (/ספגטי/.test(name)) {
        attrs.type = 'ספגטי';
      } else if (/פנה/.test(name)) {
        attrs.type = 'פנה';
      } else if (/מקרוני/.test(name)) {
        attrs.type = 'מקרוני';
      } else if (/מסולסל|תלתלים|פוזילי/.test(name)) {
        attrs.type = 'פוזילי';
      } else {
        attrs.type = 'ספגטי';
      }

      // Weight
      const weightG = name.match(/(\d+)\s*גר/);
      const weightKg = name.match(/(\d+\.?\d*)\s*ק/);
      if (weightG) {
        const grams = parseInt(weightG[1]);
        if (grams <= 500) attrs.weight = '500 גרם';
        else attrs.weight = '1 ק״ג';
      } else if (weightKg) {
        attrs.weight = '1 ק״ג';
      }

      return attrs;
    },
  },
  {
    categorySlug: 'tomatoes',
    patterns: [/עגבני/],
    excludePatterns: [/רסק עגבניות/, /רוטב עגבניות/, /עגבניות מיובשות/, /עגבניות חצויות/, /עגבניות מרוסקות/, /קטשופ/, /משחת עגבניות/],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Type
      if (/תמר|שרי|cherry/i.test(name)) {
        attrs.type = 'שרי';
      } else if (/רומא/.test(name)) {
        attrs.type = 'רומא';
      } else {
        attrs.type = 'רגיל';
      }

      // Weight from Quantity field
      const qty = parseFloat(item.Quantity);
      if (!isNaN(qty) && qty > 0) {
        if (qty <= 500) attrs.weight = '500 גרם';
        else attrs.weight = '1 ק״ג';
      }

      return attrs;
    },
  },
  {
    categorySlug: 'cucumbers',
    patterns: [/מלפפון/],
    excludePatterns: [/חמוץ/, /כבוש/, /חמוצים/],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Type
      if (/בייבי|פרסי|mini/i.test(name)) {
        attrs.type = 'פרסי';
      } else if (/אנגלי/.test(name)) {
        attrs.type = 'אנגלי';
      } else {
        attrs.type = 'רגיל';
      }

      // Quantity
      attrs.quantity = 'יחידה';

      return attrs;
    },
  },
  {
    categorySlug: 'chicken-breast',
    patterns: [/חזה עוף/],
    excludePatterns: [/שניצל/, /נקניק/],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Type
      if (/אורגני/.test(name)) {
        attrs.type = 'אורגני';
      } else if (/חופש/.test(name)) {
        attrs.type = 'חופש';
      } else {
        attrs.type = 'רגיל';
      }

      // Weight
      const weightKg = name.match(/(\d+\.?\d*)\s*ק/);
      const weightG = name.match(/(\d+)\s*גר/);
      if (weightKg) {
        attrs.weight = '1 ק״ג';
      } else if (weightG) {
        const grams = parseInt(weightG[1]);
        if (grams <= 500) attrs.weight = '500 גרם';
        else attrs.weight = '1 ק״ג';
      } else {
        // Default for chicken sold by weight (per kg)
        attrs.weight = '1 ק״ג';
      }

      return attrs;
    },
  },
  {
    categorySlug: 'tuna',
    patterns: [/טונה/],
    excludePatterns: [/סלט טונה/, /ממרח טונה/],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Type
      if (/במים/.test(name)) {
        attrs.type = 'במים';
      } else if (/מלח|ציר/.test(name)) {
        attrs.type = 'בציר מלח';
      } else if (/בשמן|שמן/.test(name)) {
        attrs.type = 'בשמן';
      } else {
        attrs.type = 'בשמן';
      }

      // Weight - extract total weight from multi-pack patterns like "4*160ג" or "3*80 גרם"
      const multiMatch = name.match(/(\d+)\s*\*\s*(\d+)\s*ג/) || name.match(/(\d+)\s*[xX]\s*(\d+)\s*ג/);
      const singleMatch = name.match(/(\d+)\s*גר/);
      if (multiMatch) {
        const total = parseInt(multiMatch[1]) * parseInt(multiMatch[2]);
        if (total <= 120) attrs.weight = '120 גרם';
        else if (total <= 185) attrs.weight = '185 גרם';
        else attrs.weight = '400 גרם';
      } else if (singleMatch) {
        const grams = parseInt(singleMatch[1]);
        if (grams <= 120) attrs.weight = '120 גרם';
        else if (grams <= 185) attrs.weight = '185 גרם';
        else attrs.weight = '400 גרם';
      }

      return attrs;
    },
  },
  {
    categorySlug: 'cereal',
    patterns: [/דגני בוקר|קורנפלקס|גרנולה|מוזלי|שיבולת שועל|קראנץ|נסקוויק/],
    excludePatterns: [],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Type
      if (/גרנולה/.test(name)) {
        attrs.type = 'גרנולה';
      } else if (/מוזלי/.test(name)) {
        attrs.type = 'מוזלי';
      } else if (/שיבולת שועל/.test(name)) {
        attrs.type = 'שיבולת שועל';
      } else {
        attrs.type = 'קורנפלקס';
      }

      // Weight
      const weightG = name.match(/(\d+)\s*גר/);
      const weightKg = name.match(/(\d+\.?\d*)\s*ק/);
      if (weightG) {
        const grams = parseInt(weightG[1]);
        if (grams <= 375) attrs.weight = '375 גרם';
        else if (grams <= 500) attrs.weight = '500 גרם';
        else attrs.weight = '750 גרם';
      } else if (weightKg) {
        attrs.weight = '750 גרם';
      }

      return attrs;
    },
  },
  {
    categorySlug: 'coffee',
    patterns: [/קפה/, /קפסולות/],
    excludePatterns: [/קפה קר/, /קפה מוכן/, /קרם קפה/],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Type
      if (/קפסולות|קפסולה|נספרסו/.test(name)) {
        attrs.type = 'קפסולות';
      } else if (/טורקי/.test(name)) {
        attrs.type = 'טורקי';
      } else if (/נמס|גולד/.test(name)) {
        attrs.type = 'נמס';
      } else if (/פולים/.test(name)) {
        attrs.type = 'פולים';
      } else {
        attrs.type = 'נמס';
      }

      // Weight
      const weightG = name.match(/(\d+)\s*ג/);
      if (weightG) {
        const grams = parseInt(weightG[1]);
        if (grams <= 100) attrs.weight = '100 גרם';
        else if (grams <= 200) attrs.weight = '200 גרם';
        else attrs.weight = '500 גרם';
      }

      return attrs;
    },
  },
  {
    categorySlug: 'oil',
    patterns: [/שמן/],
    excludePatterns: [/שמנת/, /שמן דגים/, /שמן גוף/, /שמן שיער/, /שמן תינוק/],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Type
      if (/זית/.test(name)) {
        attrs.type = 'זית';
      } else if (/קנולה/.test(name)) {
        attrs.type = 'קנולה';
      } else if (/חמניות/.test(name)) {
        attrs.type = 'חמניות';
      } else {
        attrs.type = 'צמחי';
      }

      // Volume
      const volumeMl = name.match(/(\d+)\s*מ[״"']?ל/);
      const volumeL = name.match(/(\d+\.?\d*)\s*ל[יטר']*/) || name.match(/(\d+\.?\d*)\s*ל$/);
      if (volumeMl) {
        const ml = parseInt(volumeMl[1]);
        if (ml <= 500) attrs.volume = '500 מ״ל';
        else if (ml <= 750) attrs.volume = '750 מ״ל';
        else attrs.volume = '1 ליטר';
      } else if (volumeL) {
        const l = parseFloat(volumeL[1]);
        if (l <= 0.75) attrs.volume = '750 מ״ל';
        else attrs.volume = '1 ליטר';
      }

      return attrs;
    },
  },
  {
    categorySlug: 'sugar',
    patterns: [/סוכר/],
    excludePatterns: [/סוכריות/, /סוכרייה/],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Type
      if (/חום|דמררה/.test(name)) {
        attrs.type = 'חום';
      } else if (/סוכרזית|ממתיק/.test(name)) {
        attrs.type = 'סוכרזית';
      } else {
        attrs.type = 'לבן';
      }

      // Weight
      const weightKg = name.match(/(\d+\.?\d*)\s*ק/);
      const weightG = name.match(/(\d+)\s*ג/);
      if (weightKg) {
        attrs.weight = '1 ק״ג';
      } else if (weightG) {
        const grams = parseInt(weightG[1]);
        if (grams <= 500) attrs.weight = '500 גרם';
        else attrs.weight = '1 ק״ג';
      }

      return attrs;
    },
  },
  {
    categorySlug: 'snacks',
    patterns: [/במבה|ביסלי|צ'?יפס|פופקורן|חטיף/],
    excludePatterns: [/חטיף חלבון/, /חטיף בריאות/],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Type
      if (/במבה/.test(name)) {
        attrs.type = 'במבה';
      } else if (/ביסלי/.test(name)) {
        attrs.type = 'ביסלי';
      } else if (/צ'?יפס|תפוצ'?יפס/.test(name)) {
        attrs.type = 'צ׳יפס';
      } else if (/פופקורן/.test(name)) {
        attrs.type = 'פופקורן';
      } else {
        attrs.type = 'אחר';
      }

      // Weight
      const weightG = name.match(/(\d+)\s*ג/);
      if (weightG) {
        const grams = parseInt(weightG[1]);
        if (grams <= 50) attrs.weight = '50 גרם';
        else if (grams <= 100) attrs.weight = '100 גרם';
        else attrs.weight = '200 גרם';
      }

      return attrs;
    },
  },
  {
    categorySlug: 'beverages',
    patterns: [/מים מינרל|מיץ|סודה|קולה|בירה|שתייה|מים \d/],
    excludePatterns: [/מי ורדים/, /מי סבון/, /סודה לשתייה/],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Type
      if (/מים/.test(name)) {
        attrs.type = 'מים';
      } else if (/מיץ/.test(name)) {
        attrs.type = 'מיץ';
      } else if (/סודה|קולה|ספרייט|פנטה/.test(name)) {
        attrs.type = 'סודה';
      } else if (/בירה|גולדסטאר|מקבי|קרלסברג|הייניקן/.test(name)) {
        attrs.type = 'בירה';
      } else {
        attrs.type = 'מיץ';
      }

      // Volume
      const volumeMl = name.match(/(\d+)\s*מ[״"']?ל/);
      const volumeL = name.match(/(\d+\.?\d*)\s*ל[יטר']*/) || name.match(/(\d+\.?\d*)\s*ל$/);
      if (volumeMl) {
        const ml = parseInt(volumeMl[1]);
        if (ml <= 500) attrs.volume = '500 מ״ל';
        else if (ml <= 1000) attrs.volume = '1 ליטר';
        else if (ml <= 1500) attrs.volume = '1.5 ליטר';
        else attrs.volume = '2 ליטר';
      } else if (volumeL) {
        const l = parseFloat(volumeL[1]);
        if (l <= 0.5) attrs.volume = '500 מ״ל';
        else if (l <= 1) attrs.volume = '1 ליטר';
        else if (l <= 1.5) attrs.volume = '1.5 ליטר';
        else attrs.volume = '2 ליטר';
      }

      return attrs;
    },
  },
  {
    categorySlug: 'cleaning',
    patterns: [/סבון כלים|נוזל כלים|אבקת כביסה|נוזל כביסה|מנקה רצפ|מנקה אסלה|אקונומיקה|מרכך כביסה/],
    excludePatterns: [/סבון ידיים/, /סבון גוף/, /שמפו/],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Type
      if (/כלים/.test(name)) {
        attrs.type = 'כלים';
      } else if (/כביסה/.test(name)) {
        attrs.type = 'כביסה';
      } else if (/רצפ/.test(name)) {
        attrs.type = 'רצפה';
      } else if (/אסלה|שירותים/.test(name)) {
        attrs.type = 'אסלה';
      } else {
        attrs.type = 'כללי';
      }

      // Volume
      const volumeMl = name.match(/(\d+)\s*מ[״"']?ל/);
      const volumeL = name.match(/(\d+\.?\d*)\s*ל[יטר']*/) || name.match(/(\d+\.?\d*)\s*ל$/);
      if (volumeMl) {
        const ml = parseInt(volumeMl[1]);
        if (ml <= 500) attrs.volume = '500 מ״ל';
        else if (ml <= 1000) attrs.volume = '1 ליטר';
        else attrs.volume = '2 ליטר';
      } else if (volumeL) {
        const l = parseFloat(volumeL[1]);
        if (l <= 1) attrs.volume = '1 ליטר';
        else attrs.volume = '2 ליטר';
      }

      return attrs;
    },
  },
  {
    categorySlug: 'frozen',
    patterns: [/קפוא|קפואה|קפואים|קפואות/],
    excludePatterns: [/ירקות קפואים.*תבלין/],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Type
      if (/ירקות/.test(name)) {
        attrs.type = 'ירקות';
      } else if (/פיצה/.test(name)) {
        attrs.type = 'פיצה';
      } else if (/בורקס/.test(name)) {
        attrs.type = 'בורקס';
      } else if (/שניצל/.test(name)) {
        attrs.type = 'שניצל';
      } else if (/גלידה/.test(name)) {
        attrs.type = 'גלידה';
      } else {
        attrs.type = 'ירקות';
      }

      // Weight
      const weightG = name.match(/(\d+)\s*ג/);
      const weightKg = name.match(/(\d+\.?\d*)\s*ק/);
      if (weightG) {
        const grams = parseInt(weightG[1]);
        if (grams <= 400) attrs.weight = '400 גרם';
        else if (grams <= 500) attrs.weight = '500 גרם';
        else attrs.weight = '1 ק״ג';
      } else if (weightKg) {
        attrs.weight = '1 ק״ג';
      }

      return attrs;
    },
  },
  {
    categorySlug: 'cheese',
    patterns: [/גבינ/],
    excludePatterns: [/קוטג/, /שמנת/, /גבינת שמנת/],
    extractAttributes: (item: ShufersalItem) => {
      const name = item.ItemName;
      const attrs: Record<string, string> = {};

      // Type
      if (/צהובה|עמק|גאודה|אדם|צ'דר/.test(name)) {
        attrs.type = 'צהובה';
      } else if (/בולגרית/.test(name)) {
        attrs.type = 'בולגרית';
      } else if (/מוצרלה/.test(name)) {
        attrs.type = 'מוצרלה';
      } else if (/שמנת/.test(name)) {
        attrs.type = 'שמנת';
      } else if (/לבנה/.test(name)) {
        attrs.type = 'לבנה';
      } else {
        attrs.type = 'לבנה';
      }

      // Weight
      const weightG = name.match(/(\d+)\s*ג/);
      if (weightG) {
        const grams = parseInt(weightG[1]);
        if (grams <= 200) attrs.weight = '200 גרם';
        else if (grams <= 250) attrs.weight = '250 גרם';
        else attrs.weight = '500 גרם';
      }

      return attrs;
    },
  },
];

// ── Product Name Cleanup ──

export function cleanProductName(name: string): string {
  let cleaned = name;

  // Normalize multiple spaces to single space
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  // Clean up common abbreviations
  cleaned = cleaned.replace(/\bגר\b/g, 'גרם');
  cleaned = cleaned.replace(/מ\\"ל/g, 'מ"ל');
  cleaned = cleaned.replace(/ק\\"ג/g, 'ק"ג');

  // Remove trailing standalone unit patterns like "250ג" when they appear at the end
  // These are raw weight suffixes already captured in attributes
  cleaned = cleaned.replace(/\s+\d+ג$/g, '');

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

// ── XML Parser ──

export function parseXmlItems(xml: string): ShufersalItem[] {
  const items: ShufersalItem[] = [];
  const itemRegex = /<Item>([\s\S]*?)<\/Item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const item: Record<string, string> = {};

    const fields = [
      'PriceUpdateDate', 'ItemCode', 'ItemType', 'ItemName',
      'ManufacturerName', 'ManufactureCountry', 'ManufacturerItemDescription',
      'UnitQty', 'Quantity', 'bIsWeighted', 'UnitOfMeasure',
      'QtyInPackage', 'ItemPrice', 'UnitOfMeasurePrice',
      'AllowDiscount', 'ItemStatus',
    ];

    for (const field of fields) {
      const fieldMatch = block.match(new RegExp(`<${field}>(.*?)</${field}>`));
      item[field] = fieldMatch ? fieldMatch[1].trim() : '';
    }

    items.push(item as unknown as ShufersalItem);
  }

  return items;
}

// ── File Reader ──

function readGzFile(filePath: string): string {
  const compressed = fs.readFileSync(filePath);
  const decompressed = zlib.gunzipSync(compressed);
  return decompressed.toString('utf-8');
}

function findLatestGzFile(dataDir: string, chainId: string, prefix: string = 'PriceFull'): string | null {
  const files = fs.readdirSync(dataDir)
    .filter(f => f.startsWith(`${prefix}${chainId}`) && f.endsWith('.gz'))
    .sort()
    .reverse();

  return files.length > 0 ? path.join(dataDir, files[0]) : null;
}

// ── PromoFull Types and Parser ──

export interface PromoItem {
  ItemCode: string;
  ItemType: string; // "0" = internal code, "1" = barcode
  IsGiftItem: string;
}

export interface Promotion {
  PromotionId: string;
  PromotionDescription: string;
  PromotionStartDate: string;
  PromotionEndDate: string;
  DiscountType: string; // "1" = percentage, "2" = fixed amount, etc.
  DiscountRate: string;
  MinQty: string;
  MaxQty: string;
  RewardType: string;
  items: PromoItem[];
}

/**
 * Parse PromoFull XML content into structured Promotion objects.
 *
 * PromoFull XML structure (Israeli Price Transparency Law):
 * <root>
 *   <Promotions>
 *     <Promotion>
 *       <PromotionId>...</PromotionId>
 *       <PromotionDescription>...</PromotionDescription>
 *       <PromotionStartDate>...</PromotionStartDate>
 *       <PromotionEndDate>...</PromotionEndDate>
 *       <DiscountType>...</DiscountType>
 *       <DiscountRate>...</DiscountRate>
 *       <MinQty>...</MinQty>
 *       <MaxQty>...</MaxQty>
 *       <RewardType>...</RewardType>
 *       <PromotionItems>
 *         <Item>
 *           <ItemCode>...</ItemCode>
 *           <ItemType>...</ItemType>
 *           <IsGiftItem>...</IsGiftItem>
 *         </Item>
 *       </PromotionItems>
 *     </Promotion>
 *   </Promotions>
 * </root>
 */
export function parsePromoXml(xml: string): Promotion[] {
  const promotions: Promotion[] = [];
  const promoRegex = /<Promotion>([\s\S]*?)<\/Promotion>/g;
  let promoMatch: RegExpExecArray | null;

  while ((promoMatch = promoRegex.exec(xml)) !== null) {
    const block = promoMatch[1];

    const getField = (name: string): string => {
      const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`));
      return m ? m[1].trim() : '';
    };

    // Parse promotion items
    const items: PromoItem[] = [];
    const itemsBlock = block.match(/<PromotionItems>([\s\S]*?)<\/PromotionItems>/);
    if (itemsBlock) {
      const itemRegex = /<Item>([\s\S]*?)<\/Item>/g;
      let itemMatch: RegExpExecArray | null;
      while ((itemMatch = itemRegex.exec(itemsBlock[1])) !== null) {
        const itemBlock = itemMatch[1];
        const getItemField = (name: string): string => {
          const m = itemBlock.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`));
          return m ? m[1].trim() : '';
        };
        items.push({
          ItemCode: getItemField('ItemCode'),
          ItemType: getItemField('ItemType'),
          IsGiftItem: getItemField('IsGiftItem'),
        });
      }
    }

    promotions.push({
      PromotionId: getField('PromotionId'),
      PromotionDescription: getField('PromotionDescription'),
      PromotionStartDate: getField('PromotionStartDate'),
      PromotionEndDate: getField('PromotionEndDate'),
      DiscountType: getField('DiscountType'),
      DiscountRate: getField('DiscountRate'),
      MinQty: getField('MinQty'),
      MaxQty: getField('MaxQty'),
      RewardType: getField('RewardType'),
      items,
    });
  }

  return promotions;
}

/**
 * Check if a promotion is currently active based on its date range.
 */
export function isPromoActive(promo: Promotion, now: Date = new Date()): boolean {
  try {
    const start = new Date(promo.PromotionStartDate.replace(' ', 'T'));
    const end = new Date(promo.PromotionEndDate.replace(' ', 'T'));
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
    return now >= start && now <= end;
  } catch {
    return false;
  }
}

/**
 * Build a Hebrew promo description string from a Promotion object.
 */
export function buildPromoDescription(promo: Promotion): string {
  const desc = promo.PromotionDescription.trim();
  if (desc) return desc;

  // Fall back to building from fields
  const rate = parseFloat(promo.DiscountRate);
  if (isNaN(rate) || rate <= 0) return 'מבצע';

  const discountType = promo.DiscountType;
  if (discountType === '1') return `${rate}% הנחה`;
  if (discountType === '2') return `₪${rate} הנחה`;

  const minQty = parseInt(promo.MinQty);
  if (minQty > 1) return `${minQty} יח׳ ב-₪${rate}`;

  return `מבצע - ₪${rate}`;
}

// ── Category Matching ──

export function matchCategory(item: ShufersalItem): CategoryMatch | null {
  const name = item.ItemName;

  for (const matcher of CATEGORY_MATCHERS) {
    // Check if any pattern matches
    const hasMatch = matcher.patterns.some(p => p.test(name));
    if (!hasMatch) continue;

    // Check exclusions
    const isExcluded = matcher.excludePatterns.some(p => p.test(name));
    if (isExcluded) continue;

    const attributes = matcher.extractAttributes(item);
    const brand = normalizeBrand(item.ManufacturerName, item.ItemName);

    return {
      categorySlug: matcher.categorySlug,
      attributes,
      brand,
    };
  }

  return null;
}

// ── Provider ──

const SHUFERSAL_CHAIN_ID = '7290027600007';

export class ShufersalProvider implements IngestionProvider {
  readonly type = 'shufersal-file';

  async ingest(supermarketId: string): Promise<IngestionResult> {
    const start = Date.now();
    const errors: string[] = [];

    const supermarket = await prisma.supermarket.findUnique({
      where: { id: supermarketId },
    });

    if (!supermarket) {
      return {
        supermarketId,
        supermarketName: 'Unknown',
        productsUpdated: 0,
        snapshotsCreated: 0,
        promoCount: 0,
        outOfStockCount: 0,
        errors: [`Supermarket ${supermarketId} not found`],
        durationMs: Date.now() - start,
      };
    }

    log.info(`Starting Shufersal file ingestion for ${supermarket.name}`, { supermarketId });

    // 1. Find the latest GZ file
    const dataDir = path.resolve(process.cwd(), 'data');
    const gzFile = findLatestGzFile(dataDir, SHUFERSAL_CHAIN_ID);

    if (!gzFile) {
      return {
        supermarketId,
        supermarketName: supermarket.name,
        productsUpdated: 0,
        snapshotsCreated: 0,
        promoCount: 0,
        outOfStockCount: 0,
        errors: [`No Shufersal GZ file found in ${dataDir}`],
        durationMs: Date.now() - start,
      };
    }

    log.info(`Reading file: ${gzFile}`);

    // 2. Parse XML
    let items: ShufersalItem[];
    try {
      const xml = readGzFile(gzFile);
      items = parseXmlItems(xml);
      log.info(`Parsed ${items.length} items from XML`);
    } catch (err) {
      return {
        supermarketId,
        supermarketName: supermarket.name,
        productsUpdated: 0,
        snapshotsCreated: 0,
        promoCount: 0,
        outOfStockCount: 0,
        errors: [`Failed to parse XML: ${err instanceof Error ? err.message : String(err)}`],
        durationMs: Date.now() - start,
      };
    }

    // 3. Load category lookup
    const categories = await prisma.productCategory.findMany();
    const categoryBySlug = new Map(categories.map(c => [c.slug, c]));

    let productsUpdated = 0;
    let snapshotsCreated = 0;
    let promoCount = 0;
    let outOfStockCount = 0;

    // 4. Process each matched item
    for (const item of items) {
      try {
        const match = matchCategory(item);
        if (!match) continue;

        const category = categoryBySlug.get(match.categorySlug);
        if (!category) {
          log.warn(`Category not found: ${match.categorySlug}`);
          continue;
        }

        const inStock = item.ItemStatus === '1';
        const price = parseFloat(item.ItemPrice);
        if (isNaN(price) || price <= 0) continue;

        const externalId = `shufersal-${item.ItemCode}`;
        const metadataStr = JSON.stringify(match.attributes);

        // Parse update date
        let capturedAt: Date;
        try {
          // Format: "2024-12-31 12:36"
          capturedAt = new Date(item.PriceUpdateDate.replace(' ', 'T') + ':00');
          if (isNaN(capturedAt.getTime())) {
            capturedAt = new Date();
          }
        } catch {
          capturedAt = new Date();
        }

        // Find existing supermarket product by external ID stored in metadata
        let supermarketProduct = await prisma.supermarketProduct.findFirst({
          where: {
            supermarketId,
            metadata: { contains: `"externalId":"${externalId}"` },
          },
        });

        const cleanedName = cleanProductName(item.ItemName);

        if (supermarketProduct) {
          // Update existing product
          await prisma.supermarketProduct.update({
            where: { id: supermarketProduct.id },
            data: {
              externalName: cleanedName,
              brand: match.brand,
              price,
              inStock,
              isPromo: false,
              promoDescription: null,
              metadata: JSON.stringify({ ...match.attributes, externalId }),
              updatedAt: new Date(),
            },
          });
        } else {
          // Find or create canonical product
          const canonicalProduct = await findOrCreateCanonicalProduct(
            category.id,
            match.categorySlug,
            match.attributes,
            match.brand,
            item.ItemName,
            item.ItemCode,
          );

          // Create supermarket product
          supermarketProduct = await prisma.supermarketProduct.create({
            data: {
              supermarketId,
              canonicalProductId: canonicalProduct.id,
              externalName: cleanedName,
              brand: match.brand,
              price,
              inStock,
              isPromo: false,
              promoDescription: null,
              metadata: JSON.stringify({ ...match.attributes, externalId }),
            },
          });
        }

        // Create price snapshot
        await prisma.priceSnapshot.create({
          data: {
            supermarketProductId: supermarketProduct.id,
            price,
            currency: 'ILS',
            isPromo: false,
            promoDescription: null,
            inStock,
            capturedAt,
          },
        });
        snapshotsCreated++;
        productsUpdated++;

        if (!inStock) outOfStockCount++;
      } catch (err) {
        const msg = `Failed to process item ${item.ItemCode} (${item.ItemName}): ${err instanceof Error ? err.message : String(err)}`;
        log.error(msg);
        errors.push(msg);
      }
    }

    // Update supermarket's last ingestion timestamp
    await prisma.supermarket.update({
      where: { id: supermarketId },
      data: { lastIngestionAt: new Date() },
    });

    const durationMs = Date.now() - start;
    log.info(`Completed Shufersal ingestion for ${supermarket.name}`, {
      productsUpdated,
      snapshotsCreated,
      promoCount,
      outOfStockCount,
      errorCount: errors.length,
      durationMs,
    });

    return {
      supermarketId,
      supermarketName: supermarket.name,
      productsUpdated,
      snapshotsCreated,
      promoCount,
      outOfStockCount,
      errors,
      durationMs,
    };
  }

  /**
   * Ingest promotions from a PromoFull GZ file.
   * Matches promotions to existing SupermarketProducts by ItemCode (externalId).
   * Only applies currently active promotions.
   */
  async ingestPromos(supermarketId: string): Promise<{
    totalPromotions: number;
    activePromotions: number;
    productsUpdated: number;
    errors: string[];
    durationMs: number;
  }> {
    const start = Date.now();
    const errors: string[] = [];

    const supermarket = await prisma.supermarket.findUnique({
      where: { id: supermarketId },
    });

    if (!supermarket) {
      return { totalPromotions: 0, activePromotions: 0, productsUpdated: 0, errors: [`Supermarket ${supermarketId} not found`], durationMs: Date.now() - start };
    }

    // 1. Find PromoFull GZ file
    const dataDir = path.join(process.cwd(), 'data');
    const promoFile = findLatestGzFile(dataDir, SHUFERSAL_CHAIN_ID, 'PromoFull');

    if (!promoFile) {
      return { totalPromotions: 0, activePromotions: 0, productsUpdated: 0, errors: [`No PromoFull GZ file found for chain ${SHUFERSAL_CHAIN_ID} in ${dataDir}`], durationMs: Date.now() - start };
    }

    log.info(`Reading promo file: ${promoFile}`);

    // 2. Parse XML
    const xml = readGzFile(promoFile);
    const promotions = parsePromoXml(xml);
    log.info(`Parsed ${promotions.length} promotions`);

    // 3. Filter to active promotions
    const now = new Date();
    const activePromos = promotions.filter(p => isPromoActive(p, now));
    log.info(`${activePromos.length} active promotions (of ${promotions.length} total)`);

    // 4. Build ItemCode → promo description map
    // An item can appear in multiple promos; keep the one with the best description
    const promoByItemCode = new Map<string, string>();
    for (const promo of activePromos) {
      const desc = buildPromoDescription(promo);
      for (const item of promo.items) {
        if (item.IsGiftItem === '1') continue; // skip gift items
        const code = item.ItemCode.trim();
        if (!code) continue;
        // Keep the first (often best) promo for each item
        if (!promoByItemCode.has(code)) {
          promoByItemCode.set(code, desc);
        }
      }
    }

    log.info(`${promoByItemCode.size} unique items with active promotions`);

    // 5. First, reset all promos for this supermarket (remove expired promos)
    await prisma.supermarketProduct.updateMany({
      where: { supermarketId, isPromo: true },
      data: { isPromo: false, promoDescription: null },
    });

    // 6. Apply active promos to matching products
    let productsUpdated = 0;

    for (const [itemCode, promoDesc] of promoByItemCode) {
      try {
        const externalId = `shufersal-${itemCode}`;

        // Find the SupermarketProduct by its externalId stored in metadata
        const product = await prisma.supermarketProduct.findFirst({
          where: {
            supermarketId,
            metadata: { contains: `"externalId":"${externalId}"` },
          },
        });

        if (!product) continue;

        // Update the product with promo info
        await prisma.supermarketProduct.update({
          where: { id: product.id },
          data: {
            isPromo: true,
            promoDescription: promoDesc,
          },
        });

        // Also update the latest price snapshot if it exists
        const latestSnapshot = await prisma.priceSnapshot.findFirst({
          where: { supermarketProductId: product.id },
          orderBy: { capturedAt: 'desc' },
        });

        if (latestSnapshot) {
          await prisma.priceSnapshot.update({
            where: { id: latestSnapshot.id },
            data: {
              isPromo: true,
              promoDescription: promoDesc,
            },
          });
        }

        productsUpdated++;
      } catch (err) {
        errors.push(`Failed to apply promo to item ${itemCode}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const durationMs = Date.now() - start;
    log.info(`Promo ingestion complete`, {
      totalPromotions: promotions.length,
      activePromotions: activePromos.length,
      productsUpdated,
      errorCount: errors.length,
      durationMs,
    });

    return {
      totalPromotions: promotions.length,
      activePromotions: activePromos.length,
      productsUpdated,
      errors,
      durationMs,
    };
  }
}

// ── Canonical Product Matching ──

export async function findOrCreateCanonicalProduct(
  categoryId: string,
  categorySlug: string,
  attributes: Record<string, string>,
  brand: string | null,
  itemName: string,
  barcode?: string,
) {
  // 1. Try barcode match first (definitive cross-chain matching)
  if (barcode) {
    const barcodeResult = await findByBarcode(barcode);
    if (barcodeResult.matched && barcodeResult.canonicalProductId) {
      const existing = await prisma.canonicalProduct.findUnique({
        where: { id: barcodeResult.canonicalProductId },
      });
      if (existing) return existing;
    }
  }

  // 2. Fall back to category + brand + attribute matching (heuristic)
  const existingProducts = await prisma.canonicalProduct.findMany({
    where: {
      categoryId,
      ...(brand ? { brand } : {}),
    },
  });

  for (const existing of existingProducts) {
    let existingMeta: Record<string, string>;
    try {
      existingMeta = JSON.parse(existing.metadata);
    } catch {
      continue;
    }

    const attrKeys = Object.keys(attributes);
    if (attrKeys.length === 0) continue;

    const allMatch = attrKeys.every(key => existingMeta[key] === attributes[key]);
    if (allMatch && Object.keys(existingMeta).length === attrKeys.length) {
      // If we matched by attributes and the existing product has no barcode, update it
      if (barcode && !existing.barcode) {
        await prisma.canonicalProduct.update({
          where: { id: existing.id },
          data: { barcode },
        });
      }
      return existing;
    }
  }

  // 3. Create a new canonical product
  const name = buildCanonicalName(categorySlug, attributes, brand);
  const normalizedName = name.toLowerCase().replace(/\s+/g, '-');
  const searchableText = [itemName, brand, ...Object.values(attributes)].filter(Boolean).join(' ').toLowerCase();

  return prisma.canonicalProduct.create({
    data: {
      categoryId,
      name,
      normalizedName,
      brand,
      barcode: barcode ?? null,
      metadata: JSON.stringify(attributes),
      searchableText,
    },
  });
}

export function buildCanonicalName(
  categorySlug: string,
  attributes: Record<string, string>,
  brand: string | null,
): string {
  const categoryNames: Record<string, string> = {
    'milk': 'חלב',
    'eggs': 'ביצים',
    'cottage-cheese': 'קוטג\'',
    'yogurt': 'יוגורט',
    'bread': 'לחם',
    'rice': 'אורז',
    'pasta': 'פסטה',
    'tomatoes': 'עגבניות',
    'cucumbers': 'מלפפונים',
    'chicken-breast': 'חזה עוף',
    'tuna': 'טונה',
    'cereal': 'דגני בוקר',
    'coffee': 'קפה',
    'oil': 'שמן',
    'sugar': 'סוכר',
    'snacks': 'חטיפים',
    'beverages': 'שתייה',
    'cleaning': 'ניקיון',
    'frozen': 'קפואים',
    'cheese': 'גבינות',
  };

  const parts: string[] = [];
  const catName = categoryNames[categorySlug] || categorySlug;

  // Add category name
  parts.push(catName);

  // Add key attributes
  if (attributes.fat) parts.push(attributes.fat);
  if (attributes.type && attributes.type !== 'רגיל') parts.push(attributes.type);
  if (attributes.volume) parts.push(attributes.volume);
  if (attributes.weight) parts.push(attributes.weight);
  if (attributes.size) parts.push(attributes.size);
  if (attributes.packCount) parts.push(`${attributes.packCount} יחידות`);

  const namePart = parts.join(' ');
  return brand ? `${namePart} ${brand}` : namePart;
}
