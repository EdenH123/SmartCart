import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
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
