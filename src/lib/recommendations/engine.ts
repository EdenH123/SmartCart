import { passesConstraints } from '@/lib/products/matching';
import type {
  Recommendation,
  RecommendationType,
  OptimizationResult,
  OptimizedItem,
  UserConstraints,
} from '@/types';

// ── Input types (mirrors comparison engine shapes) ──

export interface BasketItemForOptimization {
  id: string;
  categoryId: string;
  quantity: number;
  matchMode: 'exact' | 'flexible';
  selectedCanonicalProductId: string | null;
  userConstraints: UserConstraints;
  displayName: string;
}

export interface ProductForOptimization {
  id: string;
  supermarketId: string;
  canonicalProductId: string;
  externalName: string;
  brand: string | null;
  price: number;
  inStock: boolean;
  isPromo: boolean;
  promoDescription: string | null;
  canonicalProduct: {
    id: string;
    categoryId: string;
    name: string;
    brand: string | null;
    metadata: Record<string, unknown>;
  };
}

export interface SupermarketForOptimization {
  id: string;
  name: string;
  slug: string;
}

let recIdCounter = 0;
function nextRecId(): string {
  return `rec_${++recIdCounter}`;
}
/** Reset counter between test runs */
export function resetRecIdCounter(): void {
  recIdCounter = 0;
}

// ── Scoring ──

const PRICE_WEIGHT = 1.0;
const ATTRIBUTE_DEVIATION_PENALTY = 5.0;
const BRAND_CHANGE_PENALTY = 2.0;

/**
 * Score a candidate product for optimization. Lower = better.
 * score = priceWeight * price + penalties
 */
export function optimizationScore(
  candidate: ProductForOptimization,
  item: BasketItemForOptimization
): number {
  let score = PRICE_WEIGHT * candidate.price;

  // Penalty for each non-matching attribute
  const constraints = item.userConstraints;
  for (const [key, value] of Object.entries(constraints)) {
    if (value === null || value === 'any' || value === '') continue;
    const productValue = candidate.canonicalProduct.metadata[key];
    if (productValue === undefined || productValue === null) {
      score += ATTRIBUTE_DEVIATION_PENALTY;
    } else if (String(productValue).toLowerCase() !== String(value).toLowerCase()) {
      score += ATTRIBUTE_DEVIATION_PENALTY;
    }
  }

  // Penalty for brand change (if user selected a specific product)
  if (item.selectedCanonicalProductId && candidate.canonicalProductId !== item.selectedCanonicalProductId) {
    score += BRAND_CHANGE_PENALTY;
  }

  return score;
}

// ── Cheaper Alternative Recommendations ──

function findCheaperAlternatives(
  item: BasketItemForOptimization,
  currentProduct: ProductForOptimization | null,
  allProducts: ProductForOptimization[],
  supermarket: SupermarketForOptimization
): Recommendation[] {
  if (item.matchMode === 'exact') return []; // never suggest for exact items
  if (!currentProduct) return [];

  const candidates = allProducts.filter(
    (p) =>
      p.canonicalProduct.categoryId === item.categoryId &&
      p.inStock &&
      p.canonicalProductId !== currentProduct.canonicalProductId &&
      passesConstraints(p.canonicalProduct.metadata, item.userConstraints) &&
      p.price < currentProduct.price
  );

  if (candidates.length === 0) return [];

  // Sort cheapest first
  candidates.sort((a, b) => a.price - b.price);
  const best = candidates[0];
  const savingsPerUnit = currentProduct.price - best.price;
  const totalSavings = savingsPerUnit * item.quantity;
  const percentage = Math.round((savingsPerUnit / currentProduct.price) * 100);

  if (totalSavings < 0.05) return []; // skip trivial savings

  return [{
    id: nextRecId(),
    type: 'cheaper_alternative',
    title: `Switch to ${best.brand ?? 'a different brand'} ${item.displayName.split(' ').slice(0, 2).join(' ')}`,
    description: `Switch from ${currentProduct.externalName} to ${best.externalName} and save $${totalSavings.toFixed(2)}${item.quantity > 1 ? ` (x${item.quantity})` : ''}.`,
    impact: { savingsAmount: round2(totalSavings), percentage },
    affectedItems: [item.id],
    action: {
      type: 'replace',
      payload: {
        newCanonicalProductId: best.canonicalProductId,
        newProductName: best.externalName,
        newBrand: best.brand,
        newPrice: best.price,
      },
    },
    supermarketId: supermarket.id,
    supermarketName: supermarket.name,
  }];
}

