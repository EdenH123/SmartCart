export interface IngestionResult {
  supermarketId: string;
  supermarketName: string;
  productsUpdated: number;
  snapshotsCreated: number;
  promoCount: number;
  outOfStockCount: number;
  errors: string[];
  durationMs: number;
}

export interface IngestionProvider {
  readonly type: string;
  ingest(supermarketId: string): Promise<IngestionResult>;
}

export interface IngestionRunSummary {
  startedAt: string;
  completedAt: string;
  totalDurationMs: number;
  results: IngestionResult[];
  totalProductsUpdated: number;
  totalSnapshotsCreated: number;
  totalErrors: number;
}
