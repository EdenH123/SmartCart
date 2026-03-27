import { resolveBasketItem, compareBasket } from '@/lib/comparison/engine';

// ── Test data factories ──

function makeProduct(overrides: Partial<{
  id: string;
  supermarketId: string;
  canonicalProductId: string;
  externalName: string;
  brand: string | null;
  price: number;
  inStock: boolean;
  isPromo: boolean;
  promoDescription: string | null;
  metadata: Record<string, unknown>;
  canonicalProduct: {
    id: string;
    categoryId: string;
    name: string;
    brand: string | null;
    metadata: Record<string, unknown>;
  };
}> = {}) {
  const cpId = overrides.canonicalProductId ?? 'cp1';
  return {
    id: overrides.id ?? 'sp1',
    supermarketId: overrides.supermarketId ?? 'sm1',
    canonicalProductId: cpId,
    externalName: overrides.externalName ?? 'Test Product',
    brand: overrides.brand ?? 'TestBrand',
    price: overrides.price ?? 1.99,
    inStock: overrides.inStock ?? true,
    isPromo: overrides.isPromo ?? false,
    promoDescription: overrides.promoDescription ?? null,
    metadata: overrides.metadata ?? {},
    canonicalProduct: overrides.canonicalProduct ?? {
      id: cpId,
      categoryId: 'cat1',
      name: 'Test Product',
      brand: 'TestBrand',
      metadata: { type: 'Regular', fat: '3%', volume: '1L' },
    },
  };
}

function makeBasketItem(overrides: Partial<{
  id: string;
  categoryId: string;
  quantity: number;
  matchMode: 'exact' | 'flexible';
  selectedCanonicalProductId: string | null;
  userConstraints: Record<string, string | number | boolean | null>;
  displayName: string;
}> = {}) {
  return {
    id: overrides.id ?? 'bi1',
    categoryId: overrides.categoryId ?? 'cat1',
    quantity: overrides.quantity ?? 1,
    matchMode: overrides.matchMode ?? 'flexible',
    selectedCanonicalProductId: overrides.selectedCanonicalProductId ?? null,
    userConstraints: overrides.userConstraints ?? {},
    displayName: overrides.displayName ?? 'Test Item',
  };
}

// ── Tests ──

