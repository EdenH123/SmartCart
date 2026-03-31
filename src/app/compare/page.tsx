'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, AlertTriangle, ArrowRight, RefreshCw, TrendingDown, Clock, Info, LayoutGrid, TableProperties } from 'lucide-react';
import { compareBasketAction } from '@/lib/actions';
import { formatPrice, formatTimeAgo } from '@/lib/utils';
import type { ComparisonResult, SupermarketComparison } from '@/types';

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareSkeleton />}>
      <ComparePageInner />
    </Suspense>
  );
}

function CompareSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-4 w-20 rounded-lg bg-gray-200 mb-6" />
      <div className="h-7 w-40 rounded-lg bg-gray-200" />
      <div className="mt-4 h-16 w-full rounded-2xl bg-gray-100" />
      <div className="mt-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-200" />
                <div className="h-5 w-32 rounded-lg bg-gray-200" />
              </div>
              <div className="h-8 w-20 rounded-lg bg-gray-200" />
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-5 w-20 rounded-full bg-gray-200" />
              <div className="h-5 w-24 rounded-full bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type ViewMode = 'cards' | 'table';

function ComparePageInner() {
  const searchParams = useSearchParams();
  const basketId = searchParams.get('basketId');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  useEffect(() => {
    async function run() {
      if (!basketId) {
        setError('No basket specified');
        setLoading(false);
        return;
      }
      try {
        const comparison = await compareBasketAction(basketId);
        setResult(comparison);
      } catch {
        setError('Failed to compare prices. Please try again.');
      }
      setLoading(false);
    }
    run();
  }, [basketId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
            <RefreshCw className="h-6 w-6 text-brand-500 animate-spin" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">משווים מחירים...</p>
          <div className="mx-auto mt-2 h-4 w-64 rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
          <AlertTriangle className="h-7 w-7 text-amber-500" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">משהו השתבש</h2>
        <p className="mt-2 text-sm text-gray-500">{error ?? 'Unknown error'}</p>
        <Link href="/basket" className="btn-primary mt-6 inline-flex">
          חזרה לסל
        </Link>
      </div>
    );
  }

  if (result.comparisons.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="text-lg font-semibold text-gray-900">אין תוצאות</h2>
        <p className="mt-2 text-sm text-gray-500">ייתכן שהסל שלכם ריק.</p>
        <Link href="/basket" className="btn-primary mt-6 inline-flex">
          חזרה לסל
        </Link>
      </div>
    );
  }

  const savings = result.worstTotal - result.bestTotal;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/basket" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6">
        <ArrowRight className="h-4 w-4" />
        חזרה לסל
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">השוואת מחירים</h1>
        <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
              viewMode === 'cards'
                ? 'bg-brand-50 text-brand-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            aria-label="תצוגת כרטיסים"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">כרטיסים</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
              viewMode === 'table'
                ? 'bg-brand-50 text-brand-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            aria-label="תצוגת טבלה"
          >
            <TableProperties className="h-4 w-4" />
            <span className="hidden sm:inline">טבלה</span>
          </button>
        </div>
      </div>

      {/* Savings banner */}
      {savings > 0 ? (
        <div className="savings-banner-positive mt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <TrendingDown className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800">
                חסכו {formatPrice(savings)} ב-{result.comparisons[0].supermarketName}
              </p>
              <p className="text-sm text-green-700">
                לעומת {result.comparisons[result.comparisons.length - 1].supermarketName}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="savings-banner-neutral mt-4">
          <p className="text-sm text-gray-600 font-medium">מדורג לפי זמינות ואז לפי מחיר כולל.</p>
        </div>
      )}

      {/* Freshness disclaimer */}
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>המחירים מתעדכנים מעת לעת ועשויים לא לשקף מחירים בזמן אמת.</span>
      </div>

      {/* Supermarket cards */}
      {viewMode === 'cards' && (
        <div className="mt-6 space-y-4">
          {result.comparisons.map((comp, index) => (
            <SupermarketCard
              key={comp.supermarketId}
              comparison={comp}
              rank={index + 1}
              isBest={comp.supermarketId === result.bestSupermarketId}
              basketId={basketId!}
            />
          ))}
        </div>
      )}

      {/* Comparison table */}
      {viewMode === 'table' && (
        <ComparisonTable result={result} />
      )}
    </div>
  );
}

