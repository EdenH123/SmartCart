/**
 * Tests for server actions (src/lib/actions.ts).
 *
 * All Prisma calls and next/headers cookies are mocked.
 */

// ── Mock next/headers before any imports ──
const mockCookieStore = {
  get: jest.fn(),
  set: jest.fn(),
};
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue(mockCookieStore),
}));

// ── Mock Prisma ──
jest.mock('@/lib/db/client', () => {
  const mockPrisma = {
    basket: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    basketItem: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    productCategory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    supermarket: {
      findMany: jest.fn(),
    },
    supermarketProduct: {
      findMany: jest.fn(),
    },
  };
  return { prisma: mockPrisma };
});

// ── Mock search module ──
jest.mock('@/lib/products/search', () => ({
  searchCategories: jest.fn(),
  searchProducts: jest.fn(),
  getAllCategories: jest.fn(),
  getCategory: jest.fn(),
}));

// ── Mock comparison engine ──
jest.mock('@/lib/comparison/engine', () => ({
  compareBasket: jest.fn(),
}));

// ── Mock recommendations engine ──
jest.mock('@/lib/recommendations', () => ({
  optimizeBasket: jest.fn(),
  splitCartOptimization: jest.fn(),
}));

// ── Mock logger ──
jest.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));

import { prisma } from '@/lib/db/client';
import { searchCategories, searchProducts, getAllCategories, getCategory } from '@/lib/products/search';
import { compareBasket } from '@/lib/comparison/engine';
import { optimizeBasket, splitCartOptimization } from '@/lib/recommendations';

// Import actions after mocks
import {
  searchCategoriesAction,
  getAllCategoriesAction,
  getCategoryAction,
  searchProductsAction,
  getOrCreateBasket,
  getBasketItems,
  addBasketItem,
  updateBasketItemQuantity,
  removeBasketItem,
  clearBasket,
  quickAddToBasket,
  getItemPriceRanges,
  compareBasketAction,
  optimizeBasketAction,
  getSupermarkets,
} from '@/lib/actions';

const db = prisma as unknown as {
  basket: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
  };
  basketItem: {
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    deleteMany: jest.Mock;
  };
  productCategory: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
  };
  supermarket: {
    findMany: jest.Mock;
  };
  supermarketProduct: {
    findMany: jest.Mock;
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCookieStore.get.mockReturnValue(undefined);
  mockCookieStore.set.mockReturnValue(undefined);
});

// ── Category Actions ──

describe('searchCategoriesAction', () => {
  test('delegates to searchCategories', async () => {
    const mockResult = [{ id: 'c1', name: 'חלב', slug: 'milk', parentId: null, attributes: [] }];
    (searchCategories as jest.Mock).mockResolvedValue(mockResult);

    const result = await searchCategoriesAction('חלב');

    expect(searchCategories).toHaveBeenCalledWith('חלב');
    expect(result).toEqual(mockResult);
  });
});

describe('getAllCategoriesAction', () => {
  test('delegates to getAllCategories', async () => {
    const mockResult = [{ id: 'c1', name: 'חלב', slug: 'milk', parentId: null, attributes: [] }];
    (getAllCategories as jest.Mock).mockResolvedValue(mockResult);

    const result = await getAllCategoriesAction();

    expect(getAllCategories).toHaveBeenCalled();
    expect(result).toEqual(mockResult);
  });
});

describe('getCategoryAction', () => {
  test('delegates to getCategory', async () => {
    const mockResult = { id: 'c1', name: 'חלב', slug: 'milk', parentId: null, attributes: [] };
    (getCategory as jest.Mock).mockResolvedValue(mockResult);

    const result = await getCategoryAction('c1');

    expect(getCategory).toHaveBeenCalledWith('c1');
    expect(result).toEqual(mockResult);
  });

  test('returns null when category not found', async () => {
    (getCategory as jest.Mock).mockResolvedValue(null);

    const result = await getCategoryAction('nonexistent');
    expect(result).toBeNull();
  });
});

