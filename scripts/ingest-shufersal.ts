import { PrismaClient } from '@prisma/client';
import { ShufersalProvider } from '../src/lib/ingestion/shufersal-provider';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Shufersal Ingestion Script ===\n');

  // 1. Find or create the Shufersal supermarket
  let supermarket = await prisma.supermarket.findUnique({
    where: { slug: 'shufersal' },
  });

  if (!supermarket) {
    console.log('Creating Shufersal supermarket...');
    supermarket = await prisma.supermarket.create({
      data: {
        name: 'שופרסל',
        slug: 'shufersal',
      },
    });
    console.log(`Created supermarket: ${supermarket.name} (${supermarket.id})`);
  } else {
    console.log(`Found supermarket: ${supermarket.name} (${supermarket.id})`);
  }

  // 2. Ensure a shufersal-file data source exists
  const existingDataSource = await prisma.dataSource.findFirst({
    where: {
      supermarketId: supermarket.id,
      type: 'shufersal-file',
    },
  });

  if (!existingDataSource) {
    console.log('Creating shufersal-file data source...');
    await prisma.dataSource.create({
      data: {
        supermarketId: supermarket.id,
        type: 'shufersal-file',
        config: JSON.stringify({ chainId: '7290027600007' }),
        isActive: true,
      },
    });
    console.log('Data source created.');
  } else {
    console.log('Data source already exists.');
  }

  // 3. Run the ingestion
  console.log('\nRunning Shufersal file ingestion...\n');
  const provider = new ShufersalProvider();
  const result = await provider.ingest(supermarket.id);

  // 4. Print results
  console.log('=== Ingestion Results ===');
  console.log(`Supermarket:      ${result.supermarketName}`);
  console.log(`Products Updated: ${result.productsUpdated}`);
  console.log(`Snapshots Created: ${result.snapshotsCreated}`);
  console.log(`Promos:           ${result.promoCount}`);
  console.log(`Out of Stock:     ${result.outOfStockCount}`);
  console.log(`Errors:           ${result.errors.length}`);
  console.log(`Duration:         ${result.durationMs}ms`);

  if (result.errors.length > 0) {
    console.log('\n=== Errors ===');
    for (const error of result.errors.slice(0, 20)) {
      console.log(`  - ${error}`);
    }
    if (result.errors.length > 20) {
      console.log(`  ... and ${result.errors.length - 20} more`);
    }
  }

  console.log('\nDone.');
}

main()
  .catch((err) => {
    console.error('Ingestion failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
