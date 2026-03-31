'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bookmark, Loader2, Trash2, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { saveBasketAs, getSavedBaskets, loadSavedBasket, deleteSavedBasket } from '@/lib/actions';
import { useToast } from '@/components/Toast';

interface SavedBasketsProps {
  basketId: string;
  onBasketLoaded: () => void;
}

export function SavedBasketsPanel({ basketId, onBasketLoaded }: SavedBasketsProps) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [baskets, setBaskets] = useState<Array<{ name: string; itemCount: number; savedAt: string }>>([]);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);

  const fetchBaskets = useCallback(async () => {
    const data = await getSavedBaskets();
    setBaskets(data);
  }, []);

  useEffect(() => {
    if (open) fetchBaskets();
  }, [open, fetchBaskets]);

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      await saveBasketAs(basketId, saveName.trim());
      setSaveName('');
      await fetchBaskets();
      showToast('success', 'הסל נשמר');
    } catch {
      showToast('error', 'שגיאה בשמירת הסל');
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = async (index: number) => {
    setLoadingIdx(index);
    try {
      await loadSavedBasket(index);
      onBasketLoaded();
      showToast('success', 'הסל נטען');
    } catch {
      showToast('error', 'שגיאה בטעינת הסל');
    } finally {
      setLoadingIdx(null);
    }
  };

  const handleDelete = async (index: number) => {
    try {
      await deleteSavedBasket(index);
      await fetchBaskets();
      showToast('success', 'הסל נמחק');
    } catch {
      showToast('error', 'שגיאה במחיקת הסל');
    }
  };

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <span className="flex items-center gap-2">
          <Bookmark className="h-4 w-4" />
          סלים שמורים
          {baskets.length > 0 && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              {baskets.length}
            </span>
          )}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4 space-y-3 animate-slide-down dark:border-gray-800">
          {/* Save current basket */}
          <div className="flex gap-2">
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="שם לסל (למשל: קניות שבועיות)"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button
              onClick={handleSave}
              disabled={saving || !saveName.trim()}
              className="btn-primary text-sm px-3 py-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור'}
            </button>
          </div>

          {/* Saved baskets list */}
          {baskets.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-2">אין סלים שמורים</p>
          ) : (
            <div className="space-y-2">
              {baskets.map((basket, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">{basket.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {basket.itemCount} פריטים · {new Date(basket.savedAt).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 mr-2">
                    <button
                      onClick={() => handleLoad(i)}
                      disabled={loadingIdx !== null}
                      className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 transition-colors dark:text-brand-400 dark:hover:bg-brand-900/30"
                      title="טען"
                    >
                      {loadingIdx === i ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(i)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors dark:hover:bg-red-900/30"
                      title="מחק"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
