'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const isBasket = pathname.startsWith('/basket') || pathname.startsWith('/compare') || pathname.startsWith('/optimize');

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <span className="text-sm font-bold text-white">ס</span>
            </div>
            <span className="text-lg font-bold text-gray-900">סל חכם</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/basket"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isBasket
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              הסל שלי
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
