'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Plus, Loader2, ChevronLeft, ShoppingCart } from 'lucide-react';
import {
  getProductsByCategory,
  getCategoryAction,
  getOrCreateBasket,
  quickAddToBasket,
} from '@/lib/actions';
import { useToast } from '@/components/Toast';
import type { CategoryProduct } from '@/lib/actions';
import type { CategoryWithAttributes } from '@/types';

export default function CategoryProductsPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<CategoryWithAttributes | null>(null);
  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [basketId, setBasketId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [cat, productsPage, bId] = await Promise.all([
          getCategoryAction(categoryId),
          getProductsByCategory(categoryId, 1),
          getOrCreateBasket(),
        ]);
        setCategory(cat);
        setProducts(productsPage.products);
        setTotalCount(productsPage.totalCount);
        setHasMore(productsPage.hasMore);
        setBasketId(bId);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [categoryId]);

  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const productsPage = await getProductsByCategory(categoryId, nextPage);
      setProducts((prev) => [...prev, ...productsPage.products]);
      setHasMore(productsPage.hasMore);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  }, [categoryId, page]);

  const handleAddToBasket = useCallback(async (product: CategoryProduct) => {
    if (!basketId) return;
    setAddingId(product.id);
    try {
      const constraints: Record<string, string> = {};
      if (product.metadata) {
        for (const [key, value] of Object.entries(product.metadata)) {
          if (value !== null && value !== undefined) {
            constraints[key] = String(value);
          }
        }
      }
      await quickAddToBasket(
        basketId,
        product.categorySlug,
        constraints,
        product.brand ? `${product.name} ${product.brand}` : product.name
      );
      showToast('success', `${product.name} נוסף לסל`);
    } catch {
      showToast('error', 'שגיאה בהוספת המוצר');
    } finally {
      setAddingId(null);
    }
  }, [basketId, showToast]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 text-center">
        <Package className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">קטגוריה לא נמצאה</p>
        <Link href="/categories" className="mt-4 inline-flex btn-primary gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          חזרה לקטגוריות
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/categories" className="hover:text-brand-600 transition-colors">
          קטגוריות
        </Link>
        <ChevronLeft className="h-3.5 w-3.5" />
        <span className="font-medium text-gray-900 dark:text-gray-100">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{category.name}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {totalCount} מוצרים
          </p>
        </div>
        <Link href="/categories" className="btn-ghost text-sm gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          חזרה
        </Link>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="mt-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">אין מוצרים בקטגוריה זו</p>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="card p-4 animate-slide-up"
                style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'backwards' }}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {product.name}
                    </p>
                    {product.brand && (
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {product.brand}
                      </p>
                    )}
                    {product.priceMin !== null && (
                      <p className="mt-0.5 text-xs text-brand-600 font-medium">
                        {product.priceMin === product.priceMax
                          ? `₪${product.priceMin.toFixed(2)}`
                          : `₪${product.priceMin.toFixed(2)} - ₪${product.priceMax!.toFixed(2)}`}
                        <span className="text-gray-400 font-normal">
                          {' '}· {product.supermarketCount} סופרים
                        </span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToBasket(product)}
                    disabled={addingId === product.id}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-100 transition-colors dark:bg-brand-900/30 dark:text-brand-300 dark:hover:bg-brand-900/50 disabled:opacity-50"
                  >
                    {addingId === product.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-3.5 w-3.5" />
                    )}
                    הוסף לסל
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn-secondary gap-1.5"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                טען עוד
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
