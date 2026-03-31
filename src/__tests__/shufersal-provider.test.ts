import {
  parseXmlItems,
  matchCategory,
  cleanProductName,
  normalizeBrand,
  buildCanonicalName,
  parsePromoXml,
  isPromoActive,
  buildPromoDescription,
  ShufersalItem,
  Promotion,
} from '@/lib/ingestion/shufersal-provider';

describe('parseXmlItems', () => {
  it('parses a single XML item', () => {
    const xml = `
      <root>
        <Items>
          <Item>
            <ItemCode>7290000001</ItemCode>
            <ItemName>חלב תנובה 3% 1 ליטר</ItemName>
            <ItemPrice>6.90</ItemPrice>
            <ManufacturerName>תנובה</ManufacturerName>
            <PriceUpdateDate>2026-03-30</PriceUpdateDate>
            <UnitOfMeasure>ליטר</UnitOfMeasure>
            <Quantity>1</Quantity>
          </Item>
        </Items>
      </root>`;

    const items = parseXmlItems(xml);
    expect(items).toHaveLength(1);
    expect(items[0].ItemCode).toBe('7290000001');
    expect(items[0].ItemName).toBe('חלב תנובה 3% 1 ליטר');
    expect(items[0].ItemPrice).toBe('6.90');
    expect(items[0].ManufacturerName).toBe('תנובה');
  });

  it('parses multiple items', () => {
    const xml = `
      <root>
        <Items>
          <Item>
            <ItemCode>001</ItemCode>
            <ItemName>Product A</ItemName>
            <ItemPrice>5.00</ItemPrice>
            <ManufacturerName>Brand A</ManufacturerName>
            <PriceUpdateDate>2026-03-30</PriceUpdateDate>
          </Item>
          <Item>
            <ItemCode>002</ItemCode>
            <ItemName>Product B</ItemName>
            <ItemPrice>10.00</ItemPrice>
            <ManufacturerName>Brand B</ManufacturerName>
            <PriceUpdateDate>2026-03-30</PriceUpdateDate>
          </Item>
        </Items>
      </root>`;

    const items = parseXmlItems(xml);
    expect(items).toHaveLength(2);
    expect(items[0].ItemCode).toBe('001');
    expect(items[1].ItemCode).toBe('002');
  });

  it('returns empty array for no items', () => {
    const xml = '<root><Items></Items></root>';
    expect(parseXmlItems(xml)).toHaveLength(0);
  });

  it('handles missing fields gracefully', () => {
    const xml = `
      <root>
        <Items>
          <Item>
            <ItemCode>001</ItemCode>
            <ItemName>Test</ItemName>
          </Item>
        </Items>
      </root>`;

    const items = parseXmlItems(xml);
    expect(items).toHaveLength(1);
    expect(items[0].ItemCode).toBe('001');
    expect(items[0].ItemPrice).toBe('');
  });
});