describe('searchProductsAction', () => {
  test('delegates to searchProducts', async () => {
    const mockProducts = [{ id: 'p1', name: 'Tnuva Milk', brand: 'Tnuva', categoryName: 'חלב', metadata: {} }];
    (searchProducts as jest.Mock).mockResolvedValue(mockProducts);

    const result = await searchProductsAction('cat1', { fat: '3%' });

    expect(searchProducts).toHaveBeenCalledWith('cat1', { fat: '3%' });
    expect(result).toEqual(mockProducts);
  });
});

// ── Basket Management ──

describe('getOrCreateBasket', () => {
  test('returns existing basket from cookie', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'basket-123' });
    db.basket.findUnique.mockResolvedValue({ id: 'basket-123' });

    const id = await getOrCreateBasket();

    expect(id).toBe('basket-123');
    expect(db.basket.findUnique).toHaveBeenCalledWith({ where: { id: 'basket-123' } });
  });

  test('falls back to most recent basket when cookie basket not found', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'deleted-basket' });
    db.basket.findUnique.mockResolvedValue(null);
    db.basket.findFirst.mockResolvedValue({ id: 'recent-basket' });

    const id = await getOrCreateBasket();

    expect(id).toBe('recent-basket');
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'smartcart-basket-id',
      'recent-basket',
      expect.objectContaining({ path: '/' })
    );
  });

  test('creates new basket when none exist', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    db.basket.findFirst.mockResolvedValue(null);
    db.basket.create.mockResolvedValue({ id: 'new-basket' });

    const id = await getOrCreateBasket();

    expect(id).toBe('new-basket');
    expect(db.basket.create).toHaveBeenCalledWith({ data: {} });
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'smartcart-basket-id',
      'new-basket',
      expect.objectContaining({ path: '/' })
    );
  });

  test('falls back to recent basket when no cookie is set', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    db.basket.findFirst.mockResolvedValue({ id: 'existing-basket' });

    const id = await getOrCreateBasket();

    expect(id).toBe('existing-basket');
  });
});

describe('getBasketItems', () => {
  test('returns formatted basket items', async () => {
    const now = new Date();
    db.basketItem.findMany.mockResolvedValue([
      {
        id: 'item-1',
        basketId: 'b1',
        categoryId: 'cat1',
        category: { name: 'חלב' },
        quantity: 2,
        matchMode: 'flexible',
        selectedCanonicalProductId: null,
        userConstraints: '{"fat":"3%"}',
        displayName: 'חלב 3%',
        createdAt: now,
      },
    ]);

    const items = await getBasketItems('b1');

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      id: 'item-1',
      basketId: 'b1',
      categoryId: 'cat1',
      categoryName: 'חלב',
      quantity: 2,
      matchMode: 'flexible',
      selectedCanonicalProductId: null,
      userConstraints: { fat: '3%' },
      displayName: 'חלב 3%',
      createdAt: now.toISOString(),
    });
  });

  test('returns empty array for empty basket', async () => {
    db.basketItem.findMany.mockResolvedValue([]);
    const items = await getBasketItems('empty-basket');
    expect(items).toEqual([]);
  });

  test('handles invalid JSON in userConstraints gracefully', async () => {
    db.basketItem.findMany.mockResolvedValue([
      {
        id: 'item-1',
        basketId: 'b1',
        categoryId: 'cat1',
        category: { name: 'חלב' },
        quantity: 1,
        matchMode: 'flexible',
        selectedCanonicalProductId: null,
        userConstraints: 'not-valid-json',
        displayName: 'חלב',
        createdAt: new Date(),
      },
    ]);

    const items = await getBasketItems('b1');
    expect(items[0].userConstraints).toEqual({});
  });
});

