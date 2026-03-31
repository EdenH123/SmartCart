'use client';

import { useState, useRef } from 'react';
import { ScanBarcode, Loader2, ShoppingCart, X } from 'lucide-react';
import { lookupBarcode } from '@/lib/actions';
import type { BarcodeLookupResult } from '@/lib/actions';

interface Props {
  onAdd: (result: BarcodeLookupResult) => void;
  disabled?: boolean;
}

export default function BarcodeLookup({ onAdd, disabled }: Props) {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BarcodeLookupResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    const trimmed = barcode.trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);
    setNotFound(false);

    try {
      const found = await lookupBarcode(trimmed);
      if (found) {
        setResult(found);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleAdd = () => {
    if (!result) return;
    onAdd(result);
    setBarcode('');
    setResult(null);
    setNotFound(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setBarcode('');
    setResult(null);
    setNotFound(false);
    inputRef.current?.focus();
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <ScanBarcode className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            placeholder="הדביקו ברקוד..."
            aria-label="חיפוש לפי ברקוד"
            className="input pr-9 text-sm"
            value={barcode}
            onChange={(e) => {
              setBarcode(e.target.value);
              setResult(null);
              setNotFound(false);
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled || loading}
          />
          {barcode && (
            <button
              onClick={handleClear}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="נקה"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={disabled || loading || !barcode.trim()}
          className="btn-primary text-sm px-3 py-2 shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'חפש'}
        </button>
      </div>

      {/* Result: product found */}
      {result && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-brand-50 dark:bg-brand-900/20 px-3 py-2 animate-fade-in">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{result.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {result.categoryName}
              {result.brand && ` · ${result.brand}`}
            </p>
          </div>
          <button
            onClick={handleAdd}
            disabled={disabled}
            className="btn-primary text-xs gap-1 px-2.5 py-1.5 shrink-0 mr-2"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            הוסף לסל
          </button>
        </div>
      )}

      {/* Result: not found */}
      {notFound && (
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400 animate-fade-in">
          מוצר לא נמצא
        </p>
      )}
    </div>
  );
}
