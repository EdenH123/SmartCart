import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (order matters for FK constraints)
  await prisma.basketItem.deleteMany();
  await prisma.basket.deleteMany();
  await prisma.priceSnapshot.deleteMany();
  await prisma.supermarketProduct.deleteMany();
  await prisma.canonicalProduct.deleteMany();
  await prisma.productAttributeDefinition.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.dataSource.deleteMany();
  await prisma.supermarket.deleteMany();

  // ── Categories ──
  const milk = await prisma.productCategory.create({
    data: { name: 'Milk', slug: 'milk' },
  });
  const eggs = await prisma.productCategory.create({
    data: { name: 'Eggs', slug: 'eggs' },
  });
  const cottage = await prisma.productCategory.create({
    data: { name: 'Cottage Cheese', slug: 'cottage-cheese' },
  });
  const yogurt = await prisma.productCategory.create({
    data: { name: 'Yogurt', slug: 'yogurt' },
  });
  const bread = await prisma.productCategory.create({
    data: { name: 'Bread', slug: 'bread' },
  });
  const rice = await prisma.productCategory.create({
    data: { name: 'Rice', slug: 'rice' },
  });
  const pasta = await prisma.productCategory.create({
    data: { name: 'Pasta', slug: 'pasta' },
  });
  const tomatoes = await prisma.productCategory.create({
    data: { name: 'Tomatoes', slug: 'tomatoes' },
  });
  const cucumbers = await prisma.productCategory.create({
    data: { name: 'Cucumbers', slug: 'cucumbers' },
  });
  const chicken = await prisma.productCategory.create({
    data: { name: 'Chicken Breast', slug: 'chicken-breast' },
  });
  const tuna = await prisma.productCategory.create({
    data: { name: 'Tuna', slug: 'tuna' },
  });
  const cereal = await prisma.productCategory.create({
    data: { name: 'Cereal', slug: 'cereal' },
  });

  // ── Attribute Definitions ──
  const attrDefs = [
    // Milk
    { categoryId: milk.id, key: 'type', label: 'Type', type: 'enum', possibleValues: JSON.stringify(['Regular', 'Lactose Free', 'Organic']), sortOrder: 1 },
    { categoryId: milk.id, key: 'fat', label: 'Fat %', type: 'enum', possibleValues: JSON.stringify(['1%', '2%', '3%', 'Skim']), sortOrder: 2 },
    { categoryId: milk.id, key: 'volume', label: 'Volume', type: 'enum', possibleValues: JSON.stringify(['1L', '2L', '0.5L']), sortOrder: 3 },
    // Eggs
    { categoryId: eggs.id, key: 'size', label: 'Size', type: 'enum', possibleValues: JSON.stringify(['M', 'L', 'XL']), sortOrder: 1 },
    { categoryId: eggs.id, key: 'packCount', label: 'Pack Count', type: 'enum', possibleValues: JSON.stringify(['6', '12']), sortOrder: 2 },
    { categoryId: eggs.id, key: 'type', label: 'Type', type: 'enum', possibleValues: JSON.stringify(['Regular', 'Free Range', 'Organic']), sortOrder: 3 },
    // Cottage Cheese
    { categoryId: cottage.id, key: 'fat', label: 'Fat %', type: 'enum', possibleValues: JSON.stringify(['0%', '3%', '5%', '9%']), sortOrder: 1 },
    { categoryId: cottage.id, key: 'weight', label: 'Weight', type: 'enum', possibleValues: JSON.stringify(['200g', '250g', '500g']), sortOrder: 2 },
    // Yogurt
    { categoryId: yogurt.id, key: 'type', label: 'Type', type: 'enum', possibleValues: JSON.stringify(['Plain', 'Greek', 'Fruit']), sortOrder: 1 },
    { categoryId: yogurt.id, key: 'fat', label: 'Fat %', type: 'enum', possibleValues: JSON.stringify(['0%', '2%', '5%']), sortOrder: 2 },
    { categoryId: yogurt.id, key: 'weight', label: 'Weight', type: 'enum', possibleValues: JSON.stringify(['150g', '200g', '500g']), sortOrder: 3 },
    // Bread
    { categoryId: bread.id, key: 'type', label: 'Type', type: 'enum', possibleValues: JSON.stringify(['White', 'Whole Wheat', 'Rye', 'Multigrain']), sortOrder: 1 },
    { categoryId: bread.id, key: 'weight', label: 'Weight', type: 'enum', possibleValues: JSON.stringify(['500g', '750g', '1kg']), sortOrder: 2 },
    // Rice
    { categoryId: rice.id, key: 'type', label: 'Type', type: 'enum', possibleValues: JSON.stringify(['White', 'Brown', 'Basmati', 'Jasmine']), sortOrder: 1 },
    { categoryId: rice.id, key: 'weight', label: 'Weight', type: 'enum', possibleValues: JSON.stringify(['500g', '1kg', '2kg']), sortOrder: 2 },
    // Pasta
    { categoryId: pasta.id, key: 'type', label: 'Type', type: 'enum', possibleValues: JSON.stringify(['Spaghetti', 'Penne', 'Fusilli', 'Macaroni']), sortOrder: 1 },
    { categoryId: pasta.id, key: 'weight', label: 'Weight', type: 'enum', possibleValues: JSON.stringify(['500g', '1kg']), sortOrder: 2 },
    // Tomatoes
    { categoryId: tomatoes.id, key: 'type', label: 'Type', type: 'enum', possibleValues: JSON.stringify(['Regular', 'Cherry', 'Roma']), sortOrder: 1 },
    { categoryId: tomatoes.id, key: 'weight', label: 'Weight', type: 'enum', possibleValues: JSON.stringify(['500g', '1kg']), sortOrder: 2 },
    // Cucumbers
    { categoryId: cucumbers.id, key: 'type', label: 'Type', type: 'enum', possibleValues: JSON.stringify(['Regular', 'Persian', 'English']), sortOrder: 1 },
    { categoryId: cucumbers.id, key: 'quantity', label: 'Quantity', type: 'enum', possibleValues: JSON.stringify(['Single', 'Pack of 3', 'Pack of 5']), sortOrder: 2 },
    // Chicken
    { categoryId: chicken.id, key: 'type', label: 'Type', type: 'enum', possibleValues: JSON.stringify(['Regular', 'Organic', 'Free Range']), sortOrder: 1 },
    { categoryId: chicken.id, key: 'weight', label: 'Weight', type: 'enum', possibleValues: JSON.stringify(['500g', '1kg']), sortOrder: 2 },
    // Tuna
    { categoryId: tuna.id, key: 'type', label: 'Type', type: 'enum', possibleValues: JSON.stringify(['In Water', 'In Oil', 'In Brine']), sortOrder: 1 },
    { categoryId: tuna.id, key: 'weight', label: 'Weight', type: 'enum', possibleValues: JSON.stringify(['120g', '185g', '400g']), sortOrder: 2 },
    // Cereal
    { categoryId: cereal.id, key: 'type', label: 'Type', type: 'enum', possibleValues: JSON.stringify(['Corn Flakes', 'Granola', 'Muesli', 'Oatmeal']), sortOrder: 1 },
    { categoryId: cereal.id, key: 'weight', label: 'Weight', type: 'enum', possibleValues: JSON.stringify(['375g', '500g', '750g']), sortOrder: 2 },
  ];

  for (const attr of attrDefs) {
    await prisma.productAttributeDefinition.create({ data: attr });
  }

  // ── Supermarkets ──
  const now = new Date();
  const freshmart = await prisma.supermarket.create({
    data: { name: 'FreshMart', slug: 'freshmart', lastIngestionAt: now },
  });
  const valueGrocer = await prisma.supermarket.create({
    data: { name: 'ValueGrocer', slug: 'valuegrocer', lastIngestionAt: now },
  });
  const greenBasket = await prisma.supermarket.create({
    data: { name: 'GreenBasket', slug: 'greenbasket', lastIngestionAt: now },
  });

  // ── Data Sources ──
  for (const sm of [freshmart, valueGrocer, greenBasket]) {
    await prisma.dataSource.create({
      data: {
        supermarketId: sm.id,
        type: 'mock',
        config: JSON.stringify({ variationPercent: 0.10 }),
      },
    });
  }

  // ── Canonical Products & Supermarket Products ──
  // Helper to create canonical + supermarket listings
  async function seedProduct(
    categoryId: string,
    name: string,
    brand: string | null,
    metadata: Record<string, string>,
    listings: Array<{
      supermarketId: string;
      externalName: string;
      price: number;
      inStock?: boolean;
      isPromo?: boolean;
      promoDescription?: string | null;
    }>
  ) {
    const normalizedName = name.toLowerCase().replace(/\s+/g, '-');
    const searchableText = [name, brand, ...Object.values(metadata)].filter(Boolean).join(' ').toLowerCase();

    const canonical = await prisma.canonicalProduct.create({
      data: {
        categoryId,
        name,
        normalizedName,
        brand,
        metadata: JSON.stringify(metadata),
        searchableText,
      },
    });

    for (const listing of listings) {
      const sp = await prisma.supermarketProduct.create({
        data: {
          supermarketId: listing.supermarketId,
          canonicalProductId: canonical.id,
          externalName: listing.externalName,
          brand,
          price: listing.price,
          inStock: listing.inStock ?? true,
          isPromo: listing.isPromo ?? false,
          promoDescription: listing.promoDescription ?? null,
          metadata: JSON.stringify(metadata),
        },
      });

      // Create initial price snapshot
      await prisma.priceSnapshot.create({
        data: {
          supermarketProductId: sp.id,
          price: listing.price,
          isPromo: listing.isPromo ?? false,
          promoDescription: listing.promoDescription ?? null,
          inStock: listing.inStock ?? true,
        },
      });
    }

    return canonical;
  }

  // ── MILK ──
  await seedProduct(milk.id, 'Regular Milk 3% 1L', 'DairyBest', { type: 'Regular', fat: '3%', volume: '1L' }, [
    { supermarketId: freshmart.id, externalName: 'DairyBest Full Milk 3% 1L', price: 1.89 },
    { supermarketId: valueGrocer.id, externalName: 'DairyBest Milk 3% 1 Liter', price: 1.79 },
    { supermarketId: greenBasket.id, externalName: 'DairyBest 3% Milk 1L', price: 1.99 },
  ]);
  await seedProduct(milk.id, 'Regular Milk 3% 1L', 'Farm Fresh', { type: 'Regular', fat: '3%', volume: '1L' }, [
    { supermarketId: freshmart.id, externalName: 'Farm Fresh Whole Milk 3% 1L', price: 1.69, isPromo: true, promoDescription: 'Weekly special - save $0.30' },
    { supermarketId: valueGrocer.id, externalName: 'Farm Fresh 3% Milk 1L', price: 1.85 },
    { supermarketId: greenBasket.id, externalName: 'Farm Fresh Milk 3% 1L', price: 1.95 },
  ]);
  await seedProduct(milk.id, 'Skim Milk 1L', 'DairyBest', { type: 'Regular', fat: 'Skim', volume: '1L' }, [
    { supermarketId: freshmart.id, externalName: 'DairyBest Skim Milk 1L', price: 1.59 },
    { supermarketId: valueGrocer.id, externalName: 'DairyBest Skim 1L', price: 1.55 },
  ]);
  await seedProduct(milk.id, 'Organic Milk 3% 1L', 'GreenFields', { type: 'Organic', fat: '3%', volume: '1L' }, [
    { supermarketId: freshmart.id, externalName: 'GreenFields Organic 3% Milk 1L', price: 3.29 },
    { supermarketId: greenBasket.id, externalName: 'GreenFields Organic Milk 3% 1L', price: 2.99 },
  ]);
  await seedProduct(milk.id, 'Lactose Free Milk 2% 1L', 'DairyBest', { type: 'Lactose Free', fat: '2%', volume: '1L' }, [
    { supermarketId: freshmart.id, externalName: 'DairyBest Lactose Free 2% 1L', price: 2.49 },
    { supermarketId: valueGrocer.id, externalName: 'DairyBest LF Milk 2% 1L', price: 2.39 },
    { supermarketId: greenBasket.id, externalName: 'DairyBest Lactose Free 2% 1L', price: 2.59 },
  ]);
  await seedProduct(milk.id, 'Regular Milk 1% 2L', 'Farm Fresh', { type: 'Regular', fat: '1%', volume: '2L' }, [
    { supermarketId: freshmart.id, externalName: 'Farm Fresh Low Fat 1% 2L', price: 2.99 },
    { supermarketId: valueGrocer.id, externalName: 'Farm Fresh 1% Milk 2L', price: 2.89 },
    { supermarketId: greenBasket.id, externalName: 'Farm Fresh Light Milk 1% 2L', price: 3.15 },
  ]);

  // ── EGGS ──
  await seedProduct(eggs.id, 'Large Eggs 12-pack', 'HappyHen', { size: 'L', packCount: '12', type: 'Regular' }, [
    { supermarketId: freshmart.id, externalName: 'HappyHen Large Eggs x12', price: 3.99 },
    { supermarketId: valueGrocer.id, externalName: 'HappyHen Eggs Large 12pk', price: 3.49, isPromo: true, promoDescription: 'Buy 2 get 10% off' },
    { supermarketId: greenBasket.id, externalName: 'HappyHen Large 12 Eggs', price: 4.29 },
  ]);
  await seedProduct(eggs.id, 'Free Range Eggs L 12-pack', 'NatureFarm', { size: 'L', packCount: '12', type: 'Free Range' }, [
    { supermarketId: freshmart.id, externalName: 'NatureFarm Free Range L x12', price: 5.49 },
    { supermarketId: greenBasket.id, externalName: 'NatureFarm Free Range Large 12pk', price: 5.29 },
  ]);
  await seedProduct(eggs.id, 'Medium Eggs 6-pack', 'HappyHen', { size: 'M', packCount: '6', type: 'Regular' }, [
    { supermarketId: freshmart.id, externalName: 'HappyHen Medium Eggs x6', price: 1.99 },
    { supermarketId: valueGrocer.id, externalName: 'HappyHen Eggs M 6pk', price: 1.89 },
    { supermarketId: greenBasket.id, externalName: 'HappyHen Medium 6 Eggs', price: 2.09 },
  ]);

  // ── COTTAGE CHEESE ──
  await seedProduct(cottage.id, 'Cottage Cheese 5% 250g', 'CreamyDale', { fat: '5%', weight: '250g' }, [
    { supermarketId: freshmart.id, externalName: 'CreamyDale Cottage 5% 250g', price: 2.29 },
    { supermarketId: valueGrocer.id, externalName: 'CreamyDale Cottage Cheese 5% 250g', price: 2.19 },
    { supermarketId: greenBasket.id, externalName: 'CreamyDale 5% Cottage 250g', price: 2.39 },
  ]);
  await seedProduct(cottage.id, 'Cottage Cheese 0% 250g', 'FitDairy', { fat: '0%', weight: '250g' }, [
    { supermarketId: freshmart.id, externalName: 'FitDairy Fat Free Cottage 250g', price: 2.49 },
    { supermarketId: valueGrocer.id, externalName: 'FitDairy 0% Cottage 250g', price: 2.29 },
  ]);
  await seedProduct(cottage.id, 'Cottage Cheese 9% 500g', 'CreamyDale', { fat: '9%', weight: '500g' }, [
    { supermarketId: freshmart.id, externalName: 'CreamyDale Rich Cottage 9% 500g', price: 3.99 },
    { supermarketId: greenBasket.id, externalName: 'CreamyDale Cottage 9% 500g', price: 4.19 },
  ]);

  // ── YOGURT ──
  await seedProduct(yogurt.id, 'Greek Yogurt 0% 200g', 'GreekGold', { type: 'Greek', fat: '0%', weight: '200g' }, [
    { supermarketId: freshmart.id, externalName: 'GreekGold Greek Yogurt 0% 200g', price: 1.79 },
    { supermarketId: valueGrocer.id, externalName: 'GreekGold 0% Greek 200g', price: 1.69 },
    { supermarketId: greenBasket.id, externalName: 'GreekGold Fat-Free Greek 200g', price: 1.89 },
  ]);
  await seedProduct(yogurt.id, 'Fruit Yogurt 2% 150g', 'YumYogurt', { type: 'Fruit', fat: '2%', weight: '150g' }, [
    { supermarketId: freshmart.id, externalName: 'YumYogurt Strawberry 2% 150g', price: 0.99 },
    { supermarketId: valueGrocer.id, externalName: 'YumYogurt Fruit Mix 2% 150g', price: 0.89, isPromo: true, promoDescription: '3 for $2.50' },
    { supermarketId: greenBasket.id, externalName: 'YumYogurt Berry 2% 150g', price: 1.09 },
  ]);

  // ── BREAD ──
  await seedProduct(bread.id, 'White Bread 750g', 'BakersBest', { type: 'White', weight: '750g' }, [
    { supermarketId: freshmart.id, externalName: 'BakersBest White Loaf 750g', price: 2.49 },
    { supermarketId: valueGrocer.id, externalName: 'BakersBest White Bread 750g', price: 2.29 },
    { supermarketId: greenBasket.id, externalName: 'BakersBest Classic White 750g', price: 2.69 },
  ]);
  await seedProduct(bread.id, 'Whole Wheat Bread 750g', 'BakersBest', { type: 'Whole Wheat', weight: '750g' }, [
    { supermarketId: freshmart.id, externalName: 'BakersBest Whole Wheat 750g', price: 2.99 },
    { supermarketId: valueGrocer.id, externalName: 'BakersBest WW Bread 750g', price: 2.79 },
    { supermarketId: greenBasket.id, externalName: 'BakersBest Wholemeal 750g', price: 3.19 },
  ]);
  await seedProduct(bread.id, 'Multigrain Bread 500g', 'HealthyLoaf', { type: 'Multigrain', weight: '500g' }, [
    { supermarketId: freshmart.id, externalName: 'HealthyLoaf Multigrain 500g', price: 3.49 },
    { supermarketId: greenBasket.id, externalName: 'HealthyLoaf Multi-Seed 500g', price: 3.29 },
  ]);

  // ── RICE ──
  await seedProduct(rice.id, 'Basmati Rice 1kg', 'RoyalGrain', { type: 'Basmati', weight: '1kg' }, [
    { supermarketId: freshmart.id, externalName: 'RoyalGrain Basmati 1kg', price: 3.99 },
    { supermarketId: valueGrocer.id, externalName: 'RoyalGrain Basmati Rice 1kg', price: 3.79 },
    { supermarketId: greenBasket.id, externalName: 'RoyalGrain Premium Basmati 1kg', price: 4.29 },
  ]);
  await seedProduct(rice.id, 'White Rice 2kg', 'EasyRice', { type: 'White', weight: '2kg' }, [
    { supermarketId: freshmart.id, externalName: 'EasyRice Long Grain White 2kg', price: 3.49 },
    { supermarketId: valueGrocer.id, externalName: 'EasyRice White 2kg', price: 3.29 },
    { supermarketId: greenBasket.id, externalName: 'EasyRice White Rice 2kg', price: 3.69 },
  ]);

  // ── PASTA ──
  await seedProduct(pasta.id, 'Spaghetti 500g', 'PastaVita', { type: 'Spaghetti', weight: '500g' }, [
    { supermarketId: freshmart.id, externalName: 'PastaVita Spaghetti 500g', price: 1.49 },
    { supermarketId: valueGrocer.id, externalName: 'PastaVita Spaghetti 500g', price: 1.29 },
    { supermarketId: greenBasket.id, externalName: 'PastaVita Classic Spaghetti 500g', price: 1.59 },
  ]);
  await seedProduct(pasta.id, 'Penne 500g', 'PastaVita', { type: 'Penne', weight: '500g' }, [
    { supermarketId: freshmart.id, externalName: 'PastaVita Penne 500g', price: 1.49 },
    { supermarketId: valueGrocer.id, externalName: 'PastaVita Penne Rigate 500g', price: 1.39 },
    { supermarketId: greenBasket.id, externalName: 'PastaVita Penne 500g', price: 1.55 },
  ]);

  // ── TOMATOES ──
  await seedProduct(tomatoes.id, 'Cherry Tomatoes 500g', null, { type: 'Cherry', weight: '500g' }, [
    { supermarketId: freshmart.id, externalName: 'Fresh Cherry Tomatoes 500g', price: 2.99 },
    { supermarketId: valueGrocer.id, externalName: 'Cherry Tomatoes Pack 500g', price: 2.79 },
    { supermarketId: greenBasket.id, externalName: 'Organic Cherry Tomatoes 500g', price: 3.49 },
  ]);
  await seedProduct(tomatoes.id, 'Regular Tomatoes 1kg', null, { type: 'Regular', weight: '1kg' }, [
    { supermarketId: freshmart.id, externalName: 'Vine Tomatoes 1kg', price: 3.29 },
    { supermarketId: valueGrocer.id, externalName: 'Fresh Tomatoes 1kg', price: 2.99 },
    { supermarketId: greenBasket.id, externalName: 'Premium Tomatoes 1kg', price: 3.59 },
  ]);

  // ── CUCUMBERS ──
  await seedProduct(cucumbers.id, 'English Cucumber Single', null, { type: 'English', quantity: 'Single' }, [
    { supermarketId: freshmart.id, externalName: 'English Cucumber', price: 1.29 },
    { supermarketId: valueGrocer.id, externalName: 'Long English Cucumber', price: 1.19 },
    { supermarketId: greenBasket.id, externalName: 'English Cucumber', price: 1.39 },
  ]);
  await seedProduct(cucumbers.id, 'Persian Cucumbers Pack of 5', null, { type: 'Persian', quantity: 'Pack of 5' }, [
    { supermarketId: freshmart.id, externalName: 'Persian Mini Cucumbers x5', price: 2.49 },
    { supermarketId: greenBasket.id, externalName: 'Persian Cucumbers 5pk', price: 2.69 },
  ]);

  // ── CHICKEN BREAST ──
  await seedProduct(chicken.id, 'Chicken Breast 1kg', 'FarmPride', { type: 'Regular', weight: '1kg' }, [
    { supermarketId: freshmart.id, externalName: 'FarmPride Chicken Breast 1kg', price: 8.99 },
    { supermarketId: valueGrocer.id, externalName: 'FarmPride Chicken Breast 1kg', price: 7.99, isPromo: true, promoDescription: 'Meat week special!' },
    { supermarketId: greenBasket.id, externalName: 'FarmPride Fresh Chicken Breast 1kg', price: 9.49 },
  ]);
  await seedProduct(chicken.id, 'Organic Chicken Breast 500g', 'NatureFarm', { type: 'Organic', weight: '500g' }, [
    { supermarketId: freshmart.id, externalName: 'NatureFarm Organic Chicken 500g', price: 7.99 },
    { supermarketId: greenBasket.id, externalName: 'NatureFarm Organic Breast 500g', price: 7.49 },
  ]);

  // ── TUNA ──
  await seedProduct(tuna.id, 'Tuna in Water 185g', 'OceanCatch', { type: 'In Water', weight: '185g' }, [
    { supermarketId: freshmart.id, externalName: 'OceanCatch Tuna in Water 185g', price: 2.29 },
    { supermarketId: valueGrocer.id, externalName: 'OceanCatch Light Tuna Water 185g', price: 1.99 },
    { supermarketId: greenBasket.id, externalName: 'OceanCatch Tuna Chunks Water 185g', price: 2.49 },
  ]);
  await seedProduct(tuna.id, 'Tuna in Oil 185g', 'OceanCatch', { type: 'In Oil', weight: '185g' }, [
    { supermarketId: freshmart.id, externalName: 'OceanCatch Tuna in Oil 185g', price: 2.49 },
    { supermarketId: valueGrocer.id, externalName: 'OceanCatch Tuna Oil 185g', price: 2.19 },
    { supermarketId: greenBasket.id, externalName: 'OceanCatch Premium Tuna Oil 185g', price: 2.69 },
  ]);

  // ── CEREAL ──
  await seedProduct(cereal.id, 'Corn Flakes 500g', 'MorningCrunch', { type: 'Corn Flakes', weight: '500g' }, [
    { supermarketId: freshmart.id, externalName: 'MorningCrunch Corn Flakes 500g', price: 3.49 },
    { supermarketId: valueGrocer.id, externalName: 'MorningCrunch Classic Corn Flakes 500g', price: 3.29 },
    { supermarketId: greenBasket.id, externalName: 'MorningCrunch Corn Flakes 500g', price: 3.69 },
  ]);
  await seedProduct(cereal.id, 'Granola 750g', 'NutriMix', { type: 'Granola', weight: '750g' }, [
    { supermarketId: freshmart.id, externalName: 'NutriMix Crunchy Granola 750g', price: 5.99 },
    { supermarketId: valueGrocer.id, externalName: 'NutriMix Granola Mix 750g', price: 5.49 },
    { supermarketId: greenBasket.id, externalName: 'NutriMix Premium Granola 750g', price: 6.29, isPromo: true, promoDescription: 'New product - 10% off' },
  ]);
  await seedProduct(cereal.id, 'Oatmeal 500g', 'MorningCrunch', { type: 'Oatmeal', weight: '500g' }, [
    { supermarketId: freshmart.id, externalName: 'MorningCrunch Instant Oats 500g', price: 2.99 },
    { supermarketId: valueGrocer.id, externalName: 'MorningCrunch Oatmeal 500g', price: 2.79 },
  ]);

  // Create a demo basket with some items
  const demoBasket = await prisma.basket.create({
    data: {
      items: {
        create: [
          {
            categoryId: milk.id,
            quantity: 2,
            matchMode: 'flexible',
            displayName: 'Milk Regular 3% 1L',
            userConstraints: JSON.stringify({ type: 'Regular', fat: '3%', volume: '1L' }),
          },
          {
            categoryId: eggs.id,
            quantity: 1,
            matchMode: 'flexible',
            displayName: 'Eggs Large 12-pack',
            userConstraints: JSON.stringify({ size: 'L', packCount: '12' }),
          },
          {
            categoryId: bread.id,
            quantity: 1,
            matchMode: 'flexible',
            displayName: 'Bread Whole Wheat 750g',
            userConstraints: JSON.stringify({ type: 'Whole Wheat', weight: '750g' }),
          },
          {
            categoryId: chicken.id,
            quantity: 1,
            matchMode: 'flexible',
            displayName: 'Chicken Breast Regular 1kg',
            userConstraints: JSON.stringify({ type: 'Regular', weight: '1kg' }),
          },
          {
            categoryId: pasta.id,
            quantity: 2,
            matchMode: 'exact',
            displayName: 'Pasta Spaghetti 500g',
            userConstraints: JSON.stringify({ type: 'Spaghetti', weight: '500g' }),
          },
        ],
      },
    },
  });

  console.log(`✓ Seeded database successfully`);
  console.log(`  - 12 product categories`);
  console.log(`  - 30 canonical products`);
  console.log(`  - 3 supermarkets with mock data sources`);
  console.log(`  - ~80 supermarket listings with initial price snapshots`);
  console.log(`  - 1 demo basket (id: ${demoBasket.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
