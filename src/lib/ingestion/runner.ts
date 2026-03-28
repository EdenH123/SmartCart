import { prisma } from '@/lib/db/client';
import { createLogger } from '@/lib/logger';
import { MockIngestionProvider } from './mock-provider';
import type { IngestionProvider, IngestionRunSummary, IngestionResult } from './types';

const log = createLogger('ingestion:runner');

/**
 * Resolve the correct ingestion provider for a data source type.
 */
function getProvider(type: string): IngestionProvider {
  switch (type) {
    case 'mock':
      return new MockIngestionProvider();
    // Future: case 'scraper': return new ScraperProvider();
    // Future: case 'api': return new ApiProvider();
    default:
      throw new Error(`Unknown data source type: ${type}`);
  }
}

/**
 * Run ingestion for all active supermarkets.
 * For each supermarket, finds the active data source and runs its provider.
 * Falls back to mock provider if no data source is configured.
 */
export async function runIngestion(): Promise<IngestionRunSummary> {
  const startedAt = new Date();
  log.info('Starting ingestion run');

  const supermarkets = await prisma.supermarket.findMany({
    where: { isActive: true },
    include: {
      dataSources: {
        where: { isActive: true },
        take: 1,
      },
    },
  });

  const results: IngestionResult[] = [];

  for (const supermarket of supermarkets) {
    const dataSource = supermarket.dataSources[0];
    const providerType = dataSource?.type ?? 'mock';

    try {
      const provider = getProvider(providerType);
      const result = await provider.ingest(supermarket.id);
      results.push(result);
    } catch (err) {
      log.error(`Ingestion failed for ${supermarket.name}`, {
        supermarketId: supermarket.id,
        error: err instanceof Error ? err.message : String(err),
      });
      results.push({
        supermarketId: supermarket.id,
        supermarketName: supermarket.name,
        productsUpdated: 0,
        snapshotsCreated: 0,
        promoCount: 0,
        outOfStockCount: 0,
        errors: [err instanceof Error ? err.message : String(err)],
        durationMs: 0,
      });
    }
  }

  const completedAt = new Date();
  const totalDurationMs = completedAt.getTime() - startedAt.getTime();

  const summary: IngestionRunSummary = {
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    totalDurationMs,
    results,
    totalProductsUpdated: results.reduce((sum, r) => sum + r.productsUpdated, 0),
    totalSnapshotsCreated: results.reduce((sum, r) => sum + r.snapshotsCreated, 0),
    totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
  };

  log.info('Ingestion run completed', {
    totalDurationMs,
    totalProductsUpdated: summary.totalProductsUpdated,
    totalSnapshotsCreated: summary.totalSnapshotsCreated,
    totalErrors: summary.totalErrors,
  });

  return summary;
}