describe('matchCategory', () => {
  const makeItem = (name: string): ShufersalItem => ({
    ItemCode: '001',
    ItemName: name,
    ItemPrice: '5.00',
    ManufacturerName: 'Test',
    PriceUpdateDate: '2026-03-30',
    UnitOfMeasure: '',
    Quantity: '1',
    UnitOfMeasurePrice: '',
    AllowDiscount: '',
    ItemStatus: '',
    bIsWeighted: '',
  });

  it('matches milk products', () => {
    const result = matchCategory(makeItem('חלב תנובה 3% 1 ליטר'));
    expect(result).not.toBeNull();
    expect(result!.categorySlug).toBe('milk');
  });

  it('matches eggs', () => {
    const result = matchCategory(makeItem('ביצים חופש L גודל 12 יח'));
    expect(result).not.toBeNull();
    expect(result!.categorySlug).toBe('eggs');
  });

  it('matches bread', () => {
    const result = matchCategory(makeItem('לחם לבן אנג\'ל 750 גרם'));
    expect(result).not.toBeNull();
    expect(result!.categorySlug).toBe('bread');
  });

  it('matches chicken breast', () => {
    const result = matchCategory(makeItem('חזה עוף טרי 1 ק"ג'));
    expect(result).not.toBeNull();
    expect(result!.categorySlug).toBe('chicken-breast');
  });

  it('matches cottage cheese', () => {
    const result = matchCategory(makeItem('קוטג\' תנובה 5% 250 גרם'));
    expect(result).not.toBeNull();
    expect(result!.categorySlug).toBe('cottage-cheese');
  });

  it('matches rice', () => {
    const result = matchCategory(makeItem('אורז לבן סוגת 1 ק"ג'));
    expect(result).not.toBeNull();
    expect(result!.categorySlug).toBe('rice');
  });

  it('matches pasta', () => {
    const result = matchCategory(makeItem('פסטה ספגטי אוסם 500 גרם'));
    expect(result).not.toBeNull();
    expect(result!.categorySlug).toBe('pasta');
  });

  it('matches sugar', () => {
    const result = matchCategory(makeItem('סוכר לבן 1 ק"ג'));
    expect(result).not.toBeNull();
    expect(result!.categorySlug).toBe('sugar');
  });

  it('matches oil', () => {
    const result = matchCategory(makeItem('שמן זית כתית מעולה 750 מ"ל'));
    expect(result).not.toBeNull();
    expect(result!.categorySlug).toBe('oil');
  });

  it('excludes chocolate milk from milk category', () => {
    const result = matchCategory(makeItem('שוקולד חלב במילוי קרם'));
    // Should not match as milk
    if (result) {
      expect(result.categorySlug).not.toBe('milk');
    }
  });

  it('falls back to general category for unmatched items', () => {
    const result = matchCategory(makeItem('מגבות נייר סנו'));
    expect(result).not.toBeNull();
    expect(result!.categorySlug).toBe('general');
  });
});

describe('cleanProductName', () => {
  it('removes multiple spaces', () => {
    expect(cleanProductName('חלב   תנובה   3%')).toBe('חלב תנובה 3%');
  });

  it('trims whitespace', () => {
    expect(cleanProductName('  חלב תנובה  ')).toBe('חלב תנובה');
  });

  it('cleans product names consistently', () => {
    const result = cleanProductName('חלב  תנובה  3%  1  ליטר');
    expect(result).toBe('חלב תנובה 3% 1 ליטר');
  });

  it('handles empty string', () => {
    expect(cleanProductName('')).toBe('');
  });

  it('preserves Hebrew text', () => {
    expect(cleanProductName('חלב תנובה 3% 1 ליטר')).toBe('חלב תנובה 3% 1 ליטר');
  });
});

describe('normalizeBrand', () => {
  it('normalizes תנובה', () => {
    const result = normalizeBrand('תנובה', 'חלב תנובה');
    expect(result).toBe('תנובה');
  });

  it('normalizes שטראוס', () => {
    const result = normalizeBrand('שטראוס', 'שוקולד שטראוס');
    expect(result).toBe('שטראוס');
  });

  it('normalizes אסם to אוסם', () => {
    const result = normalizeBrand('אסם', 'פסטה אסם');
    expect(result).toBe('אוסם');
  });

  it('returns null for empty manufacturer', () => {
    const result = normalizeBrand('', 'some product');
    expect(result).toBeNull();
  });

  it('handles unknown manufacturer', () => {
    const result = normalizeBrand('חברה לא מוכרת', 'מוצר כלשהו');
    expect(result).toBe('חברה לא מוכרת');
  });
});

