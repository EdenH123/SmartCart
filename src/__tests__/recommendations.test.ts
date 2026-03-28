import {
  generateRecommendations,
  optimizeBasket,
  optimizationScore,
  resetRecIdCounter,
} from '@/lib/recommendations';
import type {
  BasketItemForOptimization,
  ProductForOptimization,
  SupermarketForOptimization,
} from '@/lib/recommendations';

// ── Factories ──

function makeItem(overrides: Partial<BasketItemForOptimization> = {}): BasketItemForOptimization {
  return {
    id: 'item-1',
    categoryId: 'cat-milk',
    quantity: 1,
    matchMode: 'flexible',
    selectedCanonicalProductId: null,
    userConstraints: { fat: '3%', type: 'Regular' },
    displayName: 'Milk Regular 3% 1L',
    ...overrides,
  };
}

function makeProduct(overrides: Partial<ProductForOptimization> & { id?: string; price?: number } = {}): ProductForOptimization {
  return {
    id: 'prod-1',
    supermarketId: 'sm-1',
    canonicalProductId: 'cp-1',
    externalName: 'FreshMart Milk 3% 1L',
    brand: 'FreshMart',
    price: 3.99,
    inStock: true,
    isPromo: false,
    promoDescription: null,
    canonicalProduct: {
      id: 'cp-1',
      categoryId: 'cat-milk',
      name: 'Milk 3% 1L',
      brand: 'FreshMart',
      metadata: { fat: '3%', type: 'Regular', volume: '1L' },
    },
    ...overrides,
  };
}

const supermarket: SupermarketForOptimization = {
  id: 'sm-1',
  name: 'FreshMart',
  slug: 'freshmart',
};

beforeEach(() => {
  resetRecIdCounter();
});

// ── optimizationScore ──

describe('optimizationScore', () => {
  test('score equals price when all constraints match', () => {
    const item = makeItem();
    const product = makeProduct({ price: 3.99 });
    const score = optimizationScore(product, item);
    expect(score).toBe(3.99);
  });

  test('adds penalty for each mismatched attribute', () => {
    const item = makeItem({ userConstraints: { fat: '3%', type: 'Organic' } });
    const product = makeProduct({
      price: 2.00,
      canonicalProduct: {
        id: 'cp-1', categoryId: 'cat-milk', name: 'Milk', brand: null,
        metadata: { fat: '3%', type: 'Regular' }, // type mismatch
      },
    });
    // 2.00 + 5.0 penalty for type mismatch = 7.0
    expect(optimizationScore(product, item)).toBe(7.0);
  });

  test('adds brand change penalty when selectedCanonicalProductId differs', () => {
    const item = makeItem({ selectedCanonicalProductId: 'cp-original' });
    const product = makeProduct({ canonicalProductId: 'cp-different', price: 2.00 });
    // 2.00 + 2.0 brand penalty = 4.0
    expect(optimizationScore(product, item)).toBe(4.0);
  });

  test('no brand penalty when canonicalProductId matches selection', () => {
    const item = makeItem({ selectedCanonicalProductId: 'cp-1' });
    const product = makeProduct({ canonicalProductId: 'cp-1', price: 2.00 });
    expect(optimizationScore(product, item)).toBe(2.0);
  });

  test('ignores "any" and null constraints', () => {
    const item = makeItem({ userConstraints: { fat: 'any', type: null as unknown as string } });
    const product = makeProduct({ price: 1.50 });
    expect(optimizationScore(product, item)).toBe(1.50);
  });
});

// ── generateRecommendations ──