// ── Promo Recommendations ──

function findPromoOpportunities(
  item: BasketItemForOptimization,
  allProducts: ProductForOptimization[],
  supermarket: SupermarketForOptimization
): Recommendation[] {
  const promoProducts = allProducts.filter(
    (p) =>
      p.canonicalProduct.categoryId === item.categoryId &&
      p.inStock &&
      p.isPromo &&
      passesConstraints(p.canonicalProduct.metadata, item.userConstraints)
  );

  if (promoProducts.length === 0) return [];

  const cheapestPromo = promoProducts.sort((a, b) => a.price - b.price)[0];

  // Find the current best non-promo
  const regularProducts = allProducts.filter(
    (p) =>
      p.canonicalProduct.categoryId === item.categoryId &&
      p.inStock &&
      !p.isPromo &&
      passesConstraints(p.canonicalProduct.metadata, item.userConstraints)
  );
  const cheapestRegular = regularProducts.sort((a, b) => a.price - b.price)[0];

  if (!cheapestRegular || cheapestPromo.price >= cheapestRegular.price) return [];

  const savingsPerUnit = cheapestRegular.price - cheapestPromo.price;
  const totalSavings = savingsPerUnit * item.quantity;
  if (totalSavings < 0.05) return [];

  return [{
    id: nextRecId(),
    type: 'promo',
    title: `Use promotion on ${cheapestPromo.externalName}`,
    description: `${cheapestPromo.promoDescription ?? 'Promotional price available'}. Save $${totalSavings.toFixed(2)} vs regular price.`,
    impact: {
      savingsAmount: round2(totalSavings),
      percentage: Math.round((savingsPerUnit / cheapestRegular.price) * 100),
    },
    affectedItems: [item.id],
    action: {
      type: 'replace',
      payload: {
        newCanonicalProductId: cheapestPromo.canonicalProductId,
        newProductName: cheapestPromo.externalName,
        newBrand: cheapestPromo.brand,
        newPrice: cheapestPromo.price,
      },
    },
    supermarketId: supermarket.id,
    supermarketName: supermarket.name,
  }];
}

// ── Constraint Relaxation Recommendations ──

function findConstraintRelaxations(
  item: BasketItemForOptimization,
  currentProduct: ProductForOptimization | null,
  allProducts: ProductForOptimization[],
  supermarket: SupermarketForOptimization
): Recommendation[] {
  if (item.matchMode === 'exact') return [];
  if (!currentProduct) return [];

  const recommendations: Recommendation[] = [];
  const constraints = item.userConstraints;

  // For each non-"any" constraint, see what happens if we relax it
  for (const [key, value] of Object.entries(constraints)) {
    if (value === null || value === 'any' || value === '') continue;

    const relaxedConstraints = { ...constraints, [key]: 'any' };
    const candidates = allProducts.filter(
      (p) =>
        p.canonicalProduct.categoryId === item.categoryId &&
        p.inStock &&
        passesConstraints(p.canonicalProduct.metadata, relaxedConstraints) &&
        p.price < currentProduct.price
    );

    if (candidates.length === 0) continue;

    candidates.sort((a, b) => a.price - b.price);
    const best = candidates[0];

    // Only suggest if the relaxed product actually differs in this attribute
    const bestAttrValue = best.canonicalProduct.metadata[key];
    if (bestAttrValue !== undefined && String(bestAttrValue).toLowerCase() === String(value).toLowerCase()) {
      continue; // same attribute value, relaxation didn't help
    }

    const savingsPerUnit = currentProduct.price - best.price;
    const totalSavings = savingsPerUnit * item.quantity;
    if (totalSavings < 0.10) continue;

    recommendations.push({
      id: nextRecId(),
      type: 'constraint_relaxation',
      title: `Allow any ${key} for ${item.displayName.split(' ')[0]}`,
      description: `If you allow any ${key} instead of "${value}", you could get ${best.externalName} and save $${totalSavings.toFixed(2)}.`,
      impact: {
        savingsAmount: round2(totalSavings),
        percentage: Math.round((savingsPerUnit / currentProduct.price) * 100),
      },
      affectedItems: [item.id],
      action: {
        type: 'relax_constraint',
        payload: {
          constraintKey: key,
          constraintOldValue: String(value),
          constraintNewValue: 'any',
          newCanonicalProductId: best.canonicalProductId,
          newProductName: best.externalName,
          newBrand: best.brand,
          newPrice: best.price,
        },
      },
      supermarketId: supermarket.id,
      supermarketName: supermarket.name,
    });
  }

  return recommendations;
}

