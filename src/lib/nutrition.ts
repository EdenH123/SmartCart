import type { NutritionInfo } from '@/types';

/**
 * Static lookup table mapping category slugs to approximate nutritional values
 * per standard serving. Values are estimates for typical Israeli grocery items.
 */
const NUTRITION_TABLE: Record<string, NutritionInfo> = {
  milk: {
    calories: 150,
    protein: 8,
    carbs: 12,
    fat: 8,
    serving: '1 כוס (250 מ״ל)',
  },
  eggs: {
    calories: 70,
    protein: 6,
    carbs: 0.5,
    fat: 5,
    serving: '1 ביצה (50 גרם)',
  },
  bread: {
    calories: 79,
    protein: 3,
    carbs: 15,
    fat: 1,
    serving: '1 פרוסה (30 גרם)',
  },
  'chicken-breast': {
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    serving: '100 גרם',
  },
  'cottage-cheese': {
    calories: 98,
    protein: 11,
    carbs: 3.4,
    fat: 4.3,
    serving: '100 גרם',
  },
  rice: {
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
    serving: '100 גרם (מבושל)',
  },
  butter: {
    calories: 102,
    protein: 0.1,
    carbs: 0,
    fat: 11.5,
    serving: '1 כף (14 גרם)',
  },
  tehina: {
    calories: 89,
    protein: 2.6,
    carbs: 3.2,
    fat: 8,
    serving: '1 כף (15 גרם)',
  },
  hummus: {
    calories: 166,
    protein: 8,
    carbs: 14,
    fat: 10,
    serving: '100 גרם',
  },
  flour: {
    calories: 364,
    protein: 10,
    carbs: 76,
    fat: 1,
    serving: '100 גרם',
  },
  'canned-tomatoes': {
    calories: 32,
    protein: 1.5,
    carbs: 7,
    fat: 0.2,
    serving: '100 גרם',
  },
  'ground-meat': {
    calories: 254,
    protein: 17,
    carbs: 0,
    fat: 20,
    serving: '100 גרם',
  },
  cheese: {
    calories: 113,
    protein: 7,
    carbs: 0.4,
    fat: 9,
    serving: '1 פרוסה (28 גרם)',
  },
  yogurt: {
    calories: 100,
    protein: 5,
    carbs: 15,
    fat: 2,
    serving: '1 כוס (200 גרם)',
  },
  'sour-cream': {
    calories: 54,
    protein: 0.6,
    carbs: 1,
    fat: 5,
    serving: '1 כף (15 גרם)',
  },
  'olive-oil': {
    calories: 119,
    protein: 0,
    carbs: 0,
    fat: 14,
    serving: '1 כף (14 מ״ל)',
  },
  pasta: {
    calories: 131,
    protein: 5,
    carbs: 25,
    fat: 1.1,
    serving: '100 גרם (מבושל)',
  },
  sugar: {
    calories: 387,
    protein: 0,
    carbs: 100,
    fat: 0,
    serving: '100 גרם',
  },
  tuna: {
    calories: 128,
    protein: 26,
    carbs: 0,
    fat: 2.5,
    serving: '100 גרם',
  },
};

/**
 * Returns approximate nutritional info for a given category slug.
 * Returns null if the category is not in the lookup table.
 */
export function getNutritionByCategory(categorySlug: string): NutritionInfo | null {
  return NUTRITION_TABLE[categorySlug] ?? null;
}
