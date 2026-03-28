import { scoreMatch, passesConstraints } from '@/lib/products/matching';
import type {
  ItemResolution,
  SupermarketComparison,
  ComparisonResult,
  UserConstraints,
  ResolutionType,
} from '@/types';

export interface BasketItemForComparison {
  id: string;
  categoryId: string;
  quantity: number;
  matchMode: 'exact' | 'flexible';
  selectedCanonicalProductId: string | null;
  userConstraints: UserConstraints;
  displayName: string;
}

export interface SupermarketProductForComparison {
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
}

export interface SupermarketInfo {
  id: string;
  name: string;
  slug: string;
  lastIngestionAt: string | null;
}

const CURRENCY = 'USD';

/**
 * Resolve a single basket item for a specific supermarket.
 */
export function resolveBasketItem(
  item: BasketItemForComparison,
  availableProducts: SupermarketProductForComparison[]
): ItemResolution {
  const base: Pick<ItemResolution, 'basketItemId' | 'requestedDisplayName' | 'quantity'> = {
    basketItemId: item.id,
    requestedDisplayName: item.displayName,
    quantity: item.quantity,
  };

  // Filter products to the same category and in stock
  const categoryProducts = availableProducts.filter(
    (p) => p.canonicalProduct.categoryId === item.categoryId && p.inStock
  );

  if (item.matchMode === 'exact' && item.selectedCanonicalProductId) {
    return resolveExact(base, item, categoryProducts);
  }

  return resolveFlexible(base, item, categoryProducts);
}

function resolveExact(
  base: Pick<ItemResolution, 'basketItemId' | 'requestedDisplayName' | 'quantity'>,
  item: BasketItemForComparison,
  categoryProducts: SupermarketProductForComparison[]
): ItemResolution {
  const exactMatch = categoryProducts.find(
    (p) => p.canonicalProductId === item.selectedCanonicalProductId
  );

  if (!exactMatch) {
    return {
      ...base,
      resolutionType: 'unavailable',
      canonicalProductId: item.selectedCanonicalProductId,
      supermarketProductId: null,
      productName: null,
      brand: null,
      unitPrice: null,
      totalPrice: null,
      wasSubstituted: false,
      substitutionReason: 'Exact product unavailable at this supermarket',
      isPromo: false,
      promoDescription: null,
      priceTimestamp: null,
    };
  }

  return {
    ...base,
    resolutionType: 'exact',
    canonicalProductId: exactMatch.canonicalProductId,
    supermarketProductId: exactMatch.id,
    productName: exactMatch.externalName,
    brand: exactMatch.brand,
    unitPrice: exactMatch.price,
    totalPrice: exactMatch.price * base.quantity,
    wasSubstituted: false,
    substitutionReason: null,
    isPromo: exactMatch.isPromo,
    promoDescription: exactMatch.promoDescription,
    priceTimestamp: exactMatch.priceTimestamp,
  };
}