describe('addBasketItem', () => {
  test('creates a basket item and returns DTO', async () => {
    const now = new Date();
    db.basketItem.create.mockResolvedValue({
      id: 'item-new',
      basketId: 'b1',
      categoryId: 'cat1',
      category: { name: 'ביצים' },
      quantity: 1,
      matchMode: 'exact',
      selectedCanonicalProductId: 'cp-1',
      userConstraints: '{"size":"L","packCount":"12"}',
      displayName: 'ביצים L 12',
      createdAt: now,
    });

    const result = await addBasketItem('b1', {
      categoryId: 'cat1',
      quantity: 1,
      matchMode: 'exact',
      selectedCanonicalProductId: 'cp-1',
      userConstraints: { size: 'L', packCount: '12' },
      displayName: 'ביצים L 12',
    });

    expect(db.basketItem.create).toHaveBeenCalledWith({
      data: {
        basketId: 'b1',
        categoryId: 'cat1',
        quantity: 1,
        matchMode: 'exact',
        selectedCanonicalProductId: 'cp-1',
        userConstraints: '{"size":"L","packCount":"12"}',
        displayName: 'ביצים L 12',
      },
      include: { category: true },
    });

    expect(result.id).toBe('item-new');
    expect(result.matchMode).toBe('exact');
    expect(result.userConstraints).toEqual({ size: 'L', packCount: '12' });
  });

  test('sets selectedCanonicalProductId to null when not provided', async () => {
    db.basketItem.create.mockResolvedValue({
      id: 'item-new',
      basketId: 'b1',
      categoryId: 'cat1',
      category: { name: 'לחם' },
      quantity: 1,
      matchMode: 'flexible',
      selectedCanonicalProductId: null,
      userConstraints: '{}',
      displayName: 'לחם',
      createdAt: new Date(),
    });

    await addBasketItem('b1', {
      categoryId: 'cat1',
      quantity: 1,
      matchMode: 'flexible',
      selectedCanonicalProductId: null,
      userConstraints: {},
      displayName: 'לחם',
    });

    expect(db.basketItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ selectedCanonicalProductId: null }),
      })
    );
  });
});

describe('updateBasketItemQuantity', () => {
  test('updates item quantity', async () => {
    db.basketItem.update.mockResolvedValue({});

    await updateBasketItemQuantity('item-1', 5);

    expect(db.basketItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { quantity: 5 },
    });
  });
});

describe('removeBasketItem', () => {
  test('deletes item by id', async () => {
    db.basketItem.delete.mockResolvedValue({});

    await removeBasketItem('item-1');

    expect(db.basketItem.delete).toHaveBeenCalledWith({ where: { id: 'item-1' } });
  });
});

describe('clearBasket', () => {
  test('deletes all items in basket', async () => {
    db.basketItem.deleteMany.mockResolvedValue({ count: 3 });

    await clearBasket('b1');

    expect(db.basketItem.deleteMany).toHaveBeenCalledWith({ where: { basketId: 'b1' } });
  });
});

// ── Quick Add ──

describe('quickAddToBasket', () => {
  test('creates item using category slug lookup', async () => {
    db.productCategory.findUnique.mockResolvedValue({ id: 'cat-milk', name: 'חלב', slug: 'milk' });
    db.basketItem.create.mockResolvedValue({
      id: 'item-quick',
      basketId: 'b1',
      categoryId: 'cat-milk',
      category: { name: 'חלב' },
      quantity: 1,
      matchMode: 'flexible',
      selectedCanonicalProductId: null,
      userConstraints: '{"fat":"3%"}',
      displayName: 'חלב 3%',
      createdAt: new Date(),
    });

    const result = await quickAddToBasket('b1', 'milk', { fat: '3%' }, 'חלב 3%');

    expect(db.productCategory.findUnique).toHaveBeenCalledWith({ where: { slug: 'milk' } });
    expect(result).not.toBeNull();
    expect(result!.categoryName).toBe('חלב');
    expect(result!.matchMode).toBe('flexible');
  });

  test('returns null when category not found', async () => {
    db.productCategory.findUnique.mockResolvedValue(null);

    const result = await quickAddToBasket('b1', 'nonexistent', {}, 'test');

    expect(result).toBeNull();
    expect(db.basketItem.create).not.toHaveBeenCalled();
  });

  test('always adds with quantity 1 and flexible mode', async () => {
    db.productCategory.findUnique.mockResolvedValue({ id: 'cat1', name: 'ביצים', slug: 'eggs' });
    db.basketItem.create.mockResolvedValue({
      id: 'item-q',
      basketId: 'b1',
      categoryId: 'cat1',
      category: { name: 'ביצים' },
      quantity: 1,
      matchMode: 'flexible',
      selectedCanonicalProductId: null,
      userConstraints: '{"size":"L"}',
      displayName: 'ביצים L',
      createdAt: new Date(),
    });

    await quickAddToBasket('b1', 'eggs', { size: 'L' }, 'ביצים L');

    expect(db.basketItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          quantity: 1,
          matchMode: 'flexible',
          selectedCanonicalProductId: null,
        }),
      })
    );
  });
});

