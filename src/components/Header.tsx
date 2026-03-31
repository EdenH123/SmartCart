'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Sparkles } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const isBasket = pathname.startsWith('/basket') || pathname.startsWith('/compare') || pathname.startsWith('/optimize');

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">
              סל <span className="text-brand-600">חכם</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/basket"
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                isBasket
                  ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200/50'
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
