import { PrismaClient } from '@prisma/client';
import { ShufersalProvider } from '../src/lib/ingestion/shufersal-provider';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Shufersal Promo Ingestion Script ===\n');

  // 1. Find the Shufersal supermarket
  const supermarket = await prisma.supermarket.findUnique({
    where: { slug: 'shufersal' },
  });

  if (!supermarket) {
    console.error('Shufersal supermarket not found. Run `npm run ingest` first.');
    process.exit(1);
  }

  console.log(`Found supermarket: ${supermarket.name} (${supermarket.id})`);

  // 2. Run promo ingestion
  console.log('\nRunning Shufersal promo ingestion...\n');
  const provider = new ShufersalProvider();
  const result = await provider.ingestPromos(supermarket.id);

  // 3. Print results
  console.log('=== Promo Ingestion Results ===');
  console.log(`Total Promotions:  ${result.totalPromotions}`);
  console.log(`Active Promotions: ${result.activePromotions}`);
  console.log(`Products Updated:  ${result.productsUpdated}`);
  console.log(`Errors:            ${result.errors.length}`);
  console.log(`Duration:          ${result.durationMs}ms`);

  if (result.errors.length > 0) {
    console.log('\n=== Errors ===');
    for (const error of result.errors.slice(0, 20)) {
      console.log(`  - ${error}`);
    }
    if (result.errors.length > 20) {
      console.log(`  ... and ${result.errors.length - 20} more`);
    }
  }

  // 4. Show a sample of promo products
  const promoProducts = await prisma.supermarketProduct.findMany({
    where: { supermarketId: supermarket.id, isPromo: true },
    select: { externalName: true, price: true, promoDescription: true },
    take: 10,
  });

  if (promoProducts.length > 0) {
    console.log('\n=== Sample Promo Products ===');
    for (const p of promoProducts) {
      console.log(`  ${p.externalName} — ₪${p.price} — ${p.promoDescription}`);
    }
  }

  console.log('\nDone.');
}

main()
  .catch((err) => {
    console.error('Promo ingestion failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