// ── Price Ranges ──

describe('getItemPriceRanges', () => {
  test('returns empty object for empty basket', async () => {
    db.basketItem.findMany.mockResolvedValue([]);

    const result = await getItemPriceRanges('empty-basket');
    expect(result).toEqual({});
  });

  test('returns min/max/count for flexible items', async () => {
    db.basketItem.findMany.mockResolvedValue([
      {
        id: 'bi1',
        basketId: 'b1',
        categoryId: 'cat1',
        matchMode: 'flexible',
        selectedCanonicalProductId: null,
      },
    ]);

    db.supermarketProduct.findMany.mockResolvedValue([
      {
        price: 5.99,
        supermarketId: 'sm1',
        canonicalProductId: 'cp1',
        canonicalProduct: { categoryId: 'cat1' },
        priceSnapshots: [],
      },
      {
        price: 7.50,
        supermarketId: 'sm2',
        canonicalProductId: 'cp2',
        canonicalProduct: { categoryId: 'cat1' },
        priceSnapshots: [],
      },
      {
        price: 6.20,
        supermarketId: 'sm3',
        canonicalProductId: 'cp3',
        canonicalProduct: { categoryId: 'cat1' },
        priceSnapshots: [],
      },
    ]);

    const result = await getItemPriceRanges('b1');

    expect(result['bi1']).toEqual({ min: 5.99, max: 7.50, count: 3 });
  });

  test('returns null for item with no matching products', async () => {
    db.basketItem.findMany.mockResolvedValue([
      {
        id: 'bi1',
        basketId: 'b1',
        categoryId: 'cat-unknown',
        matchMode: 'flexible',
        selectedCanonicalProductId: null,
      },
    ]);

    db.supermarketProduct.findMany.mockResolvedValue([]);

    const result = await getItemPriceRanges('b1');
    expect(result['bi1']).toBeNull();
  });

  test('uses price snapshot when available', async () => {
    db.basketItem.findMany.mockResolvedValue([
      {
        id: 'bi1',
        basketId: 'b1',
        categoryId: 'cat1',
        matchMode: 'flexible',
        selectedCanonicalProductId: null,
      },
    ]);

    db.supermarketProduct.findMany.mockResolvedValue([
      {
        price: 10.00, // base price
        supermarketId: 'sm1',
        canonicalProductId: 'cp1',
        canonicalProduct: { categoryId: 'cat1' },
        priceSnapshots: [{ price: 8.00, inStock: true }], // snapshot price
      },
    ]);

    const result = await getItemPriceRanges('b1');
    expect(result['bi1']!.min).toBe(8.00);
  });

  test('excludes out-of-stock products from snapshot', async () => {
    db.basketItem.findMany.mockResolvedValue([
      {
        id: 'bi1',
        basketId: 'b1',
        categoryId: 'cat1',
        matchMode: 'flexible',
        selectedCanonicalProductId: null,
      },
    ]);

    db.supermarketProduct.findMany.mockResolvedValue([
      {
        price: 5.00,
        supermarketId: 'sm1',
        canonicalProductId: 'cp1',
        canonicalProduct: { categoryId: 'cat1' },
        priceSnapshots: [{ price: 5.00, inStock: false }],
      },
      {
        price: 7.00,
        supermarketId: 'sm2',
        canonicalProductId: 'cp2',
        canonicalProduct: { categoryId: 'cat1' },
        priceSnapshots: [],
      },
    ]);

    const result = await getItemPriceRanges('b1');
    expect(result['bi1']!.min).toBe(7.00);
    expect(result['bi1']!.count).toBe(1);
  });

  test('handles exact mode items by matching canonicalProductId', async () => {
    db.basketItem.findMany.mockResolvedValue([
      {
        id: 'bi1',
        basketId: 'b1',
        categoryId: 'cat1',
        matchMode: 'exact',
        selectedCanonicalProductId: 'cp-specific',
      },
    ]);

    db.supermarketProduct.findMany.mockResolvedValue([
      {
        price: 5.00,
        supermarketId: 'sm1',
        canonicalProductId: 'cp-specific',
        canonicalProduct: { categoryId: 'cat1' },
        priceSnapshots: [],
      },
      {
        price: 3.00,
        supermarketId: 'sm2',
        canonicalProductId: 'cp-other',
        canonicalProduct: { categoryId: 'cat1' },
        priceSnapshots: [],
      },
    ]);

    const result = await getItemPriceRanges('b1');
    // Should only find the exact product, not cp-other
    expect(result['bi1']!.min).toBe(5.00);
    expect(result['bi1']!.max).toBe(5.00);
    expect(result['bi1']!.count).toBe(1);
  });
});