function ComparisonTable({ result }: { result: ComparisonResult }) {
  const sortedComparisons = [...result.comparisons].sort((a, b) => a.total - b.total);

  const firstComp = result.comparisons[0];
  const basketItems = firstComp.itemResults.map((item) => ({
    basketItemId: item.basketItemId,
    displayName: item.requestedDisplayName,
    quantity: item.quantity,
  }));

  const priceMap = new Map<string, Map<string, { totalPrice: number | null; resolutionType: string }>>();
  for (const item of basketItems) {
    const supermarketPrices = new Map<string, { totalPrice: number | null; resolutionType: string }>();
    for (const comp of sortedComparisons) {
      const match = comp.itemResults.find((r) => r.basketItemId === item.basketItemId);
      supermarketPrices.set(comp.supermarketId, {
        totalPrice: match?.totalPrice ?? null,
        resolutionType: match?.resolutionType ?? 'unavailable',
      });
    }
    priceMap.set(item.basketItemId, supermarketPrices);
  }

  const minMaxPerItem = new Map<string, { min: number; max: number }>();
  for (const item of basketItems) {
    const prices = sortedComparisons
      .map((comp) => priceMap.get(item.basketItemId)?.get(comp.supermarketId)?.totalPrice)
      .filter((p): p is number => p != null);
    if (prices.length > 0) {
      minMaxPerItem.set(item.basketItemId, { min: Math.min(...prices), max: Math.max(...prices) });
    }
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 shadow-card scrollbar-thin" dir="rtl">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="sticky right-0 z-10 bg-gray-50 px-4 py-3 text-right font-semibold text-gray-700 min-w-[140px]">
              מוצר
            </th>
            {sortedComparisons.map((comp, idx) => (
              <th key={comp.supermarketId} className="px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">
                <div className="flex flex-col items-center gap-0.5">
                  <span>{comp.supermarketName}</span>
                  {idx === 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-brand-600">
                      <Trophy className="h-3 w-3" />
                      זול ביותר
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {basketItems.map((item, rowIdx) => {
            const minMax = minMaxPerItem.get(item.basketItemId);
            return (
              <tr key={item.basketItemId} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="sticky right-0 z-10 px-4 py-2.5 font-medium text-gray-900 min-w-[140px]" style={{ backgroundColor: rowIdx % 2 === 0 ? 'white' : 'rgb(249 250 251 / 0.5)' }}>
                  <div className="truncate max-w-[180px]">{item.displayName}</div>
                  {item.quantity > 1 && (
                    <span className="text-xs text-gray-400">x{item.quantity}</span>
                  )}
                </td>
                {sortedComparisons.map((comp) => {
                  const info = priceMap.get(item.basketItemId)?.get(comp.supermarketId);
                  const price = info?.totalPrice;
                  const isUnavailable = info?.resolutionType === 'unavailable';

                  let cellColor = '';
                  if (price != null && minMax && minMax.min !== minMax.max) {
                    if (price === minMax.min) cellColor = 'text-green-700 bg-green-50/80';
                    else if (price === minMax.max) cellColor = 'text-red-700 bg-red-50/80';
                  }

                  return (
                    <td key={comp.supermarketId} className={`px-4 py-2.5 text-center whitespace-nowrap transition-colors ${cellColor}`}>
                      {isUnavailable ? (
                        <span className="text-xs text-gray-400">--</span>
                      ) : price != null ? (
                        <span className="font-medium tabular-nums">{formatPrice(price)}</span>
                      ) : (
                        <span className="text-xs text-gray-400">--</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
            <td className="sticky right-0 z-10 bg-gray-50 px-4 py-3 text-right text-gray-900">
              סה&quot;כ
            </td>
            {sortedComparisons.map((comp, idx) => (
              <td key={comp.supermarketId} className={`px-4 py-3 text-center tabular-nums ${idx === 0 ? 'text-brand-700' : 'text-gray-900'}`}>
                {formatPrice(comp.total)}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function SupermarketCard({
  comparison,
  rank,
  isBest,
  basketId,
}: {
  comparison: SupermarketComparison;
  rank: number;
  isBest: boolean;
  basketId: string;
}) {
  const slugClass = `supermarket-${comparison.supermarketSlug}`;

  return (
    <div className={`card overflow-hidden ${slugClass} ${isBest ? 'ring-2 ring-brand-500 shadow-glow-brand' : ''}`}>
      {isBest && (
        <div className="bg-gradient-to-l from-brand-600 to-brand-700 px-4 py-2 text-xs font-semibold text-white flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5" />
          המחיר הטוב ביותר
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${
                isBest ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {rank}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{comparison.supermarketName}</h3>
                {comparison.lastIngestionAt && (
                  <p className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    עודכן לפני {formatTimeAgo(comparison.lastIngestionAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold tabular-nums ${isBest ? 'text-brand-700' : 'text-gray-900'}`}>
              {formatPrice(comparison.total)}
            </p>
            <p className="text-xs text-gray-400">{comparison.currency}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex flex-wrap gap-2">
          {comparison.unavailableCount > 0 && (
            <span className="badge-unavailable">
              <AlertTriangle className="h-3 w-3" />
              {comparison.unavailableCount} לא זמין
            </span>
          )}
          {comparison.substitutionCount > 0 && (
            <span className="badge-substituted">
              <RefreshCw className="h-3 w-3" />
              {comparison.substitutionCount} תחליפים
            </span>
          )}
          {comparison.itemResults.some((r) => r.isPromo) && (
            <span className="badge-promo">
              כולל מבצעים
            </span>
          )}
        </div>

        {/* Quick summary of items */}
        <div className="mt-4 border-t pt-3">
          <div className="space-y-1.5">
            {comparison.itemResults.slice(0, 3).map((item) => (
              <div key={item.basketItemId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-gray-600">
                    {item.productName ?? item.requestedDisplayName}
                  </span>
                  {item.wasSubstituted && (
                    <span className="badge-substituted text-[10px]">תחליף</span>
                  )}
                  {item.isPromo && (
                    <span className="badge-promo text-[10px]">מבצע</span>
                  )}
                  {item.resolutionType === 'unavailable' && (
                    <span className="badge-unavailable text-[10px]">חסר</span>
                  )}
                </div>
                <span className="text-gray-900 font-medium ml-2 whitespace-nowrap tabular-nums">
                  {item.totalPrice != null
                    ? `${formatPrice(item.totalPrice)}${item.quantity > 1 ? ` (x${item.quantity})` : ''}`
                    : '\u2014'}
                </span>
              </div>
            ))}
            {comparison.itemResults.length > 3 && (
              <p className="text-xs text-gray-400">
                עוד +{comparison.itemResults.length - 3} פריטים
              </p>
            )}
          </div>
        </div>

        <Link
          href={`/compare/${comparison.supermarketSlug}?basketId=${basketId}`}
          className="mt-4 flex items-center justify-center gap-1 rounded-xl bg-gray-50 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200"
        >
          צפו בפירוט מלא
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
