/**
 * Tests for barcode-based cross-chain product matching.
 *
 * These tests mock the Prisma client to verify matching logic
 * without a real database.
 */

import { findByBarcode, findCrossChainMatches, getBarcodeMatchStats } from '@/lib/products/barcode-matching';

// Mock Prisma
jest.mock('@/lib/db/client', () => {
  const mockPrisma = {
    canonicalProduct: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    supermarketProduct: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    supermarket: {
      findMany: jest.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import { prisma } from '@/lib/db/client';
const mockPrisma = prisma as unknown as {
  canonicalProduct: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  supermarketProduct: {
    findMany: jest.Mock;
    count: jest.Mock;
  };
  supermarket: {
    findMany: jest.Mock;
  };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findByBarcode', () => {
  it('returns matched=true when barcode exists in DB', async () => {
    mockPrisma.canonicalProduct.findFirst.mockResolvedValue({ id: 'cp-123' });

    const result = await findByBarcode('7290000001');

    expect(result).toEqual({
      matched: true,
      canonicalProductId: 'cp-123',
      matchType: 'barcode',
    });
    expect(mockPrisma.canonicalProduct.findFirst).toHaveBeenCalledWith({
      where: { barcode: '7290000001' },
      select: { id: true },
    });
  });

  it('returns matched=false when barcode not found', async () => {
    mockPrisma.canonicalProduct.findFirst.mockResolvedValue(null);

    const result = await findByBarcode('9999999999');

    expect(result).toEqual({
      matched: false,
      canonicalProductId: null,
      matchType: 'none',
    });
  });

  it('returns matched=false for empty barcode', async () => {
    const result = await findByBarcode('');

    expect(result).toEqual({
      matched: false,
      canonicalProductId: null,
      matchType: 'none',
    });
    expect(mockPrisma.canonicalProduct.findFirst).not.toHaveBeenCalled();
  });

  it('trims whitespace from barcode', async () => {
    mockPrisma.canonicalProduct.findFirst.mockResolvedValue({ id: 'cp-456' });

    const result = await findByBarcode('  7290000001  ');

    expect(result.matched).toBe(true);
    expect(mockPrisma.canonicalProduct.findFirst).toHaveBeenCalledWith({
      where: { barcode: '7290000001' },
      select: { id: true },
    });
  });

  it('handles whitespace-only barcode as empty', async () => {
    const result = await findByBarcode('   ');

    expect(result.matched).toBe(false);
    expect(mockPrisma.canonicalProduct.findFirst).not.toHaveBeenCalled();
  });
});

describe('findCrossChainMatches', () => {
  it('finds products available at multiple chains', async () => {
    // Products in chain "sm-1"
    mockPrisma.supermarketProduct.findMany.mockResolvedValue([
      { canonicalProduct: { id: 'cp-1', barcode: '7290000001' } },
      { canonicalProduct: { id: 'cp-2', barcode: '7290000002' } },
      { canonicalProduct: { id: 'cp-3', barcode: null } },
    ]);

    // Cross-chain lookup
    mockPrisma.canonicalProduct.findMany.mockResolvedValue([
      {
        id: 'cp-1',
        barcode: '7290000001',
        supermarketProducts: [{ supermarketId: 'sm-1' }, { supermarketId: 'sm-2' }],
      },
      {
        id: 'cp-2',
        barcode: '7290000002',
        supermarketProducts: [{ supermarketId: 'sm-1' }], // only one chain
      },
    ]);

    const matches = await findCrossChainMatches('sm-1');

    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({
      canonicalProductId: 'cp-1',
      barcode: '7290000001',
      chainCount: 2,
    });
  });

  it('returns empty array when no products have barcodes', async () => {
    mockPrisma.supermarketProduct.findMany.mockResolvedValue([
      { canonicalProduct: { id: 'cp-1', barcode: null } },
      { canonicalProduct: { id: 'cp-2', barcode: '' } },
    ]);

    const matches = await findCrossChainMatches('sm-1');

    expect(matches).toHaveLength(0);
    expect(mockPrisma.canonicalProduct.findMany).not.toHaveBeenCalled();
  });

  it('returns empty array when no cross-chain matches exist', async () => {
    mockPrisma.supermarketProduct.findMany.mockResolvedValue([
      { canonicalProduct: { id: 'cp-1', barcode: '7290000001' } },
    ]);

    mockPrisma.canonicalProduct.findMany.mockResolvedValue([
      {
        id: 'cp-1',
        barcode: '7290000001',
        supermarketProducts: [{ supermarketId: 'sm-1' }], // only one chain
      },
    ]);

    const matches = await findCrossChainMatches('sm-1');

    expect(matches).toHaveLength(0);
  });
});

describe('getBarcodeMatchStats', () => {
  it('returns correct statistics', async () => {
    // count calls: withBarcode, withoutBarcode
    mockPrisma.canonicalProduct.count
      .mockResolvedValueOnce(100) // with barcode
      .mockResolvedValueOnce(50); // without barcode

    // Cross-chain: canonical products with barcodes
    mockPrisma.canonicalProduct.findMany.mockResolvedValue([
      { id: 'cp-1', supermarketProducts: [{ supermarketId: 'sm-1' }, { supermarketId: 'sm-2' }] },
      { id: 'cp-2', supermarketProducts: [{ supermarketId: 'sm-1' }] },
      { id: 'cp-3', supermarketProducts: [{ supermarketId: 'sm-1' }, { supermarketId: 'sm-2' }, { supermarketId: 'sm-3' }] },
    ]);

    // Supermarkets
    mockPrisma.supermarket.findMany.mockResolvedValue([
      { id: 'sm-1' },
      { id: 'sm-2' },
    ]);

    // Per-chain counts are called via Promise.all so order depends on resolution
    // Use mockImplementation to match by call args
    mockPrisma.supermarketProduct.count.mockImplementation((args: Record<string, unknown>) => {
      const where = args.where as Record<string, unknown>;
      const smId = (where.supermarketId as string) ?? '';
      const hasCanonical = 'canonicalProduct' in where;
      if (smId === 'sm-1' && !hasCanonical) return Promise.resolve(80);
      if (smId === 'sm-1' && hasCanonical) return Promise.resolve(60);
      if (smId === 'sm-2' && !hasCanonical) return Promise.resolve(40);
      if (smId === 'sm-2' && hasCanonical) return Promise.resolve(30);
      return Promise.resolve(0);
    });

    const stats = await getBarcodeMatchStats();

    expect(stats.totalWithBarcode).toBe(100);
    expect(stats.totalWithoutBarcode).toBe(50);
    expect(stats.crossChainMatches).toBe(2); // cp-1 and cp-3 have >1 chain
    expect(stats.chainCoverage).toHaveLength(2);
    expect(stats.chainCoverage[0]).toEqual({
      supermarketId: 'sm-1',
      productsWithBarcode: 60,
      totalProducts: 80,
    });
    expect(stats.chainCoverage[1]).toEqual({
      supermarketId: 'sm-2',
      productsWithBarcode: 30,
      totalProducts: 40,
    });
  });

  it('handles empty database', async () => {
    mockPrisma.canonicalProduct.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    mockPrisma.canonicalProduct.findMany.mockResolvedValue([]);
    mockPrisma.supermarket.findMany.mockResolvedValue([]);

    const stats = await getBarcodeMatchStats();

    expect(stats.totalWithBarcode).toBe(0);
    expect(stats.totalWithoutBarcode).toBe(0);
    expect(stats.crossChainMatches).toBe(0);
    expect(stats.chainCoverage).toHaveLength(0);
  });
});

describe('barcode matching integration flow', () => {
  it('scenario: same product ingested from two chains', async () => {
    // Chain 1 (Shufersal) ingests "חלב תנובה 3%" with barcode 7290000001
    // findByBarcode returns no match (first chain)
    mockPrisma.canonicalProduct.findFirst.mockResolvedValue(null);
    const result1 = await findByBarcode('7290000001');
    expect(result1.matched).toBe(false);
    // → Provider creates new CanonicalProduct with barcode=7290000001

    // Chain 2 (Rami Levy) ingests same barcode 7290000001
    // findByBarcode now finds existing product
    mockPrisma.canonicalProduct.findFirst.mockResolvedValue({ id: 'cp-milk-tnuva-3pct' });
    const result2 = await findByBarcode('7290000001');
    expect(result2.matched).toBe(true);
    expect(result2.canonicalProductId).toBe('cp-milk-tnuva-3pct');
    // → Provider reuses existing CanonicalProduct, links Rami Levy's SupermarketProduct to it
  });

  it('scenario: same product with different external names across chains', async () => {
    // Shufersal: "חלב תנובה טרי 3% שומן 1 ליטר בקרטון" → barcode 7290000001
    // Rami Levy: "חלב 3% תנובה 1 ל'" → barcode 7290000001
    // Both should map to the same CanonicalProduct via barcode

    mockPrisma.canonicalProduct.findFirst.mockResolvedValue({ id: 'cp-milk-tnuva-3pct' });

    const shufersal = await findByBarcode('7290000001');
    const ramiLevy = await findByBarcode('7290000001');

    expect(shufersal.canonicalProductId).toBe(ramiLevy.canonicalProductId);
  });
});
