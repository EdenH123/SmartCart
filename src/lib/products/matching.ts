/**
 * Matching and scoring utilities for canonical product resolution.
 * Designed to be pure functions, no DB dependency.
 */

/**
 * Normalize a string for comparison: lowercase, remove punctuation, collapse whitespace.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface ScoringCandidate {
  metadata: Record<string, unknown>;
  brand: string | null;
  price: number;
}

interface ScoringConstraints {
  [key: string]: string | number | boolean | null;
}

export interface MatchScore {
  total: number;
  attributeMatches: number;
  attributeTotal: number;
  brandMatch: boolean;
}

/**
 * Score a candidate product against user constraints.
 * Higher score = better match.
 *
 * Scoring:
 * - Each exact attribute match: +10 points
 * - Brand match: +5 points
 * - All attributes matching: +20 bonus
 */
export function scoreMatch(
  candidate: ScoringCandidate,
  constraints: ScoringConstraints,
  preferredBrand?: string | null
): MatchScore {
  let attributeMatches = 0;
  let attributeTotal = 0;

  for (const [key, value] of Object.entries(constraints)) {
    if (value === null || value === undefined || value === 'any' || value === '') {
      continue;
    }

    attributeTotal++;
    const productValue = candidate.metadata[key];
    if (productValue !== undefined && productValue !== null) {
      const pNorm = normalizeText(String(productValue));
      const cNorm = normalizeText(String(value));
      if (pNorm === cNorm) {
        attributeMatches++;
      }
    }
  }

  const brandMatch =
    preferredBrand != null &&
    preferredBrand !== '' &&
    preferredBrand !== 'any' &&
    candidate.brand != null &&
    normalizeText(candidate.brand) === normalizeText(preferredBrand);

  let total = attributeMatches * 10;
  if (brandMatch) total += 5;
  if (attributeTotal > 0 && attributeMatches === attributeTotal) total += 20;

  return { total, attributeMatches, attributeTotal, brandMatch };
}

/**
 * Check if a candidate passes all hard constraints (non-"any" values must match exactly).
 */
export function passesConstraints(
  candidateMetadata: Record<string, unknown>,
  constraints: ScoringConstraints
): boolean {
  for (const [key, value] of Object.entries(constraints)) {
    if (value === null || value === undefined || value === 'any' || value === '') {
      continue;
    }
    const productValue = candidateMetadata[key];
    if (productValue === undefined || productValue === null) return false;
    if (normalizeText(String(productValue)) !== normalizeText(String(value))) return false;
  }
  return true;
}