describe('resolveBasketItem', () => {
  test('exact mode: finds exact match', () => {
    const item = makeBasketItem({
      matchMode: 'exact',
      selectedCanonicalProductId: 'cp1',
      quantity: 2,
    });
    const products = [
      makeProduct({ canonicalProductId: 'cp1', price: 3.50 }),
      makeProduct({ id: 'sp2', canonicalProductId: 'cp2', price: 2.00 }),
    ];

    const result = resolveBasketItem(item, products);

    expect(result.resolutionType).toBe('exact');
    expect(result.unitPrice).toBe(3.50);
    expect(result.totalPrice).toBe(7.00);
    expect(result.wasSubstituted).toBe(false);
  });

  test('exact mode: returns unavailable when product not found', () => {
    const item = makeBasketItem({
      matchMode: 'exact',
      selectedCanonicalProductId: 'cp-missing',
    });
    const products = [makeProduct({ canonicalProductId: 'cp1' })];

    const result = resolveBasketItem(item, products);

    expect(result.resolutionType).toBe('unavailable');
    expect(result.unitPrice).toBeNull();
    expect(result.totalPrice).toBeNull();
  });

  test('exact mode: ignores out-of-stock products', () => {
    const item = makeBasketItem({
      matchMode: 'exact',
      selectedCanonicalProductId: 'cp1',
    });
    const products = [makeProduct({ canonicalProductId: 'cp1', inStock: false })];

    const result = resolveBasketItem(item, products);
    expect(result.resolutionType).toBe('unavailable');
  });

  test('flexible mode: picks cheapest matching product', () => {
    const item = makeBasketItem({
      matchMode: 'flexible',
      userConstraints: { fat: '3%' },
    });
    const products = [
      makeProduct({
        id: 'sp1',
        canonicalProductId: 'cp1',
        price: 3.00,
        canonicalProduct: { id: 'cp1', categoryId: 'cat1', name: 'Expensive', brand: 'A', metadata: { fat: '3%' } },
      }),
      makeProduct({
        id: 'sp2',
        canonicalProductId: 'cp2',
        price: 1.50,
        canonicalProduct: { id: 'cp2', categoryId: 'cat1', name: 'Cheap', brand: 'B', metadata: { fat: '3%' } },
      }),
    ];

    const result = resolveBasketItem(item, products);

    expect(result.resolutionType).toBe('exact');
    expect(result.unitPrice).toBe(1.50);
    expect(result.supermarketProductId).toBe('sp2');
  });

  test('flexible mode: filters by constraints', () => {
    const item = makeBasketItem({
      matchMode: 'flexible',
      userConstraints: { fat: '3%', type: 'Organic' },
    });
    const products = [
      makeProduct({
        id: 'sp1',
        canonicalProductId: 'cp1',
        price: 1.00,
        canonicalProduct: { id: 'cp1', categoryId: 'cat1', name: 'Cheap Regular', brand: 'A', metadata: { fat: '3%', type: 'Regular' } },
      }),
      makeProduct({
        id: 'sp2',
        canonicalProductId: 'cp2',
        price: 3.00,
        canonicalProduct: { id: 'cp2', categoryId: 'cat1', name: 'Organic', brand: 'B', metadata: { fat: '3%', type: 'Organic' } },
      }),
    ];

    const result = resolveBasketItem(item, products);

    expect(result.unitPrice).toBe(3.00);
    expect(result.supermarketProductId).toBe('sp2');
  });

  test('flexible mode: "any" constraint does not filter', () => {
    const item = makeBasketItem({
      matchMode: 'flexible',
      userConstraints: { fat: 'any', type: 'Regular' },
    });
    const products = [
      makeProduct({
        id: 'sp1',
        canonicalProductId: 'cp1',
        price: 2.00,
        canonicalProduct: { id: 'cp1', categoryId: 'cat1', name: 'Regular 3%', brand: 'A', metadata: { fat: '3%', type: 'Regular' } },
      }),
      makeProduct({
        id: 'sp2',
        canonicalProductId: 'cp2',
        price: 1.50,
        canonicalProduct: { id: 'cp2', categoryId: 'cat1', name: 'Regular 1%', brand: 'B', metadata: { fat: '1%', type: 'Regular' } },
      }),
    ];

    const result = resolveBasketItem(item, products);

    expect(result.unitPrice).toBe(1.50);
  });

  test('flexible mode: returns unavailable when no products match constraints', () => {
    const item = makeBasketItem({
      matchMode: 'flexible',
      userConstraints: { fat: '99%' },
    });
    const products = [
      makeProduct({
        canonicalProduct: { id: 'cp1', categoryId: 'cat1', name: 'Test', brand: 'A', metadata: { fat: '3%' } },
      }),
    ];

    const result = resolveBasketItem(item, products);
    expect(result.resolutionType).toBe('unavailable');
  });

  test('flexible mode: marks substitution when different canonical product chosen', () => {
    const item = makeBasketItem({
      matchMode: 'flexible',
      selectedCanonicalProductId: 'cp1',
      userConstraints: { fat: '3%' },
    });
    const products = [
      makeProduct({
        id: 'sp1',
        canonicalProductId: 'cp2',
        price: 1.00,
        canonicalProduct: { id: 'cp2', categoryId: 'cat1', name: 'Alternative', brand: 'B', metadata: { fat: '3%' } },
      }),
    ];

    const result = resolveBasketItem(item, products);

    expect(result.wasSubstituted).toBe(true);
    expect(result.resolutionType).toBe('flexible_match');
    expect(result.substitutionReason).toBeTruthy();
  });

  test('promo flag is passed through', () => {
    const item = makeBasketItem({ matchMode: 'flexible' });
    const products = [
      makeProduct({
        isPromo: true,
        promoDescription: 'Weekly deal',
        canonicalProduct: { id: 'cp1', categoryId: 'cat1', name: 'Promo', brand: 'A', metadata: {} },
      }),
    ];

    const result = resolveBasketItem(item, products);
    expect(result.isPromo).toBe(true);
    expect(result.promoDescription).toBe('Weekly deal');
  });
});

