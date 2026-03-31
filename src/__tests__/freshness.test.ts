import { isStale } from '@/lib/utils';

describe('isStale', () => {
  test('returns true for null input', () => {
    expect(isStale(null)).toBe(true);
  });

  test('returns false for a date 1 hour ago (within 24h threshold)', () => {
    const date = new Date();
    date.setHours(date.getHours() - 1);
    expect(isStale(date.toISOString())).toBe(false);
  });

  test('returns true for a date 25 hours ago (exceeds 24h threshold)', () => {
    const date = new Date();
    date.setHours(date.getHours() - 25);
    expect(isStale(date.toISOString())).toBe(true);
  });

  test('respects custom threshold', () => {
    const date = new Date();
    date.setHours(date.getHours() - 3);
    // 3 hours ago should be stale with a 2h threshold
    expect(isStale(date.toISOString(), 2)).toBe(true);
    // 3 hours ago should not be stale with a 6h threshold
    expect(isStale(date.toISOString(), 6)).toBe(false);
  });

  test('returns true for invalid date string', () => {
    expect(isStale('not-a-real-date')).toBe(true);
    expect(isStale('abc123')).toBe(true);
  });
});
