// Shared types used across client and server

export type MatchMode = 'exact' | 'flexible';

export type AttributeType = 'text' | 'number' | 'enum' | 'boolean';

export type ResolutionType = 'exact' | 'flexible_match' | 'unavailable';

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
