'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Package,
  Grid3X3,
  Store,
  Camera,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { getAdminStats } from '@/lib/actions';
import { formatPrice } from '@/lib/utils';
import type { AdminStats } from '@/types';

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'עכשיו';
  if (minutes < 60) return `לפני ${minutes} דקות`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
}

/** Returns a value 0..1 indicating freshness (1 = just now, 0 = 24h+ ago). */
function freshnessRatio(dateStr: string | null): number {
  if (!dateStr) return 0;
  const ageMs = Date.now() - new Date(dateStr).getTime();
  const maxMs = 24 * 60 * 60 * 1000; // 24h
  return Math.max(0, 1 - ageMs / maxMs);
}

function freshnessColor(ratio: number): string {
  if (ratio > 0.75) return 'bg-green-500';
  if (ratio > 0.5) return 'bg-lime-500';
  if (ratio > 0.25) return 'bg-yellow-500';
  if (ratio > 0) return 'bg-orange-500';
  return 'bg-red-500';
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch {
      setError('לא ניתן לטעון נתוני מערכת. נסו שוב.');
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-500" />
        <p className="mt-4 text-sm text-gray-500">טוען נתוני מערכת...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-amber-500" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">משהו השתבש</h2>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <button onClick={() => load()} className="btn-primary mt-6 inline-flex">נסו שוב</button>
      </div>
    );
  }

  if (!stats) return null;

  const summaryCards = [
    { label: 'מוצרים', value: stats.totalProducts, icon: Package, bgClass: 'bg-blue-50 dark:bg-blue-900/30', iconClass: 'text-blue-600 dark:text-blue-400' },
    { label: 'קטגוריות', value: stats.totalCategories, icon: Grid3X3, bgClass: 'bg-purple-50 dark:bg-purple-900/30', iconClass: 'text-purple-600 dark:text-purple-400' },
    { label: 'סופרמרקטים', value: stats.totalSupermarkets, icon: Store, bgClass: 'bg-green-50 dark:bg-green-900/30', iconClass: 'text-green-600 dark:text-green-400' },
    { label: 'תמונות מחיר', value: stats.totalSnapshots, icon: Camera, bgClass: 'bg-amber-50 dark:bg-amber-900/30', iconClass: 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">לוח בקרה</h1>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          רענון
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="card p-5 animate-slide-up"
              style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'backwards' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.bgClass}`}>
                  <Icon className={`h-4 w-4 ${card.iconClass}`} />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {card.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Supermarket health table */}
      <div className="card p-6 mb-8 animate-slide-up" style={{ animationDelay: '320ms', animationFillMode: 'backwards' }}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">בריאות סופרמרקטים</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-right pb-3 font-medium text-gray-500 dark:text-gray-400">שם</th>
                <th className="text-right pb-3 font-medium text-gray-500 dark:text-gray-400">מוצרים</th>
                <th className="text-right pb-3 font-medium text-gray-500 dark:text-gray-400">עדכון אחרון</th>
                <th className="text-right pb-3 font-medium text-gray-500 dark:text-gray-400">מחיר ממוצע</th>
                <th className="text-right pb-3 font-medium text-gray-500 dark:text-gray-400">חסר במלאי</th>
                <th className="text-right pb-3 font-medium text-gray-500 dark:text-gray-400">מבצעים</th>
                <th className="text-right pb-3 font-medium text-gray-500 dark:text-gray-400">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {stats.supermarketHealth.map((sm) => (
                <tr key={sm.slug}>
                  <td className="py-3 font-medium text-gray-900 dark:text-gray-100">{sm.name}</td>
                  <td className="py-3 tabular-nums text-gray-700 dark:text-gray-300">{sm.productCount.toLocaleString()}</td>
                  <td className="py-3 text-gray-500 dark:text-gray-400">
                    {sm.lastIngestionAt ? timeSince(sm.lastIngestionAt) : 'אף פעם'}
                  </td>
                  <td className="py-3 tabular-nums text-gray-700 dark:text-gray-300">{formatPrice(sm.avgPrice)}</td>
                  <td className="py-3 tabular-nums text-gray-700 dark:text-gray-300">{sm.outOfStockCount}</td>
                  <td className="py-3 tabular-nums text-gray-700 dark:text-gray-300">{sm.promoCount}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${sm.isStale ? 'bg-red-500' : 'bg-green-500'}`}
                      />
                      <span className={`text-xs font-medium ${sm.isStale ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {sm.isStale ? 'לא עדכני' : 'עדכני'}
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data freshness timeline */}
      <div className="card p-6 animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">רעננות נתונים</h2>
        <div className="space-y-4">
          {stats.supermarketHealth.map((sm) => {
            const ratio = freshnessRatio(sm.lastIngestionAt);
            const widthPercent = Math.max(ratio * 100, 2); // min 2% so bar is visible
            const colorClass = freshnessColor(ratio);
            return (
              <div key={sm.slug}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{sm.name}</span>
                  <span className="text-xs text-gray-400 tabular-nums">
                    {sm.lastIngestionAt ? timeSince(sm.lastIngestionAt) : 'אין נתונים'}
                  </span>
                </div>
                <div className="h-5 w-full rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-lg transition-all duration-700 ${colorClass}`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          ירוק = עדכני (פחות מ-6 שעות) | צהוב = מזדקן (6-18 שעות) | אדום = לא עדכני (מעל 24 שעות)
        </p>
      </div>
    </div>
  );
}