// ── Comparison ──

describe('compareBasketAction', () => {
  test('returns empty result for empty basket', async () => {
    db.basketItem.findMany.mockResolvedValue([]);

    const result = await compareBasketAction('b1');

    expect(result.comparisons).toEqual([]);
    expect(result.bestSupermarketId).toBeNull();
    expect(result.bestTotal).toBe(0);
  });

  test('calls compareBasket engine with transformed data', async () => {
    db.basketItem.findMany.mockResolvedValue([
      {
        id: 'bi1',
        basketId: 'b1',
        categoryId: 'cat1',
        quantity: 2,
        matchMode: 'flexible',
        selectedCanonicalProductId: null,
        userConstraints: '{"fat":"3%"}',
        displayName: 'חלב 3%',
        category: { name: 'חלב' },
      },
    ]);

    db.supermarket.findMany.mockResolvedValue([
      { id: 'sm1', name: 'שופרסל', slug: 'shufersal', isActive: true, lastIngestionAt: new Date() },
    ]);

    db.supermarketProduct.findMany.mockResolvedValue([]);

    (compareBasket as jest.Mock).mockReturnValue({
      basketId: 'current',
      comparisons: [
        { supermarketId: 'sm1', supermarketName: 'שופרסל', total: 10.00, itemResults: [] },
      ],
      bestSupermarketId: 'sm1',
      bestTotal: 10.00,
      worstTotal: 10.00,
    });

    const result = await compareBasketAction('b1');

    expect(compareBasket).toHaveBeenCalled();
    expect(result.basketId).toBe('b1');
    expect(result.comparisons).toHaveLength(1);
  });
});

// ── Optimization ──

