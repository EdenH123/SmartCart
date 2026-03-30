import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { prisma } from '@/lib/db/client';
import { createLogger } from '@/lib/logger';
import type { IngestionProvider, IngestionResult } from './types';

const log = createLogger('ingestion:shufersal');

// ── Types ──

interface ShufersalItem {
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
};

function normalizeBrand(manufacturerName: string, itemName: string): string | null {
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
];

// ── XML Parser ──

function parseXmlItems(xml: string): ShufersalItem[] {
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

function findLatestGzFile(dataDir: string, chainId: string): string | null {
  const files = fs.readdirSync(dataDir)
    .filter(f => f.startsWith(`PriceFull${chainId}`) && f.endsWith('.gz'))
    .sort()
    .reverse();

  return files.length > 0 ? path.join(dataDir, files[0]) : null;
}

// ── Category Matching ──

function matchCategory(item: ShufersalItem): CategoryMatch | null {
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

        if (supermarketProduct) {
          // Update existing product
          await prisma.supermarketProduct.update({
            where: { id: supermarketProduct.id },
            data: {
              externalName: item.ItemName,
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
          );

          // Create supermarket product
          supermarketProduct = await prisma.supermarketProduct.create({
            data: {
              supermarketId,
              canonicalProductId: canonicalProduct.id,
              externalName: item.ItemName,
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
}

// ── Canonical Product Matching ──

async function findOrCreateCanonicalProduct(
  categoryId: string,
  categorySlug: string,
  attributes: Record<string, string>,
  brand: string | null,
  itemName: string,
) {
  // Try to find existing canonical product with same category, brand, and attributes
  const existingProducts = await prisma.canonicalProduct.findMany({
    where: {
      categoryId,
      ...(brand ? { brand } : {}),
    },
  });

  // Match by attributes
  for (const existing of existingProducts) {
    let existingMeta: Record<string, string>;
    try {
      existingMeta = JSON.parse(existing.metadata);
    } catch {
      continue;
    }

    // Check if all attributes match
    const attrKeys = Object.keys(attributes);
    if (attrKeys.length === 0) continue;

    const allMatch = attrKeys.every(key => existingMeta[key] === attributes[key]);
    if (allMatch && Object.keys(existingMeta).length === attrKeys.length) {
      return existing;
    }
  }

  // Create a new canonical product
  const name = buildCanonicalName(categorySlug, attributes, brand);
  const normalizedName = name.toLowerCase().replace(/\s+/g, '-');
  const searchableText = [itemName, brand, ...Object.values(attributes)].filter(Boolean).join(' ').toLowerCase();

  return prisma.canonicalProduct.create({
    data: {
      categoryId,
      name,
      normalizedName,
      brand,
      metadata: JSON.stringify(attributes),
      searchableText,
    },
  });
}

function buildCanonicalName(
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
