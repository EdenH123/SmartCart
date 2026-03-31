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
  const coffee = await prisma.productCategory.create({
    data: { name: 'קפה', slug: 'coffee' },
  });
  const oil = await prisma.productCategory.create({
    data: { name: 'שמן', slug: 'oil' },
  });
  const sugar = await prisma.productCategory.create({
    data: { name: 'סוכר', slug: 'sugar' },
  });
  const snacks = await prisma.productCategory.create({
    data: { name: 'חטיפים', slug: 'snacks' },
  });
  const beverages = await prisma.productCategory.create({
    data: { name: 'שתייה', slug: 'beverages' },
  });
  const cleaning = await prisma.productCategory.create({
    data: { name: 'ניקיון', slug: 'cleaning' },
  });
  const frozen = await prisma.productCategory.create({
    data: { name: 'קפואים', slug: 'frozen' },
  });
  const cheese = await prisma.productCategory.create({
    data: { name: 'גבינות', slug: 'cheese' },
  });
  const butter = await prisma.productCategory.create({
    data: { name: 'חמאה', slug: 'butter' },
  });
  const flour = await prisma.productCategory.create({
    data: { name: 'קמח', slug: 'flour' },
  });
  const cannedTomatoes = await prisma.productCategory.create({
    data: { name: 'עגבניות שימורים', slug: 'canned-tomatoes' },
  });
  const spreads = await prisma.productCategory.create({
    data: { name: 'ממרחים', slug: 'spreads' },
  });
  const condiments = await prisma.productCategory.create({
    data: { name: 'רטבים ותבלינים', slug: 'condiments' },
  });
  const legumes = await prisma.productCategory.create({
    data: { name: 'קטניות', slug: 'legumes' },
  });
  const groundMeat = await prisma.productCategory.create({
    data: { name: 'בשר טחון', slug: 'ground-meat' },
  });
  const toiletPaper = await prisma.productCategory.create({
    data: { name: 'נייר טואלט', slug: 'toilet-paper' },
  });
  const diapers = await prisma.productCategory.create({
    data: { name: 'חיתולים', slug: 'diapers' },
  });
  const babyfood = await prisma.productCategory.create({
    data: { name: 'מזון לתינוקות', slug: 'baby-food' },
  });
  const tehina = await prisma.productCategory.create({
    data: { name: 'טחינה', slug: 'tehina' },
  });
  const hummus = await prisma.productCategory.create({
    data: { name: 'חומוס', slug: 'hummus' },
  });

  // ── New Categories (full Shufersal coverage) ──
  const chocolate = await prisma.productCategory.create({ data: { name: 'שוקולד', slug: 'chocolate' } });
  const cookies = await prisma.productCategory.create({ data: { name: 'עוגיות וביסקוויטים', slug: 'cookies' } });
  const cakes = await prisma.productCategory.create({ data: { name: 'עוגות ומאפים', slug: 'cakes' } });
  const wine = await prisma.productCategory.create({ data: { name: 'יין', slug: 'wine' } });
  const beer = await prisma.productCategory.create({ data: { name: 'בירה', slug: 'beer' } });
  const softDrinks = await prisma.productCategory.create({ data: { name: 'משקאות קלים', slug: 'soft-drinks' } });
  const water = await prisma.productCategory.create({ data: { name: 'מים', slug: 'water' } });
  const juice = await prisma.productCategory.create({ data: { name: 'מיצים', slug: 'juice' } });
  const tea = await prisma.productCategory.create({ data: { name: 'תה וחליטות', slug: 'tea' } });
  const hairCare = await prisma.productCategory.create({ data: { name: 'טיפוח שיער', slug: 'hair-care' } });
  const soapBody = await prisma.productCategory.create({ data: { name: 'סבון ורחצה', slug: 'soap-body' } });
  const deli = await prisma.productCategory.create({ data: { name: 'נקניקים ומעדני בשר', slug: 'deli' } });
  const fruits = await prisma.productCategory.create({ data: { name: 'פירות', slug: 'fruits' } });
  const vegetables = await prisma.productCategory.create({ data: { name: 'ירקות', slug: 'vegetables' } });
  const spices = await prisma.productCategory.create({ data: { name: 'תבלינים', slug: 'spices' } });
  const soup = await prisma.productCategory.create({ data: { name: 'מרקים', slug: 'soup' } });
  const fish = await prisma.productCategory.create({ data: { name: 'דגים', slug: 'fish' } });
  const meat = await prisma.productCategory.create({ data: { name: 'בשר', slug: 'meat' } });
  const corn = await prisma.productCategory.create({ data: { name: 'תירס ופופקורן', slug: 'corn' } });
  const olivesPickles = await prisma.productCategory.create({ data: { name: 'זיתים וחמוצים', slug: 'olives-pickles' } });
  const nuts = await prisma.productCategory.create({ data: { name: 'אגוזים וגרעינים', slug: 'nuts' } });
  const salads = await prisma.productCategory.create({ data: { name: 'סלטים', slug: 'salads' } });
  const creamDesserts = await prisma.productCategory.create({ data: { name: 'קרמים וקינוחים', slug: 'cream-desserts' } });
  const candy = await prisma.productCategory.create({ data: { name: 'סוכריות וממתקים', slug: 'candy' } });
  const driedFruits = await prisma.productCategory.create({ data: { name: 'פירות יבשים', slug: 'dried-fruits' } });
  const freshHerbs = await prisma.productCategory.create({ data: { name: 'עשבי תיבול טריים', slug: 'fresh-herbs' } });
  const paperProducts = await prisma.productCategory.create({ data: { name: 'מוצרי נייר', slug: 'paper-products' } });
  const personalHygiene = await prisma.productCategory.create({ data: { name: 'היגיינה אישית', slug: 'personal-hygiene' } });
  const skincare = await prisma.productCategory.create({ data: { name: 'טיפוח וקוסמטיקה', slug: 'skincare' } });
  const couscous = await prisma.productCategory.create({ data: { name: 'קוסקוס ופתיתים', slug: 'couscous' } });
  const halva = await prisma.productCategory.create({ data: { name: 'חלוה', slug: 'halva' } });
  const hotDrinks = await prisma.productCategory.create({ data: { name: 'משקאות חמים', slug: 'hot-drinks' } });
  const vegan = await prisma.productCategory.create({ data: { name: 'מוצרים טבעוניים', slug: 'vegan' } });
  const petFood = await prisma.productCategory.create({ data: { name: 'מזון לחיות מחמד', slug: 'pet-food' } });
  const disposables = await prisma.productCategory.create({ data: { name: 'כלים חד פעמיים', slug: 'disposables' } });
  const iceCream = await prisma.productCategory.create({ data: { name: 'מוצרי גלידה', slug: 'ice-cream' } });
  const general = await prisma.productCategory.create({ data: { name: 'כללי', slug: 'general' } });

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
    // קפה
    { categoryId: coffee.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['נמס', 'טורקי', 'קפסולות', 'פולים']), sortOrder: 1 },
    { categoryId: coffee.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['100 גרם', '200 גרם', '500 גרם']), sortOrder: 2 },
    // שמן
    { categoryId: oil.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['זית', 'קנולה', 'חמניות', 'צמחי']), sortOrder: 1 },
    { categoryId: oil.id, key: 'volume', label: 'נפח', type: 'enum', possibleValues: JSON.stringify(['500 מ״ל', '750 מ״ל', '1 ליטר']), sortOrder: 2 },
    // סוכר
    { categoryId: sugar.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['לבן', 'חום', 'סוכרזית']), sortOrder: 1 },
    { categoryId: sugar.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['500 גרם', '1 ק״ג']), sortOrder: 2 },
    // חטיפים
    { categoryId: snacks.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['במבה', 'ביסלי', 'צ׳יפס', 'פופקורן', 'אחר']), sortOrder: 1 },
    { categoryId: snacks.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['50 גרם', '100 גרם', '200 גרם']), sortOrder: 2 },
    // שתייה
    { categoryId: beverages.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['מים', 'מיץ', 'סודה', 'בירה']), sortOrder: 1 },
    { categoryId: beverages.id, key: 'volume', label: 'נפח', type: 'enum', possibleValues: JSON.stringify(['500 מ״ל', '1 ליטר', '1.5 ליטר', '2 ליטר']), sortOrder: 2 },
    // ניקיון
    { categoryId: cleaning.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['כלים', 'כביסה', 'רצפה', 'אסלה', 'כללי']), sortOrder: 1 },
    { categoryId: cleaning.id, key: 'volume', label: 'נפח', type: 'enum', possibleValues: JSON.stringify(['500 מ״ל', '1 ליטר', '2 ליטר']), sortOrder: 2 },
    // קפואים
    { categoryId: frozen.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['ירקות', 'פיצה', 'בורקס', 'שניצל', 'גלידה']), sortOrder: 1 },
    { categoryId: frozen.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['400 גרם', '500 גרם', '1 ק״ג']), sortOrder: 2 },
    // גבינות
    { categoryId: cheese.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['צהובה', 'לבנה', 'שמנת', 'בולגרית', 'מוצרלה']), sortOrder: 1 },
    { categoryId: cheese.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['200 גרם', '250 גרם', '500 גרם']), sortOrder: 2 },
    // חמאה
    { categoryId: butter.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['חמאה', 'מרגרינה', 'חמאה מלוחה']), sortOrder: 1 },
    { categoryId: butter.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['100 גרם', '200 גרם', '250 גרם']), sortOrder: 2 },
    // קמח
    { categoryId: flour.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['לבן', 'מלא', 'כוסמין', 'תופח']), sortOrder: 1 },
    { categoryId: flour.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['500 גרם', '1 ק״ג', '2 ק״ג']), sortOrder: 2 },
    // עגבניות שימורים
    { categoryId: cannedTomatoes.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['רסק', 'מרוסקות', 'שלמות', 'רוטב']), sortOrder: 1 },
    { categoryId: cannedTomatoes.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['400 גרם', '800 גרם']), sortOrder: 2 },
    // ממרחים
    { categoryId: spreads.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['חמאת בוטנים', 'שוקולד', 'ריבה', 'דבש']), sortOrder: 1 },
    { categoryId: spreads.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['200 גרם', '350 גרם', '500 גרם']), sortOrder: 2 },
    // רטבים ותבלינים
    { categoryId: condiments.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['קטשופ', 'מיונז', 'חרדל', 'סויה', 'חריף']), sortOrder: 1 },
    { categoryId: condiments.id, key: 'volume', label: 'נפח', type: 'enum', possibleValues: JSON.stringify(['250 מ״ל', '500 מ״ל', '750 מ״ל']), sortOrder: 2 },
    // קטניות
    { categoryId: legumes.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['עדשים', 'חומוס יבש', 'שעועית', 'פול']), sortOrder: 1 },
    { categoryId: legumes.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['500 גרם', '1 ק״ג']), sortOrder: 2 },
    // בשר טחון
    { categoryId: groundMeat.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['בקר', 'עוף', 'מעורב']), sortOrder: 1 },
    { categoryId: groundMeat.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['500 גרם', '1 ק״ג']), sortOrder: 2 },
    // נייר טואלט
    { categoryId: toiletPaper.id, key: 'layers', label: 'שכבות', type: 'enum', possibleValues: JSON.stringify(['2', '3', '4']), sortOrder: 1 },
    { categoryId: toiletPaper.id, key: 'rolls', label: 'גלילים', type: 'enum', possibleValues: JSON.stringify(['8', '16', '24', '32']), sortOrder: 2 },
    // חיתולים
    { categoryId: diapers.id, key: 'size', label: 'מידה', type: 'enum', possibleValues: JSON.stringify(['1', '2', '3', '4', '5', '6']), sortOrder: 1 },
    { categoryId: diapers.id, key: 'packCount', label: 'כמות באריזה', type: 'enum', possibleValues: JSON.stringify(['24', '36', '48', '72']), sortOrder: 2 },
    // מזון לתינוקות
    { categoryId: babyfood.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['תמ״ל', 'דייסה', 'מחית']), sortOrder: 1 },
    { categoryId: babyfood.id, key: 'stage', label: 'שלב', type: 'enum', possibleValues: JSON.stringify(['0-6', '6-12', '12+']), sortOrder: 2 },
    // טחינה
    { categoryId: tehina.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['גולמית', 'מלאה', 'אורגנית']), sortOrder: 1 },
    { categoryId: tehina.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['250 גרם', '500 גרם', '1 ק״ג']), sortOrder: 2 },
    // חומוס
    { categoryId: hummus.id, key: 'type', label: 'סוג', type: 'enum', possibleValues: JSON.stringify(['קלאסי', 'משואשה', 'עם טחינה', 'חריף']), sortOrder: 1 },
    { categoryId: hummus.id, key: 'weight', label: 'משקל', type: 'enum', possibleValues: JSON.stringify(['200 גרם', '400 גרם', '1 ק״ג']), sortOrder: 2 },
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
  // Shufersal uses real file-based ingestion from GZ XML files
  await prisma.dataSource.create({
    data: {
      supermarketId: shufersal.id,
      type: 'shufersal-file',
      config: JSON.stringify({}),
    },
  });
  // Other chains use mock until real data is available
  for (const sm of [yochananof, ramiLevy]) {
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

  // ── קפה ──
  await seedProduct(coffee.id, 'קפה נמס 200 גרם', 'עלית', { type: 'נמס', weight: '200 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'עלית קפה נמס 200 גרם', price: 22.90 },
    { supermarketId: yochananof.id, externalName: 'קפה נמס עלית 200 גרם', price: 21.90 },
    { supermarketId: ramiLevy.id, externalName: 'עלית קפה נמס קלאסי 200 גרם', price: 23.90 },
  ]);
  await seedProduct(coffee.id, 'קפה טורקי 200 גרם', 'עלית', { type: 'טורקי', weight: '200 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'עלית קפה טורקי 200 גרם', price: 18.90 },
    { supermarketId: yochananof.id, externalName: 'קפה טורקי עלית 200 גרם', price: 17.90 },
    { supermarketId: ramiLevy.id, externalName: 'עלית טורקי קלאסי 200 גרם', price: 19.50 },
  ]);
  await seedProduct(coffee.id, 'קפסולות נספרסו 100 גרם', 'נספרסו', { type: 'קפסולות', weight: '100 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'קפסולות נספרסו 10 יח׳', price: 19.90 },
    { supermarketId: yochananof.id, externalName: 'נספרסו קפסולות 10 יח׳', price: 18.90 },
    { supermarketId: ramiLevy.id, externalName: 'קפסולות נספרסו קלאסיק 10 יח׳', price: 20.90 },
  ]);

  // ── שמן ──
  await seedProduct(oil.id, 'שמן זית כתית מעולה 750 מ״ל', null, { type: 'זית', volume: '750 מ״ל' }, [
    { supermarketId: shufersal.id, externalName: 'שמן זית כתית מעולה 750 מ״ל', price: 34.90 },
    { supermarketId: yochananof.id, externalName: 'שמן זית כתית 750 מ״ל', price: 32.90 },
    { supermarketId: ramiLevy.id, externalName: 'שמן זית כתית מעולה 750 מ״ל', price: 36.90 },
  ]);
  await seedProduct(oil.id, 'שמן קנולה 1 ליטר', null, { type: 'קנולה', volume: '1 ליטר' }, [
    { supermarketId: shufersal.id, externalName: 'שמן קנולה 1 ליטר', price: 12.90 },
    { supermarketId: yochananof.id, externalName: 'שמן קנולה 1 ליטר', price: 11.90 },
    { supermarketId: ramiLevy.id, externalName: 'שמן קנולה טהור 1 ליטר', price: 13.50 },
  ]);

  // ── סוכר ──
  await seedProduct(sugar.id, 'סוכר לבן 1 ק״ג', 'סוגת', { type: 'לבן', weight: '1 ק״ג' }, [
    { supermarketId: shufersal.id, externalName: 'סוגת סוכר לבן 1 ק״ג', price: 7.90 },
    { supermarketId: yochananof.id, externalName: 'סוכר סוגת לבן 1 ק״ג', price: 7.50 },
    { supermarketId: ramiLevy.id, externalName: 'סוגת סוכר לבן דק 1 ק״ג', price: 8.20 },
  ]);
  await seedProduct(sugar.id, 'סוכר חום 500 גרם', 'סוגת', { type: 'חום', weight: '500 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'סוגת סוכר חום דמררה 500 גרם', price: 12.90 },
    { supermarketId: yochananof.id, externalName: 'סוכר חום סוגת 500 גרם', price: 11.90 },
    { supermarketId: ramiLevy.id, externalName: 'סוגת סוכר חום 500 גרם', price: 13.50 },
  ]);

  // ── חטיפים ──
  await seedProduct(snacks.id, 'במבה 100 גרם', 'אוסם', { type: 'במבה', weight: '100 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'אוסם במבה 100 גרם', price: 7.90 },
    { supermarketId: yochananof.id, externalName: 'במבה אוסם 100 גרם', price: 7.50 },
    { supermarketId: ramiLevy.id, externalName: 'אוסם במבה אריזה גדולה 100 גרם', price: 8.50 },
  ]);
  await seedProduct(snacks.id, 'ביסלי גריל 200 גרם', 'אוסם', { type: 'ביסלי', weight: '200 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'אוסם ביסלי גריל 200 גרם', price: 9.90 },
    { supermarketId: yochananof.id, externalName: 'ביסלי גריל אוסם 200 גרם', price: 9.50 },
    { supermarketId: ramiLevy.id, externalName: 'אוסם ביסלי גריל מרקיזה 200 גרם', price: 10.50 },
  ]);
  await seedProduct(snacks.id, 'צ׳יפס 50 גרם', 'תפוצ׳יפס', { type: 'צ׳יפס', weight: '50 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'תפוצ׳יפס 50 גרם', price: 5.90 },
    { supermarketId: yochananof.id, externalName: 'צ׳יפס תפוצ׳יפס 50 גרם', price: 5.50 },
    { supermarketId: ramiLevy.id, externalName: 'תפוצ׳יפס קלאסי 50 גרם', price: 6.20 },
  ]);

  // ── שתייה ──
  await seedProduct(beverages.id, 'מים מינרלים 1.5 ליטר', 'נביעות', { type: 'מים', volume: '1.5 ליטר' }, [
    { supermarketId: shufersal.id, externalName: 'נביעות מים מינרלים 1.5 ליטר', price: 4.90 },
    { supermarketId: yochananof.id, externalName: 'מים נביעות 1.5 ליטר', price: 4.50 },
    { supermarketId: ramiLevy.id, externalName: 'נביעות מים 1.5 ליטר', price: 5.20 },
  ]);
  await seedProduct(beverages.id, 'מיץ תפוזים 1 ליטר', 'פריגת', { type: 'מיץ', volume: '1 ליטר' }, [
    { supermarketId: shufersal.id, externalName: 'פריגת מיץ תפוזים 1 ליטר', price: 10.90 },
    { supermarketId: yochananof.id, externalName: 'מיץ תפוזים פריגת 1 ליטר', price: 9.90 },
    { supermarketId: ramiLevy.id, externalName: 'פריגת תפוזים 100% 1 ליטר', price: 11.50 },
  ]);
  await seedProduct(beverages.id, 'בירה גולדסטאר 500 מ״ל', 'גולדסטאר', { type: 'בירה', volume: '500 מ״ל' }, [
    { supermarketId: shufersal.id, externalName: 'גולדסטאר בירה 500 מ״ל', price: 8.90 },
    { supermarketId: yochananof.id, externalName: 'בירה גולדסטאר 500 מ״ל', price: 7.90 },
    { supermarketId: ramiLevy.id, externalName: 'גולדסטאר 500 מ״ל', price: 9.50 },
  ]);

  // ── ניקיון ──
  await seedProduct(cleaning.id, 'סבון כלים 750 מ״ל', 'פיירי', { type: 'כלים', volume: '500 מ״ל' }, [
    { supermarketId: shufersal.id, externalName: 'פיירי סבון כלים 750 מ״ל', price: 12.90 },
    { supermarketId: yochananof.id, externalName: 'סבון כלים פיירי 750 מ״ל', price: 11.90 },
    { supermarketId: ramiLevy.id, externalName: 'פיירי נוזל כלים 750 מ״ל', price: 13.50 },
  ]);
  await seedProduct(cleaning.id, 'נוזל כביסה 2 ליטר', 'סנו', { type: 'כביסה', volume: '2 ליטר' }, [
    { supermarketId: shufersal.id, externalName: 'סנו נוזל כביסה 2 ליטר', price: 29.90 },
    { supermarketId: yochananof.id, externalName: 'נוזל כביסה סנו 2 ליטר', price: 27.90 },
    { supermarketId: ramiLevy.id, externalName: 'סנו מקסימה נוזל כביסה 2 ליטר', price: 31.90 },
  ]);

  // ── קפואים ──
  await seedProduct(frozen.id, 'ירקות קפואים 400 גרם', null, { type: 'ירקות', weight: '400 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'ירקות קפואים מעורב 400 גרם', price: 9.90 },
    { supermarketId: yochananof.id, externalName: 'ירקות קפואים 400 גרם', price: 8.90 },
    { supermarketId: ramiLevy.id, externalName: 'ירקות מעורב קפואים 400 גרם', price: 10.50 },
  ]);
  await seedProduct(frozen.id, 'פיצה קפואה 500 גרם', null, { type: 'פיצה', weight: '500 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'פיצה קפואה 500 גרם', price: 19.90 },
    { supermarketId: yochananof.id, externalName: 'פיצה משפחתית קפואה 500 גרם', price: 18.90 },
    { supermarketId: ramiLevy.id, externalName: 'פיצה קפואה גדולה 500 גרם', price: 21.90 },
  ]);
  await seedProduct(frozen.id, 'בורקס גבינה 500 גרם', null, { type: 'בורקס', weight: '500 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'בורקס גבינה קפוא 500 גרם', price: 22.90 },
    { supermarketId: yochananof.id, externalName: 'בורקס גבינה 500 גרם', price: 21.90 },
    { supermarketId: ramiLevy.id, externalName: 'בורקס גבינה בולגרית 500 גרם', price: 24.90 },
  ]);

  // ── גבינות ──
  await seedProduct(cheese.id, 'גבינה צהובה 200 גרם', 'תנובה', { type: 'צהובה', weight: '200 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'תנובה גבינה צהובה עמק 200 גרם', price: 18.90 },
    { supermarketId: yochananof.id, externalName: 'גבינה צהובה עמק תנובה 200 גרם', price: 17.90 },
    { supermarketId: ramiLevy.id, externalName: 'תנובה עמק צהובה 200 גרם', price: 19.90 },
  ]);
  await seedProduct(cheese.id, 'גבינה בולגרית 5% 250 גרם', 'תנובה', { type: 'בולגרית', weight: '250 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'תנובה גבינה בולגרית 5% 250 גרם', price: 9.90 },
    { supermarketId: yochananof.id, externalName: 'גבינה בולגרית תנובה 5% 250 גרם', price: 9.50 },
    { supermarketId: ramiLevy.id, externalName: 'תנובה בולגרית 5% 250 גרם', price: 10.50 },
  ]);
  await seedProduct(cheese.id, 'מוצרלה 200 גרם', 'גד', { type: 'מוצרלה', weight: '200 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'גד מוצרלה 200 גרם', price: 14.90 },
    { supermarketId: yochananof.id, externalName: 'מוצרלה גד 200 גרם', price: 13.90 },
    { supermarketId: ramiLevy.id, externalName: 'גד מוצרלה טרייה 200 גרם', price: 15.90 },
  ]);

  // ── חמאה ──
  await seedProduct(butter.id, 'חמאה 200 גרם', 'תנובה', { type: 'חמאה', weight: '200 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'תנובה חמאה 200 גרם', price: 8.90 },
    { supermarketId: yochananof.id, externalName: 'חמאה תנובה 200 גרם', price: 8.50 },
    { supermarketId: ramiLevy.id, externalName: 'תנובה חמאה 200 גר', price: 9.20 },
  ]);
  await seedProduct(butter.id, 'מרגרינה 250 גרם', 'שופרסל', { type: 'מרגרינה', weight: '250 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'שופרסל מרגרינה 250 גרם', price: 5.90, isPromo: true, promoDescription: '2 ב-10₪' },
    { supermarketId: ramiLevy.id, externalName: 'מרגרינה שופרסל 250 גרם', price: 6.50 },
  ]);

  // ── קמח ──
  await seedProduct(flour.id, 'קמח לבן 1 ק״ג', 'סוגת', { type: 'לבן', weight: '1 ק״ג' }, [
    { supermarketId: shufersal.id, externalName: 'סוגת קמח לבן 1 ק״ג', price: 5.90 },
    { supermarketId: yochananof.id, externalName: 'קמח סוגת לבן 1 ק״ג', price: 5.50 },
    { supermarketId: ramiLevy.id, externalName: 'סוגת קמח לבן רגיל 1 ק״ג', price: 6.20 },
  ]);
  await seedProduct(flour.id, 'קמח מלא 1 ק״ג', 'סוגת', { type: 'מלא', weight: '1 ק״ג' }, [
    { supermarketId: shufersal.id, externalName: 'סוגת קמח מלא 1 ק״ג', price: 7.90 },
    { supermarketId: yochananof.id, externalName: 'קמח מלא סוגת 1 ק״ג', price: 7.50 },
  ]);
  await seedProduct(flour.id, 'קמח תופח 500 גרם', 'סוגת', { type: 'תופח', weight: '500 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'סוגת קמח תופח 500 גרם', price: 4.90 },
    { supermarketId: ramiLevy.id, externalName: 'סוגת קמח תופח 500 גרם', price: 5.20 },
  ]);

  // ── עגבניות שימורים ──
  await seedProduct(cannedTomatoes.id, 'רסק עגבניות 400 גרם', 'אוסם', { type: 'רסק', weight: '400 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'אוסם רסק עגבניות 400 גרם', price: 5.90 },
    { supermarketId: yochananof.id, externalName: 'רסק עגבניות אוסם 400 גרם', price: 5.50 },
    { supermarketId: ramiLevy.id, externalName: 'אוסם רסק עגבניות מרוכז 400 גרם', price: 6.20 },
  ]);
  await seedProduct(cannedTomatoes.id, 'עגבניות מרוסקות 800 גרם', 'מוטי', { type: 'מרוסקות', weight: '800 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'מוטי עגבניות מרוסקות 800 גרם', price: 9.90 },
    { supermarketId: yochananof.id, externalName: 'עגבניות מרוסקות מוטי 800 גרם', price: 9.50 },
    { supermarketId: ramiLevy.id, externalName: 'מוטי פולפה עגבניות 800 גרם', price: 10.50 },
  ]);

  // ── ממרחים ──
  await seedProduct(spreads.id, 'חמאת בוטנים 350 גרם', 'שופרסל', { type: 'חמאת בוטנים', weight: '350 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'שופרסל חמאת בוטנים 350 גרם', price: 16.90 },
    { supermarketId: yochananof.id, externalName: 'חמאת בוטנים שופרסל 350 גרם', price: 15.90 },
    { supermarketId: ramiLevy.id, externalName: 'חמאת בוטנים 350 גרם', price: 17.50 },
  ]);
  await seedProduct(spreads.id, 'ממרח שוקולד 500 גרם', 'נוטלה', { type: 'שוקולד', weight: '500 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'נוטלה ממרח שוקולד 500 גרם', price: 24.90 },
    { supermarketId: yochananof.id, externalName: 'ממרח נוטלה 500 גרם', price: 23.90 },
    { supermarketId: ramiLevy.id, externalName: 'נוטלה 500 גרם', price: 25.90 },
  ]);
  await seedProduct(spreads.id, 'דבש טהור 350 גרם', null, { type: 'דבש', weight: '350 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'דבש טהור מפרחי בר 350 גרם', price: 29.90 },
    { supermarketId: ramiLevy.id, externalName: 'דבש טהור 350 גרם', price: 27.90 },
  ]);

  // ── רטבים ותבלינים ──
  await seedProduct(condiments.id, 'קטשופ 750 מ״ל', 'אוסם', { type: 'קטשופ', volume: '750 מ״ל' }, [
    { supermarketId: shufersal.id, externalName: 'אוסם קטשופ 750 מ״ל', price: 12.90 },
    { supermarketId: yochananof.id, externalName: 'קטשופ אוסם 750 מ״ל', price: 11.90 },
    { supermarketId: ramiLevy.id, externalName: 'אוסם קטשופ קלאסי 750 מ״ל', price: 13.50 },
  ]);
  await seedProduct(condiments.id, 'מיונז 500 מ״ל', 'הלמנ׳ס', { type: 'מיונז', volume: '500 מ״ל' }, [
    { supermarketId: shufersal.id, externalName: 'הלמנ׳ס מיונז 500 מ״ל', price: 14.90 },
    { supermarketId: yochananof.id, externalName: 'מיונז הלמנ׳ס 500 מ״ל', price: 13.90 },
    { supermarketId: ramiLevy.id, externalName: 'הלמנ׳ס מיונז קלאסי 500 מ״ל', price: 15.50 },
  ]);
  await seedProduct(condiments.id, 'רוטב סויה 250 מ״ל', 'קיקומן', { type: 'סויה', volume: '250 מ״ל' }, [
    { supermarketId: shufersal.id, externalName: 'קיקומן רוטב סויה 250 מ״ל', price: 12.90 },
    { supermarketId: ramiLevy.id, externalName: 'קיקומן סויה 250 מ״ל', price: 13.50 },
  ]);

  // ── קטניות ──
  await seedProduct(legumes.id, 'עדשים כתומות 500 גרם', 'סוגת', { type: 'עדשים', weight: '500 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'סוגת עדשים כתומות 500 גרם', price: 9.90 },
    { supermarketId: yochananof.id, externalName: 'עדשים כתומות סוגת 500 גרם', price: 9.50 },
    { supermarketId: ramiLevy.id, externalName: 'סוגת עדשים כתומות 500 גרם', price: 10.50 },
  ]);
  await seedProduct(legumes.id, 'שעועית לבנה 1 ק״ג', 'סוגת', { type: 'שעועית', weight: '1 ק״ג' }, [
    { supermarketId: shufersal.id, externalName: 'סוגת שעועית לבנה 1 ק״ג', price: 14.90 },
    { supermarketId: yochananof.id, externalName: 'שעועית לבנה סוגת 1 ק״ג', price: 13.90 },
  ]);

  // ── בשר טחון ──
  await seedProduct(groundMeat.id, 'בשר טחון בקר 500 גרם', 'טיב טעם', { type: 'בקר', weight: '500 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'טיב טעם בשר טחון בקר 500 גרם', price: 39.90 },
    { supermarketId: yochananof.id, externalName: 'בשר טחון בקר טיב טעם 500 גרם', price: 37.90, isPromo: true, promoDescription: 'מבצע סוף שבוע' },
    { supermarketId: ramiLevy.id, externalName: 'טיב טעם טחון בקר טרי 500 גרם', price: 41.90 },
  ]);
  await seedProduct(groundMeat.id, 'בשר טחון עוף 500 גרם', 'עוף טוב', { type: 'עוף', weight: '500 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'עוף טוב טחון עוף 500 גרם', price: 24.90 },
    { supermarketId: yochananof.id, externalName: 'טחון עוף עוף טוב 500 גרם', price: 23.90 },
    { supermarketId: ramiLevy.id, externalName: 'עוף טוב בשר טחון עוף 500 גרם', price: 25.90 },
  ]);
  await seedProduct(groundMeat.id, 'בשר טחון מעורב 1 ק״ג', 'טיב טעם', { type: 'מעורב', weight: '1 ק״ג' }, [
    { supermarketId: shufersal.id, externalName: 'טיב טעם טחון מעורב 1 ק״ג', price: 64.90 },
    { supermarketId: ramiLevy.id, externalName: 'טיב טעם בשר טחון מעורב 1 ק״ג', price: 66.90 },
  ]);

  // ── נייר טואלט ──
  await seedProduct(toiletPaper.id, 'נייר טואלט 3 שכבות 32 גלילים', 'סנו', { layers: '3', rolls: '32' }, [
    { supermarketId: shufersal.id, externalName: 'סנו נייר טואלט 3 שכבות 32 גלילים', price: 44.90 },
    { supermarketId: yochananof.id, externalName: 'נייר טואלט סנו 32 גלילים', price: 42.90 },
    { supermarketId: ramiLevy.id, externalName: 'סנו סופט נייר טואלט 32 גלילים', price: 46.90 },
  ]);
  await seedProduct(toiletPaper.id, 'נייר טואלט 4 שכבות 16 גלילים', 'לילי', { layers: '4', rolls: '16' }, [
    { supermarketId: shufersal.id, externalName: 'לילי נייר טואלט 4 שכבות 16 גלילים', price: 34.90 },
    { supermarketId: yochananof.id, externalName: 'נייר טואלט לילי 16 גלילים', price: 32.90, isPromo: true, promoDescription: '2 ב-60₪' },
    { supermarketId: ramiLevy.id, externalName: 'לילי פרימיום 4 שכבות 16 גלילים', price: 36.90 },
  ]);

  // ── חיתולים ──
  await seedProduct(diapers.id, 'חיתולים מידה 4 אריזת 72', 'האגיס', { size: '4', packCount: '72' }, [
    { supermarketId: shufersal.id, externalName: 'האגיס חיתולים מידה 4 72 יח׳', price: 89.90 },
    { supermarketId: yochananof.id, externalName: 'חיתולי האגיס מידה 4 72 יח׳', price: 84.90 },
    { supermarketId: ramiLevy.id, externalName: 'האגיס פרידום מידה 4 72 יח׳', price: 92.90 },
  ]);
  await seedProduct(diapers.id, 'חיתולים מידה 3 אריזת 48', 'פמפרס', { size: '3', packCount: '48' }, [
    { supermarketId: shufersal.id, externalName: 'פמפרס חיתולים מידה 3 48 יח׳', price: 69.90 },
    { supermarketId: yochananof.id, externalName: 'חיתולי פמפרס מידה 3 48 יח׳', price: 65.90 },
    { supermarketId: ramiLevy.id, externalName: 'פמפרס בייבי דריי מידה 3 48 יח׳', price: 72.90 },
  ]);

  // ── מזון לתינוקות ──
  await seedProduct(babyfood.id, 'תמ״ל שלב 1 700 גרם', 'מעדנות', { type: 'תמ״ל', stage: '0-6' }, [
    { supermarketId: shufersal.id, externalName: 'מעדנות תמ״ל שלב 1 700 גרם', price: 54.90 },
    { supermarketId: yochananof.id, externalName: 'תמ״ל מעדנות שלב 1 700 גרם', price: 52.90 },
    { supermarketId: ramiLevy.id, externalName: 'מעדנות שלב 1 תמ״ל 700 גרם', price: 56.90 },
  ]);
  await seedProduct(babyfood.id, 'דייסת אורז שלב 6+ חודשים', 'מטרנה', { type: 'דייסה', stage: '6-12' }, [
    { supermarketId: shufersal.id, externalName: 'מטרנה דייסת אורז 6+ חודשים', price: 19.90 },
    { supermarketId: yochananof.id, externalName: 'דייסה מטרנה אורז 6+', price: 18.90 },
    { supermarketId: ramiLevy.id, externalName: 'מטרנה דייסת אורז לתינוק 6+', price: 20.90 },
  ]);
  await seedProduct(babyfood.id, 'מחית פירות 12+ חודשים', 'מטרנה', { type: 'מחית', stage: '12+' }, [
    { supermarketId: shufersal.id, externalName: 'מטרנה מחית פירות 12+', price: 8.90 },
    { supermarketId: ramiLevy.id, externalName: 'מטרנה מחית פירות מעורב 12+', price: 9.50 },
  ]);

  // ── טחינה ──
  await seedProduct(tehina.id, 'טחינה גולמית 500 גרם', 'האחים סלימאן', { type: 'גולמית', weight: '500 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'האחים סלימאן טחינה גולמית 500 גרם', price: 22.90 },
    { supermarketId: yochananof.id, externalName: 'טחינה סלימאן גולמית 500 גרם', price: 21.90 },
    { supermarketId: ramiLevy.id, externalName: 'האחים סלימאן טחינה 500 גרם', price: 23.90 },
  ]);
  await seedProduct(tehina.id, 'טחינה מלאה 250 גרם', 'הר ברכה', { type: 'מלאה', weight: '250 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'הר ברכה טחינה מלאה 250 גרם', price: 14.90 },
    { supermarketId: yochananof.id, externalName: 'טחינה הר ברכה מלאה 250 גרם', price: 13.90 },
    { supermarketId: ramiLevy.id, externalName: 'הר ברכה טחינה מלאה 250 גרם', price: 15.50 },
  ]);

  // ── חומוס ──
  await seedProduct(hummus.id, 'חומוס קלאסי 400 גרם', 'צבר', { type: 'קלאסי', weight: '400 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'צבר חומוס קלאסי 400 גרם', price: 9.90 },
    { supermarketId: yochananof.id, externalName: 'חומוס צבר קלאסי 400 גרם', price: 9.50 },
    { supermarketId: ramiLevy.id, externalName: 'צבר חומוס קלאסי 400 גרם', price: 10.50 },
  ]);
  await seedProduct(hummus.id, 'חומוס משואשה 400 גרם', 'צבר', { type: 'משואשה', weight: '400 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'צבר חומוס משואשה 400 גרם', price: 11.90 },
    { supermarketId: yochananof.id, externalName: 'חומוס משואשה צבר 400 גרם', price: 11.50 },
    { supermarketId: ramiLevy.id, externalName: 'צבר משואשה 400 גרם', price: 12.50 },
  ]);
  await seedProduct(hummus.id, 'חומוס עם טחינה 200 גרם', 'שטראוס', { type: 'עם טחינה', weight: '200 גרם' }, [
    { supermarketId: shufersal.id, externalName: 'שטראוס חומוס עם טחינה 200 גרם', price: 7.90 },
    { supermarketId: ramiLevy.id, externalName: 'שטראוס חומוס טחינה 200 גרם', price: 8.50 },
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
  console.log(`  - 32 קטגוריות מוצרים`);
  console.log(`  - 83 מוצרים קנוניים`);
  console.log(`  - 3 סופרמרקטים ישראליים עם מקורות נתונים`);
  console.log(`  - ~233 מוצרים בסופרמרקטים עם תמונות מחיר`);
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