// ── Quantity Suggestions ──

function findQuantitySuggestions(
  item: BasketItemForOptimization,
  allProducts: ProductForOptimization[],
  supermarket: SupermarketForOptimization
): Recommendation[] {
  // Look for promo products where buying more could save money
  const promoProducts = allProducts.filter(
    (p) =>
      p.canonicalProduct.categoryId === item.categoryId &&
      p.inStock &&
      p.isPromo &&
      p.promoDescription &&
      passesConstraints(p.canonicalProduct.metadata, item.userConstraints)
  );

  if (promoProducts.length === 0) return [];

  const recommendations: Recommendation[] = [];

  for (const promo of promoProducts) {
    // Heuristic: if promo mentions "buy 2" or "3 for" etc., suggest increasing qty
    const desc = (promo.promoDescription ?? '').toLowerCase();
    const buyMorePattern = /buy\s*(\d+)|(\d+)\s*for/;
    const match = desc.match(buyMorePattern);

    if (!match) continue;
    const suggestedQty = parseInt(match[1] ?? match[2]);
    if (isNaN(suggestedQty) || suggestedQty <= item.quantity) continue;

    // Estimate savings: compare cost of suggestedQty at promo vs regular
    const regularProducts = allProducts.filter(
      (p) =>
        p.canonicalProduct.categoryId === item.categoryId &&
        p.inStock &&
        !p.isPromo &&
        passesConstraints(p.canonicalProduct.metadata, item.userConstraints)
    );
    if (regularProducts.length === 0) continue;

    const cheapestRegular = regularProducts.sort((a, b) => a.price - b.price)[0];
    const regularCostForQty = cheapestRegular.price * suggestedQty;
    const promoCostForQty = promo.price * suggestedQty;
    const savings = regularCostForQty - promoCostForQty;

    if (savings < 0.10) continue;

    recommendations.push({
      id: nextRecId(),
      type: 'quantity',
      title: `Buy ${suggestedQty} to use promotion`,
      description: `Buy ${suggestedQty} instead of ${item.quantity} of ${promo.externalName} (${promo.promoDescription}) and save $${savings.toFixed(2)} vs regular price.`,
      impact: {
        savingsAmount: round2(savings),
        percentage: Math.round((savings / regularCostForQty) * 100),
      },
      affectedItems: [item.id],
      action: {
        type: 'adjust_quantity',
        payload: { newQuantity: suggestedQty, newPrice: promo.price },
      },
      supermarketId: supermarket.id,
      supermarketName: supermarket.name,
    });
  }

  return recommendations;
}

// ── Main API: Generate Recommendations ──

/**
 * Generate all recommendations for a basket at a specific supermarket.
 * Pure function — no DB dependency.
 */
