'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function OptimizeError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('Optimize error:', error); }, [error]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center">
      <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
      <h2 className="mt-4 text-lg font-semibold text-gray-900">שגיאה באופטימיזציה</h2>
      <p className="mt-2 text-sm text-gray-500">משהו השתבש. אנא נסו שוב.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={reset} className="btn-primary gap-2">
          <RotateCcw className="h-4 w-4" />
          נסו שוב
        </button>
        <Link href="/basket" className="btn-secondary">חזרה לסל</Link>
      </div>
    </div>
  );
}
