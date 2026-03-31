import { prisma } from '@/lib/db/client';
import type { CategoryWithAttributes, ProductSearchResult } from '@/types';

function safeJsonParse(json: string, fallback: unknown = {}): unknown {
  try { return JSON.parse(json); }
  catch { return fallback; }
}

type RawCategory = Awaited<ReturnType<typeof prisma.productCategory.findMany>>[number] & {
  attributeDefinitions: Array<{
    id: string;
    key: string;
    label: string;
    type: string;
    possibleValues: string;
    sortOrder: number;
  }>;
};

function transformCategory(cat: RawCategory): CategoryWithAttributes {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parentId: cat.parentId,
    attributes: cat.attributeDefinitions.map((attr) => ({
      id: attr.id,
      key: attr.key,
      label: attr.label,
      type: attr.type as 'text' | 'number' | 'enum' | 'boolean',
      possibleValues: safeJsonParse(attr.possibleValues, []) as string[],
      sortOrder: attr.sortOrder,
    })),
  };
}

const CATEGORY_INCLUDE = {
  attributeDefinitions: { orderBy: { sortOrder: 'asc' as const } },
} as const;

/**
 * Returns true if all characters of `query` appear in `text` in order.
 * Also returns true for exact substring matches.
 */
export function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Exact substring match
  if (lowerText.includes(lowerQuery)) return true;

  // Fuzzy: all query chars appear in order
  let ti = 0;
  for (let qi = 0; qi < lowerQuery.length; qi++) {
    const idx = lowerText.indexOf(lowerQuery[qi], ti);
    if (idx === -1) return false;
    ti = idx + 1;
  }
  return true;
}

/**
 * Scores relevance of `text` to `query` on a 0-100 scale.
 *  - Exact match = 100
 *  - Starts with = 90
 *  - Contains    = 70
 *  - Fuzzy match = 50
 *  - No match    = 0
 */
export function fuzzyScore(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lowerText === lowerQuery) return 100;
  if (lowerText.startsWith(lowerQuery)) return 90;
  if (lowerText.includes(lowerQuery)) return 70;
  if (fuzzyMatch(text, query)) return 50;
  return 0;
}

export async function searchCategories(query: string): Promise<CategoryWithAttributes[]> {
  if (!query || query.length < 1) return [];

  // Single query with OR: match by category name or product searchableText
  const categories = await prisma.productCategory.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { canonicalProducts: { some: { searchableText: { contains: query } } } },
      ],
    },
    include: CATEGORY_INCLUDE,
  });

  // Post-filter with fuzzy matching and sort by relevance score
  return categories
    .map(transformCategory)
    .filter((cat) => fuzzyMatch(cat.name, query))
    .sort((a, b) => fuzzyScore(b.name, query) - fuzzyScore(a.name, query));
}

export async function getCategory(categoryId: string): Promise<CategoryWithAttributes | null> {
  const cat = await prisma.productCategory.findUnique({
    where: { id: categoryId },
    include: CATEGORY_INCLUDE,
  });

  if (!cat) return null;
  return transformCategory(cat);
}

export async function searchProducts(
  categoryId: string,
  constraints: Record<string, string | number | boolean | null>
): Promise<ProductSearchResult[]> {
  const products = await prisma.canonicalProduct.findMany({
    where: {
      categoryId,
      isActive: true,
    },
    include: {
      category: true,
    },
  });

  // Filter by constraints - parse metadata once per product
  return products
    .reduce<ProductSearchResult[]>((acc, product) => {
      const meta = safeJsonParse(product.metadata, {}) as Record<string, unknown>;

      // Check all constraints
      for (const [key, value] of Object.entries(constraints)) {
        if (value === null || value === 'any' || value === '') continue;
        const productVal = meta[key];
        if (productVal === undefined) return acc;
        if (String(productVal).toLowerCase() !== String(value).toLowerCase()) return acc;
      }

      acc.push({
        id: product.id,
        name: product.name,
        brand: product.brand,
        categoryName: product.category.name,
        metadata: meta,
      });
      return acc;
    }, []);
}

export async function getAllCategories(): Promise<CategoryWithAttributes[]> {
  const categories = await prisma.productCategory.findMany({
    include: CATEGORY_INCLUDE,
    orderBy: { name: 'asc' },
  });

  return categories.map(transformCategory);
}
