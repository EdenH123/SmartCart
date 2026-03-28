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
    data: { name: 'חלב', slug: 'milk' },
  });
  const eggs = await prisma.productCategory.create({
    data: { name: 'ביצים', slug: 'eggs' },
  });
  const cottage = await prisma.productCategory.create({
    data: { name: 'גבינת קוטג׳', slug: 'cottage-cheese' },
  });
  const yogurt = await prisma.productCategory.create({
    data: { name: 'יוגורט', slug: 'yogurt' },
  });
  const bread = await prisma.productCategory.create({
    data: { name: 'לחם', slug: 'bread' },
  });
  const rice = await prisma.productCategory.create({
    data: { name: 'אורז', slug: 'rice' },
  });
  const pasta = await prisma.productCategory.create({
    data: { name: 'פסטה', slug: 'pasta' },
  });
  const tomatoes = await prisma.productCategory.create({
    data: { name: 'עגבניות', slug: 'tomatoes' },
  });
  const cucumbers = await prisma.productCategory.create({
    data: { name: 'מלפפונים', slug: 'cucumbers' },
  });
  const chicken = await prisma.productCategory.create({
    data: { name: 'חזה עוף', slug: 'chicken-breast' },
  });
  const tuna = await prisma.productCategory.create({
    data: { name: 'טונה', slug: 'tuna' },
  });
  const cereal = await prisma.productCategory.create({
    data: { name: 'דגני בוקר', slug: 'cereal' },
  });

  // ── Attribute Definitions ──
  const attrDefs = [
    // חלב
    { categoryId: milk.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['רגיל', 'ללא לקטוז', 'אורגני']), sortOrder: 1 },
    { categoryId: milk.id, key: 'fat', label: 'אחוז שומן', type: 'enum', possibleValues: JSON.stringify(['1%', '2%', '3%', 'דל שומן']), sortOrder: 2 },
    { categoryId: milk.id, key: 'volume', label: 'נפח', type: 'enum', possibleValues: JSON.stringify(['1 ליטר', '2 ליטר', '0.5 ליטר']), sortOrder: 3 },
    // ביצים
    { categoryId: eggs.id, key: 'size', label: 'גודל', type: 'enum', possibleValues: JSON.stringify(['M', 'L', 'XL']), sortOrder: 1 },
    { categoryId: eggs.id, key: 'packCount', label: 'כמות באריזה', type: 'enum', possibleValues: JSON.stringify(['6', '12']), sortOrder: 2 },
    { categoryId: eggs.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['רגיל', 'חופש', 'אורגני']), sortOrder: 3 },
    // גבינת קוטג׳
    { categoryId: cottage.id, key: 'fat', label: 'אחוז שומן', type: 'enum', possibleValues: JSON.stringify(['0%', '3%', '5%', '9%']), sortOrder: 1 },
    { categoryId: cottage.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['200 גרם', '250 גרם', '500 גרם']), sortOrder: 2 },
    // יוגורט
    { categoryId: yogurt.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['טבעי', 'יווני', 'פירות']), sortOrder: 1 },
    { categoryId: yogurt.id, key: 'fat', label: 'אחוז שומן', type: 'enum', possibleValues: JSON.stringify(['0%', '2%', '5%']), sortOrder: 2 },
    { categoryId: yogurt.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['150 גרם', '200 גרם', '500 גרם']), sortOrder: 3 },
    // לחם
    { categoryId: bread.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['לבן', 'מלא', 'שיפון', 'רב דגנים']), sortOrder: 1 },
    { categoryId: bread.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['500 גרם', '750 גרם', '1 ק״ג']), sortOrder: 2 },
    // אורז
    { categoryId: rice.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['לבן', 'חום', 'בסמטי', 'יסמין']), sortOrder: 1 },
    { categoryId: rice.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['500 גרם', '1 ק״ג', '2 ק״ג']), sortOrder: 2 },
    // פסטה
    { categoryId: pasta.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['ספגטי', 'פנה', 'פוזילי', 'מקרוני']), sortOrder: 1 },
    { categoryId: pasta.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['500 גרם', '1 ק״ג']), sortOrder: 2 },
    // עגבניות
    { categoryId: tomatoes.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['רגיל', 'שרי', 'רומא']), sortOrder: 1 },
    { categoryId: tomatoes.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['500 גרם', '1 ק״ג']), sortOrder: 2 },
    // מלפפונים
    { categoryId: cucumbers.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['רגיל', 'פרסי', 'אנגלי']), sortOrder: 1 },
    { categoryId: cucumbers.id, key: 'quantity', label: 'כמות', type: 'enum', possibleValues: JSON.stringify(['יחידה', 'שלישייה', 'חמישייה']), sortOrder: 2 },
    // חזה עוף
    { categoryId: chicken.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['רגיל', 'אורגני', 'חופש']), sortOrder: 1 },
    { categoryId: chicken.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['500 גרם', '1 ק״ג']), sortOrder: 2 },
    // טונה
    { categoryId: tuna.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['במים', 'בשמן', 'בציר מלח']), sortOrder: 1 },
    { categoryId: tuna.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['120 גרם', '185 גרם', '400 גרם']), sortOrder: 2 },
    // דגני בוקר
    { categoryId: cereal.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['קורנפלקס', 'גרנולה', 'מוזלי', 'שיבולת שועל']), sortOrder: 1 },
    { categoryId: cereal.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['375 גרם', '500 גרם', '750 גרם']), sortOrder: 2 },
  ];

  for (const attr of attrDefs) {
    await prisma.productAttributeDefinition.create({ data: attr });
  }

  // ── Supermarkets ──
  const now = new Date();
  const shufersal = await prisma.supermarket.create({
    data: { name: 'שופרסל', slug: 'shufersal', lastIngestionAt: now },
  });
  const yochananof = await prisma.supermarket.create({
    data: { name: 'יוחננוף', slug: 'yochananof', lastIngestionAt: now },
  });
  const ramiLevy = await prisma.supermarket.create({
    data: { name: 'רמי לוי', slug: 'rami-levy', lastIngestionAt: now },
  });

  // ── Data Sources ──
  for (const sm of [shufersal, yochananof, ramiLevy]) {
    await prisma.dataSource.create({
      data: {
        supermarketId: sm.id,
        type: 'mock',
        config: JSON.stringify({ variationPercent: 0.10 }),
      },
    });
  }

  // ── Canonical Products & Supermarket Products ──
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

  // ── חלב ──
  await seedProduct(milk.id, 'חלב 3% רגיל 1 ליטר', 'תנובה', { type: 'רגיל', fat: '3%', volume: '1 ליטר' }, [
    { supermarketId: shufersal.id, externalName: 'תנובה חלב 3% 1 ליטר', price: 6.90 },
    { supermarketId: yochananof.id, externalName: 'חלב תנובה 3% 1 ליטר', price: 6.50 },
    { supermarketId: ramiLevy.id, externalName: 'תנובה חלב מלא 3% 1 ליטר', price: 7.20 },
  ]);
  await seedProduct(milk.id, 'חלב 3% רגיל 1 ליטר', 'טרה', { type: 'רגיל', fat: '3%', volume: '1 ליטר' }, [
    { supermarketId: shufersal.id, externalName: 'טרה חלב 3% 1 ליטר', price: 6.50, isPromo: true, promoDescription: 'מבצע השבוע - חסכו 1.50₪' },
    { supermarketId: yochananof.id, externalName: 'חלב טרה 3% 1 ליטר', price: 6.90 },
    { supermarketId: ramiLevy.id, externalName: 'טרה חלב 3% 1 ליטר', price: 7.10 },
  ]);
  await seedProduct(milk.id, 'חלב דל שומן 1 ליטר', 'תנובה', { type: 'רגיל', fat: 'דל שומן', volume: '1 ליטר' }, [
    { supermarketId: shufersal.id, externalName: 'תנובה חלב דל שומן 1 ליטר', price: 6.20 },
    { supermarketId: yochananof.id, externalName: 'חלב תנובה דל שומן 1 ליטר', price: 5.90 },
  ]);
  await seedProduct(milk.id, 'חלב אורגני 3% 1 ליטר', 'תנובה', { type: 'אורגני', fat: '3%', volume: '1 ליטר' }, [
    { supermarketId: shufersal.id, externalName: 'תנובה חלב אורגני 3% 1 ליטר', price: 11.90 },
    { supermarketId: ramiLevy.id, externalName: 'תנובה אורגני חלב 3% 1 ליטר', price: 10.90 },
  ]);
  await seedProduct(milk.id, 'חלב ללא לקטוז 2% 1 ליטר', 'שטראוס', { type: 'ללא לקטוז', fat: '2%', volume: '1 ליטר' }, [
    { supermarketId: shufersal.id, externalName: 'שטראוס חלב ללא לקטוז 2% 1 ליטר', price: 8.90 },
    { supermarketId: yochananof.id, externalName: 'שטראוס ללא לקטוז 2% 1 ליטר', price: 8.50 },
    { supermarketId: ramiLevy.id, externalName: 'שטראוס חלב ל.ל 2% 1 ליטר', price: 9.20 },
  ]);
  await seedProduct(milk.id, 'חלב 1% רגיל 2 ליטר', 'טרה', { type: 'רגיל', fat: '1%', volume: '2 ליטר' }, [
    { supermarketId: shufersal.id, externalName: 'טרה חלב 1% 2 ליטר', price: 11.90 },
    { supermarketId: yochananof.id, externalName: 'חלב טרה 1% 2 ליטר', price: 11.50 },
    { supermarketId: ramiLevy.id, externalName: 'טרה חלב דל 1% 2 ליטר', price: 12.50 },
  ]);

  // ── ביצים ──
  await seedProduct(eggs.id, 'ביצים L תריסר', 'משק שמיר', { size: 'L', packCount: '12', type: 'רגיל' }, [
    { supermarketId: shufersal.id, externalName: 'משק שמיר ביצים L 12 יח׳', price: 25.90 },
    { supermarketId: yochananof.id, externalName: 'ביצים משק שמיר L 12', price: 23.90, isPromo: true, promoDescription: 'קנו 2 קבלו 10% הנחה' },
    { supermarketId: ramiLevy.id, externalName: 'משק שמיר ביצים גדולות 12 יח׳', price: 27.90 },
  ]);
  await seedProduct(eggs.id, 'ביצים חופש L תריסר', 'ביצת הנגב', { size: 'L', packCount: '12', type: 'חופש' }, [
    { supermarketId: shufersal.id, externalName: 'ביצת הנגב ביצי חופש L 12', price: 32.90 },
    { supermarketId: ramiLevy.id, externalName: 'ביצת הנגב חופש L 12 יח׳', price: 30.90 },
  ]);
  await seedProduct(eggs.id, 'ביצים M שישייה', 'משק שמיר', { size: 'M', packCount: '6', type: 'רגיל' }, [
    { supermarketId: shufersal.id, externalName: 'משק שמיר ביצים M 6 יח׳', price: 13.90 },
    { supermarketId: yochananof.id, externalName: 'ביצים משק שמיר M 6', price: 12.90 },
    { supermarketId: ramiLevy.id, externalName: 'משק שמיר ביצים בינוניות 6 יח׳', price: 14.50 },
  ]);

  // ── גבינת קוטג׳ ──
  await seedProduct(cottage.id, 'קוטג׳ 5% 250 גרם', 'תנובה', { fat: '5%', weight: '250 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'תנובה קוטג׳ 5% 250 גרם', price: 7.90 },
    { supermarketId: yochananof.id, externalName: 'קוטג׳ תנובה 5% 250 גרם', price: 7.50 },
    { supermarketId: ramiLevy.id, externalName: 'תנובה קוטג׳ 5% 250 גרם', price: 8.20 },
  ]);
  await seedProduct(cottage.id, 'קוטג׳ 0% 250 גרם', 'שטראוס', { fat: '0%', weight: '250 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'שטראוס קוטג׳ 0% 250 גרם', price: 8.50 },
    { supermarketId: yochananof.id, externalName: 'קוטג׳ שטראוס דל שומן 250 גרם', price: 7.90 },
  ]);
  await seedProduct(cottage.id, 'קוטג׳ 9% 500 גרם', 'תנובה', { fat: '9%', weight: '500 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'תנובה קוטג׳ 9% 500 גרם', price: 14.90 },
    { supermarketId: ramiLevy.id, externalName: 'תנובה קוטג׳ שמן 9% 500 גרם', price: 15.50 },
  ]);

  // ── יוגורט ──
  await seedProduct(yogurt.id, 'יוגורט יווני 0% 200 גרם', 'דנונה', { type: 'יווני', fat: '0%', weight: '200 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'דנונה יוגורט יווני 0% 200 גרם', price: 6.90 },
    { supermarketId: yochananof.id, externalName: 'יוגורט דנונה יווני 0% 200 גרם', price: 6.50 },
    { supermarketId: ramiLevy.id, externalName: 'דנונה יווני 0% 200 גרם', price: 7.20 },
  ]);
  await seedProduct(yogurt.id, 'יוגורט פירות 2% 150 גרם', 'תנובה', { type: 'פירות', fat: '2%', weight: '150 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'תנובה יוגורט פירות 2% 150 גרם', price: 4.90 },
    { supermarketId: yochananof.id, externalName: 'יוגורט תנובה פירות 2% 150 גרם', price: 4.50, isPromo: true, promoDescription: '3 ב-12₪' },
    { supermarketId: ramiLevy.id, externalName: 'תנובה יוגורט פירות יער 2% 150 גרם', price: 5.20 },
  ]);

  // ── לחם ──
  await seedProduct(bread.id, 'לחם לבן 750 גרם', 'אנג׳ל', { type: 'לבן', weight: '750 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'אנג׳ל לחם לבן 750 גרם', price: 9.90 },
    { supermarketId: yochananof.id, externalName: 'לחם אנג׳ל לבן 750 גרם', price: 8.90 },
    { supermarketId: ramiLevy.id, externalName: 'אנג׳ל לחם לבן קלאסי 750 גרם', price: 10.50 },
  ]);
  await seedProduct(bread.id, 'לחם מלא 750 גרם', 'אנג׳ל', { type: 'מלא', weight: '750 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'אנג׳ל לחם מלא 750 גרם', price: 11.90 },
    { supermarketId: yochananof.id, externalName: 'לחם אנג׳ל מלא 750 גרם', price: 10.90 },
    { supermarketId: ramiLevy.id, externalName: 'אנג׳ל לחם חיטה מלאה 750 גרם', price: 12.50 },
  ]);
  await seedProduct(bread.id, 'לחם רב דגנים 500 גרם', 'ברמן', { type: 'רב דגנים', weight: '500 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'ברמן לחם רב דגנים 500 גרם', price: 13.90 },
    { supermarketId: ramiLevy.id, externalName: 'ברמן רב דגנים 500 גרם', price: 12.90 },
  ]);

  // ── אורז ──
  await seedProduct(rice.id, 'אורז בסמטי 1 ק״ג', 'סוגת', { type: 'בסמטי', weight: '1 ק״ג' }, [
    { supermarketId: shufersal.id, externalName: 'סוגת אורז בסמטי 1 ק״ג', price: 15.90 },
    { supermarketId: yochananof.id, externalName: 'אורז סוגת בסמטי 1 ק״ג', price: 14.90 },
    { supermarketId: ramiLevy.id, externalName: 'סוגת בסמטי פרימיום 1 ק״ג', price: 16.90 },
  ]);
  await seedProduct(rice.id, 'אורז לבן 2 ק״ג', 'סוגת', { type: 'לבן', weight: '2 ק״ג' }, [
    { supermarketId: shufersal.id, externalName: 'סוגת אורז לבן 2 ק״ג', price: 13.90 },
    { supermarketId: yochananof.id, externalName: 'אורז סוגת לבן 2 ק״ג', price: 12.90 },
    { supermarketId: ramiLevy.id, externalName: 'סוגת אורז לבן ארוך 2 ק״ג', price: 14.50 },
  ]);

  // ── פסטה ──
  await seedProduct(pasta.id, 'ספגטי 500 גרם', 'אוסם', { type: 'ספגטי', weight: '500 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'אוסם ספגטי 500 גרם', price: 5.90 },
    { supermarketId: yochananof.id, externalName: 'ספגטי אוסם 500 גרם', price: 5.50 },
    { supermarketId: ramiLevy.id, externalName: 'אוסם ספגטי קלאסי 500 גרם', price: 6.20 },
  ]);
  await seedProduct(pasta.id, 'פנה 500 גרם', 'ברילה', { type: 'פנה', weight: '500 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'ברילה פנה 500 גרם', price: 8.90 },
    { supermarketId: yochananof.id, externalName: 'פנה ברילה 500 גרם', price: 7.90 },
    { supermarketId: ramiLevy.id, externalName: 'ברילה פנה ריגאטה 500 גרם', price: 9.50 },
  ]);

  // ── עגבניות ──
  await seedProduct(tomatoes.id, 'עגבניות שרי 500 גרם', null, { type: 'שרי', weight: '500 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'עגבניות שרי טריות 500 גרם', price: 7.90 },
    { supermarketId: yochananof.id, externalName: 'שרי 500 גרם', price: 6.90 },
    { supermarketId: ramiLevy.id, externalName: 'עגבניות שרי אורגני 500 גרם', price: 9.90 },
  ]);
  await seedProduct(tomatoes.id, 'עגבניות רגיל 1 ק״ג', null, { type: 'רגיל', weight: '1 ק״ג' }, [
    { supermarketId: shufersal.id, externalName: 'עגבניות 1 ק״ג', price: 8.90 },
    { supermarketId: yochananof.id, externalName: 'עגבניות טריות 1 ק״ג', price: 7.90 },
    { supermarketId: ramiLevy.id, externalName: 'עגבניות אשכולות 1 ק״ג', price: 9.90 },
  ]);

  // ── מלפפונים ──
  await seedProduct(cucumbers.id, 'מלפפון אנגלי יחידה', null, { type: 'אנגלי', quantity: 'יחידה' }, [
    { supermarketId: shufersal.id, externalName: 'מלפפון אנגלי', price: 4.90 },
    { supermarketId: yochananof.id, externalName: 'מלפפון אנגלי ארוך', price: 4.50 },
    { supermarketId: ramiLevy.id, externalName: 'מלפפון אנגלי טרי', price: 5.20 },
  ]);
  await seedProduct(cucumbers.id, 'מלפפונים פרסיים חמישייה', null, { type: 'פרסי', quantity: 'חמישייה' }, [
    { supermarketId: shufersal.id, externalName: 'מלפפונים פרסיים 5 יח׳', price: 8.90 },
    { supermarketId: ramiLevy.id, externalName: 'מלפפון פרסי 5 יח׳', price: 9.50 },
  ]);

  // ── חזה עוף ──
  await seedProduct(chicken.id, 'חזה עוף רגיל 1 ק״ג', 'עוף טוב', { type: 'רגיל', weight: '1 ק״ג' }, [
    { supermarketId: shufersal.id, externalName: 'עוף טוב חזה עוף 1 ק״ג', price: 34.90 },
    { supermarketId: yochananof.id, externalName: 'חזה עוף עוף טוב 1 ק״ג', price: 31.90, isPromo: true, promoDescription: 'מבצע בשר השבוע!' },
    { supermarketId: ramiLevy.id, externalName: 'עוף טוב חזה טרי 1 ק״ג', price: 36.90 },
  ]);
  await seedProduct(chicken.id, 'חזה עוף אורגני 500 גרם', 'עוף העמק', { type: 'אורגני', weight: '500 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'עוף העמק חזה אורגני 500 גרם', price: 29.90 },
    { supermarketId: ramiLevy.id, externalName: 'עוף העמק אורגני חזה 500 גרם', price: 27.90 },
  ]);

  // ── טונה ──
  await seedProduct(tuna.id, 'טונה במים 185 גרם', 'סטארקיסט', { type: 'במים', weight: '185 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'סטארקיסט טונה במים 185 גרם', price: 9.90 },
    { supermarketId: yochananof.id, externalName: 'טונה סטארקיסט במים 185 גרם', price: 8.90 },
    { supermarketId: ramiLevy.id, externalName: 'סטארקיסט טונה לייט במים 185 גרם', price: 10.50 },
  ]);
  await seedProduct(tuna.id, 'טונה בשמן 185 גרם', 'גלי', { type: 'בשמן', weight: '185 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'גלי טונה בשמן 185 גרם', price: 10.90 },
    { supermarketId: yochananof.id, externalName: 'טונה גלי בשמן 185 גרם', price: 9.90 },
    { supermarketId: ramiLevy.id, externalName: 'גלי טונה פרימיום בשמן 185 גרם', price: 11.50 },
  ]);

  // ── דגני בוקר ──
  await seedProduct(cereal.id, 'קורנפלקס 500 גרם', 'תלמה', { type: 'קורנפלקס', weight: '500 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'תלמה קורנפלקס 500 גרם', price: 16.90 },
    { supermarketId: yochananof.id, externalName: 'קורנפלקס תלמה 500 גרם', price: 15.90 },
    { supermarketId: ramiLevy.id, externalName: 'תלמה קורנפלקס קלאסי 500 גרם', price: 17.90 },
  ]);
  await seedProduct(cereal.id, 'גרנולה 750 גרם', 'תלמה', { type: 'גרנולה', weight: '750 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'תלמה גרנולה 750 גרם', price: 24.90 },
    { supermarketId: yochananof.id, externalName: 'גרנולה תלמה 750 גרם', price: 22.90 },
    { supermarketId: ramiLevy.id, externalName: 'תלמה גרנולה פרימיום 750 גרם', price: 26.90, isPromo: true, promoDescription: 'מוצר חדש - 10% הנחה' },
  ]);
  await seedProduct(cereal.id, 'שיבולת שועל 500 גרם', 'אוסם', { type: 'שיבולת שועל', weight: '500 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'אוסם שיבולת שועל 500 גרם', price: 12.90 },
    { supermarketId: yochananof.id, externalName: 'שיבולת שועל אוסם 500 גרם', price: 11.90 },
  ]);

  // ── Demo Basket ──
  const demoBasket = await prisma.basket.create({
    data: {
      items: {
        create: [
          {
            categoryId: milk.id,
            quantity: 2,
            matchMode: 'flexible',
            displayName: 'חלב רגיל 3% 1 ליטר',
            userConstraints: JSON.stringify({ type: 'רגיל', fat: '3%', volume: '1 ליטר' }),
          },
          {
            categoryId: eggs.id,
            quantity: 1,
            matchMode: 'flexible',
            displayName: 'ביצים L תריסר',
            userConstraints: JSON.stringify({ size: 'L', packCount: '12' }),
          },
          {
            categoryId: bread.id,
            quantity: 1,
            matchMode: 'flexible',
            displayName: 'לחם מלא 750 גרם',
            userConstraints: JSON.stringify({ type: 'מלא', weight: '750 גרם' }),
          },
          {
            categoryId: chicken.id,
            quantity: 1,
            matchMode: 'flexible',
            displayName: 'חזה עוף רגיל 1 ק״ג',
            userConstraints: JSON.stringify({ type: 'רגיל', weight: '1 ק״ג' }),
          },
          {
            categoryId: pasta.id,
            quantity: 2,
            matchMode: 'exact',
            displayName: 'ספגטי אוסם 500 גרם',
            userConstraints: JSON.stringify({ type: 'ספגטי', weight: '500 גרם' }),
          },
        ],
      },
    },
  });

  console.log(`✓ בסיס הנתונים נוצר בהצלחה`);
  console.log(`  - 12 קטגוריות מוצרים`);
  console.log(`  - 30 מוצרים קנוניים`);
  console.log(`  - 3 סופרמרקטים ישראליים עם מקורות נתונים`);
  console.log(`  - ~80 מוצרים בסופרמרקטים עם תמונות מחיר`);
  console.log(`  - 1 סל לדוגמה (id: ${demoBasket.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
