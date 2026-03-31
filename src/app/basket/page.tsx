'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Trash2, ShoppingCart, ArrowRight, Scale, Minus, Sparkles, Loader2, Package, Share2, GripVertical, ListChecks, Flame } from 'lucide-react';
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
  shareBasket,
  importSharedBasket,
} from '@/lib/actions';
import type { BarcodeLookupResult } from '@/lib/actions';
import BarcodeLookup from '@/components/BarcodeLookup';
import { useToast } from '@/components/Toast';
import AddProductModal from '@/components/AddProductModal';
import PriceDropBanner from '@/components/PriceDropBanner';
import { SavedBasketsPanel } from '@/components/SavedBasketsPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import NutritionBadge from '@/components/NutritionBadge';
import { getNutritionByCategory } from '@/lib/nutrition';
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

  // Shopping list mode
  const [shoppingMode, setShoppingMode] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Drag & drop
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

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
        const shareParam = searchParams.get('share');
        const demo = searchParams.get('demo');
        let id: string;
        if (shareParam) {
          id = await importSharedBasket(shareParam);
          setBasketId(id);
          await loadBasket(id);
          showToast('success', 'סל משותף נטען!');
          router.replace('/basket');
          return;
        } else if (demo === 'true') {
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

  // Load checked items from localStorage
  useEffect(() => {
    if (basketId) {
      const stored = localStorage.getItem(`smartcart-checked-${basketId}`);
      if (stored) {
        try {
          setCheckedItems(new Set(JSON.parse(stored)));
        } catch { /* ignore */ }
      }
    }
  }, [basketId]);

  const toggleChecked = (itemId: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      if (basketId) localStorage.setItem(`smartcart-checked-${basketId}`, JSON.stringify([...next]));
      return next;
    });
  };

  // Drag handlers
  const handleDragStart = (index: number) => {
    setDragIdx(index);
    dragRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIdx(index);
  };

  const handleDrop = (index: number) => {
    if (dragRef.current === null || dragRef.current === index) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragRef.current!, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIdx(null);
    setDragOverIdx(null);
    dragRef.current = null;
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
    dragRef.current = null;
  };

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
      setCheckedItems(new Set());
      localStorage.removeItem(`smartcart-checked-${basketId}`);
      await loadBasket(basketId);
      showToast('info', 'הסל נוקה');
    } catch {
      showToast('error', 'שגיאה בניקוי הסל');
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    if (!basketId) return;
    try {
      setBusy(true);
      const encoded = await shareBasket(basketId);
      const url = `${window.location.origin}/basket?share=${encoded}`;
      await navigator.clipboard.writeText(url);
      showToast('success', 'הקישור הועתק!');
    } catch {
      showToast('error', 'שגיאה ביצירת קישור שיתוף');
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

  const handleBarcodeAdd = async (result: BarcodeLookupResult) => {
    if (!basketId) return;
    try {
      setBusy(true);
      await addBasketItem(basketId, {
        categoryId: result.categoryId,
        quantity: 1,
        matchMode: 'exact',
        selectedCanonicalProductId: result.canonicalProductId,
        userConstraints: {},
        displayName: result.name,
      });
      await loadBasket(basketId);
      showToast('success', `${result.name} נוסף לסל`);
    } catch {
      showToast('error', 'שגיאה בהוספת המוצר');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <BasketSkeleton />;
  }

  const checkedCount = items.filter((i) => checkedItems.has(i.id)).length;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">הסל שלי</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {items.length === 0
              ? 'הסל שלכם ריק'
              : shoppingMode
                ? `${checkedCount}/${items.length} פריטים סומנו`
                : `${items.length} פריטים`}
          </p>
        </div>
        <div className="flex gap-2">
          {items.length > 0 && (
            <>
              <button
                onClick={() => setShoppingMode(!shoppingMode)}
                className={`btn-ghost text-xs gap-1 ${shoppingMode ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'text-gray-600'}`}
                title={shoppingMode ? 'צא ממצב קניות' : 'מצב קניות'}
              >
                <ListChecks className="h-3.5 w-3.5" />
                {shoppingMode ? 'סיום' : 'קניות'}
              </button>
              <button onClick={handleShare} disabled={busy} className="btn-ghost text-gray-600 hover:bg-gray-100 text-xs gap-1">
                <Share2 className="h-3.5 w-3.5" />
                שתף
              </button>
              <button onClick={handleClear} disabled={busy} className="btn-ghost text-red-600 hover:bg-red-50 text-xs">
                נקה הכל
              </button>
            </>
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
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 sm:p-12 text-center dark:border-gray-700">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/30">
              <ShoppingCart className="h-8 w-8 text-brand-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">אין פריטים עדיין</h3>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
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
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">פריטים פופולריים</h3>
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

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">חיפוש לפי ברקוד</h3>
            <BarcodeLookup onAdd={handleBarcodeAdd} disabled={busy} />
          </div>
        </div>
      )}

      {/* Price drop banner */}
      {items.length > 0 && basketId && (
        <ErrorBoundary section="התראות מחיר">
          <div className="mt-6">
            <PriceDropBanner basketId={basketId} />
          </div>
        </ErrorBoundary>
      )}

      {/* Saved baskets */}
      {basketId && (
        <ErrorBoundary section="סלים שמורים">
          <div className="mt-6">
            <SavedBasketsPanel basketId={basketId} onBasketLoaded={() => loadBasket(basketId)} />
          </div>
        </ErrorBoundary>
      )}

      {/* Basket items */}
      {items.length > 0 && (
        <>
          <div className="mt-6 space-y-3">
            {items.map((item, index) => {
              const isChecked = checkedItems.has(item.id);
              const isDragging = dragIdx === index;
              const isDragOver = dragOverIdx === index;

              return (
                <div
                  key={item.id}
                  draggable={!shoppingMode}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={`card p-4 animate-slide-up transition-all duration-300 ${
                    removingId === item.id ? 'opacity-0 scale-[0.97]' : ''
                  } ${isDragging ? 'opacity-50 scale-[0.98]' : ''} ${
                    isDragOver ? 'ring-2 ring-brand-400 ring-offset-2 dark:ring-offset-gray-900' : ''
                  } ${shoppingMode && isChecked ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
                  style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Drag handle or checkbox */}
                    {shoppingMode ? (
                      <button
                        onClick={() => toggleChecked(item.id)}
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                          isChecked
                            ? 'bg-brand-100 dark:bg-brand-900/40'
                            : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        aria-label={isChecked ? 'בטל סימון' : 'סמן כנקנה'}
                      >
                        {isChecked ? (
                          <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="h-5 w-5 rounded-md border-2 border-gray-300 dark:border-gray-600" />
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <div
                          className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-400 dark:text-gray-600 dark:hover:text-gray-500 touch-none"
                          title="גרור לשינוי סדר"
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    )}

                    <div className={`flex-1 min-w-0 transition-all duration-200 ${shoppingMode && isChecked ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-medium text-gray-900 dark:text-gray-100 truncate ${shoppingMode && isChecked ? 'line-through' : ''}`}>
                          {item.displayName}
                        </p>
                        <span className={item.matchMode === 'exact' ? 'badge-exact' : 'badge-flexible'}>
                          {item.matchMode === 'exact' ? 'מדויק' : 'גמיש'}
                        </span>
                      </div>
                      <p className={`mt-0.5 text-xs text-gray-500 dark:text-gray-400 ${shoppingMode && isChecked ? 'line-through' : ''}`}>
                        {item.categoryName}
                      </p>
                      {!shoppingMode && priceRanges[item.id] && (
                        <p className="mt-0.5 text-xs text-brand-600 font-medium">
                          {priceRanges[item.id]!.min === priceRanges[item.id]!.max
                            ? `₪${priceRanges[item.id]!.min.toFixed(2)}`
                            : `₪${priceRanges[item.id]!.min.toFixed(2)} - ₪${priceRanges[item.id]!.max.toFixed(2)}`}
                          <span className="text-gray-400 font-normal"> · {priceRanges[item.id]!.count} סופרים</span>
                        </p>
                      )}
                      {!shoppingMode && getNutritionByCategory(item.categorySlug) && (
                        <NutritionBadge nutrition={getNutritionByCategory(item.categorySlug)!} />
                      )}
                      {!shoppingMode && Object.keys(item.userConstraints).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {Object.entries(item.userConstraints).map(([key, value]) => (
                            <span key={key} className="rounded-md bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quantity controls + delete (hidden in shopping mode) */}
                    {!shoppingMode && (
                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30 dark:hover:bg-gray-700"
                          disabled={item.quantity <= 1}
                          aria-label="הפחת כמות"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-[1.75rem] text-center text-sm font-semibold tabular-nums dark:text-gray-100">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-700"
                          aria-label="הוסף כמות"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={removingId === item.id}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-30 dark:hover:bg-red-900/30"
                          aria-label="הסר מהסל"
                        >
                          {removingId === item.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    )}

                    {/* Quantity badge in shopping mode */}
                    {shoppingMode && item.quantity > 1 && (
                      <span className={`shrink-0 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 ${isChecked ? 'opacity-50' : ''}`}>
                        ×{item.quantity}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shopping mode progress bar */}
          {shoppingMode && items.length > 0 && (
            <div className="mt-4 rounded-xl bg-gray-100 dark:bg-gray-800 p-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">התקדמות</span>
                <span className="font-semibold text-brand-600 dark:text-brand-400">{checkedCount}/{items.length}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-500"
                  style={{ width: `${items.length > 0 ? (checkedCount / items.length) * 100 : 0}%` }}
                />
              </div>
              {checkedCount === items.length && items.length > 0 && (
                <p className="mt-2 text-center text-sm font-medium text-brand-600 dark:text-brand-400 animate-fade-in">
                  סיימתם את הקניות! 🎉
                </p>
              )}
            </div>
          )}

          {/* Total nutrition summary */}
          {!shoppingMode && (() => {
            const totals = items.reduce(
              (acc, item) => {
                const info = getNutritionByCategory(item.categorySlug);
                if (info) {
                  acc.calories += info.calories * item.quantity;
                  acc.protein += info.protein * item.quantity;
                  acc.carbs += info.carbs * item.quantity;
                  acc.fat += info.fat * item.quantity;
                  acc.hasAny = true;
                }
                return acc;
              },
              { calories: 0, protein: 0, carbs: 0, fat: 0, hasAny: false }
            );
            if (!totals.hasAny) return null;
            return (
              <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-orange-500" />
                  סיכום תזונתי (הערכה)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-2.5 text-center">
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{Math.round(totals.calories)}</p>
                    <p className="text-[11px] text-orange-500 dark:text-orange-400/80">קלוריות</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-2.5 text-center">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{Math.round(totals.protein)} גר׳</p>
                    <p className="text-[11px] text-blue-500 dark:text-blue-400/80">חלבון</p>
                  </div>
                  <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-2.5 text-center">
                    <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{Math.round(totals.carbs)} גר׳</p>
                    <p className="text-[11px] text-yellow-500 dark:text-yellow-400/80">פחמימות</p>
                  </div>
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-2.5 text-center">
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{Math.round(totals.fat)} גר׳</p>
                    <p className="text-[11px] text-red-500 dark:text-red-400/80">שומן</p>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500 text-center">
                  * הערכים הם הערכה לפי קטגוריה, למנה סטנדרטית אחת לכל פריט
                </p>
              </div>
            );
          })()}

          {/* Action buttons */}
          {!shoppingMode && (
            <div className="mt-8 space-y-3">
              <button onClick={handleCompare} className="btn-primary w-full gap-2 py-3.5 text-base shadow-md">
                <Scale className="h-5 w-5" />
                השוו מחירים
                <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={handleOptimize} className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-brand-200 bg-brand-50/50 py-3.5 text-base font-semibold text-brand-700 hover:bg-brand-100 hover:border-brand-300 transition-all duration-200 dark:border-brand-700 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/40">
                <Sparkles className="h-5 w-5" />
                מטבו את הסל שלי
              </button>
            </div>
          )}

          {/* Popular items quick-add */}
          {!shoppingMode && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">הוסיפו במהירות</h3>
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
          )}
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
