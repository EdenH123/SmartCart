'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/client';
import { searchCategories, searchProducts, getAllCategories, getCategory } from '@/lib/products/search';
import { compareBasket } from '@/lib/comparison/engine';
import { optimizeBasket as optimizeBasketEngine, splitCartOptimization } from '@/lib/recommendations';
import { createLogger } from '@/lib/logger';
import type {
  BasketItemDTO,
  BasketItemInput,
  CategoryWithAttributes,
  ComparisonResult,
  MatchMode,
  OptimizationResult,
  ProductSearchResult,
  SupermarketDTO,
  UserConstraints,
  PriceHistoryData,
  PriceDrop,
  SpendingAnalytics,
  CostHistory,
  CostHistoryPoint,
  AdminStats,
  SupermarketHealth,
} from '@/types';

const log = createLogger('actions');

// ── Category Actions ──

export async function searchCategoriesAction(query: string): Promise<CategoryWithAttributes[]> {
  return searchCategories(query);
}

export async function getAllCategoriesAction(): Promise<CategoryWithAttributes[]> {
  return getAllCategories();
}

export async function getCategoryAction(categoryId: string): Promise<CategoryWithAttributes | null> {
  return getCategory(categoryId);
}

// ── Product Search ──

export async function searchProductsAction(
  categoryId: string,
  constraints: Record<string, string | number | boolean | null>
): Promise<ProductSearchResult[]> {
  return searchProducts(categoryId, constraints);
}

// ── Basket Actions ──

const BASKET_COOKIE = 'smartcart-basket-id';
const BASKET_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export async function getOrCreateBasket(): Promise<string> {
  const cookieStore = await cookies();
  const savedId = cookieStore.get(BASKET_COOKIE)?.value;

  // Try to use the cookie-saved basket
  if (savedId) {
    const existing = await prisma.basket.findUnique({ where: { id: savedId } });
    if (existing) return existing.id;
  }

  // Fall back to most recent basket
  const recent = await prisma.basket.findFirst({
    orderBy: { updatedAt: 'desc' },
  });
  if (recent) {
    cookieStore.set(BASKET_COOKIE, recent.id, { maxAge: BASKET_COOKIE_MAX_AGE, path: '/' });
    return recent.id;
  }

  // Create new basket
  const basket = await prisma.basket.create({ data: {} });
  cookieStore.set(BASKET_COOKIE, basket.id, { maxAge: BASKET_COOKIE_MAX_AGE, path: '/' });
  return basket.id;
}