describe('generateRecommendations', () => {
  test('finds cheaper alternative when available', () => {
    const item = makeItem();
    const currentProduct = makeProduct({ id: 'prod-1', price: 5.00, canonicalProductId: 'cp-1' });
    const cheaperProduct = makeProduct({
      id: 'prod-2',
      price: 3.00,
      canonicalProductId: 'cp-2',
      externalName: 'BudgetMilk 3% 1L',
      brand: 'Budget',
      canonicalProduct: {
        id: 'cp-2', categoryId: 'cat-milk', name: 'Budget Milk', brand: 'Budget',
        metadata: { fat: '3%', type: 'Regular', volume: '1L' },
      },
    });

    const resolutions = new Map([['item-1', currentProduct]]);
    const recs = generateRecommendations([item], [currentProduct, cheaperProduct], supermarket, resolutions);

    const cheaperRec = recs.find((r) => r.type === 'cheaper_alternative');
    expect(cheaperRec).toBeDefined();
    expect(cheaperRec!.impact.savingsAmount).toBe(2.00);
  });

  test('does not recommend changes for exact mode items', () => {
    const item = makeItem({ matchMode: 'exact' });
    const currentProduct = makeProduct({ id: 'prod-1', price: 5.00 });
    const cheaperProduct = makeProduct({
      id: 'prod-2', price: 2.00, canonicalProductId: 'cp-2',
      canonicalProduct: {
        id: 'cp-2', categoryId: 'cat-milk', name: 'Cheap', brand: null,
        metadata: { fat: '3%', type: 'Regular' },
      },
    });

    const resolutions = new Map([['item-1', currentProduct]]);
    const recs = generateRecommendations([item], [currentProduct, cheaperProduct], supermarket, resolutions);

    // No cheaper_alternative or constraint_relaxation for exact items
    expect(recs.filter((r) => r.type === 'cheaper_alternative')).toHaveLength(0);
    expect(recs.filter((r) => r.type === 'constraint_relaxation')).toHaveLength(0);
  });

  test('finds promo opportunities', () => {
    const item = makeItem();
    const regularProduct = makeProduct({ id: 'prod-1', price: 4.00, isPromo: false });
    const promoProduct = makeProduct({
      id: 'prod-2',
      price: 2.50,
      canonicalProductId: 'cp-2',
      externalName: 'Promo Milk 3%',
      isPromo: true,
      promoDescription: '25% off this week',
      canonicalProduct: {
        id: 'cp-2', categoryId: 'cat-milk', name: 'Promo Milk', brand: null,
        metadata: { fat: '3%', type: 'Regular', volume: '1L' },
      },
    });

    const resolutions = new Map([['item-1', regularProduct]]);
    const recs = generateRecommendations([item], [regularProduct, promoProduct], supermarket, resolutions);

    const promoRec = recs.find((r) => r.type === 'promo');
    expect(promoRec).toBeDefined();
    expect(promoRec!.impact.savingsAmount).toBe(1.50);
  });

  test('finds constraint relaxation opportunities', () => {
    const item = makeItem({ userConstraints: { fat: '3%', type: 'Organic' } });
    const currentProduct = makeProduct({
      id: 'prod-1', price: 6.00,
      canonicalProduct: {
        id: 'cp-1', categoryId: 'cat-milk', name: 'Organic Milk', brand: null,
        metadata: { fat: '3%', type: 'Organic' },
      },
    });
    const regularProduct = makeProduct({
      id: 'prod-2', price: 3.00, canonicalProductId: 'cp-2',
      externalName: 'Regular Milk 3%',
      canonicalProduct: {
        id: 'cp-2', categoryId: 'cat-milk', name: 'Regular Milk', brand: null,
        metadata: { fat: '3%', type: 'Regular' },
      },
    });

    const resolutions = new Map([['item-1', currentProduct]]);
    const recs = generateRecommendations([item], [currentProduct, regularProduct], supermarket, resolutions);

    const relaxRec = recs.find((r) => r.type === 'constraint_relaxation');
    expect(relaxRec).toBeDefined();
    expect(relaxRec!.action.payload.constraintKey).toBe('type');
    expect(relaxRec!.impact.savingsAmount).toBe(3.00);
  });

  test('deduplicates recommendations by item and type', () => {
    const item = makeItem();
    const currentProduct = makeProduct({ id: 'prod-1', price: 5.00 });
    // Two cheaper products — only one cheaper_alternative rec should survive
    const cheap1 = makeProduct({
      id: 'prod-2', price: 3.00, canonicalProductId: 'cp-2',
      canonicalProduct: { id: 'cp-2', categoryId: 'cat-milk', name: 'A', brand: null, metadata: { fat: '3%', type: 'Regular' } },
    });
    const cheap2 = makeProduct({
      id: 'prod-3', price: 4.00, canonicalProductId: 'cp-3',
      canonicalProduct: { id: 'cp-3', categoryId: 'cat-milk', name: 'B', brand: null, metadata: { fat: '3%', type: 'Regular' } },
    });

    const resolutions = new Map([['item-1', currentProduct]]);
    const recs = generateRecommendations([item], [currentProduct, cheap1, cheap2], supermarket, resolutions);

    const cheaperRecs = recs.filter((r) => r.type === 'cheaper_alternative');
    expect(cheaperRecs).toHaveLength(1);
  });

  test('sorts recommendations by savings descending', () => {
    const item1 = makeItem({ id: 'item-1' });
    const item2 = makeItem({ id: 'item-2', displayName: 'Milk Organic' });

    const current1 = makeProduct({ id: 'prod-1', price: 5.00, canonicalProductId: 'cp-1' });
    const current2 = makeProduct({ id: 'prod-3', price: 8.00, canonicalProductId: 'cp-3',
      canonicalProduct: { id: 'cp-3', categoryId: 'cat-milk', name: 'Expensive', brand: null, metadata: { fat: '3%', type: 'Regular' } },
    });
    const cheap = makeProduct({
      id: 'prod-2', price: 2.00, canonicalProductId: 'cp-2',
      canonicalProduct: { id: 'cp-2', categoryId: 'cat-milk', name: 'Cheap', brand: null, metadata: { fat: '3%', type: 'Regular' } },
    });

    const resolutions = new Map<string, ProductForOptimization | null>([
      ['item-1', current1],
      ['item-2', current2],
    ]);

    const recs = generateRecommendations([item1, item2], [current1, current2, cheap], supermarket, resolutions);

    if (recs.length >= 2) {
      expect(recs[0].impact.savingsAmount).toBeGreaterThanOrEqual(recs[1].impact.savingsAmount);
    }
  });

  test('returns empty for no current product', () => {
    const item = makeItem();
    const resolutions = new Map<string, ProductForOptimization | null>([['item-1', null]]);
    const recs = generateRecommendations([item], [], supermarket, resolutions);
    expect(recs.filter((r) => r.type === 'cheaper_alternative')).toHaveLength(0);
  });
});

