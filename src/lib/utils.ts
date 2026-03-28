import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return `₪${price.toFixed(2)}`;
}

export function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'מעולם לא';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'הרגע';
  if (diffMin < 60) return `לפני ${diffMin}ד׳`;
  if (diffHr < 24) return `לפני ${diffHr}ש׳`;
  return `לפני ${diffDay}י׳`;
}

export function buildDisplayName(
  categoryName: string,
  constraints: Record<string, unknown>
): string {
  const parts = [categoryName];
  for (const [key, value] of Object.entries(constraints)) {
    if (value && value !== 'any') {
      parts.push(String(value));
    }
  }
  return parts.join(' ');
}
