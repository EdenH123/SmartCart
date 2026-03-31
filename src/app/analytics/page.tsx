'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart3, ArrowRight, ShoppingCart, TrendingDown, Tag, DollarSign, Loader2, AlertTriangle } from 'lucide-react';
import { getOrCreateBasket, getSpendingAnalytics } from '@/lib/actions';
import { formatPrice } from '@/lib/utils';
import type { SpendingAnalytics } from '@/types';

const CATEGORY_COLORS = [
  '#25a768', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<SpendingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const basketId = await getOrCreateBasket();
        const data = await getSpendingAnalytics(basketId);
        setAnalytics(data);
      } catch {
        setError('לא ניתן לטעון נתוני ניתוח. נסו שוב.');
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-500" />
        <p className="mt-4 text-sm text-gray-500">מנתחים הוצאות...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-amber-500" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">משהו השתבש</h2>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <Link href="/basket" className="btn-primary mt-6 inline-flex">חזרה לסל</Link>
      </div>
    );
  }

  if (!analytics || analytics.totalItems === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">אין נתונים לניתוח</h2>
        <p className="mt-2 text-sm text-gray-500">הוסיפו מוצרים לסל כדי לראות ניתוח הוצאות.</p>
        <Link href="/basket" className="btn-primary mt-6 inline-flex gap-1.5">
          <ArrowRight className="h-4 w-4" />
          חזרה לסל
        </Link>
      </div>
    );
  }

  const maxCost = Math.max(...analytics.supermarketCosts.map((s) => s.totalCost));

  // Conic gradient for category pie chart
  const conicStops: string[] = [];
  let accumulated = 0;
  analytics.categoryBreakdown.forEach((cat, idx) => {
    const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
    const start = accumulated;
    accumulated += cat.percentage;
    conicStops.push(`${color} ${start}% ${accumulated}%`);
  });
  const conicGradient = `conic-gradient(${conicStops.join(', ')})`;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/basket" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6">
        <ArrowRight className="h-4 w-4" />
        חזרה לסל
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ניתוח הוצאות</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5 animate-slide-up" style={{ animationDelay: '0ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
              <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">סה&quot;כ פריטים</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{analytics.totalItems}</p>
        </div>

        <div className="card p-5 animate-slide-up" style={{ animationDelay: '80ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/30">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">הזול ביותר</span>
          </div>
          <p className="text-3xl font-bold text-brand-700 dark:text-brand-400 tabular-nums">{formatPrice(analytics.cheapestTotal)}</p>
          <p className="text-xs text-gray-500 mt-1">{analytics.cheapestSupermarket}</p>
        </div>

        <div className="card p-5 animate-slide-up" style={{ animationDelay: '160ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
              <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">חיסכון מקסימלי</span>
          </div>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{formatPrice(analytics.potentialMaxSavings)}</p>
        </div>
      </div>

      {/* Cost by supermarket */}
      {analytics.supermarketCosts.length > 0 && (
        <div className="card p-6 mb-8 animate-slide-up" style={{ animationDelay: '240ms', animationFillMode: 'backwards' }}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">עלות לפי סופרמרקט</h2>
          <div className="space-y-4">
            {analytics.supermarketCosts.map((sm, idx) => {
              const widthPercent = maxCost > 0 ? (sm.totalCost / maxCost) * 100 : 0;
              const isCheapest = idx === 0;
              return (
                <div key={sm.supermarketName}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {sm.supermarketName}
                      {isCheapest && (
                        <span className="mr-2 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                          הזול ביותר
                        </span>
                      )}
                    </span>
                    <span className={`text-sm font-bold tabular-nums ${isCheapest ? 'text-brand-700 dark:text-brand-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {formatPrice(sm.totalCost)}
                    </span>
                  </div>
                  <div className="h-6 w-full rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-lg transition-all duration-700 ${
                        isCheapest
                          ? 'bg-gradient-to-l from-brand-500 to-brand-600'
                          : 'bg-gradient-to-l from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500'
                      }`}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {analytics.categoryBreakdown.length > 0 && (
        <div className="card p-6 mb-8 animate-slide-up" style={{ animationDelay: '320ms', animationFillMode: 'backwards' }}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">התפלגות לפי קטגוריה</h2>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div
              className="w-48 h-48 rounded-full shrink-0 shadow-sm"
              style={{ background: conicGradient }}
              role="img"
              aria-label="תרשים התפלגות הוצאות לפי קטגוריה"
            />
            <div className="flex-1 space-y-3 w-full">
              {analytics.categoryBreakdown.map((cat, idx) => (
                <div key={cat.categoryName} className="flex items-center gap-3">
                  <div
                    className="w-3.5 h-3.5 rounded-sm shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                  />
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{cat.categoryName}</span>
                    <div className="flex items-center gap-2 shrink-0 mr-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums">
                        {formatPrice(cat.amount)}
                      </span>
                      <span className="text-xs text-gray-400 tabular-nums w-12 text-left">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Savings opportunities */}
      {analytics.savingsOpportunities.length > 0 && (
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
            <Tag className="h-5 w-5 text-amber-500" />
            הזדמנויות חיסכון
          </h2>
          <div className="space-y-3">
            {analytics.savingsOpportunities.map((item) => (
              <div
                key={item.productName}
                className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.productName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatPrice(item.minPrice)} — {formatPrice(item.maxPrice)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/30 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400 shrink-0">
                  <TrendingDown className="h-3 w-3" />
                  חיסכון {formatPrice(item.savings)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
