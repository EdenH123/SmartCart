'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Trash2, ShoppingCart, ArrowRight, Scale, Minus, Sparkles, Loader2, Package } from 'lucide-react';
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
import { useToast } from '@/components/Toast';
import AddProductModal from '@/components/AddProductModal';
import type { BasketItemDTO, BasketItemInput } from '@/types';

const POPULAR_ITEMS: { label: string; categorySlug: string; constraints: Record<string, string> }[] = [
  { label: 'חלב 3%', categorySlug: 'milk', constraints: { type: 'רגיל', fat: '3%', volume: '1 ליטר' } },
  { label: 'ביצים L 12', categorySlug: 'eggs', constraints: { size: 'L', packCount: '12', type: 'רגיל' } },
  { label: 'לחם לבן', categorySlug: 'bread', constraints: { type: 'לבן', weight: '750 גרם' } },
  { label: 'חזה עוף 1ק"ג', categorySlug: 'chicken-breast', constraints: { type: 'רגיל', weight: '1 ק״ג' } },
  { label: 'קוטג\' 5%', categorySlug: 'cottage-cheese', constraints: { fat: '5%', weight: '250 גרם' } },
  { label: 'אורז 1ק"ג', categorySlug: 'rice', constraints: { type: 'לבן', weight: '1 ק״ג' } },
  { label: 'חמאה 200ג', categorySlug: 'butter', constraints: { type: 'חמאה', weight: '200 גרם' } },
  { label: 'טחינה 500ג', categorySlug: 'tehina', constraints: { type: 'גולמית', weight: '500 גרם' } },
  { label: 'חומוס קלאסי', categorySlug: 'hummus', constraints: { type: 'קלאסי', weight: '400 גרם' } },
  { label: 'קמח לבן 1ק"ג', categorySlug: 'flour', constraints: { type: 'לבן', weight: '1 ק״ג' } },
  { label: 'רסק עגבניות', categorySlug: 'canned-tomatoes', constraints: { type: 'רסק', weight: '400 גרם' } },
  { label: 'בשר טחון 500ג', categorySlug: 'ground-meat', constraints: { type: 'בקר', weight: '500 גרם' } },
];

export default function BasketPage() {
  return (
    <Suspense fallback={<BasketSkeleton />}>
      <BasketPageInner />
    </Suspense>
  );
}

function BasketSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-28 rounded-lg bg-gray-200" />
          <div className="mt-2 h-4 w-20 rounded-lg bg-gray-200" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-gray-200" />
      </div>
      <div className="mt-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-5 w-40 rounded-lg bg-gray-200" />
                <div className="mt-2 h-3 w-24 rounded-lg bg-gray-200" />
              </div>
              <div className="h-8 w-24 rounded-lg bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 h-12 w-full rounded-xl bg-gray-200" />
    </div>
  );
}

function BasketPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [basketId, setBasketId] = useState<string | null>(null);
  const [items, setItems] = useState<BasketItemDTO[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [priceRanges, setPriceRanges] = useState<Record<string, { min: number; max: number; count: number } | null>>({});

  const loadBasket = useCallback(async (id: string) => {
    const basketItems = await getBasketItems(id);
    setItems(basketItems);
    setLoading(false);
    if (basketItems.length > 0) {
      const ranges = await getItemPriceRanges(id);
      setPriceRanges(ranges);
    } else {
      setPriceRanges({});
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const demo = searchParams.get('demo');
        let id: string;
        if (demo === 'true') {
          id = await loadDemoBasket();
          router.replace('/basket');
        } else {
          id = await getOrCreateBasket();
        }
        setBasketId(id);
        await loadBasket(id);
      } catch {
        setLoading(false);
        showToast('error', 'שגיאה בטעינת הסל');
      }
    }
    init();
  }, [searchParams, router, loadBasket, showToast]);

  const handleAdd = async (input: BasketItemInput) => {
    if (!basketId) return;
    try {
      setBusy(true);
      await addBasketItem(basketId, input);
      await loadBasket(basketId);
      showToast('success', 'המוצר נוסף לסל');
    } catch {
      showToast('error', 'שגיאה בהוספת המוצר');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      setRemovingId(itemId);
      await removeBasketItem(itemId);
      if (basketId) await loadBasket(basketId);
      showToast('info', 'המוצר הוסר מהסל');
    } catch {
      showToast('error', 'שגיאה בהסרת המוצר');
    } finally {
      setRemovingId(null);
    }
  };

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      await updateBasketItemQuantity(itemId, newQty);
      if (basketId) await loadBasket(basketId);
    } catch {
      showToast('error', 'שגיאה בעדכון הכמות');
    }
  };

  const handleClear = async () => {
    if (!basketId) return;
    try {
      setBusy(true);
      await clearBasket(basketId);
      await loadBasket(basketId);
      showToast('info', 'הסל נוקה');
    } catch {
      showToast('error', 'שגיאה בניקוי הסל');
    } finally {
      setBusy(false);
    }
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
    try {
      setBusy(true);
      await quickAddToBasket(basketId, item.categorySlug, item.constraints, item.label);
      await loadBasket(basketId);
      showToast('success', `${item.label} נוסף לסל`);
    } catch {
      showToast('error', 'שגיאה בהוספת המוצר');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <BasketSkeleton />;
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
            <button onClick={handleClear} disabled={busy} className="btn-ghost text-red-600 hover:bg-red-50 text-xs">
              נקה הכל
            </button>
          )}
          <button onClick={() => setShowAddModal(true)} disabled={busy} className="btn-primary gap-1.5">
            <Plus className="h-4 w-4" />
            הוסף מוצר
          </button>
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="mt-12 animate-fade-in">
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 sm:p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
              <ShoppingCart className="h-8 w-8 text-brand-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900">אין פריטים עדיין</h3>
            <p className="mt-1.5 text-sm text-gray-500">
              הוסיפו מוצרים לסל כדי להשוות מחירים בין סופרמרקטים.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => setShowAddModal(true)} className="btn-primary gap-1.5">
                <Plus className="h-4 w-4" />
                הוסף מוצר
              </button>
              <button
                onClick={async () => {
                  try {
                    setBusy(true);
                    const id = await loadDemoBasket();
                    setBasketId(id);
                    await loadBasket(id);
                    showToast('success', 'סל לדוגמה נטען');
                  } catch {
                    showToast('error', 'שגיאה בטעינת סל לדוגמה');
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
                className="btn-secondary"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'טענו סל לדוגמה'}
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-700 mb-3">פריטים פופולריים</h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_ITEMS.map((item) => (
                <button
                  key={item.categorySlug}
                  onClick={() => handleQuickAdd(item)}
                  disabled={busy}
                  className="chip"
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
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`card p-4 transition-all duration-200 ${removingId === item.id ? 'opacity-50 scale-[0.98]' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 truncate">{item.displayName}</p>
                      <span className={item.matchMode === 'exact' ? 'badge-exact' : 'badge-flexible'}>
                        {item.matchMode === 'exact' ? 'מדויק' : 'גמיש'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{item.categoryName}</p>
                    {priceRanges[item.id] && (
                      <p className="mt-0.5 text-xs text-brand-600 font-medium">
                        {priceRanges[item.id]!.min === priceRanges[item.id]!.max
                          ? `₪${priceRanges[item.id]!.min.toFixed(2)}`
                          : `₪${priceRanges[item.id]!.min.toFixed(2)} - ₪${priceRanges[item.id]!.max.toFixed(2)}`}
                        <span className="text-gray-400 font-normal"> · {priceRanges[item.id]!.count} סופרים</span>
                      </p>
                    )}
                    {Object.keys(item.userConstraints).length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {Object.entries(item.userConstraints).map(([key, value]) => (
                          <span key={key} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quantity controls + delete */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30"
                      disabled={item.quantity <= 1}
                      aria-label="הפחת כמות"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[1.75rem] text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      aria-label="הוסף כמות"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <div className="mx-1 h-5 w-px bg-gray-200" />
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={removingId === item.id}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-30"
                      aria-label="הסר מהסל"
                    >
                      {removingId === item.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="mt-8 space-y-3">
            <button onClick={handleCompare} className="btn-primary w-full gap-2 py-3.5 text-base shadow-md">
              <Scale className="h-5 w-5" />
              השוו מחירים
              <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={handleOptimize} className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-brand-200 bg-brand-50/50 py-3.5 text-base font-semibold text-brand-700 hover:bg-brand-100 hover:border-brand-300 transition-all duration-200">
              <Sparkles className="h-5 w-5" />
              מטבו את הסל שלי
            </button>
          </div>

          {/* Popular items quick-add */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-700 mb-3">הוסיפו במהירות</h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_ITEMS.map((item) => (
                <button
                  key={item.categorySlug}
                  onClick={() => handleQuickAdd(item)}
                  disabled={busy}
                  className="chip text-xs"
                >
                  <Plus className="h-3 w-3" />
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