export async function getBasketItems(basketId: string): Promise<BasketItemDTO[]> {
  const items = await prisma.basketItem.findMany({
    where: { basketId },
    include: { category: true },
    orderBy: { createdAt: 'asc' },
  });

  return items.map((item) => ({
    id: item.id,
    basketId: item.basketId,
    categoryId: item.categoryId,
    categoryName: item.category.name,
    categorySlug: item.category.slug,
    quantity: item.quantity,
    matchMode: item.matchMode as MatchMode,
    selectedCanonicalProductId: item.selectedCanonicalProductId,
    userConstraints: safeJsonParse(item.userConstraints) as UserConstraints,
    displayName: item.displayName,
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function addBasketItem(basketId: string, input: BasketItemInput): Promise<BasketItemDTO> {
  const item = await prisma.basketItem.create({
    data: {
      basketId,
      categoryId: input.categoryId,
      quantity: input.quantity,
      matchMode: input.matchMode,
      selectedCanonicalProductId: input.selectedCanonicalProductId ?? null,
      userConstraints: JSON.stringify(input.userConstraints),
      displayName: input.displayName,
    },
    include: { category: true },
  });

  return {
    id: item.id,
    basketId: item.basketId,
    categoryId: item.categoryId,
    categoryName: item.category.name,
    categorySlug: item.category.slug,
    quantity: item.quantity,
    matchMode: item.matchMode as MatchMode,
    selectedCanonicalProductId: item.selectedCanonicalProductId,
    userConstraints: safeJsonParse(item.userConstraints) as UserConstraints,
    displayName: item.displayName,
    createdAt: item.createdAt.toISOString(),
  };
}

export async function updateBasketItemQuantity(itemId: string, quantity: number): Promise<void> {
  await prisma.basketItem.update({
    where: { id: itemId },
    data: { quantity },
  });
}

export async function removeBasketItem(itemId: string): Promise<void> {
  await prisma.basketItem.delete({ where: { id: itemId } });
}

export async function clearBasket(basketId: string): Promise<void> {
  await prisma.basketItem.deleteMany({ where: { basketId } });
}

// ── Load Demo Basket ──

export async function loadDemoBasket(): Promise<string> {
  const demoBasket = await prisma.basket.findFirst({
    where: {
      items: { some: {} },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (demoBasket) {
    const cookieStore = await cookies();
    cookieStore.set(BASKET_COOKIE, demoBasket.id, { maxAge: BASKET_COOKIE_MAX_AGE, path: '/' });
    return demoBasket.id;
  }

  const categories = await prisma.productCategory.findMany();
  const catMap = new Map(categories.map((c) => [c.slug, c.id]));

  const basket = await prisma.basket.create({
    data: {
      items: {
        create: [
          {
            categoryId: catMap.get('milk')!,
            quantity: 2,
            matchMode: 'flexible',
            displayName: 'Milk Regular 3% 1L',
            userConstraints: JSON.stringify({ type: 'Regular', fat: '3%', volume: '1L' }),
          },
          {
            categoryId: catMap.get('eggs')!,
            quantity: 1,
            matchMode: 'flexible',
            displayName: 'Eggs Large 12-pack',
            userConstraints: JSON.stringify({ size: 'L', packCount: '12' }),
          },
          {
            categoryId: catMap.get('chicken-breast')!,
            quantity: 1,
            matchMode: 'flexible',
            displayName: 'Chicken Breast Regular 1kg',
            userConstraints: JSON.stringify({ type: 'Regular', weight: '1kg' }),
          },
        ],
      },
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(BASKET_COOKIE, basket.id, { maxAge: BASKET_COOKIE_MAX_AGE, path: '/' });
  return basket.id;
}

// ── Shared Helpers ──

type RawSupermarketProduct = Awaited<ReturnType<typeof prisma.supermarketProduct.findMany>>[number] & {
  canonicalProduct: Awaited<ReturnType<typeof prisma.canonicalProduct.findFirst>> & Record<string, unknown>;
  priceSnapshots: Array<{ price: number; isPromo: boolean; promoDescription: string | null; inStock: boolean; capturedAt: Date }>;
};

interface TransformedProduct {
  id: string;
  supermarketId: string;
  canonicalProductId: string;
  externalName: string;
  brand: string | null;
  price: number;
  inStock: boolean;
  isPromo: boolean;
  promoDescription: string | null;
  promoEndDate: string | null;
  metadata: Record<string, unknown>;
  priceTimestamp: string | null;
  canonicalProduct: {
    id: string;
    categoryId: string;
    name: string;
    brand: string | null;
    metadata: Record<string, unknown>;
  };
}

function safeJsonParse(json: string, fallback: Record<string, unknown> = {}): Record<string, unknown> {
  try { return JSON.parse(json) as Record<string, unknown>; }
  catch { return fallback; }
}

function transformProduct(p: RawSupermarketProduct): TransformedProduct {
  const snap = p.priceSnapshots[0];
  return {
    id: p.id,
    supermarketId: p.supermarketId,
    canonicalProductId: p.canonicalProductId,
    externalName: p.externalName,
    brand: p.brand,
    price: snap?.price ?? p.price,
    inStock: snap?.inStock ?? p.inStock,
    isPromo: snap?.isPromo ?? p.isPromo,
    promoDescription: snap?.promoDescription ?? p.promoDescription,
    promoEndDate: (p as Record<string, unknown>).promoEndDate
      ? ((p as Record<string, unknown>).promoEndDate as Date).toISOString()
      : null,
    metadata: safeJsonParse(p.metadata),
    priceTimestamp: snap?.capturedAt?.toISOString() ?? p.updatedAt.toISOString(),
    canonicalProduct: {
      id: p.canonicalProduct.id,
      categoryId: p.canonicalProduct.categoryId,
      name: p.canonicalProduct.name,
      brand: p.canonicalProduct.brand,
      metadata: safeJsonParse(p.canonicalProduct.metadata),
    },
  };
}

const PRODUCT_INCLUDE = {
  canonicalProduct: true,
  priceSnapshots: { orderBy: { capturedAt: 'desc' as const }, take: 1 },
} as const;

async function fetchAllProductsGrouped() {
  const [supermarkets, allProducts] = await Promise.all([
    prisma.supermarket.findMany({ where: { isActive: true } }),
    prisma.supermarketProduct.findMany({ include: PRODUCT_INCLUDE }),
  ]);

  // Group raw products by supermarket
  const rawBySupermarket = new Map<string, RawSupermarketProduct[]>();
  for (const p of allProducts) {
    const list = rawBySupermarket.get(p.supermarketId) ?? [];
    list.push(p as RawSupermarketProduct);
    rawBySupermarket.set(p.supermarketId, list);
  }

  // Transform once, reuse everywhere
  const transformedBySupermarket = new Map<string, TransformedProduct[]>();
  for (const [smId, products] of rawBySupermarket) {
    transformedBySupermarket.set(smId, products.map(transformProduct));
  }

  return { supermarkets, transformedBySupermarket };
}

function toBasketItemsForEngine(basketItems: Array<{
  id: string;
  categoryId: string;
  quantity: number;
  matchMode: string;
  selectedCanonicalProductId: string | null;
  userConstraints: string;
  displayName: string;
}>) {
  return basketItems.map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    quantity: item.quantity,
    matchMode: item.matchMode as 'exact' | 'flexible',
    selectedCanonicalProductId: item.selectedCanonicalProductId,
    userConstraints: safeJsonParse(item.userConstraints) as UserConstraints,
    displayName: item.displayName,
  }));
}

// ── Comparison ──

export async function compareBasketAction(basketId: string): Promise<ComparisonResult> {
  const startTime = Date.now();

  const basketItems = await prisma.basketItem.findMany({
    where: { basketId },
    include: { category: true },
  });

  if (basketItems.length === 0) {
    return {
      basketId,
      comparisons: [],
      bestSupermarketId: null,
      bestTotal: 0,
      worstTotal: 0,
    };
  }

  const { supermarkets, transformedBySupermarket } = await fetchAllProductsGrouped();

  const itemsForComparison = toBasketItemsForEngine(basketItems);

  const supermarketInfos = supermarkets.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    lastIngestionAt: s.lastIngestionAt?.toISOString() ?? null,
  }));

  const result = compareBasket(itemsForComparison, supermarketInfos, transformedBySupermarket);
  result.basketId = basketId;

  const durationMs = Date.now() - startTime;
  log.info('Comparison completed', {
    basketId,
    itemCount: basketItems.length,
    supermarketCount: supermarkets.length,
    durationMs,
  });

  return result;
}

// ── Optimization ──

export async function optimizeBasketAction(basketId: string): Promise<OptimizationResult> {
  const startTime = Date.now();
  const emptyResult: OptimizationResult = {
    basketId,
    supermarketId: '',
    supermarketName: '',
    originalTotal: 0,
    optimizedTotal: 0,
    savings: 0,
    savingsPercentage: 0,
    items: [],
    recommendations: [],
  };

  const basketItems = await prisma.basketItem.findMany({
    where: { basketId },
    include: { category: true },
  });

  if (basketItems.length === 0) return emptyResult;

  // Single fetch: all supermarkets + all products (reused for compare, optimize, and split-cart)
  const { supermarkets, transformedBySupermarket } = await fetchAllProductsGrouped();

  const itemsForEngine = toBasketItemsForEngine(basketItems);

  // Run comparison inline (no second DB fetch)
  const supermarketInfos = supermarkets.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    lastIngestionAt: s.lastIngestionAt?.toISOString() ?? null,
  }));

  const comparisonResult = compareBasket(itemsForEngine, supermarketInfos, transformedBySupermarket);

  if (!comparisonResult.bestSupermarketId || comparisonResult.comparisons.length === 0) {
    return emptyResult;
  }

  const bestComparison = comparisonResult.comparisons.find(
    (c) => c.supermarketId === comparisonResult.bestSupermarketId
  );
  if (!bestComparison) return emptyResult;

  const supermarket = supermarkets.find((s) => s.id === comparisonResult.bestSupermarketId);
  if (!supermarket) throw new Error(`Supermarket ${comparisonResult.bestSupermarketId} not found`);

  const products = transformedBySupermarket.get(supermarket.id) ?? [];

  // Build current resolutions from the comparison result
  const currentResolutions = new Map<string, { product: TransformedProduct | null; unitPrice: number }>();
  for (const itemResult of bestComparison.itemResults) {
    const matchedProduct = itemResult.supermarketProductId
      ? products.find((p) => p.id === itemResult.supermarketProductId) ?? null
      : null;
    currentResolutions.set(itemResult.basketItemId, {
      product: matchedProduct,
      unitPrice: itemResult.unitPrice ?? 0,
    });
  }

  const result = optimizeBasketEngine(
    itemsForEngine,
    products,
    { id: supermarket.id, name: supermarket.name, slug: supermarket.slug },
    currentResolutions
  );
  result.basketId = basketId;

  // Split-cart optimization reuses already-fetched data
  if (supermarkets.length >= 2) {
    const allSmProducts = supermarkets.map((sm) => ({
      supermarket: { id: sm.id, name: sm.name, slug: sm.slug },
      products: transformedBySupermarket.get(sm.id) ?? [],
    }));

    result.splitCart = splitCartOptimization(
      itemsForEngine,
      allSmProducts,
      result.optimizedTotal
    );
  }

  const durationMs = Date.now() - startTime;
  log.info('Optimization completed', {
    basketId,
    supermarketId: supermarket.id,
    originalTotal: result.originalTotal,
    optimizedTotal: result.optimizedTotal,
    savings: result.savings,
    splitCartSavings: result.splitCart?.savingsVsBest ?? 0,
    durationMs,
  });

  return result;
}

// ── Quick Add ──

export async function quickAddToBasket(
  basketId: string,
  categorySlug: string,
  constraints: Record<string, string>,
  displayName: string
): Promise<BasketItemDTO | null> {
  const category = await prisma.productCategory.findUnique({
    where: { slug: categorySlug },
  });

  if (!category) {
    log.warn('quickAddToBasket: category not found', { categorySlug });
    return null;
  }

  const item = await prisma.basketItem.create({
    data: {
      basketId,
      categoryId: category.id,
      quantity: 1,
      matchMode: 'flexible',
      selectedCanonicalProductId: null,
      userConstraints: JSON.stringify(constraints),
      displayName,
    },
    include: { category: true },
  });

  return {
    id: item.id,
    basketId: item.basketId,
    categoryId: item.categoryId,
    categoryName: item.category.name,
    categorySlug: item.category.slug,
    quantity: item.quantity,
    matchMode: item.matchMode as MatchMode,
    selectedCanonicalProductId: item.selectedCanonicalProductId,
    userConstraints: safeJsonParse(item.userConstraints) as UserConstraints,
    displayName: item.displayName,
    createdAt: item.createdAt.toISOString(),
  };
}

// ── Price Ranges ──

export async function getItemPriceRanges(
  basketId: string
): Promise<Record<string, { min: number; max: number; count: number } | null>> {
  const basketItems = await prisma.basketItem.findMany({
    where: { basketId },
  });

  if (basketItems.length === 0) return {};

  // Collect all category IDs and canonical product IDs needed
  const categoryIds = new Set<string>();
  const canonicalProductIds = new Set<string>();
  for (const item of basketItems) {
    if (item.matchMode === 'exact' && item.selectedCanonicalProductId) {
      canonicalProductIds.add(item.selectedCanonicalProductId);
    } else {
      categoryIds.add(item.categoryId);
    }
  }

  // Single batched query for all products across all basket items
  const allProducts = await prisma.supermarketProduct.findMany({
    where: {
      inStock: true,
      OR: [
        ...(categoryIds.size > 0 ? [{ canonicalProduct: { categoryId: { in: [...categoryIds] } } }] : []),
        ...(canonicalProductIds.size > 0 ? [{ canonicalProduct: { id: { in: [...canonicalProductIds] } } }] : []),
      ],
    },
    select: {
      price: true,
      supermarketId: true,
      canonicalProductId: true,
      canonicalProduct: { select: { categoryId: true } },
      priceSnapshots: {
        orderBy: { capturedAt: 'desc' },
        take: 1,
        select: { price: true, inStock: true },
      },
    },
  });

  // Build index: categoryId → products, and canonicalProductId → products
  const result: Record<string, { min: number; max: number; count: number } | null> = {};

  for (const item of basketItems) {
    const isExact = item.matchMode === 'exact' && item.selectedCanonicalProductId;
    let min = Infinity;
    let max = -Infinity;
    const supermarketIds = new Set<string>();

    for (const p of allProducts) {
      // Match product to basket item
      if (isExact) {
        if (p.canonicalProductId !== item.selectedCanonicalProductId) continue;
      } else {
        if (p.canonicalProduct.categoryId !== item.categoryId) continue;
      }

      const snapshot = p.priceSnapshots[0];
      if (snapshot && !snapshot.inStock) continue;
      const price = snapshot?.price ?? p.price;
      if (price < min) min = price;
      if (price > max) max = price;
      supermarketIds.add(p.supermarketId);
    }

    result[item.id] = min === Infinity ? null : { min, max, count: supermarketIds.size };
  }

  return result;
}

// ── Share Basket ──

export async function shareBasket(basketId: string): Promise<string> {
  const items = await prisma.basketItem.findMany({
    where: { basketId },
    orderBy: { createdAt: 'asc' },
  });

  const compact = items.map((item) => ({
    c: item.categoryId,
    q: item.quantity,
    m: item.matchMode,
    p: item.selectedCanonicalProductId,
    u: safeJsonParse(item.userConstraints),
    d: item.displayName,
  }));

  const json = JSON.stringify(compact);
  const encoded = Buffer.from(json, 'utf-8').toString('base64url');
  return encoded;
}

export async function importSharedBasket(encoded: string): Promise<string> {
  const json = Buffer.from(encoded, 'base64url').toString('utf-8');
  const compact = JSON.parse(json) as Array<{
    c: string;
    q: number;
    m: string;
    p: string | null;
    u: Record<string, unknown>;
    d: string;
  }>;

  const basket = await prisma.basket.create({
    data: {
      items: {
        create: compact.map((item) => ({
          categoryId: item.c,
          quantity: item.q,
          matchMode: item.m,
          selectedCanonicalProductId: item.p,
          userConstraints: JSON.stringify(item.u),
          displayName: item.d,
        })),
      },
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(BASKET_COOKIE, basket.id, { maxAge: BASKET_COOKIE_MAX_AGE, path: '/' });
  return basket.id;
}

// ── Supermarket Info ──

export async function getSupermarkets(): Promise<SupermarketDTO[]> {
  const supermarkets = await prisma.supermarket.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  return supermarkets.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    logoUrl: s.logoUrl,
    lastIngestionAt: s.lastIngestionAt?.toISOString() ?? null,
  }));
}

// ── Price History ──

export async function getPriceHistory(canonicalProductId: string): Promise<PriceHistoryData> {
  const supermarketProducts = await prisma.supermarketProduct.findMany({
    where: { canonicalProductId },
    include: {
      supermarket: { select: { name: true } },
      priceSnapshots: {
        orderBy: { capturedAt: 'desc' },
        take: 30,
      },
    },
  });

  return supermarketProducts.map((sp) => ({
    supermarketName: sp.supermarket.name,
    data: sp.priceSnapshots.map((snap) => ({
      date: snap.capturedAt.toISOString(),
      price: snap.price,
      isPromo: snap.isPromo,
    })),
  }));
}

// ── Price Drop Notifications ──

export async function checkPriceDrops(basketId: string): Promise<PriceDrop[]> {
  const basketItems = await prisma.basketItem.findMany({
    where: { basketId },
    include: { category: true },
  });

  if (basketItems.length === 0) return [];

  const categoryIds = [...new Set(basketItems.map((item) => item.categoryId))];

  const supermarketProducts = await prisma.supermarketProduct.findMany({
    where: {
      canonicalProduct: { categoryId: { in: categoryIds } },
      inStock: true,
    },
    include: {
      canonicalProduct: { select: { id: true, categoryId: true, name: true } },
      supermarket: { select: { name: true } },
      priceSnapshots: {
        orderBy: { capturedAt: 'desc' },
        take: 2,
      },
    },
  });

  const drops: PriceDrop[] = [];

  for (const sp of supermarketProducts) {
    if (sp.priceSnapshots.length < 2) continue;

    const [current, previous] = sp.priceSnapshots;
    if (current.price >= previous.price) continue;

    const matchingItem = basketItems.find((item) => item.categoryId === sp.canonicalProduct.categoryId);
    if (!matchingItem) continue;

    const dropPercent = ((previous.price - current.price) / previous.price) * 100;

    drops.push({
      productName: sp.canonicalProduct.name,
      supermarket: sp.supermarket.name,
      oldPrice: previous.price,
      newPrice: current.price,
      dropPercent: Math.round(dropPercent * 10) / 10,
    });
  }

  drops.sort((a, b) => b.dropPercent - a.dropPercent);
  return drops;
}

// ── Category Browsing ──

export interface CategoryWithProductCount {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export async function getCategoriesWithProductCount(): Promise<CategoryWithProductCount[]> {
  const categories = await prisma.productCategory.findMany({
    include: {
      _count: {
        select: {
          canonicalProducts: { where: { isActive: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    productCount: cat._count.canonicalProducts,
  }));
}

export interface CategoryProduct {
  id: string;
  name: string;
  brand: string | null;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  metadata: Record<string, unknown>;
  priceMin: number | null;
  priceMax: number | null;
  supermarketCount: number;
}

export interface CategoryProductsPage {
  products: CategoryProduct[];
  totalCount: number;
  hasMore: boolean;
}

export async function getProductsByCategory(
  categoryId: string,
  page: number = 1
): Promise<CategoryProductsPage> {
  const PAGE_SIZE = 20;
  const skip = (page - 1) * PAGE_SIZE;

  const [products, totalCount] = await Promise.all([
    prisma.canonicalProduct.findMany({
      where: { categoryId, isActive: true },
      include: {
        category: true,
        supermarketProducts: {
          where: { inStock: true },
          select: {
            price: true,
            supermarketId: true,
            priceSnapshots: {
              orderBy: { capturedAt: 'desc' },
              take: 1,
              select: { price: true, inStock: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.canonicalProduct.count({
      where: { categoryId, isActive: true },
    }),
  ]);

  const result: CategoryProduct[] = products.map((product) => {
    let min = Infinity;
    let max = -Infinity;
    const supermarketIds = new Set<string>();

    for (const sp of product.supermarketProducts) {
      const snap = sp.priceSnapshots[0];
      if (snap && !snap.inStock) continue;
      const price = snap?.price ?? sp.price;
      if (price < min) min = price;
      if (price > max) max = price;
      supermarketIds.add(sp.supermarketId);
    }

    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      categorySlug: product.category.slug,
      metadata: safeJsonParse(product.metadata) as Record<string, unknown>,
      priceMin: min === Infinity ? null : min,
      priceMax: max === -Infinity ? null : max,
      supermarketCount: supermarketIds.size,
    };
  });

  return {
    products: result,
    totalCount,
    hasMore: skip + PAGE_SIZE < totalCount,
  };
}

// ── Spending Analytics ──

export async function getSpendingAnalytics(basketId: string): Promise<SpendingAnalytics | null> {
  const basketItems = await prisma.basketItem.findMany({
    where: { basketId },
    include: { category: true },
  });

  if (basketItems.length === 0) return null;

  const categoryIds = [...new Set(basketItems.map((item) => item.categoryId))];

  const supermarkets = await prisma.supermarket.findMany({ where: { isActive: true } });

  const supermarketProducts = await prisma.supermarketProduct.findMany({
    where: {
      canonicalProduct: { categoryId: { in: categoryIds } },
      inStock: true,
    },
    include: {
      canonicalProduct: { select: { id: true, categoryId: true, name: true } },
      supermarket: { select: { id: true, name: true } },
    },
  });

  // Cost per supermarket
  const costBySupermarket: Record<string, { name: string; total: number }> = {};
  for (const s of supermarkets) {
    costBySupermarket[s.id] = { name: s.name, total: 0 };
  }

  // Category spending (using cheapest supermarket prices)
  const categoryTotals: Record<string, { name: string; amount: number }> = {};

  // Price range per product
  const productPrices: Record<string, { name: string; prices: number[] }> = {};

  for (const item of basketItems) {
    const matching = supermarketProducts.filter(
      (sp) => sp.canonicalProduct.categoryId === item.categoryId
    );

    let cheapestPrice = Infinity;

    for (const sp of matching) {
      const price = sp.price * item.quantity;
      if (costBySupermarket[sp.supermarket.id]) {
        costBySupermarket[sp.supermarket.id].total += price;
      }

      if (!productPrices[sp.canonicalProduct.id]) {
        productPrices[sp.canonicalProduct.id] = { name: sp.canonicalProduct.name, prices: [] };
      }
      productPrices[sp.canonicalProduct.id].prices.push(sp.price);

      if (sp.price < cheapestPrice) cheapestPrice = sp.price;
    }

    const catName = item.category.name;
    if (!categoryTotals[catName]) {
      categoryTotals[catName] = { name: catName, amount: 0 };
    }
    if (cheapestPrice < Infinity) {
      categoryTotals[catName].amount += cheapestPrice * item.quantity;
    }
  }

  const supermarketCosts = Object.values(costBySupermarket)
    .filter((s) => s.total > 0)
    .sort((a, b) => a.total - b.total);

  const totalCategorySpending = Object.values(categoryTotals).reduce((s, c) => s + c.amount, 0);
  const categoryBreakdown = Object.values(categoryTotals)
    .filter((c) => c.amount > 0)
    .map((c) => ({
      categoryName: c.name,
      amount: Math.round(c.amount * 100) / 100,
      percentage: totalCategorySpending > 0 ? Math.round((c.amount / totalCategorySpending) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const savingsOpportunities = Object.values(productPrices)
    .filter((p) => p.prices.length >= 2)
    .map((p) => ({
      productName: p.name,
      minPrice: Math.min(...p.prices),
      maxPrice: Math.max(...p.prices),
      savings: Math.round((Math.max(...p.prices) - Math.min(...p.prices)) * 100) / 100,
    }))
    .filter((p) => p.savings > 0)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 10);

  const cheapest = supermarketCosts[0];
  const mostExpensive = supermarketCosts[supermarketCosts.length - 1];

  return {
    totalItems: basketItems.reduce((s, i) => s + i.quantity, 0),
    supermarketCosts: supermarketCosts.map((s) => ({ supermarketName: s.name, totalCost: Math.round(s.total * 100) / 100 })),
    categoryBreakdown,
    savingsOpportunities,
    potentialMaxSavings: cheapest && mostExpensive ? Math.round((mostExpensive.total - cheapest.total) * 100) / 100 : 0,
    cheapestSupermarket: cheapest?.name ?? '',
    cheapestTotal: cheapest ? Math.round(cheapest.total * 100) / 100 : 0,
  };
}

// ── Saved Baskets ──

interface SavedBasket {
  name: string;
  items: Array<{ categoryId: string; categoryName: string; userConstraints: string; displayName: string; quantity: number; matchMode: string }>;
  savedAt: string;
}

export async function saveBasketAs(basketId: string, name: string): Promise<void> {
  const cookieStore = await cookies();
  const items = await prisma.basketItem.findMany({
    where: { basketId },
    include: { category: true },
  });

  const savedEntry: SavedBasket = {
    name,
    items: items.map((i) => ({
      categoryId: i.categoryId,
      categoryName: i.category.name,
      userConstraints: i.userConstraints,
      displayName: i.displayName,
      quantity: i.quantity,
      matchMode: i.matchMode,
    })),
    savedAt: new Date().toISOString(),
  };

  const existing: SavedBasket[] = JSON.parse(cookieStore.get('saved-baskets')?.value ?? '[]') as SavedBasket[];
  existing.unshift(savedEntry);
  const trimmed = existing.slice(0, 10);
  cookieStore.set('saved-baskets', JSON.stringify(trimmed), { path: '/', maxAge: 60 * 60 * 24 * 365 });
}

export async function getSavedBaskets(): Promise<Array<{ name: string; itemCount: number; savedAt: string }>> {
  const cookieStore = await cookies();
  const baskets: SavedBasket[] = JSON.parse(cookieStore.get('saved-baskets')?.value ?? '[]') as SavedBasket[];
  return baskets.map((b) => ({
    name: b.name,
    itemCount: b.items.length,
    savedAt: b.savedAt,
  }));
}

export async function loadSavedBasket(index: number): Promise<string> {
  const cookieStore = await cookies();
  const baskets: SavedBasket[] = JSON.parse(cookieStore.get('saved-baskets')?.value ?? '[]') as SavedBasket[];
  const basket = baskets[index];
  if (!basket) throw new Error('Basket not found');

  const basketId = await getOrCreateBasket();
  await prisma.basketItem.deleteMany({ where: { basketId } });

  for (const item of basket.items) {
    await prisma.basketItem.create({
      data: {
        basketId,
        categoryId: item.categoryId,
        userConstraints: item.userConstraints,
        displayName: item.displayName,
        quantity: item.quantity,
        matchMode: item.matchMode,
      },
    });
  }

  return basketId;
}

export async function deleteSavedBasket(index: number): Promise<void> {
  const cookieStore = await cookies();
  const baskets: SavedBasket[] = JSON.parse(cookieStore.get('saved-baskets')?.value ?? '[]') as SavedBasket[];
  baskets.splice(index, 1);
  cookieStore.set('saved-baskets', JSON.stringify(baskets), { path: '/', maxAge: 60 * 60 * 24 * 365 });
}

// ── Barcode Lookup ──

export interface BarcodeLookupResult {
  canonicalProductId: string;
  name: string;
  brand: string | null;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
}

export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult | null> {
  const trimmed = barcode.trim();
  if (!trimmed) return null;

  const product = await prisma.canonicalProduct.findFirst({
    where: {
      barcode: trimmed,
      isActive: true,
    },
    include: { category: true },
  });

  if (!product) return null;

  return {
    canonicalProductId: product.id,
    name: product.name,
    brand: product.brand,
    categoryId: product.category.id,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
  };
}

// ── Cost History ──

export async function getCostHistory(basketId: string): Promise<CostHistory | null> {
  const basketItems = await prisma.basketItem.findMany({
    where: { basketId },
  });

  if (basketItems.length === 0) return null;

  const categoryIds = [...new Set(basketItems.map((item) => item.categoryId))];

  const snapshots = await prisma.priceSnapshot.findMany({
    where: {
      supermarketProduct: {
        canonicalProduct: { categoryId: { in: categoryIds } },
        inStock: true,
      },
    },
    include: {
      supermarketProduct: {
        include: {
          supermarket: { select: { id: true, name: true } },
          canonicalProduct: { select: { categoryId: true } },
        },
      },
    },
    orderBy: { capturedAt: 'asc' },
  });

  // Group by date → supermarket → sum of cheapest price per category
  const dateMap = new Map<string, Map<string, Map<string, number>>>();

  for (const snap of snapshots) {
    const dateStr = snap.capturedAt.toISOString().slice(0, 10);
    const smId = snap.supermarketProduct.supermarket.id;
    const smName = snap.supermarketProduct.supermarket.name;
    const catId = snap.supermarketProduct.canonicalProduct.categoryId;

    if (!dateMap.has(dateStr)) dateMap.set(dateStr, new Map());
    const smMap = dateMap.get(dateStr)!;
    const key = `${smId}|${smName}`;
    if (!smMap.has(key)) smMap.set(key, new Map());
    const catMap = smMap.get(key)!;

    const existing = catMap.get(catId);
    if (existing === undefined || snap.price < existing) {
      catMap.set(catId, snap.price);
    }
  }

  // For each date, find the cheapest supermarket total
  const points: CostHistoryPoint[] = [];

  for (const [date, smMap] of dateMap) {
    let cheapestTotal = Infinity;
    let cheapestName = '';

    for (const [key, catMap] of smMap) {
      let total = 0;
      for (const item of basketItems) {
        const price = catMap.get(item.categoryId);
        if (price !== undefined) {
          total += price * item.quantity;
        }
      }
      if (total > 0 && total < cheapestTotal) {
        cheapestTotal = total;
        cheapestName = key.split('|')[1];
      }
    }

    if (cheapestTotal < Infinity) {
      points.push({
        date,
        cheapestTotal: Math.round(cheapestTotal * 100) / 100,
        supermarketName: cheapestName,
      });
    }
  }

  // Return last 14 data points
  const sorted = points.sort((a, b) => a.date.localeCompare(b.date)).slice(-14);

  return {
    points: sorted,
    basketItemCount: basketItems.length,
  };
}

// ── Admin Dashboard ──

export async function getAdminStats(): Promise<AdminStats> {
  const [totalProducts, totalCategories, totalSupermarkets, totalSnapshots] = await Promise.all([
    prisma.canonicalProduct.count({ where: { isActive: true } }),
    prisma.productCategory.count(),
    prisma.supermarket.count({ where: { isActive: true } }),
    prisma.priceSnapshot.count(),
  ]);

  const supermarkets = await prisma.supermarket.findMany({
    where: { isActive: true },
    include: {
      products: {
        select: {
          price: true,
          inStock: true,
          isPromo: true,
        },
      },
    },
  });

  const now = new Date();
  const staleThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const supermarketHealth: SupermarketHealth[] = supermarkets.map((s) => {
    const products = s.products;
    const totalPrices = products.filter((p) => p.inStock).map((p) => p.price);
    const avgPrice = totalPrices.length > 0
      ? Math.round((totalPrices.reduce((sum, p) => sum + p, 0) / totalPrices.length) * 100) / 100
      : 0;

    return {
      name: s.name,
      slug: s.slug,
      productCount: products.length,
      lastIngestionAt: s.lastIngestionAt?.toISOString() ?? null,
      avgPrice,
      outOfStockCount: products.filter((p) => !p.inStock).length,
      promoCount: products.filter((p) => p.isPromo).length,
      isStale: !s.lastIngestionAt || s.lastIngestionAt < staleThreshold,
    };
  });

  return {
    totalProducts,
    totalCategories,
    totalSupermarkets,
    totalSnapshots,
    supermarketHealth,
  };
}
