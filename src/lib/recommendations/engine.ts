import { passesConstraints } from '@/lib/products/matching';
import type {
  Recommendation,
  RecommendationType,
  OptimizationResult,
  OptimizedItem,
  UserConstraints,
  SplitCartResult,
  SplitCartItem,
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
  promoEndDate: string | null;
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

const PROMO_BONUS = -0.5; // Negative = lower score = preferred

/**
 * Score a candidate product for optimization. Lower = better.
 * score = priceWeight * price + penalties - promo bonus
 */
export function optimizationScore(
  candidate: ProductForOptimization,
  item: BasketItemForOptimization
): number {
  let score = PRICE_WEIGHT * candidate.price;

  // Bonus for promo products (slightly prefer them at similar prices)
  if (candidate.isPromo) {
    score += PROMO_BONUS;
  }

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
    title: `עברו ל${best.brand ?? 'מותג אחר'} ${item.displayName.split(' ').slice(0, 2).join(' ')}`,
    description: `עברו מ${currentProduct.externalName} ל${best.externalName} וחסכו ₪${totalSavings.toFixed(2)}${item.quantity > 1 ? ` (x${item.quantity})` : ''}.`,
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
  supermarket: SupermarketForOptimization,
  currentProduct: ProductForOptimization | null
): Recommendation[] {
  // Find promo products that match constraints
  const promoProducts = allProducts.filter(
    (p) =>
      p.canonicalProduct.categoryId === item.categoryId &&
      p.inStock &&
      p.isPromo &&
      passesConstraints(p.canonicalProduct.metadata, item.userConstraints)
  );

  if (promoProducts.length === 0) return [];

  const cheapestPromo = promoProducts.sort((a, b) => a.price - b.price)[0];

  // If user already has the promo product, no recommendation needed
  if (currentProduct && currentProduct.id === cheapestPromo.id) return [];

  // Compare against what user currently has, or the cheapest non-promo option
  let comparePrice: number;
  let compareName: string;

  if (currentProduct && !currentProduct.isPromo) {
    // User has a non-promo product — compare against that
    comparePrice = currentProduct.price;
    compareName = currentProduct.externalName;
  } else {
    // Find cheapest non-promo for comparison baseline
    const regularProducts = allProducts.filter(
      (p) =>
        p.canonicalProduct.categoryId === item.categoryId &&
        p.inStock &&
        !p.isPromo &&
        passesConstraints(p.canonicalProduct.metadata, item.userConstraints)
    );
    if (regularProducts.length === 0) return [];
    const cheapestRegular = regularProducts.sort((a, b) => a.price - b.price)[0];
    comparePrice = cheapestRegular.price;
    compareName = cheapestRegular.externalName;
  }

  if (cheapestPromo.price >= comparePrice) return [];

  const savingsPerUnit = comparePrice - cheapestPromo.price;
  const totalSavings = savingsPerUnit * item.quantity;
  if (totalSavings < 0.05) return [];

  return [{
    id: nextRecId(),
    type: 'promo',
    title: `נצלו מבצע על ${cheapestPromo.externalName}`,
    description: `${cheapestPromo.promoDescription ?? 'מחיר מבצע זמין'}. חסכו ₪${totalSavings.toFixed(2)} לעומת ${compareName}.`,
    impact: {
      savingsAmount: round2(totalSavings),
      percentage: Math.round((savingsPerUnit / comparePrice) * 100),
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
      title: `אפשרו כל ${key} עבור ${item.displayName.split(' ')[0]}`,
      description: `אם תאפשרו כל ${key} במקום "${value}", תוכלו לקבל ${best.externalName} ולחסוך ₪${totalSavings.toFixed(2)}.`,
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

// ── Quantity Parsing ──

/**
 * Extract quantity from promo description text.
 * Handles Hebrew and English patterns:
 * - "2 ב-10 ש"ח" → 2
 * - "3 יח' ב-12₪" → 3
 * - "קנה 2 קבל 1" → 2
 * - "buy 2 get 1" → 2
 * - "3 for ₪10" → 3
 * - "1+1" → 2
 */
export function parseQuantityFromPromo(desc: string): number | null {
  if (!desc) return null;

  const patterns: { regex: RegExp; group: number; transform?: (n: number) => number }[] = [
    // "1+1" pattern → 2
    { regex: /(\d)\s*\+\s*(\d)/, group: 0, transform: () => 2 },
    // Hebrew: "2 ב-" or "2 ב " (2 for ...)
    { regex: /(\d+)\s*ב[-\s]/, group: 1 },
    // Hebrew: "קנה 2" or "קנו 3" (buy 2/3)
    { regex: /קנ[הו]\s*(\d+)/, group: 1 },
    // Hebrew: "3 יח'" (3 units)
    { regex: /(\d+)\s*יח[׳']/, group: 1 },
    // English: "buy 2" or "Buy 3"
    { regex: /buy\s*(\d+)/i, group: 1 },
    // English: "3 for"
    { regex: /(\d+)\s*for/i, group: 1 },
  ];

  for (const { regex, group, transform } of patterns) {
    const match = desc.match(regex);
    if (match) {
      const raw = parseInt(match[group === 0 ? 1 : group]);
      if (!isNaN(raw) && raw >= 2) {
        return transform ? transform(raw) : raw;
      }
    }
  }

  return null;
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
    // Heuristic: if promo mentions quantity deals, suggest increasing qty
    // Supports Hebrew patterns: "2 ב-10", "3 יח' ב-12", "קנה 2", etc.
    // Also supports English: "buy 2", "3 for"
    const desc = promo.promoDescription ?? '';
    const suggestedQty = parseQuantityFromPromo(desc);
    if (suggestedQty === null || suggestedQty <= item.quantity) continue;

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
      title: `קנו ${suggestedQty} לניצול מבצע`,
      description: `קנו ${suggestedQty} במקום ${item.quantity} של ${promo.externalName} (${promo.promoDescription}) וחסכו ₪${savings.toFixed(2)} לעומת מחיר רגיל.`,
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
    all.push(...findPromoOpportunities(item, products, supermarket, current));
    all.push(...findConstraintRelaxations(item, current, products, supermarket));
    all.push(...findQuantitySuggestions(item, products, supermarket));
  }

  // Sort by savings first, THEN deduplicate (keep the best per item+type)
  all.sort((a, b) => b.impact.savingsAmount - a.impact.savingsAmount);

  const seen = new Set<string>();
  const deduped = all.filter((r) => {
    const key = `${r.affectedItems[0]}_${r.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

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
        changeReason = `הוחלף ל${best.externalName} (חיסכון ₪${saved.toFixed(2)})`;
      } else {
        changeReason = `הוחלף ל${best.externalName}`;
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

// ── Split-Cart: Cross-Supermarket Optimization ──

export interface SupermarketProducts {
  supermarket: SupermarketForOptimization;
  products: ProductForOptimization[];
}

/**
 * Find the cheapest possible basket by picking the best supermarket per item.
 * This is the "split-cart" strategy — buy each item where it's cheapest.
 * Pure function — no DB dependency.
 */
export function splitCartOptimization(
  items: BasketItemForOptimization[],
  allSupermarkets: SupermarketProducts[],
  bestSingleTotal: number
): SplitCartResult | null {
  if (allSupermarkets.length < 2) return null;

  const splitItems: SplitCartItem[] = [];
  let totalCost = 0;

  for (const item of items) {
    let bestProduct: ProductForOptimization | null = null;
    let bestSupermarket: SupermarketForOptimization | null = null;
    let bestPrice = Infinity;

    for (const { supermarket, products } of allSupermarkets) {
      const candidates = products.filter(
        (p) =>
          p.canonicalProduct.categoryId === item.categoryId &&
          p.inStock &&
          passesConstraints(p.canonicalProduct.metadata, item.userConstraints)
      );

      if (candidates.length === 0) continue;

      // Sort by optimization score (accounts for promo bonus + attribute penalties)
      candidates.sort((a, b) => optimizationScore(a, item) - optimizationScore(b, item));
      const best = candidates[0];

      if (best.price < bestPrice) {
        bestPrice = best.price;
        bestProduct = best;
        bestSupermarket = supermarket;
      }
    }

    if (bestProduct && bestSupermarket) {
      const itemTotal = round2(bestPrice * item.quantity);
      splitItems.push({
        basketItemId: item.id,
        displayName: item.displayName,
        supermarketId: bestSupermarket.id,
        supermarketName: bestSupermarket.name,
        productName: bestProduct.externalName,
        unitPrice: bestPrice,
        quantity: item.quantity,
        totalPrice: itemTotal,
        isPromo: bestProduct.isPromo,
        promoEndDate: bestProduct.promoEndDate,
      });
      totalCost += itemTotal;
    }
  }

  totalCost = round2(totalCost);
  const savingsVsBest = round2(bestSingleTotal - totalCost);

  // Only suggest split-cart if it actually saves money
  if (savingsVsBest < 0.50) return null;

  // Build supermarket breakdown
  const breakdownMap = new Map<string, { supermarketId: string; supermarketName: string; itemCount: number; subtotal: number }>();
  for (const si of splitItems) {
    const existing = breakdownMap.get(si.supermarketId);
    if (existing) {
      existing.itemCount++;
      existing.subtotal = round2(existing.subtotal + si.totalPrice);
    } else {
      breakdownMap.set(si.supermarketId, {
        supermarketId: si.supermarketId,
        supermarketName: si.supermarketName,
        itemCount: 1,
        subtotal: si.totalPrice,
      });
    }
  }

  // Only return if items are actually split across 2+ supermarkets
  if (breakdownMap.size < 2) return null;

  return {
    items: splitItems,
    totalCost,
    savingsVsBest,
    supermarketBreakdown: Array.from(breakdownMap.values()),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
