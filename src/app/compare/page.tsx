'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, AlertTriangle, ArrowRight, RefreshCw, TrendingDown, ArrowLeft, Clock, Info } from 'lucide-react';
import { compareBasketAction } from '@/lib/actions';
import { formatPrice, formatTimeAgo } from '@/lib/utils';
import type { ComparisonResult, SupermarketComparison } from '@/types';

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="mx-auto h-12 w-12 rounded-full bg-gray-200" />
          <div className="mx-auto mt-4 h-6 w-48 rounded bg-gray-200" />
        </div>
      </div>
    }>
      <ComparePageInner />
    </Suspense>
  );
}

function ComparePageInner() {
  const searchParams = useSearchParams();
  const basketId = searchParams.get('basketId');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
            <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
          </div>
          <div className="mx-auto mt-4 h-6 w-48 rounded bg-gray-200" />
          <div className="mx-auto mt-2 h-4 w-64 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
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
      <Link href="/basket" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        חזרה לסל
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">השוואת מחירים</h1>

      {/* Info banner */}
      <div className="mt-4 rounded-lg bg-brand-50 p-4 text-sm text-brand-800">
        <p className="font-medium">מדורג לפי זמינות ואז לפי מחיר כולל.</p>
        {savings > 0 && (
          <p className="mt-1 flex items-center gap-1">
            <TrendingDown className="h-4 w-4" />
            אתם חוסכים <strong>{formatPrice(savings)}</strong> ב-<strong>{result.comparisons[0].supermarketName}</strong> לעומת{' '}
            <strong>{result.comparisons[result.comparisons.length - 1].supermarketName}</strong>
          </p>
        )}
      </div>

      {/* Freshness disclaimer */}
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>המחירים מתעדכנים מעת לעת ועשויים לא לשקף מחירים בזמן אמת.</span>
      </div>

      {/* Supermarket cards */}
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
  return (
    <div className={`card overflow-hidden ${isBest ? 'ring-2 ring-brand-500' : ''}`}>
      {isBest && (
        <div className="bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5" />
          המחיר הטוב ביותר
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
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
            <p className="text-2xl font-bold text-gray-900">{formatPrice(comparison.total)}</p>
            <p className="text-xs text-gray-500">{comparison.currency}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex flex-wrap gap-2">
          {comparison.unavailableCount > 0 && (
            <span className="badge-unavailable">
              <AlertTriangle className="mr-1 h-3 w-3" />
              {comparison.unavailableCount} לא זמין
            </span>
          )}
          {comparison.substitutionCount > 0 && (
            <span className="badge-substituted">
              <RefreshCw className="mr-1 h-3 w-3" />
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
                <span className="text-gray-900 font-medium ml-2 whitespace-nowrap">
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
          className="mt-4 flex items-center justify-center gap-1 rounded-lg bg-gray-50 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          צפו בפירוט מלא
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
