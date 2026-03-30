'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  TrendingDown,
  CheckCircle,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { optimizeBasketAction } from '@/lib/actions';
import { formatPrice } from '@/lib/utils';
import type { OptimizationResult, Recommendation } from '@/types';

export default function OptimizePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <div className="animate-pulse">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-200" />
            <div className="mx-auto mt-4 h-6 w-48 rounded bg-gray-200" />
          </div>
        </div>
      }
    >
      <OptimizePageInner />
    </Suspense>
  );
}

function OptimizePageInner() {
  const searchParams = useSearchParams();
  const basketId = searchParams.get('basketId');
  const [result, setResult] = useState<OptimizationResult | null>(null);
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
        const optimization = await optimizeBasketAction(basketId);
        setResult(optimization);
      } catch {
        setError('Failed to optimize basket. Please try again.');
      }
      setLoading(false);
    }
    run();
  }, [basketId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
            <Sparkles className="h-6 w-6 text-brand-500 animate-pulse" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">ממטב את הסל שלכם...</p>
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

  if (result.items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="text-lg font-semibold text-gray-900">אין מה למטב</h2>
        <p className="mt-2 text-sm text-gray-500">ייתכן שהסל שלכם ריק.</p>
        <Link href="/basket" className="btn-primary mt-6 inline-flex">
          חזרה לסל
        </Link>
      </div>
    );
  }

  const hasChanges = result.items.some((i) => i.changed);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/basket"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        חזרה לסל
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
          <Sparkles className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">אופטימיזציית סל</h1>
          <p className="text-sm text-gray-500">
            המחירים הטובים ביותר ב-<strong>{result.supermarketName}</strong>
          </p>
        </div>
      </div>

      {/* Savings banner */}
      {result.savings > 0 ? (
        <div className="mt-6 rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-center gap-3">
            <TrendingDown className="h-6 w-6 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">
                חסכו {formatPrice(result.savings)} ({result.savingsPercentage}%)
              </p>
              <p className="text-sm text-green-700">
                מקורי: {formatPrice(result.originalTotal)} ← ממוטב:{' '}
                {formatPrice(result.optimizedTotal)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-lg bg-gray-50 border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-gray-500 shrink-0" />
            <p className="text-sm text-gray-600">
              הסל שלכם כבר ממוטב! סה״כ: {formatPrice(result.originalTotal)}
            </p>
          </div>
        </div>
      )}

      {/* Optimized items */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900">פריטים</h2>
        <div className="mt-3 space-y-3">
          {result.items.map((item) => (
            <div
              key={item.basketItemId}
              className={`card p-4 ${item.changed ? 'ring-1 ring-brand-200 bg-brand-50/30' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">
                      {item.optimizedProductName}
                    </p>
                    {item.changed && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                        <RefreshCw className="h-3 w-3" />
                        הוחלף
                      </span>
                    )}
                  </div>
                  {item.changed && (
                    <p className="mt-1 text-xs text-gray-500">
                      היה: {item.originalDisplayName}
                    </p>
                  )}
                  {item.changeReason && (
                    <p className="mt-0.5 text-xs text-brand-600">{item.changeReason}</p>
                  )}
                </div>
                <div className="text-right mr-4 shrink-0">
                  {item.changed ? (
                    <>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatPrice(item.optimizedTotal)}
                      </p>
                      <p className="text-xs text-gray-400 line-through">
                        {formatPrice(item.originalTotal)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPrice(item.optimizedTotal)}
                    </p>
                  )}
                  {item.quantity > 1 && (
                    <p className="text-xs text-gray-400">
                      {formatPrice(item.optimizedUnitPrice)} x {item.quantity}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="mt-6 card p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-700">סה״כ ממוטב</span>
          <div className="text-right">
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(result.optimizedTotal)}
            </span>
            {result.savings > 0 && (
              <p className="text-xs text-green-600">
                אתם חוסכים {formatPrice(result.savings)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">המלצות</h2>
          </div>
          <div className="mt-3 space-y-3">
            {result.recommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex gap-3">
        <Link
          href={`/compare?basketId=${basketId}`}
          className="btn-primary flex-1 gap-2 py-3 justify-center"
        >
          צפו בהשוואה מלאה
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const typeStyles: Record<string, string> = {
    cheaper_alternative: 'bg-green-50 border-green-200 text-green-800',
    promo: 'bg-amber-50 border-amber-200 text-amber-800',
    constraint_relaxation: 'bg-blue-50 border-blue-200 text-blue-800',
    quantity: 'bg-purple-50 border-purple-200 text-purple-800',
  };
  const typeLabels: Record<string, string> = {
    cheaper_alternative: 'חלופה זולה יותר',
    promo: 'מבצע',
    constraint_relaxation: 'הרחבת קריטריון',
    quantity: 'טיפ לכמות',
  };

  const style = typeStyles[recommendation.type] ?? 'bg-gray-50 border-gray-200 text-gray-800';
  const label = typeLabels[recommendation.type] ?? recommendation.type;

  return (
    <div className={`rounded-lg border p-4 ${style}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase opacity-70">{label}</span>
          </div>
          <p className="mt-1 font-medium">{recommendation.title}</p>
          <p className="mt-0.5 text-sm opacity-80">{recommendation.description}</p>
        </div>
        {recommendation.impact.savingsAmount > 0 && (
          <div className="mr-4 shrink-0 text-right">
            <p className="text-lg font-bold">-{formatPrice(recommendation.impact.savingsAmount)}</p>
            <p className="text-xs opacity-70">{recommendation.impact.percentage}% הנחה</p>
          </div>
        )}
      </div>
    </div>
  );
}