describe('optimizeBasketAction', () => {
  test('returns empty result for empty basket', async () => {
    db.basketItem.findMany.mockResolvedValue([]);

    const result = await optimizeBasketAction('b1');

    expect(result.items).toEqual([]);
    expect(result.savings).toBe(0);
  });

  test('calls optimize engine and returns result with basketId', async () => {
    db.basketItem.findMany.mockResolvedValue([
      {
        id: 'bi1',
        basketId: 'b1',
        categoryId: 'cat1',
        quantity: 1,
        matchMode: 'flexible',
        selectedCanonicalProductId: null,
        userConstraints: '{}',
        displayName: 'חלב',
        category: { name: 'חלב' },
      },
    ]);

    db.supermarket.findMany.mockResolvedValue([
      { id: 'sm1', name: 'שופרסל', slug: 'shufersal', isActive: true, lastIngestionAt: null },
    ]);

    db.supermarketProduct.findMany.mockResolvedValue([]);

    (compareBasket as jest.Mock).mockReturnValue({
      basketId: 'current',
      comparisons: [{
        supermarketId: 'sm1',
        supermarketName: 'שופרסל',
        total: 5.00,
        itemResults: [{ basketItemId: 'bi1', supermarketProductId: null, unitPrice: 5.00 }],
      }],
      bestSupermarketId: 'sm1',
      bestTotal: 5.00,
      worstTotal: 5.00,
    });

    (optimizeBasket as jest.Mock).mockReturnValue({
      basketId: '',
      supermarketId: 'sm1',
      supermarketName: 'שופרסל',
      originalTotal: 5.00,
      optimizedTotal: 4.50,
      savings: 0.50,
      savingsPercentage: 10,
      items: [],
      recommendations: [],
    });

    const result = await optimizeBasketAction('b1');

    expect(result.basketId).toBe('b1');
    expect(optimizeBasket).toHaveBeenCalled();
  });

  test('includes split-cart when 2+ supermarkets exist', async () => {
    db.basketItem.findMany.mockResolvedValue([
      {
        id: 'bi1', basketId: 'b1', categoryId: 'cat1', quantity: 1,
        matchMode: 'flexible', selectedCanonicalProductId: null,
        userConstraints: '{}', displayName: 'חלב', category: { name: 'חלב' },
      },
    ]);

    db.supermarket.findMany.mockResolvedValue([
      { id: 'sm1', name: 'שופרסל', slug: 'shufersal', isActive: true, lastIngestionAt: null },
      { id: 'sm2', name: 'רמי לוי', slug: 'rami-levy', isActive: true, lastIngestionAt: null },
    ]);

    db.supermarketProduct.findMany.mockResolvedValue([]);

    (compareBasket as jest.Mock).mockReturnValue({
      basketId: 'current',
      comparisons: [
        { supermarketId: 'sm1', supermarketName: 'שופרסל', total: 5.00, itemResults: [{ basketItemId: 'bi1', supermarketProductId: null, unitPrice: 5.00 }] },
        { supermarketId: 'sm2', supermarketName: 'רמי לוי', total: 6.00, itemResults: [] },
      ],
      bestSupermarketId: 'sm1',
      bestTotal: 5.00,
      worstTotal: 6.00,
    });

    (optimizeBasket as jest.Mock).mockReturnValue({
      basketId: '', supermarketId: 'sm1', supermarketName: 'שופרסל',
      originalTotal: 5.00, optimizedTotal: 5.00, savings: 0, savingsPercentage: 0,
      items: [], recommendations: [],
    });

    const mockSplitCart = {
      totalCost: 4.50,
      savingsVsBest: 0.50,
      supermarketBreakdown: [],
      items: [],
    };
    (splitCartOptimization as jest.Mock).mockReturnValue(mockSplitCart);

    const result = await optimizeBasketAction('b1');

    expect(splitCartOptimization).toHaveBeenCalled();
    expect(result.splitCart).toEqual(mockSplitCart);
  });
});

// ── getSupermarkets ──

describe('getSupermarkets', () => {
  test('returns formatted supermarket list', async () => {
    const ingestionDate = new Date('2026-03-30T10:00:00Z');
    db.supermarket.findMany.mockResolvedValue([
      { id: 'sm1', name: 'שופרסל', slug: 'shufersal', logoUrl: null, isActive: true, lastIngestionAt: ingestionDate },
      { id: 'sm2', name: 'רמי לוי', slug: 'rami-levy', logoUrl: '/rami.png', isActive: true, lastIngestionAt: null },
    ]);

    const result = await getSupermarkets();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'sm1',
      name: 'שופרסל',
      slug: 'shufersal',
      logoUrl: null,
      lastIngestionAt: ingestionDate.toISOString(),
    });
    expect(result[1].lastIngestionAt).toBeNull();
  });

  test('returns empty array when no supermarkets exist', async () => {
    db.supermarket.findMany.mockResolvedValue([]);
    const result = await getSupermarkets();
    expect(result).toEqual([]);
  });
});
