import {
  parseXmlItems,
  matchCategory,
  cleanProductName,
  normalizeBrand,
  buildCanonicalName,
  ShufersalItem,
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

  it('returns null for unmatched items', () => {
    const result = matchCategory(makeItem('מגבות נייר סנו'));
    expect(result).toBeNull();
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
