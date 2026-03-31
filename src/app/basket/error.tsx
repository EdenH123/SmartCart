'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function BasketError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('Basket error:', error); }, [error]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
        <AlertTriangle className="h-7 w-7 text-red-400" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gray-900">שגיאה בטעינת הסל</h2>
      <p className="mt-2 text-sm text-gray-500">משהו השתבש. אנא נסו שוב.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={reset} className="btn-primary gap-2">
          <RotateCcw className="h-4 w-4" />
          נסו שוב
        </button>
        <Link href="/" className="btn-secondary">חזרה לדף הבית</Link>
      </div>
    </div>
  );
}
