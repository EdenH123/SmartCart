import { NextResponse } from 'next/server';
import { runIngestion } from '@/lib/ingestion';
import { createLogger } from '@/lib/logger';

const log = createLogger('api:ingest');

export async function POST() {
  try {
    log.info('Ingestion triggered via API');
    const summary = await runIngestion();

    return NextResponse.json({
      ok: true,
      summary,
    });
  } catch (err) {
    log.error('Ingestion API error', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Ingestion failed' },
      { status: 500 }
    );
  }
}

// Also allow GET for easy browser/dev testing
export async function GET() {
  return POST();
}
