'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Sparkles, Grid3X3, BarChart3, Home } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isBasket = pathname.startsWith('/basket') || pathname.startsWith('/compare') || pathname.startsWith('/optimize');
  const isCategories = pathname.startsWith('/categories');
  const isAnalytics = pathname.startsWith('/analytics');

  const navLinkClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200/50 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-500/30'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
    }`;

  const bottomNavLinkClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[44px] text-[10px] font-medium transition-colors duration-200 ${
      active
        ? 'text-brand-600 dark:text-brand-400'
        : 'text-gray-400 dark:text-gray-500'
    }`;

  return (
    <>
      {/* Top header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-lg dark:bg-gray-900/80 dark:border-gray-800">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm transition-transform duration-200 group-hover:scale-105">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                סל <span className="text-brand-600">חכם</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              <LanguageToggle />
              <ThemeToggle />
              {/* Hide nav links on mobile -- bottom nav handles them */}
              <Link href="/categories" aria-current={isCategories ? 'page' : undefined} className={`hidden sm:inline-flex ${navLinkClass(isCategories)}`}>
                <Grid3X3 className="h-4 w-4" />
                <span>קטגוריות</span>
              </Link>
              <Link href="/analytics" aria-current={isAnalytics ? 'page' : undefined} className={`hidden sm:inline-flex ${navLinkClass(isAnalytics)}`}>
                <BarChart3 className="h-4 w-4" />
                <span>ניתוח</span>
              </Link>
              <Link href="/basket" aria-current={isBasket ? 'page' : undefined} className={`hidden sm:inline-flex ${navLinkClass(isBasket)}`}>
                <ShoppingCart className="h-4 w-4" />
                הסל שלי
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation bar -- visible only on screens < sm (640px) */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-200/60 bg-white/95 backdrop-blur-lg sm:hidden dark:bg-gray-900/95 dark:border-gray-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around px-2 py-1">
          <Link href="/" aria-current={isHome ? 'page' : undefined} className={bottomNavLinkClass(isHome)}>
            <Home className="h-5 w-5" />
            <span>בית</span>
          </Link>
          <Link href="/categories" aria-current={isCategories ? 'page' : undefined} className={bottomNavLinkClass(isCategories)}>
            <Grid3X3 className="h-5 w-5" />
            <span>קטגוריות</span>
          </Link>
          <Link href="/basket" aria-current={isBasket ? 'page' : undefined} className={bottomNavLinkClass(isBasket)}>
            <ShoppingCart className="h-5 w-5" />
            <span>הסל שלי</span>
          </Link>
          <Link href="/analytics" aria-current={isAnalytics ? 'page' : undefined} className={bottomNavLinkClass(isAnalytics)}>
            <BarChart3 className="h-5 w-5" />
            <span>ניתוח</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
