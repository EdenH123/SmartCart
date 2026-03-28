import { prisma } from '@/lib/db/client';
import { createLogger } from '@/lib/logger';
import type { IngestionProvider, IngestionResult } from './types';

const log = createLogger('ingestion:mock');

/**
 * Mock ingestion provider that simulates realistic price updates.
 *
 * Behavior:
 * - Varies prices ±5–15% from current price
 * - ~15% chance of marking an item as promo (10–30% discount)
 * - ~5% chance of marking an item out of stock
 * - Creates a PriceSnapshot for every product
 */
export class MockIngestionProvider implements IngestionProvider {
  readonly type = 'mock';

  async ingest(supermarketId: string): Promise<IngestionResult> {
    const start = Date.now();
    const errors: string[] = [];

    const supermarket = await prisma.supermarket.findUnique({
      where: { id: supermarketId },
    });

    if (!supermarket) {
      return {
        supermarketId,
        supermarketName: 'Unknown',
        productsUpdated: 0,
        snapshotsCreated: 0,
        promoCount: 0,
        outOfStockCount: 0,
        errors: [`Supermarket ${supermarketId} not found`],
        durationMs: Date.now() - start,
      };
    }

    log.info(`Starting mock ingestion for ${supermarket.name}`, { supermarketId });

    const products = await prisma.supermarketProduct.findMany({
      where: { supermarketId },
    });

    let productsUpdated = 0;
    let snapshotsCreated = 0;
    let promoCount = 0;
    let outOfStockCount = 0;

    for (const product of products) {
      try {
        const { newPrice, isPromo, promoDescription, inStock } = simulatePriceUpdate(product.price);

        // Create price snapshot
        await prisma.priceSnapshot.create({
          data: {
            supermarketProductId: product.id,
            price: newPrice,
            isPromo,
            promoDescription,
            inStock,
          },
        });
        snapshotsCreated++;

        // Update cached values on SupermarketProduct
        await prisma.supermarketProduct.update({
          where: { id: product.id },
          data: {
            price: newPrice,
            isPromo,
            promoDescription,
            inStock,
            updatedAt: new Date(),
          },
        });
        productsUpdated++;

        if (isPromo) promoCount++;
        if (!inStock) outOfStockCount++;
      } catch (err) {
        const msg = `Failed to update product ${product.id}: ${err instanceof Error ? err.message : String(err)}`;
        log.error(msg);
        errors.push(msg);
      }
    }

    // Update supermarket's last ingestion timestamp
    await prisma.supermarket.update({
      where: { id: supermarketId },
      data: { lastIngestionAt: new Date() },
    });

    const durationMs = Date.now() - start;
    log.info(`Completed mock ingestion for ${supermarket.name}`, {
      productsUpdated,
      snapshotsCreated,
      promoCount,
      outOfStockCount,
      durationMs,
    });

    return {
      supermarketId,
      supermarketName: supermarket.name,
      productsUpdated,
      snapshotsCreated,
      promoCount,
      outOfStockCount,
      errors,
      durationMs,
    };
  }
}

function simulatePriceUpdate(currentPrice: number): {
  newPrice: number;
  isPromo: boolean;
  promoDescription: string | null;
  inStock: boolean;
} {
  // ~5% chance of going out of stock
  const inStock = Math.random() > 0.05;

  // Vary price ±5–15%
  const variationPercent = 0.05 + Math.random() * 0.10; // 5-15%
  const direction = Math.random() > 0.5 ? 1 : -1;
  let newPrice = currentPrice * (1 + direction * variationPercent);

  // ~15% chance of promo
  const isPromo = Math.random() < 0.15;
  let promoDescription: string | null = null;

  if (isPromo) {
    const discount = 0.10 + Math.random() * 0.20; // 10-30% discount
    newPrice = currentPrice * (1 - discount);
    const discountPct = Math.round(discount * 100);
    const promoTypes = [
      `${discountPct}% off this week`,
      `Special offer - save ${discountPct}%`,
      `Weekly deal`,
      `Member price - ${discountPct}% discount`,
    ];
    promoDescription = promoTypes[Math.floor(Math.random() * promoTypes.length)];
  }

  // Floor to 2 decimals, minimum $0.10
  newPrice = Math.max(0.10, Math.round(newPrice * 100) / 100);

  return { newPrice, isPromo, promoDescription, inStock };
}
