'use client';

import { Suspense, useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, RefreshCw, Tag, Check, X as XIcon, Clock } from 'lucide-react';
import { compareBasketAction } from '@/lib/actions';
import { formatPrice, formatTimeAgo } from '@/lib/utils';
import type { ComparisonResult, SupermarketComparison, ItemResolution } from '@/types';

export default function BreakdownPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    }>
      <BreakdownPageInner />
    </Suspense>
  );
}

function BreakdownPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const basketId = searchParams.get('basketId');
  const [comparison, setComparison] = useState<SupermarketComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      if (!basketId) return;
      const result: ComparisonResult = await compareBasketAction(basketId);
      const match = result.comparisons.find((c) => c.supermarketSlug === slug);
      setComparison(match ?? null);
      setLoading(false);
    }
    run();
  }, [basketId, slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
        <h2 className="mt-4 text-lg font-semibold">Supermarket not found</h2>
        <Link href={`/compare?basketId=${basketId}`} className="btn-primary mt-6 inline-flex">
          Back to comparison
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href={`/compare?basketId=${basketId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to comparison
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{comparison.supermarketName}</h1>
          <div className="mt-1 flex items-center gap-3">
            <p className="text-sm text-gray-500">Full basket breakdown</p>
            {comparison.lastIngestionAt && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                Prices updated {formatTimeAgo(comparison.lastIngestionAt)}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900">{formatPrice(comparison.total)}</p>
          <div className="mt-1 flex gap-2 justify-end">
            {comparison.unavailableCount > 0 && (
              <span className="badge-unavailable text-xs">{comparison.unavailableCount} unavailable</span>
            )}
            {comparison.substitutionCount > 0 && (
              <span className="badge-substituted text-xs">{comparison.substitutionCount} substituted</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {comparison.itemResults.map((item) => (
          <ItemRow key={item.basketItemId} item={item} />
        ))}
      </div>

      {/* Total */}
      <div className="mt-6 card p-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-gray-900">{formatPrice(comparison.total)}</span>
        </div>
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: ItemResolution }) {
  const isUnavailable = item.resolutionType === 'unavailable';

  return (
    <div className={`card p-4 ${isUnavailable ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Status icon */}
          <div className="flex items-center gap-2">
            {isUnavailable ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
                <XIcon className="h-3.5 w-3.5 text-red-600" />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                <Check className="h-3.5 w-3.5 text-green-600" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {item.productName ?? item.requestedDisplayName}
              </p>
              {item.brand && (
                <p className="text-xs text-gray-500">{item.brand}</p>
              )}
            </div>
          </div>

          {/* Requested vs resolved */}
          {item.wasSubstituted && (
            <div className="mt-2 ml-8 rounded-lg bg-purple-50 p-2.5 text-xs">
              <p className="text-purple-700">
                <span className="font-medium">Requested:</span> {item.requestedDisplayName}
              </p>
              {item.substitutionReason && (
                <p className="mt-1 text-purple-600">{item.substitutionReason}</p>
              )}
            </div>
          )}

          {/* Unavailable reason */}
          {isUnavailable && item.substitutionReason && (
            <div className="mt-2 ml-8 rounded-lg bg-red-50 p-2.5 text-xs text-red-600">
              {item.substitutionReason}
            </div>
          )}

          {/* Badges */}
          <div className="mt-2 ml-8 flex flex-wrap gap-1.5">
            {item.wasSubstituted && (
              <span className="badge-substituted text-[10px]">
                <RefreshCw className="mr-0.5 h-2.5 w-2.5" />
                Substituted
              </span>
            )}
            {item.isPromo && item.promoDescription && (
              <span className="badge-promo text-[10px]">
                <Tag className="mr-0.5 h-2.5 w-2.5" />
                {item.promoDescription}
              </span>
            )}
            {isUnavailable && (
              <span className="badge-unavailable text-[10px]">Unavailable</span>
            )}
            {item.priceTimestamp && !isUnavailable && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                <Clock className="h-2.5 w-2.5" />
                {formatTimeAgo(item.priceTimestamp)}
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          {item.totalPrice != null ? (
            <>
              <p className="text-lg font-semibold text-gray-900">{formatPrice(item.totalPrice)}</p>
              {item.quantity > 1 && (
                <p className="text-xs text-gray-500">
                  {formatPrice(item.unitPrice!)} x {item.quantity}
                </p>
              )}
            </>
          ) : (
            <p className="text-lg font-semibold text-gray-400">{'\u2014'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