describe('buildCanonicalName', () => {
  it('builds name for milk', () => {
    const name = buildCanonicalName('milk', { type: 'רגיל', fat: '3%', volume: '1 ליטר' }, 'תנובה');
    expect(name).toContain('חלב');
    expect(name).toContain('תנובה');
  });

  it('builds name for eggs', () => {
    const name = buildCanonicalName('eggs', { size: 'L', packCount: '12' }, null);
    expect(name).toContain('ביצים');
  });

  it('builds name for unknown category', () => {
    const name = buildCanonicalName('unknown-category', { weight: '1 ק"ג' }, 'brand');
    expect(name).toBeTruthy();
  });

  it('includes brand when provided', () => {
    const name = buildCanonicalName('rice', { type: 'לבן', weight: '1 ק"ג' }, 'סוגת');
    expect(name).toContain('סוגת');
  });

  it('works without brand', () => {
    const name = buildCanonicalName('bread', { type: 'לבן', weight: '750 גרם' }, null);
    expect(name).toContain('לחם');
    expect(name).not.toContain('null');
  });
});

describe('parsePromoXml', () => {
  it('parses a single promotion with items', () => {
    const xml = `
      <root>
        <Promotions>
          <Promotion>
            <PromotionId>1001</PromotionId>
            <PromotionDescription>2 ב-10 ש"ח</PromotionDescription>
            <PromotionStartDate>2026-03-01 00:00</PromotionStartDate>
            <PromotionEndDate>2026-04-30 23:59</PromotionEndDate>
            <DiscountType>1</DiscountType>
            <DiscountRate>10</DiscountRate>
            <MinQty>2</MinQty>
            <MaxQty>0</MaxQty>
            <RewardType>1</RewardType>
            <PromotionItems>
              <Item>
                <ItemCode>7290000001</ItemCode>
                <ItemType>1</ItemType>
                <IsGiftItem>0</IsGiftItem>
              </Item>
              <Item>
                <ItemCode>7290000002</ItemCode>
                <ItemType>1</ItemType>
                <IsGiftItem>0</IsGiftItem>
              </Item>
            </PromotionItems>
          </Promotion>
        </Promotions>
      </root>`;

    const promos = parsePromoXml(xml);
    expect(promos).toHaveLength(1);
    expect(promos[0].PromotionId).toBe('1001');
    expect(promos[0].PromotionDescription).toBe('2 ב-10 ש"ח');
    expect(promos[0].items).toHaveLength(2);
    expect(promos[0].items[0].ItemCode).toBe('7290000001');
    expect(promos[0].items[1].ItemCode).toBe('7290000002');
  });

  it('parses multiple promotions', () => {
    const xml = `
      <root>
        <Promotions>
          <Promotion>
            <PromotionId>1</PromotionId>
            <PromotionDescription>מבצע א</PromotionDescription>
            <PromotionStartDate>2026-03-01</PromotionStartDate>
            <PromotionEndDate>2026-04-01</PromotionEndDate>
            <DiscountType>1</DiscountType>
            <DiscountRate>0</DiscountRate>
            <MinQty>1</MinQty>
            <MaxQty>0</MaxQty>
            <RewardType>1</RewardType>
            <PromotionItems>
              <Item><ItemCode>001</ItemCode><ItemType>1</ItemType><IsGiftItem>0</IsGiftItem></Item>
            </PromotionItems>
          </Promotion>
          <Promotion>
            <PromotionId>2</PromotionId>
            <PromotionDescription>מבצע ב</PromotionDescription>
            <PromotionStartDate>2026-03-01</PromotionStartDate>
            <PromotionEndDate>2026-04-01</PromotionEndDate>
            <DiscountType>2</DiscountType>
            <DiscountRate>5</DiscountRate>
            <MinQty>1</MinQty>
            <MaxQty>0</MaxQty>
            <RewardType>1</RewardType>
            <PromotionItems>
              <Item><ItemCode>002</ItemCode><ItemType>1</ItemType><IsGiftItem>0</IsGiftItem></Item>
            </PromotionItems>
          </Promotion>
        </Promotions>
      </root>`;

    const promos = parsePromoXml(xml);
    expect(promos).toHaveLength(2);
    expect(promos[0].PromotionId).toBe('1');
    expect(promos[1].PromotionId).toBe('2');
  });

  it('returns empty array for no promotions', () => {
    const xml = '<root><Promotions></Promotions></root>';
    expect(parsePromoXml(xml)).toHaveLength(0);
  });

  it('handles promotion with no items', () => {
    const xml = `
      <root>
        <Promotions>
          <Promotion>
            <PromotionId>1</PromotionId>
            <PromotionDescription>Empty promo</PromotionDescription>
            <PromotionStartDate>2026-03-01</PromotionStartDate>
            <PromotionEndDate>2026-04-01</PromotionEndDate>
            <DiscountType>1</DiscountType>
            <DiscountRate>0</DiscountRate>
            <MinQty>1</MinQty>
            <MaxQty>0</MaxQty>
            <RewardType>1</RewardType>
          </Promotion>
        </Promotions>
      </root>`;

    const promos = parsePromoXml(xml);
    expect(promos).toHaveLength(1);
    expect(promos[0].items).toHaveLength(0);
  });
});

