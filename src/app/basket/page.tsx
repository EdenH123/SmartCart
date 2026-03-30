'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Trash2, ShoppingCart, ArrowRight, Scale, Minus, Sparkles } from 'lucide-react';
import {
  getOrCreateBasket,
  getBasketItems,
  addBasketItem,
  removeBasketItem,
  updateBasketItemQuantity,
  clearBasket,
  loadDemoBasket,
  quickAddToBasket,
  getItemPriceRanges,
} from '@/lib/actions';
import AddProductModal from '@/components/AddProductModal';
import type { BasketItemDTO, BasketItemInput } from '@/types';

const POPULAR_ITEMS: { label: string; categorySlug: string; constraints: Record<string, string> }[] = [
  { label: 'חלב 3%', categorySlug: 'milk', constraints: { type: 'רגיל', fat: '3%', volume: '1 ליטר' } },
  { label: 'ביצים L 12', categorySlug: 'eggs', constraints: { size: 'L', packCount: '12', type: 'רגיל' } },
  { label: 'לחם לבן', categorySlug: 'bread', constraints: { type: 'לבן', weight: '750 גרם' } },
  { label: 'חזה עוף 1ק"ג', categorySlug: 'chicken-breast', constraints: { type: 'רגיל', weight: '1 ק״ג' } },
  { label: 'קוטג\' 5%', categorySlug: 'cottage-cheese', constraints: { fat: '5%', weight: '250 גרם' } },
  { label: 'אורז 1ק"ג', categorySlug: 'rice', constraints: { type: 'לבן', weight: '1 ק״ג' } },
];

export default function BasketPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="mx-auto h-8 w-48 rounded bg-gray-200" />
          <div className="mx-auto mt-4 h-4 w-64 rounded bg-gray-200" />
        </div>
      </div>
    }>
      <BasketPageInner />
    </Suspense>
  );
}

function BasketPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [basketId, setBasketId] = useState<string | null>(null);
  const [items, setItems] = useState<BasketItemDTO[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [priceRanges, setPriceRanges] = useState<Record<string, { min: number; max: number; count: number } | null>>({});

  const loadBasket = useCallback(async (id: string) => {
    const basketItems = await getBasketItems(id);
    setItems(basketItems);
    setLoading(false);
    // Load price ranges in parallel
    if (basketItems.length > 0) {
      const ranges = await getItemPriceRanges(id);
      setPriceRanges(ranges);
    } else {
      setPriceRanges({});
    }
  }, []);

  useEffect(() => {
    async function init() {
      const demo = searchParams.get('demo');
      let id: string;
      if (demo === 'true') {
        id = await loadDemoBasket();
        // Clear the query param
        router.replace('/basket');
      } else {
        id = await getOrCreateBasket();
      }
      setBasketId(id);
      await loadBasket(id);
    }
    init();
  }, [searchParams, router, loadBasket]);

  const handleAdd = async (input: BasketItemInput) => {
    if (!basketId) return;
    await addBasketItem(basketId, input);
    await loadBasket(basketId);
  };

  const handleRemove = async (itemId: string) => {
    await removeBasketItem(itemId);
    if (basketId) await loadBasket(basketId);
  };

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    await updateBasketItemQuantity(itemId, newQty);
    if (basketId) await loadBasket(basketId);
  };

  const handleClear = async () => {
    if (!basketId) return;
    await clearBasket(basketId);
    await loadBasket(basketId);
  };

  const handleCompare = () => {
    if (!basketId) return;
    router.push(`/compare?basketId=${basketId}`);
  };

  const handleOptimize = () => {
    if (!basketId) return;
    router.push(`/optimize?basketId=${basketId}`);
  };

  const handleQuickAdd = async (item: typeof POPULAR_ITEMS[number]) => {
    if (!basketId) return;
    await quickAddToBasket(basketId, item.categorySlug, item.constraints, item.label);
    await loadBasket(basketId);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="mx-auto h-8 w-48 rounded bg-gray-200" />
          <div className="mx-auto mt-4 h-4 w-64 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הסל שלי</h1>
          <p className="mt-1 text-sm text-gray-500">
            {items.length === 0 ? 'הסל שלכם ריק' : `${items.length} פריטים`}
          </p>
        </div>
        <div className="flex gap-2">
          {items.length > 0 && (
            <button onClick={handleClear} className="btn-ghost text-red-600 hover:bg-red-50 text-xs">
              נקה הכל
            </button>
          )}
          <button onClick={() => setShowAddModal(true)} className="btn-primary gap-1.5">
            <Plus className="h-4 w-4" />
            הוסף מוצר
          </button>
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="mt-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <ShoppingCart className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">אין פריטים עדיין</h3>
          <p className="mt-1 text-sm text-gray-500">
            הוסיפו מוצרים לסל כדי להשוות מחירים בין סופרמרקטים.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => setShowAddModal(true)} className="btn-primary gap-1.5">
              <Plus className="h-4 w-4" />
              הוסף מוצר
            </button>
            <button
              onClick={async () => {
                const id = await loadDemoBasket();
                setBasketId(id);
                await loadBasket(id);
              }}
              className="btn-secondary"
            >
              טענו סל לדוגמה
            </button>
          </div>
          <div className="mt-8">
            <p className="text-sm font-medium text-gray-700 mb-3">פריטים פופולריים</p>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR_ITEMS.map((item) => (
                <button
                  key={item.categorySlug}
                  onClick={() => handleQuickAdd(item)}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 hover:bg-brand-50 hover:text-brand-700 px-3 py-1.5 text-sm transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Basket items */}
      {items.length > 0 && (
        <>
          <div className="mt-6 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="card p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 truncate">{item.displayName}</p>
                      <span className={item.matchMode === 'exact' ? 'badge-exact' : 'badge-flexible'}>
                        {item.matchMode === 'exact' ? 'מדויק' : 'גמיש'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{item.categoryName}</p>
                    {priceRanges[item.id] && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {priceRanges[item.id]!.min === priceRanges[item.id]!.max
                          ? `₪${priceRanges[item.id]!.min.toFixed(2)}`
                          : `₪${priceRanges[item.id]!.min.toFixed(2)} - ₪${priceRanges[item.id]!.max.toFixed(2)}`}
                        {' '}({priceRanges[item.id]!.count} סופרים)
                      </p>
                    )}
                    {Object.keys(item.userConstraints).length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {Object.entries(item.userConstraints).map(([key, value]) => (
                          <span key={key} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quantity controls + delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[1.5rem] text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="mt-8 space-y-3">
            <button onClick={handleCompare} className="btn-primary w-full gap-2 py-3 text-base">
              <Scale className="h-5 w-5" />
              השוו מחירים
              <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={handleOptimize} className="w-full inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-200 bg-brand-50 py-3 text-base font-semibold text-brand-700 hover:bg-brand-100 transition-colors">
              <Sparkles className="h-5 w-5" />
              מטבו את הסל שלי
            </button>
          </div>

          {/* Popular items quick-add */}
          <div className="mt-8">
            <p className="text-sm font-medium text-gray-700 mb-3">פריטים פופולריים</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_ITEMS.map((item) => (
                <button
                  key={item.categorySlug}
                  onClick={() => handleQuickAdd(item)}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 hover:bg-brand-50 hover:text-brand-700 px-3 py-1.5 text-sm transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <AddProductModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
      />
    </div>
  );
}
