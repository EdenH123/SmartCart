/**
 * Tests for product search module (src/lib/products/search.ts).
 *
 * Mocks Prisma to test search logic, category transformation, and constraint filtering.
 */

jest.mock('@/lib/db/client', () => {
  const mockPrisma = {
    productCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    canonicalProduct: {
      findMany: jest.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import { prisma } from '@/lib/db/client';
import { searchCategories, getCategory, searchProducts, getAllCategories } from '@/lib/products/search';

const db = prisma as unknown as {
  productCategory: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
  };
  canonicalProduct: {
    findMany: jest.Mock;
  };
};

beforeEach(() => {
  jest.clearAllMocks();
});

function makeCategory(overrides: Record<string, unknown> = {}) {
  return {
    id: overrides.id ?? 'cat1',
    name: overrides.name ?? 'חלב',
    slug: overrides.slug ?? 'milk',
    parentId: overrides.parentId ?? null,
    attributeDefinitions: overrides.attributeDefinitions ?? [
      { id: 'ad1', key: 'fat', label: 'אחוז שומן', type: 'enum', possibleValues: '["1%","3%"]', sortOrder: 1 },
      { id: 'ad2', key: 'volume', label: 'נפח', type: 'enum', possibleValues: '["1 ליטר"]', sortOrder: 2 },
    ],
  };
}

// ── searchCategories ──

describe('searchCategories', () => {
  test('returns empty array for empty query', async () => {
    const result = await searchCategories('');
    expect(result).toEqual([]);
    expect(db.productCategory.findMany).not.toHaveBeenCalled();
  });

  test('searches categories by name and product text', async () => {
    db.productCategory.findMany.mockResolvedValue([makeCategory()]);

    const result = await searchCategories('חלב');

    expect(db.productCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: 'חלב' } },
            { canonicalProducts: { some: { searchableText: { contains: 'חלב' } } } },
          ],
        },
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('חלב');
  });

  test('transforms attribute definitions correctly', async () => {
    db.productCategory.findMany.mockResolvedValue([makeCategory()]);

    const result = await searchCategories('חלב');

    expect(result[0].attributes).toHaveLength(2);
    expect(result[0].attributes[0]).toEqual({
      id: 'ad1',
      key: 'fat',
      label: 'אחוז שומן',
      type: 'enum',
      possibleValues: ['1%', '3%'],
      sortOrder: 1,
    });
  });

  test('handles categories with no attributes', async () => {
    db.productCategory.findMany.mockResolvedValue([
      makeCategory({ attributeDefinitions: [] }),
    ]);

    const result = await searchCategories('test');
    expect(result[0].attributes).toEqual([]);
  });

  test('handles invalid JSON in possibleValues gracefully', async () => {
    db.productCategory.findMany.mockResolvedValue([
      makeCategory({
        attributeDefinitions: [
          { id: 'ad1', key: 'type', label: 'סוג', type: 'enum', possibleValues: 'not-json', sortOrder: 1 },
        ],
      }),
    ]);

    const result = await searchCategories('test');
    expect(result[0].attributes[0].possibleValues).toEqual([]);
  });
});

// ── getCategory ──

describe('getCategory', () => {
  test('returns category with attributes', async () => {
    db.productCategory.findUnique.mockResolvedValue(makeCategory());

    const result = await getCategory('cat1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('cat1');
    expect(result!.name).toBe('חלב');
    expect(result!.attributes).toHaveLength(2);
  });

  test('returns null for nonexistent category', async () => {
    db.productCategory.findUnique.mockResolvedValue(null);

    const result = await getCategory('nonexistent');
    expect(result).toBeNull();
  });
});

// ── getAllCategories ──

describe('getAllCategories', () => {
  test('returns all categories sorted by name', async () => {
    db.productCategory.findMany.mockResolvedValue([
      makeCategory({ id: 'cat1', name: 'ביצים', slug: 'eggs' }),
      makeCategory({ id: 'cat2', name: 'חלב', slug: 'milk' }),
    ]);

    const result = await getAllCategories();

    expect(result).toHaveLength(2);
    expect(db.productCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { name: 'asc' } })
    );
  });

  test('returns empty array when no categories exist', async () => {
    db.productCategory.findMany.mockResolvedValue([]);

    const result = await getAllCategories();
    expect(result).toEqual([]);
  });
});

