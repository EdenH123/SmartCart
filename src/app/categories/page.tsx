'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, Package, Loader2, ArrowLeft } from 'lucide-react';
import { getCategoriesWithProductCount } from '@/lib/actions';
import type { CategoryWithProductCount } from '@/lib/actions';

const CATEGORY_COLORS = [
  'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
];

function getCategoryColor(index: number) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithProductCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getCategoriesWithProductCount();
        setCategories(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!filter.trim()) return categories;
    const q = filter.trim().toLowerCase();
    return categories.filter((cat) => cat.name.toLowerCase().includes(q));
  }, [categories, filter]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">קטגוריות</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {categories.length} קטגוריות זמינות
          </p>
        </div>
        <Link href="/basket" className="btn-ghost text-sm gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          לסל
        </Link>
      </div>

      {/* Search/filter bar */}
      <div className="mt-6 relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="חפש קטגוריה..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-10 pl-4 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-brand-500 dark:focus:ring-brand-900/30"
        />
      </div>

      {/* Categories grid */}
      {filtered.length === 0 ? (
        <div className="mt-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {filter.trim() ? 'לא נמצאו קטגוריות מתאימות' : 'אין קטגוריות זמינות'}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((cat, index) => {
            const colorClass = getCategoryColor(index);
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.id}`}
                className="card-hover p-4 sm:p-5 group animate-slide-up"
                style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'backwards' }}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass} transition-transform duration-200 group-hover:scale-110`}>
                  <Package className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {cat.name}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {cat.productCount} מוצרים
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