describe('isPromoActive', () => {
  const makePromo = (start: string, end: string): Promotion => ({
    PromotionId: '1',
    PromotionDescription: 'Test',
    PromotionStartDate: start,
    PromotionEndDate: end,
    DiscountType: '1',
    DiscountRate: '10',
    MinQty: '1',
    MaxQty: '0',
    RewardType: '1',
    items: [],
  });

  it('returns true for active promotion', () => {
    expect(isPromoActive(makePromo('2026-01-01', '2026-12-31'), new Date('2026-06-15'))).toBe(true);
  });

  it('returns false for expired promotion', () => {
    expect(isPromoActive(makePromo('2025-01-01', '2025-12-31'), new Date('2026-06-15'))).toBe(false);
  });

  it('returns false for future promotion', () => {
    expect(isPromoActive(makePromo('2027-01-01', '2027-12-31'), new Date('2026-06-15'))).toBe(false);
  });

  it('returns true on exact start date', () => {
    expect(isPromoActive(makePromo('2026-06-15', '2026-07-15'), new Date('2026-06-15'))).toBe(true);
  });

  it('returns true on exact end date', () => {
    expect(isPromoActive(makePromo('2026-05-15', '2026-06-15'), new Date('2026-06-15'))).toBe(true);
  });

  it('returns false for invalid dates', () => {
    expect(isPromoActive(makePromo('not-a-date', 'also-not'), new Date())).toBe(false);
  });
});

describe('buildPromoDescription', () => {
  const makePromo = (desc: string, discountType: string, rate: string, minQty: string): Promotion => ({
    PromotionId: '1',
    PromotionDescription: desc,
    PromotionStartDate: '2026-01-01',
    PromotionEndDate: '2026-12-31',
    DiscountType: discountType,
    DiscountRate: rate,
    MinQty: minQty,
    MaxQty: '0',
    RewardType: '1',
    items: [],
  });

  it('uses description when available', () => {
    expect(buildPromoDescription(makePromo('2 ב-10 ש"ח', '1', '10', '2'))).toBe('2 ב-10 ש"ח');
  });

  it('builds percentage description', () => {
    expect(buildPromoDescription(makePromo('', '1', '15', '1'))).toBe('15% הנחה');
  });

  it('builds fixed amount description', () => {
    expect(buildPromoDescription(makePromo('', '2', '5', '1'))).toBe('₪5 הנחה');
  });

  it('builds multi-quantity description', () => {
    expect(buildPromoDescription(makePromo('', '3', '20', '3'))).toBe('3 יח׳ ב-₪20');
  });

  it('falls back to generic description', () => {
    expect(buildPromoDescription(makePromo('', '1', '0', '1'))).toBe('מבצע');
  });
});
