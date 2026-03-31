// Shared types used across client and server

export type MatchMode = 'exact' | 'flexible';

export type AttributeType = 'text' | 'number' | 'enum' | 'boolean';

export type ResolutionType = 'exact' | 'flexible_match' | 'unavailable';

export type DataSourceType = 'mock' | 'scraper' | 'api';

export interface CategoryWithAttributes {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  attributes: AttributeDefinition[];
}

export interface AttributeDefinition {
  id: string;
  key: string;
  label: string;
  type: AttributeType;
  possibleValues: string[];
  sortOrder: number;
}

export interface UserConstraints {
  [key: string]: string | number | boolean | null;
}

export interface BasketItemInput {
  categoryId: string;
  quantity: number;
  matchMode: MatchMode;
  selectedCanonicalProductId?: string | null;
  userConstraints: UserConstraints;
  displayName: string;
}

export interface BasketItemDTO {
  id: string;
  basketId: string;
  categoryId: string;
  categoryName: string;
  quantity: number;
  matchMode: MatchMode;
  selectedCanonicalProductId: string | null;
  userConstraints: UserConstraints;
  displayName: string;
  createdAt: string;
}

export interface SupermarketDTO {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  lastIngestionAt: string | null;
}

export interface CanonicalProductDTO {
  id: string;
  categoryId: string;
  name: string;
  brand: string | null;
  metadata: Record<string, unknown>;
}

export interface ItemResolution {
  basketItemId: string;
  requestedDisplayName: string;
  quantity: number;
  resolutionType: ResolutionType;
  canonicalProductId: string | null;
  supermarketProductId: string | null;
  productName: string | null;
  brand: string | null;
  unitPrice: number | null;
  totalPrice: number | null;
  wasSubstituted: boolean;
  substitutionReason: string | null;
  isPromo: boolean;
  promoDescription: string | null;
  promoEndDate: string | null;
  priceTimestamp: string | null;
}

export interface SupermarketComparison {
  supermarketId: string;
  supermarketName: string;
  supermarketSlug: string;
  total: number;
  currency: string;
  itemResults: ItemResolution[];
  unavailableCount: number;
  substitutionCount: number;
  lastIngestionAt: string | null;
}

export interface ComparisonResult {
  basketId: string;
  comparisons: SupermarketComparison[];
  bestSupermarketId: string | null;
  worstTotal: number;
  bestTotal: number;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  brand: string | null;
  categoryName: string;
  metadata: Record<string, unknown>;
}

// ── Recommendations ──

export type RecommendationType =
  | 'cheaper_alternative'
  | 'promo'
  | 'constraint_relaxation'
  | 'quantity';

export interface RecommendationAction {
  type: 'replace' | 'adjust_quantity' | 'relax_constraint';
  payload: {
    newCanonicalProductId?: string;
    newProductName?: string;
    newBrand?: string | null;
    newPrice?: number;
    newQuantity?: number;
    constraintKey?: string;
    constraintOldValue?: string;
    constraintNewValue?: string;
  };
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  impact: {
    savingsAmount: number;
    percentage: number;
  };
  affectedItems: string[]; // basketItemIds
  action: RecommendationAction;
  supermarketId: string;
  supermarketName: string;
}

export interface OptimizedItem {
  basketItemId: string;
  originalDisplayName: string;
  optimizedProductName: string;
  originalUnitPrice: number;
  optimizedUnitPrice: number;
  quantity: number;
  originalTotal: number;
  optimizedTotal: number;
  changed: boolean;
  changeReason: string | null;
}

export interface OptimizationResult {
  basketId: string;
  supermarketId: string;
  supermarketName: string;
  originalTotal: number;
  optimizedTotal: number;
  savings: number;
  savingsPercentage: number;
  items: OptimizedItem[];
  recommendations: Recommendation[];
  splitCart?: SplitCartResult | null;
}

// ── Split-Cart (cross-supermarket optimization) ──

export interface SplitCartItem {
  basketItemId: string;
  displayName: string;
  supermarketId: string;
  supermarketName: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  isPromo: boolean;
  promoEndDate: string | null;
}

export interface SplitCartResult {
  items: SplitCartItem[];
  totalCost: number;
  savingsVsBest: number; // savings vs best single supermarket
  supermarketBreakdown: { supermarketId: string; supermarketName: string; itemCount: number; subtotal: number }[];
}
