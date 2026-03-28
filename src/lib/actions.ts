'use server';

import { prisma } from '@/lib/db/client';
import { searchCategories, searchProducts, getAllCategories, getCategory } from '@/lib/products/search';
import { compareBasket } from '@/lib/comparison/engine';
import { createLogger } from '@/lib/logger';
import type {
  BasketItemDTO,
  BasketItemInput,
  CategoryWithAttributes,
  ComparisonResult,
  MatchMode,
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

export async function getOrCreateBasket(): Promise<string> {
  const existing = await prisma.basket.findFirst({
    orderBy: { updatedAt: 'desc' },
  });
  if (existing) return existing.id;

  const basket = await prisma.basket.create({ data: {} });
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

  if (demoBasket) return demoBasket.id;

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
