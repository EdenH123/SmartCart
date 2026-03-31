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

  return categories.map(transformCategory);
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
