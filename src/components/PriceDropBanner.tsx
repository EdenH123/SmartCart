'use client';

import { useEffect, useState } from 'react';
import { TrendingDown, X } from 'lucide-react';
import { checkPriceDrops } from '@/lib/actions';
import type { PriceDrop } from '@/types';

const SESSION_KEY = 'smartcart-price-drops-dismissed';

interface PriceDropBannerProps {
  basketId: string;
}

export default function PriceDropBanner({ basketId }: PriceDropBannerProps) {
  const [drops, setDrops] = useState<PriceDrop[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    const wasDismissed = sessionStorage.getItem(SESSION_KEY);
    if (wasDismissed === basketId) {
      setDismissed(true);
      setLoaded(true);
      return;
    }

    checkPriceDrops(basketId)
      .then((result) => {
        setDrops(result);
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
      });
  }, [basketId]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(SESSION_KEY, basketId);
  };

  if (!loaded || dismissed || drops.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-green-200 bg-green-50 animate-slide-down">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100">
          <TrendingDown className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-800">
            ירידת מחירים!
          </p>
          <div className="mt-2 space-y-1.5">
            {drops.map((drop, i) => (
              <div key={i} className="flex flex-wrap items-center gap-x-2 text-sm text-green-700">
                <span className="font-medium">{drop.productName}</span>
                <span className="text-green-500">({drop.supermarket})</span>
                <span className="text-green-400">
                  &#8362;{drop.oldPrice.toFixed(2)}
                </span>
                <span className="text-green-600">&larr;</span>
                <span className="font-semibold text-green-700">
                  &#8362;{drop.newPrice.toFixed(2)}
                </span>
                <span className="rounded-full bg-green-200 px-2 py-0.5 text-xs font-bold text-green-800">
                  -{drop.dropPercent}%
                </span>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-lg p-1.5 text-green-500 hover:bg-green-100 hover:text-green-700 transition-colors"
          aria-label="סגור התראת ירידת מחירים"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