// ── optimizeBasket ──

describe('optimizeBasket', () => {
  test('picks cheapest valid product for flexible items', () => {
    const item = makeItem();
    const expensive = makeProduct({ id: 'prod-1', price: 5.00, canonicalProductId: 'cp-1' });
    const cheap = makeProduct({
      id: 'prod-2', price: 2.50, canonicalProductId: 'cp-2',
      externalName: 'Budget Milk',
      canonicalProduct: {
        id: 'cp-2', categoryId: 'cat-milk', name: 'Budget', brand: null,
        metadata: { fat: '3%', type: 'Regular', volume: '1L' },
      },
    });

    const resolutions = new Map([['item-1', { product: expensive, unitPrice: 5.00 }]]);
    const result = optimizeBasket([item], [expensive, cheap], supermarket, resolutions);

    expect(result.optimizedTotal).toBe(2.50);
    expect(result.savings).toBe(2.50);
    expect(result.items[0].changed).toBe(true);
    expect(result.items[0].optimizedProductName).toBe('Budget Milk');
  });

  test('does not change exact mode items', () => {
    const item = makeItem({ matchMode: 'exact' });
    const current = makeProduct({ id: 'prod-1', price: 5.00 });
    const cheaper = makeProduct({
      id: 'prod-2', price: 1.00, canonicalProductId: 'cp-2',
      canonicalProduct: {
        id: 'cp-2', categoryId: 'cat-milk', name: 'Cheap', brand: null,
        metadata: { fat: '3%', type: 'Regular' },
      },
    });

    const resolutions = new Map([['item-1', { product: current, unitPrice: 5.00 }]]);
    const result = optimizeBasket([item], [current, cheaper], supermarket, resolutions);

    expect(result.items[0].changed).toBe(false);
    expect(result.optimizedTotal).toBe(5.00);
    expect(result.savings).toBe(0);
  });

  test('respects quantity in totals', () => {
    const item = makeItem({ quantity: 3 });
    const current = makeProduct({ id: 'prod-1', price: 4.00 });
    const cheap = makeProduct({
      id: 'prod-2', price: 2.00, canonicalProductId: 'cp-2',
      externalName: 'Cheap Milk',
      canonicalProduct: {
        id: 'cp-2', categoryId: 'cat-milk', name: 'Cheap', brand: null,
        metadata: { fat: '3%', type: 'Regular', volume: '1L' },
      },
    });

    const resolutions = new Map([['item-1', { product: current, unitPrice: 4.00 }]]);
    const result = optimizeBasket([item], [current, cheap], supermarket, resolutions);

    expect(result.originalTotal).toBe(12.00);
    expect(result.optimizedTotal).toBe(6.00);
    expect(result.savings).toBe(6.00);
    expect(result.savingsPercentage).toBe(50);
  });

  test('keeps original when no valid candidates exist', () => {
    const item = makeItem({ userConstraints: { fat: '5%' } }); // no product has 5%
    const product = makeProduct({ id: 'prod-1', price: 3.00 });

    const resolutions = new Map([['item-1', { product: product, unitPrice: 3.00 }]]);
    const result = optimizeBasket([item], [product], supermarket, resolutions);

    expect(result.items[0].changed).toBe(false);
    expect(result.optimizedTotal).toBe(3.00);
  });

  test('calculates savings percentage correctly', () => {
    const item = makeItem();
    const current = makeProduct({ id: 'prod-1', price: 10.00 });
    const cheap = makeProduct({
      id: 'prod-2', price: 7.50, canonicalProductId: 'cp-2',
      externalName: 'Cheap',
      canonicalProduct: {
        id: 'cp-2', categoryId: 'cat-milk', name: 'Cheap', brand: null,
        metadata: { fat: '3%', type: 'Regular' },
      },
    });

    const resolutions = new Map([['item-1', { product: current, unitPrice: 10.00 }]]);
    const result = optimizeBasket([item], [current, cheap], supermarket, resolutions);

    expect(result.savingsPercentage).toBe(25);
  });

  test('includes top 5 recommendations', () => {
    const item = makeItem();
    const current = makeProduct({ id: 'prod-1', price: 10.00, canonicalProductId: 'cp-1' });
    const alternatives = Array.from({ length: 3 }, (_, i) =>
      makeProduct({
        id: `prod-alt-${i}`,
        price: 8 - i,
        canonicalProductId: `cp-alt-${i}`,
        externalName: `Alt ${i}`,
        canonicalProduct: {
          id: `cp-alt-${i}`, categoryId: 'cat-milk', name: `Alt ${i}`, brand: null,
          metadata: { fat: '3%', type: 'Regular' },
        },
      })
    );

    const resolutions = new Map([['item-1', { product: current, unitPrice: 10.00 }]]);
    const result = optimizeBasket([item], [current, ...alternatives], supermarket, resolutions);

    expect(result.recommendations.length).toBeLessThanOrEqual(5);
  });

  test('handles empty basket', () => {
    const result = optimizeBasket([], [], supermarket, new Map());

    expect(result.originalTotal).toBe(0);
    expect(result.optimizedTotal).toBe(0);
    expect(result.savings).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  test('out-of-stock products are excluded from optimization', () => {
    const item = makeItem();
    const current = makeProduct({ id: 'prod-1', price: 5.00 });
    const cheapButOOS = makeProduct({
      id: 'prod-2', price: 1.00, canonicalProductId: 'cp-2', inStock: false,
      canonicalProduct: {
        id: 'cp-2', categoryId: 'cat-milk', name: 'OOS', brand: null,
        metadata: { fat: '3%', type: 'Regular' },
      },
    });

    const resolutions = new Map([['item-1', { product: current, unitPrice: 5.00 }]]);
    const result = optimizeBasket([item], [current, cheapButOOS], supermarket, resolutions);

    // Should keep current since OOS is excluded and current is the only valid option
    expect(result.items[0].optimizedUnitPrice).toBe(5.00);
  });
});