export function generateRecommendations(
  items: BasketItemForOptimization[],
  products: ProductForOptimization[],
  supermarket: SupermarketForOptimization,
  currentResolutions: Map<string, ProductForOptimization | null>
): Recommendation[] {
  const all: Recommendation[] = [];

  for (const item of items) {
    const current = currentResolutions.get(item.id) ?? null;
    all.push(...findCheaperAlternatives(item, current, products, supermarket));
    all.push(...findPromoOpportunities(item, products, supermarket));
    all.push(...findConstraintRelaxations(item, current, products, supermarket));
    all.push(...findQuantitySuggestions(item, products, supermarket));
  }

  // Sort by savings desc, deduplicate by affected item + type
  const seen = new Set<string>();
  const deduped = all.filter((r) => {
    const key = `${r.affectedItems[0]}_${r.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => b.impact.savingsAmount - a.impact.savingsAmount);
  return deduped;
}

// ── Main API: Optimize Basket ──

/**
 * Generate an optimized basket for a specific supermarket.
 * For each item, pick the cheapest valid product using the scoring function.
 * Pure function — no DB dependency.
 */
export function optimizeBasket(
  items: BasketItemForOptimization[],
  products: ProductForOptimization[],
  supermarket: SupermarketForOptimization,
  currentResolutions: Map<string, { product: ProductForOptimization | null; unitPrice: number }>
): OptimizationResult {
  const optimizedItems: OptimizedItem[] = [];
  let originalTotal = 0;
  let optimizedTotal = 0;

  for (const item of items) {
    const current = currentResolutions.get(item.id);
    const currentPrice = current?.unitPrice ?? 0;
    const currentName = current?.product?.externalName ?? item.displayName;
    const origItemTotal = currentPrice * item.quantity;
    originalTotal += origItemTotal;

    if (item.matchMode === 'exact') {
      // Cannot optimize exact items
      optimizedItems.push({
        basketItemId: item.id,
        originalDisplayName: item.displayName,
        optimizedProductName: currentName,
        originalUnitPrice: currentPrice,
        optimizedUnitPrice: currentPrice,
        quantity: item.quantity,
        originalTotal: round2(origItemTotal),
        optimizedTotal: round2(origItemTotal),
        changed: false,
        changeReason: null,
      });
      optimizedTotal += origItemTotal;
      continue;
    }

    // Find all valid candidates in this supermarket
    const candidates = products.filter(
      (p) =>
        p.canonicalProduct.categoryId === item.categoryId &&
        p.inStock &&
        passesConstraints(p.canonicalProduct.metadata, item.userConstraints)
    );

    if (candidates.length === 0) {
      // No products available — keep original
      optimizedItems.push({
        basketItemId: item.id,
        originalDisplayName: item.displayName,
        optimizedProductName: currentName,
        originalUnitPrice: currentPrice,
        optimizedUnitPrice: currentPrice,
        quantity: item.quantity,
        originalTotal: round2(origItemTotal),
        optimizedTotal: round2(origItemTotal),
        changed: false,
        changeReason: null,
      });
      optimizedTotal += origItemTotal;
      continue;
    }

    // Pick cheapest using optimization score
    candidates.sort((a, b) => optimizationScore(a, item) - optimizationScore(b, item));
    const best = candidates[0];
    const optItemTotal = best.price * item.quantity;
    const changed = current?.product ? best.canonicalProductId !== current.product.canonicalProductId : false;

    let changeReason: string | null = null;
    if (changed) {
      const saved = origItemTotal - optItemTotal;
      if (saved > 0) {
        changeReason = `Switched to ${best.externalName} (save $${saved.toFixed(2)})`;
      } else {
        changeReason = `Switched to ${best.externalName}`;
      }
    }

    optimizedItems.push({
      basketItemId: item.id,
      originalDisplayName: item.displayName,
      optimizedProductName: best.externalName,
      originalUnitPrice: currentPrice,
      optimizedUnitPrice: best.price,
      quantity: item.quantity,
      originalTotal: round2(origItemTotal),
      optimizedTotal: round2(optItemTotal),
      changed,
      changeReason,
    });
    optimizedTotal += optItemTotal;
  }

  originalTotal = round2(originalTotal);
  optimizedTotal = round2(optimizedTotal);
  const savings = round2(originalTotal - optimizedTotal);
  const savingsPercentage = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;

  // Generate recommendations for this optimized result
  const currentMap = new Map<string, ProductForOptimization | null>();
  for (const item of items) {
    currentMap.set(item.id, currentResolutions.get(item.id)?.product ?? null);
  }
  const recommendations = generateRecommendations(items, products, supermarket, currentMap);

  return {
    basketId: '',
    supermarketId: supermarket.id,
    supermarketName: supermarket.name,
    originalTotal,
    optimizedTotal,
    savings,
    savingsPercentage,
    items: optimizedItems,
    recommendations: recommendations.slice(0, 5),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
