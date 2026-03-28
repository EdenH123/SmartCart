import { normalizeText, scoreMatch, passesConstraints } from '@/lib/products/matching';

describe('normalizeText', () => {
  test('lowercases text', () => {
    expect(normalizeText('Hello World')).toBe('hello world');
  });

  test('removes punctuation', () => {
    expect(normalizeText("DairyBest's 3% Milk (1L)")).toBe('dairybests 3 milk 1l');
  });

  test('collapses whitespace', () => {
    expect(normalizeText('  multiple   spaces  ')).toBe('multiple spaces');
  });

  test('handles empty string', () => {
    expect(normalizeText('')).toBe('');
  });
});

describe('scoreMatch', () => {
  test('scores perfect attribute match', () => {
    const candidate = { metadata: { fat: '3%', type: 'Regular' }, brand: 'TestBrand', price: 1.99 };
    const constraints = { fat: '3%', type: 'Regular' };

    const score = scoreMatch(candidate, constraints);

    expect(score.attributeMatches).toBe(2);
    expect(score.attributeTotal).toBe(2);
    // 2 matches * 10 + 20 bonus = 40
    expect(score.total).toBe(40);
  });

  test('scores partial attribute match', () => {
    const candidate = { metadata: { fat: '3%', type: 'Organic' }, brand: null, price: 2.99 };
    const constraints = { fat: '3%', type: 'Regular' };

    const score = scoreMatch(candidate, constraints);

    expect(score.attributeMatches).toBe(1);
    expect(score.attributeTotal).toBe(2);
    // 1 match * 10 = 10 (no full-match bonus)
    expect(score.total).toBe(10);
  });

  test('ignores "any" constraints in scoring', () => {
    const candidate = { metadata: { fat: '3%', type: 'Regular' }, brand: null, price: 1.99 };
    const constraints = { fat: '3%', type: 'any' };

    const score = scoreMatch(candidate, constraints);

    expect(score.attributeTotal).toBe(1); // only fat counted
    expect(score.attributeMatches).toBe(1);
    // 1 * 10 + 20 bonus (all non-any matched) = 30
    expect(score.total).toBe(30);
  });

  test('adds brand match bonus', () => {
    const candidate = { metadata: { fat: '3%' }, brand: 'DairyBest', price: 1.99 };
    const constraints = { fat: '3%' };

    const score = scoreMatch(candidate, constraints, 'DairyBest');

    expect(score.brandMatch).toBe(true);
    // 1 * 10 + 20 bonus + 5 brand = 35
    expect(score.total).toBe(35);
  });

  test('brand matching is case-insensitive', () => {
    const candidate = { metadata: {}, brand: 'DairyBest', price: 1.99 };
    const score = scoreMatch(candidate, {}, 'dairybest');
    expect(score.brandMatch).toBe(true);
  });

  test('no brand match when brand is "any"', () => {
    const candidate = { metadata: {}, brand: 'DairyBest', price: 1.99 };
    const score = scoreMatch(candidate, {}, 'any');
    expect(score.brandMatch).toBe(false);
  });

  test('scores zero for no matching attributes', () => {
    const candidate = { metadata: { fat: '1%' }, brand: null, price: 1.99 };
    const constraints = { fat: '3%' };

    const score = scoreMatch(candidate, constraints);

    expect(score.attributeMatches).toBe(0);
    expect(score.total).toBe(0);
  });
});

describe('passesConstraints', () => {
  test('passes when all constraints match', () => {
    const metadata = { fat: '3%', type: 'Regular', volume: '1L' };
    const constraints = { fat: '3%', type: 'Regular' };

    expect(passesConstraints(metadata, constraints)).toBe(true);
  });

  test('fails when a constraint does not match', () => {
    const metadata = { fat: '1%', type: 'Regular' };
    const constraints = { fat: '3%' };

    expect(passesConstraints(metadata, constraints)).toBe(false);
  });

  test('ignores "any" constraints', () => {
    const metadata = { fat: '1%', type: 'Regular' };
    const constraints = { fat: 'any', type: 'Regular' };

    expect(passesConstraints(metadata, constraints)).toBe(true);
  });

  test('ignores null constraints', () => {
    const metadata = { fat: '3%' };
    const constraints = { fat: '3%', type: null };

    expect(passesConstraints(metadata, constraints)).toBe(true);
  });

  test('fails when metadata key is missing', () => {
    const metadata = { fat: '3%' };
    const constraints = { fat: '3%', type: 'Regular' };

    expect(passesConstraints(metadata, constraints)).toBe(false);
  });

  test('comparison is case-insensitive', () => {
    const metadata = { type: 'Regular' };
    const constraints = { type: 'regular' };

    expect(passesConstraints(metadata, constraints)).toBe(true);
  });

  test('passes with empty constraints', () => {
    const metadata = { fat: '3%' };
    expect(passesConstraints(metadata, {})).toBe(true);
  });
});