describe('compareBasket', () => {
  test('ranks supermarkets by unavailable count then total', () => {
    const items = [
      makeBasketItem({ id: 'bi1', matchMode: 'flexible', userConstraints: {} }),
    ];

    const supermarkets = [
      { id: 'sm1', name: 'Expensive', slug: 'expensive' },
      { id: 'sm2', name: 'Cheap', slug: 'cheap' },
      { id: 'sm3', name: 'NoStock', slug: 'nostock' },
    ];

    const productsBySupermarket = new Map([
      ['sm1', [
        makeProduct({ id: 'sp1', supermarketId: 'sm1', price: 5.00, canonicalProduct: { id: 'cp1', categoryId: 'cat1', name: 'P1', brand: 'A', metadata: {} } }),
      ]],
      ['sm2', [
        makeProduct({ id: 'sp2', supermarketId: 'sm2', price: 2.00, canonicalProduct: { id: 'cp1', categoryId: 'cat1', name: 'P1', brand: 'A', metadata: {} } }),
      ]],
      ['sm3', [] as ReturnType<typeof makeProduct>[]],
    ]);

    const result = compareBasket(items, supermarkets, productsBySupermarket);

    // sm3 has unavailable items, should be last
    expect(result.comparisons[0].supermarketSlug).toBe('cheap');
    expect(result.comparisons[1].supermarketSlug).toBe('expensive');
    expect(result.comparisons[2].supermarketSlug).toBe('nostock');
    expect(result.comparisons[2].unavailableCount).toBe(1);
  });

  test('calculates totals correctly with quantities', () => {
    const items = [
      makeBasketItem({ id: 'bi1', quantity: 3, matchMode: 'flexible', userConstraints: {} }),
    ];

    const supermarkets = [{ id: 'sm1', name: 'Store', slug: 'store' }];
    const productsBySupermarket = new Map([
      ['sm1', [
        makeProduct({ supermarketId: 'sm1', price: 2.50, canonicalProduct: { id: 'cp1', categoryId: 'cat1', name: 'P1', brand: 'A', metadata: {} } }),
      ]],
    ]);

    const result = compareBasket(items, supermarkets, productsBySupermarket);

    expect(result.comparisons[0].total).toBe(7.50);
    expect(result.comparisons[0].itemResults[0].totalPrice).toBe(7.50);
  });

  test('returns best and worst totals', () => {
    const items = [makeBasketItem({ matchMode: 'flexible', userConstraints: {} })];
    const supermarkets = [
      { id: 'sm1', name: 'A', slug: 'a' },
      { id: 'sm2', name: 'B', slug: 'b' },
    ];
    const productsBySupermarket = new Map([
      ['sm1', [makeProduct({ supermarketId: 'sm1', price: 10, canonicalProduct: { id: 'cp1', categoryId: 'cat1', name: 'P', brand: 'A', metadata: {} } })]],
      ['sm2', [makeProduct({ id: 'sp2', supermarketId: 'sm2', price: 5, canonicalProduct: { id: 'cp1', categoryId: 'cat1', name: 'P', brand: 'A', metadata: {} } })]],
    ]);

    const result = compareBasket(items, supermarkets, productsBySupermarket);

    expect(result.bestTotal).toBe(5);
    expect(result.worstTotal).toBe(10);
    expect(result.bestSupermarketId).toBe('sm2');
  });

  test('tracks substitution count', () => {
    const items = [
      makeBasketItem({
        id: 'bi1',
        matchMode: 'flexible',
        selectedCanonicalProductId: 'cp-original',
        userConstraints: {},
      }),
    ];

    const supermarkets = [{ id: 'sm1', name: 'Store', slug: 'store' }];
    const productsBySupermarket = new Map([
      ['sm1', [
        makeProduct({
          supermarketId: 'sm1',
          canonicalProductId: 'cp-different',
          price: 2.00,
          canonicalProduct: { id: 'cp-different', categoryId: 'cat1', name: 'Alt', brand: 'B', metadata: {} },
        }),
      ]],
    ]);

    const result = compareBasket(items, supermarkets, productsBySupermarket);
    expect(result.comparisons[0].substitutionCount).toBe(1);
  });
});