function resolveFlexible(
  base: Pick<ItemResolution, 'basketItemId' | 'requestedDisplayName' | 'quantity'>,
  item: BasketItemForComparison,
  categoryProducts: SupermarketProductForComparison[]
): ItemResolution {
  const constraints = item.userConstraints;

  // Filter by hard constraints
  let candidates = categoryProducts.filter((p) =>
    passesConstraints(p.canonicalProduct.metadata, constraints)
  );

  if (candidates.length === 0) {
    return {
      ...base,
      resolutionType: 'unavailable',
      canonicalProductId: item.selectedCanonicalProductId,
      supermarketProductId: null,
      productName: null,
      brand: null,
      unitPrice: null,
      totalPrice: null,
      wasSubstituted: false,
      substitutionReason: 'No matching products available at this supermarket',
      isPromo: false,
      promoDescription: null,
      priceTimestamp: null,
    };
  }

  // Score and rank candidates
  const scored = candidates.map((p) => ({
    product: p,
    score: scoreMatch(
      { metadata: p.canonicalProduct.metadata, brand: p.brand, price: p.price },
      constraints,
      item.selectedCanonicalProductId ? undefined : undefined // no preferred brand in constraints for now
    ),
  }));

  // Sort: prefer exact canonical match, then highest score, then lowest price
  scored.sort((a, b) => {
    if (item.selectedCanonicalProductId) {
      const aIsExact = a.product.canonicalProductId === item.selectedCanonicalProductId;
      const bIsExact = b.product.canonicalProductId === item.selectedCanonicalProductId;
      if (aIsExact && !bIsExact) return -1;
      if (!aIsExact && bIsExact) return 1;
    }
    if (b.score.total !== a.score.total) return b.score.total - a.score.total;
    return a.product.price - b.product.price;
  });

  const chosen = scored[0].product;
  const wasSubstituted =
    item.selectedCanonicalProductId != null &&
    chosen.canonicalProductId !== item.selectedCanonicalProductId;
  const isFlexible = item.matchMode === 'flexible';

  let substitutionReason: string | null = null;
  if (wasSubstituted) {
    substitutionReason = buildSubstitutionReason(chosen, constraints);
  } else if (isFlexible && !item.selectedCanonicalProductId) {
    substitutionReason = `Cheapest matching option: ${chosen.externalName}`;
  }

  const resolutionType: ResolutionType = wasSubstituted ? 'flexible_match' : 'exact';

  return {
    ...base,
    resolutionType,
    canonicalProductId: chosen.canonicalProductId,
    supermarketProductId: chosen.id,
    productName: chosen.externalName,
    brand: chosen.brand,
    unitPrice: chosen.price,
    totalPrice: chosen.price * base.quantity,
    wasSubstituted,
    substitutionReason,
    isPromo: chosen.isPromo,
    promoDescription: chosen.promoDescription,
    priceTimestamp: chosen.priceTimestamp,
  };
}

function buildSubstitutionReason(
  chosen: SupermarketProductForComparison,
  constraints: UserConstraints
): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(constraints)) {
    if (value && value !== 'any') {
      parts.push(`${key}: ${value}`);
    }
  }
  const constraintStr = parts.length > 0 ? ` matching ${parts.join(', ')}` : '';
  return `Substituted with ${chosen.externalName}${constraintStr} (cheaper alternative)`;
}

/**
 * Compare basket across all supermarkets.
 */
export function compareBasket(
  items: BasketItemForComparison[],
  supermarkets: SupermarketInfo[],
  productsBySupermarket: Map<string, SupermarketProductForComparison[]>
): ComparisonResult {
  const comparisons: SupermarketComparison[] = [];

  for (const supermarket of supermarkets) {
    const products = productsBySupermarket.get(supermarket.id) ?? [];
    const itemResults: ItemResolution[] = [];
    let total = 0;
    let unavailableCount = 0;
    let substitutionCount = 0;

    for (const item of items) {
      const resolution = resolveBasketItem(item, products);
      itemResults.push(resolution);

      if (resolution.resolutionType === 'unavailable') {
        unavailableCount++;
      } else {
        total += resolution.totalPrice ?? 0;
        if (resolution.wasSubstituted) {
          substitutionCount++;
        }
      }
    }

    comparisons.push({
      supermarketId: supermarket.id,
      supermarketName: supermarket.name,
      supermarketSlug: supermarket.slug,
      total: Math.round(total * 100) / 100,
      currency: CURRENCY,
      itemResults,
      unavailableCount,
      substitutionCount,
      lastIngestionAt: supermarket.lastIngestionAt,
    });
  }

  // Sort: fewest unavailable first, then lowest total
  comparisons.sort((a, b) => {
    if (a.unavailableCount !== b.unavailableCount) {
      return a.unavailableCount - b.unavailableCount;
    }
    return a.total - b.total;
  });

  const bestTotal = comparisons.length > 0 ? comparisons[0].total : 0;
  const worstTotal = comparisons.length > 0 ? comparisons[comparisons.length - 1].total : 0;
  const bestSupermarketId = comparisons.length > 0 ? comparisons[0].supermarketId : null;

  return {
    basketId: items.length > 0 ? 'current' : '',
    comparisons,
    bestSupermarketId,
    bestTotal,
    worstTotal,
  };
}