// ── searchProducts ──

describe('searchProducts', () => {
  test('returns products matching all constraints', async () => {
    db.canonicalProduct.findMany.mockResolvedValue([
      {
        id: 'p1',
        name: 'חלב תנובה 3%',
        brand: 'תנובה',
        categoryId: 'cat1',
        metadata: '{"fat":"3%","volume":"1 ליטר","type":"רגיל"}',
        isActive: true,
        category: { name: 'חלב' },
      },
      {
        id: 'p2',
        name: 'חלב תנובה 1%',
        brand: 'תנובה',
        categoryId: 'cat1',
        metadata: '{"fat":"1%","volume":"1 ליטר","type":"רגיל"}',
        isActive: true,
        category: { name: 'חלב' },
      },
    ]);

    const result = await searchProducts('cat1', { fat: '3%' });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('חלב תנובה 3%');
  });

  test('returns all products when constraints are empty', async () => {
    db.canonicalProduct.findMany.mockResolvedValue([
      {
        id: 'p1', name: 'Product A', brand: 'A', categoryId: 'cat1',
        metadata: '{"type":"X"}', isActive: true, category: { name: 'Cat' },
      },
      {
        id: 'p2', name: 'Product B', brand: 'B', categoryId: 'cat1',
        metadata: '{"type":"Y"}', isActive: true, category: { name: 'Cat' },
      },
    ]);

    const result = await searchProducts('cat1', {});
    expect(result).toHaveLength(2);
  });

  test('skips constraints with value "any"', async () => {
    db.canonicalProduct.findMany.mockResolvedValue([
      {
        id: 'p1', name: 'Product A', brand: 'A', categoryId: 'cat1',
        metadata: '{"type":"X","size":"L"}', isActive: true, category: { name: 'Cat' },
      },
    ]);

    const result = await searchProducts('cat1', { type: 'any', size: 'L' });
    expect(result).toHaveLength(1);
  });

  test('skips constraints with null or empty value', async () => {
    db.canonicalProduct.findMany.mockResolvedValue([
      {
        id: 'p1', name: 'Product A', brand: 'A', categoryId: 'cat1',
        metadata: '{"type":"X"}', isActive: true, category: { name: 'Cat' },
      },
    ]);

    const result = await searchProducts('cat1', { type: null, size: '' });
    expect(result).toHaveLength(1);
  });

  test('filters case-insensitively', async () => {
    db.canonicalProduct.findMany.mockResolvedValue([
      {
        id: 'p1', name: 'Product A', brand: 'A', categoryId: 'cat1',
        metadata: '{"type":"Regular"}', isActive: true, category: { name: 'Cat' },
      },
    ]);

    const result = await searchProducts('cat1', { type: 'regular' });
    expect(result).toHaveLength(1);
  });

  test('excludes products missing constraint keys', async () => {
    db.canonicalProduct.findMany.mockResolvedValue([
      {
        id: 'p1', name: 'Product A', brand: 'A', categoryId: 'cat1',
        metadata: '{}', isActive: true, category: { name: 'Cat' },
      },
    ]);

    const result = await searchProducts('cat1', { type: 'X' });
    expect(result).toHaveLength(0);
  });

  test('handles invalid metadata JSON gracefully', async () => {
    db.canonicalProduct.findMany.mockResolvedValue([
      {
        id: 'p1', name: 'Product A', brand: 'A', categoryId: 'cat1',
        metadata: 'bad-json', isActive: true, category: { name: 'Cat' },
      },
    ]);

    const result = await searchProducts('cat1', { type: 'X' });
    expect(result).toHaveLength(0);
  });

  test('returns correct DTO shape', async () => {
    db.canonicalProduct.findMany.mockResolvedValue([
      {
        id: 'p1', name: 'חלב תנובה', brand: 'תנובה', categoryId: 'cat1',
        metadata: '{"fat":"3%"}', isActive: true, category: { name: 'חלב' },
      },
    ]);

    const result = await searchProducts('cat1', {});

    expect(result[0]).toEqual({
      id: 'p1',
      name: 'חלב תנובה',
      brand: 'תנובה',
      categoryName: 'חלב',
      metadata: { fat: '3%' },
    });
  });
});
