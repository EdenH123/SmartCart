/**
 * Barcode-based cross-chain product matching.
 *
 * When multiple supermarket chains sell the same physical product, they share
 * the same barcode (EAN/ItemCode). This module enables matching products across
 * chains by barcode, providing definitive matches that don't rely on
 * fuzzy attribute comparison.
 *
 * Priority during ingestion:
 * 1. Barcode match → reuse existing CanonicalProduct (definitive)
 * 2. Attribute match → reuse existing CanonicalProduct (heuristic)
 * 3. No match → create new CanonicalProduct
 */

import { prisma } from '@/lib/db/client';

export interface BarcodeMatchResult {
  matched: boolean;
  canonicalProductId: string | null;
  matchType: 'barcode' | 'none';
}

/**
 * Find an existing CanonicalProduct by barcode.
 * Returns the first match found — barcodes should be unique per product.
 */
export async function findByBarcode(barcode: string): Promise<BarcodeMatchResult> {
  if (!barcode || barcode.trim() === '') {
    return { matched: false, canonicalProductId: null, matchType: 'none' };
  }

  const existing = await prisma.canonicalProduct.findFirst({
    where: { barcode: barcode.trim() },
    select: { id: true },
  });

  if (existing) {
    return { matched: true, canonicalProductId: existing.id, matchType: 'barcode' };
  }

  return { matched: false, canonicalProductId: null, matchType: 'none' };
}

/**
 * Find canonical products that share barcodes with products from another chain.
 * Useful for reporting cross-chain coverage.
 */
export async function findCrossChainMatches(
  supermarketId: string
): Promise<{ canonicalProductId: string; barcode: string; chainCount: number }[]> {
  // Get all canonical products with barcodes that have SupermarketProducts in the given chain
  const productsInChain = await prisma.supermarketProduct.findMany({
    where: { supermarketId },
    select: {
      canonicalProduct: {
        select: { id: true, barcode: true },
      },
    },
  });

  const barcodes = productsInChain
    .map((p) => p.canonicalProduct.barcode)
    .filter((b): b is string => b != null && b.trim() !== '');

  if (barcodes.length === 0) return [];

  // Find canonical products with the same barcodes that also have products at OTHER supermarkets
  const crossMatches = await prisma.canonicalProduct.findMany({
    where: {
      barcode: { in: barcodes },
    },
    select: {
      id: true,
      barcode: true,
      supermarketProducts: {
        select: { supermarketId: true },
        distinct: ['supermarketId'],
      },
    },
  });

  return crossMatches
    .filter((cp) => cp.supermarketProducts.length > 1)
    .map((cp) => ({
      canonicalProductId: cp.id,
      barcode: cp.barcode!,
      chainCount: cp.supermarketProducts.length,
    }));
}

/**
 * Get barcode matching statistics between supermarkets.
 */
export async function getBarcodeMatchStats(): Promise<{
  totalWithBarcode: number;
  totalWithoutBarcode: number;
  crossChainMatches: number;
  chainCoverage: { supermarketId: string; productsWithBarcode: number; totalProducts: number }[];
}> {
  const [withBarcode, withoutBarcode] = await Promise.all([
    prisma.canonicalProduct.count({
      where: { barcode: { not: null } },
    }),
    prisma.canonicalProduct.count({
      where: { barcode: null },
    }),
  ]);

  // Count canonical products that appear in multiple chains
  const allCanonical = await prisma.canonicalProduct.findMany({
    where: { barcode: { not: null } },
    select: {
      id: true,
      supermarketProducts: {
        select: { supermarketId: true },
        distinct: ['supermarketId'],
      },
    },
  });

  const crossChainMatches = allCanonical.filter(
    (cp) => cp.supermarketProducts.length > 1
  ).length;

  // Per-chain coverage
  const supermarkets = await prisma.supermarket.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const chainCoverage = await Promise.all(
    supermarkets.map(async (sm) => {
      const total = await prisma.supermarketProduct.count({
        where: { supermarketId: sm.id },
      });
      const withBc = await prisma.supermarketProduct.count({
        where: {
          supermarketId: sm.id,
          canonicalProduct: { barcode: { not: null } },
        },
      });
      return {
        supermarketId: sm.id,
        productsWithBarcode: withBc,
        totalProducts: total,
      };
    })
  );

  return {
    totalWithBarcode: withBarcode,
    totalWithoutBarcode: withoutBarcode,
    crossChainMatches,
    chainCoverage,
  };
}
