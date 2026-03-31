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
    quantity: item.quantity,
    matchMode: item.matchMode as MatchMode,
    selectedCanonicalProductId: item.selectedCanonicalProductId,
    userConstraints: JSON.parse(item.userConstraints) as UserConstraints,
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
    quantity: item.quantity,
    matchMode: item.matchMode as MatchMode,
    selectedCanonicalProductId: item.selectedCanonicalProductId,
    userConstraints: JSON.parse(item.userConstraints) as UserConstraints,
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

  const supermarkets = await prisma.supermarket.findMany({
    where: { isActive: true },
  });

  // Fetch all supermarket products with canonical products and latest price snapshot
  const allProducts = await prisma.supermarketProduct.findMany({
    include: {
      canonicalProduct: true,
      priceSnapshots: {
        orderBy: { capturedAt: 'desc' },
        take: 1,
      },
    },
  });

  // Group by supermarket
  const productsBySupermarket = new Map<string, typeof allProducts>();
  for (const product of allProducts) {
    const list = productsBySupermarket.get(product.supermarketId) ?? [];
    list.push(product);
    productsBySupermarket.set(product.supermarketId, list);
  }

  // Transform for comparison engine
  const itemsForComparison = basketItems.map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    quantity: item.quantity,
    matchMode: item.matchMode as 'exact' | 'flexible',
    selectedCanonicalProductId: item.selectedCanonicalProductId,
    userConstraints: JSON.parse(item.userConstraints) as UserConstraints,
    displayName: item.displayName,
  }));

  const supermarketInfos = supermarkets.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    lastIngestionAt: s.lastIngestionAt?.toISOString() ?? null,
  }));

  const productsMap = new Map<string, Array<{
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
  }>>();

  for (const [smId, products] of productsBySupermarket) {
    productsMap.set(
      smId,
      products.map((p) => {
        // Use latest snapshot price if available, otherwise cached price
        const latestSnapshot = p.priceSnapshots[0];
        const price = latestSnapshot?.price ?? p.price;
        const isPromo = latestSnapshot?.isPromo ?? p.isPromo;
        const promoDescription = latestSnapshot?.promoDescription ?? p.promoDescription;
        const promoEndDate = p.promoEndDate?.toISOString() ?? null;
        const inStock = latestSnapshot?.inStock ?? p.inStock;
        const priceTimestamp = latestSnapshot?.capturedAt?.toISOString() ?? p.updatedAt.toISOString();

        return {
          id: p.id,
          supermarketId: p.supermarketId,
          canonicalProductId: p.canonicalProductId,
          externalName: p.externalName,
          brand: p.brand,
          price,
          inStock,
          isPromo,
          promoDescription,
          promoEndDate,
          metadata: JSON.parse(p.metadata) as Record<string, unknown>,
          priceTimestamp,
          canonicalProduct: {
            id: p.canonicalProduct.id,
            categoryId: p.canonicalProduct.categoryId,
            name: p.canonicalProduct.name,
            brand: p.canonicalProduct.brand,
            metadata: JSON.parse(p.canonicalProduct.metadata) as Record<string, unknown>,
          },
        };
      })
    );
  }

  const result = compareBasket(itemsForComparison, supermarketInfos, productsMap);
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

  const basketItems = await prisma.basketItem.findMany({
    where: { basketId },
    include: { category: true },
  });

  if (basketItems.length === 0) {
    return {
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
  }

  // Run comparison first to find the best supermarket
  const comparisonResult = await compareBasketAction(basketId);
  if (!comparisonResult.bestSupermarketId || comparisonResult.comparisons.length === 0) {
    return {
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
  }

  const bestComparison = comparisonResult.comparisons.find(
    (c) => c.supermarketId === comparisonResult.bestSupermarketId
  )!;

  const supermarket = await prisma.supermarket.findUnique({
    where: { id: comparisonResult.bestSupermarketId },
  });

  if (!supermarket) {
    throw new Error('Supermarket not found');
  }

  // Fetch all products for this supermarket
  const smProducts = await prisma.supermarketProduct.findMany({
    where: { supermarketId: supermarket.id },
    include: {
      canonicalProduct: true,
      priceSnapshots: {
        orderBy: { capturedAt: 'desc' },
        take: 1,
      },
    },
  });

  const products = smProducts.map((p) => {
    const latestSnapshot = p.priceSnapshots[0];
    return {
      id: p.id,
      supermarketId: p.supermarketId,
      canonicalProductId: p.canonicalProductId,
      externalName: p.externalName,
      brand: p.brand,
      price: latestSnapshot?.price ?? p.price,
      inStock: latestSnapshot?.inStock ?? p.inStock,
      isPromo: latestSnapshot?.isPromo ?? p.isPromo,
      promoDescription: latestSnapshot?.promoDescription ?? p.promoDescription,
      promoEndDate: p.promoEndDate?.toISOString() ?? null,
      canonicalProduct: {
        id: p.canonicalProduct.id,
        categoryId: p.canonicalProduct.categoryId,
        name: p.canonicalProduct.name,
        brand: p.canonicalProduct.brand,
        metadata: JSON.parse(p.canonicalProduct.metadata) as Record<string, unknown>,
      },
    };
  });

  // Build current resolutions from the comparison result
  const currentResolutions = new Map<string, { product: (typeof products)[number] | null; unitPrice: number }>();
  for (const itemResult of bestComparison.itemResults) {
    const matchedProduct = itemResult.supermarketProductId
      ? products.find((p) => p.id === itemResult.supermarketProductId) ?? null
      : null;
    currentResolutions.set(itemResult.basketItemId, {
      product: matchedProduct,
      unitPrice: itemResult.unitPrice ?? 0,
    });
  }

  const itemsForOptimization = basketItems.map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    quantity: item.quantity,
    matchMode: item.matchMode as 'exact' | 'flexible',
    selectedCanonicalProductId: item.selectedCanonicalProductId,
    userConstraints: JSON.parse(item.userConstraints) as UserConstraints,
    displayName: item.displayName,
  }));

  const result = optimizeBasketEngine(
    itemsForOptimization,
    products,
    { id: supermarket.id, name: supermarket.name, slug: supermarket.slug },
    currentResolutions
  );
  result.basketId = basketId;

  // Run split-cart optimization across all supermarkets
  const allSupermarkets = await prisma.supermarket.findMany({
    where: { isActive: true },
  });

  if (allSupermarkets.length >= 2) {
    const allSmProducts = await Promise.all(
      allSupermarkets.map(async (sm) => {
        const smProds = await prisma.supermarketProduct.findMany({
          where: { supermarketId: sm.id },
          include: {
            canonicalProduct: true,
            priceSnapshots: { orderBy: { capturedAt: 'desc' }, take: 1 },
          },
        });
        return {
          supermarket: { id: sm.id, name: sm.name, slug: sm.slug },
          products: smProds.map((p) => {
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
              promoEndDate: p.promoEndDate?.toISOString() ?? null,
              canonicalProduct: {
                id: p.canonicalProduct.id,
                categoryId: p.canonicalProduct.categoryId,
                name: p.canonicalProduct.name,
                brand: p.canonicalProduct.brand,
                metadata: JSON.parse(p.canonicalProduct.metadata) as Record<string, unknown>,
              },
            };
          }),
        };
      })
    );

    result.splitCart = splitCartOptimization(
      itemsForOptimization,
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
    quantity: item.quantity,
    matchMode: item.matchMode as MatchMode,
    selectedCanonicalProductId: item.selectedCanonicalProductId,
    userConstraints: JSON.parse(item.userConstraints) as UserConstraints,
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

  const result: Record<string, { min: number; max: number; count: number } | null> = {};

  for (const item of basketItems) {
    let whereClause: { canonicalProduct: { categoryId?: string; id?: string }; inStock: boolean };

    if (item.matchMode === 'exact' && item.selectedCanonicalProductId) {
      whereClause = {
        canonicalProduct: { id: item.selectedCanonicalProductId },
        inStock: true,
      };
    } else {
      whereClause = {
        canonicalProduct: { categoryId: item.categoryId },
        inStock: true,
      };
    }

    const products = await prisma.supermarketProduct.findMany({
      where: whereClause,
      select: {
        price: true,
        supermarketId: true,
        priceSnapshots: {
          orderBy: { capturedAt: 'desc' },
          take: 1,
          select: { price: true, inStock: true },
        },
      },
    });

    const prices: number[] = [];
    const supermarketIds = new Set<string>();

    for (const p of products) {
      const snapshot = p.priceSnapshots[0];
      const inStock = snapshot?.inStock ?? true;
      if (!inStock) continue;
      const price = snapshot?.price ?? p.price;
      prices.push(price);
      supermarketIds.add(p.supermarketId);
    }

    if (prices.length === 0) {
      result[item.id] = null;
    } else {
      result[item.id] = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        count: supermarketIds.size,
      };
    }
  }

  return result;
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
