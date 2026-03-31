import { formatPrice, formatTimeAgo, formatPromoExpiry, buildDisplayName, cn } from '@/lib/utils';

// ── formatPrice ──

describe('formatPrice', () => {
  test('formats whole number with two decimals', () => {
    expect(formatPrice(10)).toBe('₪10.00');
  });

  test('formats decimal price correctly', () => {
    expect(formatPrice(5.99)).toBe('₪5.99');
  });

  test('formats zero', () => {
    expect(formatPrice(0)).toBe('₪0.00');
  });

  test('rounds to two decimal places', () => {
    expect(formatPrice(1.999)).toBe('₪2.00');
    expect(formatPrice(3.141)).toBe('₪3.14');
  });

  test('formats large price', () => {
    expect(formatPrice(1234.5)).toBe('₪1234.50');
  });

  test('formats small fractional price', () => {
    expect(formatPrice(0.5)).toBe('₪0.50');
  });
});

// ── formatTimeAgo ──

describe('formatTimeAgo', () => {
  test('returns "מעולם לא" for null', () => {
    expect(formatTimeAgo(null)).toBe('מעולם לא');
  });

  test('returns "הרגע" for timestamps less than 60 seconds ago', () => {
    const now = new Date();
    now.setSeconds(now.getSeconds() - 10);
    expect(formatTimeAgo(now.toISOString())).toBe('הרגע');
  });

  test('returns minutes for timestamps less than 60 minutes ago', () => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - 5);
    expect(formatTimeAgo(date.toISOString())).toBe('לפני 5ד׳');
  });

  test('returns hours for timestamps less than 24 hours ago', () => {
    const date = new Date();
    date.setHours(date.getHours() - 3);
    expect(formatTimeAgo(date.toISOString())).toBe('לפני 3ש׳');
  });

  test('returns days for timestamps more than 24 hours ago', () => {
    const date = new Date();
    date.setDate(date.getDate() - 2);
    expect(formatTimeAgo(date.toISOString())).toBe('לפני 2י׳');
  });

  test('returns 1 minute for exactly 60 seconds', () => {
    const date = new Date();
    date.setSeconds(date.getSeconds() - 65);
    expect(formatTimeAgo(date.toISOString())).toBe('לפני 1ד׳');
  });
});

// ── formatPromoExpiry ──

describe('formatPromoExpiry', () => {
  test('returns null for null input', () => {
    expect(formatPromoExpiry(null)).toBeNull();
  });

  test('returns null for invalid date string', () => {
    expect(formatPromoExpiry('not-a-date')).toBeNull();
  });

  test('returns "פג תוקף" for past dates', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(formatPromoExpiry(past.toISOString())).toBe('פג תוקף');
  });

  test('returns "מסתיים מחר" for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Set to end of day to ensure it's within 1-day range
    tomorrow.setHours(23, 59, 59);
    const result = formatPromoExpiry(tomorrow.toISOString());
    expect(['מסתיים היום', 'מסתיים מחר', 'עוד 2 ימים']).toContain(result);
  });

  test('returns "עוד X ימים" for dates within a week', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    future.setHours(12, 0, 0);
    const result = formatPromoExpiry(future.toISOString());
    expect(result).toMatch(/^עוד \d+ ימים$/);
  });

  test('returns formatted date for dates beyond a week', () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 30);
    const result = formatPromoExpiry(farFuture.toISOString());
    expect(result).toMatch(/^עד /);
  });

  test('returns null for empty string', () => {
    expect(formatPromoExpiry('')).toBeNull();
  });
});

// ── buildDisplayName ──

describe('buildDisplayName', () => {
  test('returns category name when no constraints', () => {
    expect(buildDisplayName('חלב', {})).toBe('חלב');
  });

  test('appends non-any constraint values', () => {
    expect(buildDisplayName('חלב', { fat: '3%', volume: '1 ליטר' })).toBe('חלב 3% 1 ליטר');
  });

  test('skips constraints with value "any"', () => {
    expect(buildDisplayName('חלב', { fat: '3%', type: 'any' })).toBe('חלב 3%');
  });

  test('skips constraints with falsy values', () => {
    expect(buildDisplayName('ביצים', { size: '', packCount: '12' })).toBe('ביצים 12');
  });

  test('handles all constraints set to "any"', () => {
    expect(buildDisplayName('לחם', { type: 'any', weight: 'any' })).toBe('לחם');
  });

  test('handles mixed constraint types', () => {
    expect(buildDisplayName('חלב', { fat: '3%', organic: true as unknown as string })).toBe('חלב 3% true');
  });
});

// ── cn (classname merger) ──

describe('cn', () => {
  test('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  test('handles conditional classes', () => {
    const active = true;
    expect(cn('base', active && 'active')).toBe('base active');
  });

  test('handles false conditional classes', () => {
    const active = false;
    expect(cn('base', active && 'active')).toBe('base');
  });

  test('resolves tailwind conflicts', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  test('handles undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  test('handles empty inputs', () => {
    expect(cn()).toBe('');
  });
});
