import { prisma } from '@/lib/db/client';
import type { CategoryWithAttributes, ProductSearchResult } from '@/types';

export async function searchCategories(query: string): Promise<CategoryWithAttributes[]> {
  if (!query || query.length < 1) return [];

  // Search categories by name, and also find categories that have matching products
  const categoriesByName = await prisma.productCategory.findMany({
    where: {
      name: { contains: query },
    },
    include: {
      attributeDefinitions: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  // Also search for categories that have matching canonical products
  const categoriesByProduct = await prisma.productCategory.findMany({
    where: {
      canonicalProducts: {
        some: {
          searchableText: { contains: query },
        },
      },
    },
    include: {
      attributeDefinitions: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  // Merge and deduplicate
  const seen = new Set<string>();
  const categories = [...categoriesByName, ...categoriesByProduct].filter((cat) => {
    if (seen.has(cat.id)) return false;
    seen.add(cat.id);
    return true;
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parentId: cat.parentId,
    attributes: cat.attributeDefinitions.map((attr) => ({
      id: attr.id,
      key: attr.key,
      label: attr.label,
      type: attr.type as 'text' | 'number' | 'enum' | 'boolean',
      possibleValues: JSON.parse(attr.possibleValues) as string[],
      sortOrder: attr.sortOrder,
    })),
  }));
}

export async function getCategory(categoryId: string): Promise<CategoryWithAttributes | null> {
  const cat = await prisma.productCategory.findUnique({
    where: { id: categoryId },
    include: {
      attributeDefinitions: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!cat) return null;

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
      possibleValues: JSON.parse(attr.possibleValues) as string[],
      sortOrder: attr.sortOrder,
    })),
  };
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

  // Filter by constraints
  return products
    .filter((product) => {
      const meta = JSON.parse(product.metadata) as Record<string, unknown>;
      for (const [key, value] of Object.entries(constraints)) {
        if (value === null || value === 'any' || value === '') continue;
        const productVal = meta[key];
        if (productVal === undefined) return false;
        if (String(productVal).toLowerCase() !== String(value).toLowerCase()) return false;
      }
      return true;
    })
    .map((product) => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      categoryName: product.category.name,
      metadata: JSON.parse(product.metadata) as Record<string, unknown>,
    }));
}

export async function getAllCategories(): Promise<CategoryWithAttributes[]> {
  const categories = await prisma.productCategory.findMany({
    include: {
      attributeDefinitions: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parentId: cat.parentId,
    attributes: cat.attributeDefinitions.map((attr) => ({
      id: attr.id,
      key: attr.key,
      label: attr.label,
      type: attr.type as 'text' | 'number' | 'enum' | 'boolean',
      possibleValues: JSON.parse(attr.possibleValues) as string[],
      sortOrder: attr.sortOrder,
    })),
  }));
}
