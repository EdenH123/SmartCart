'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/lib/i18n/context';

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'he' ? 'en' : 'he')}
      className="rounded-xl p-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
      aria-label={locale === 'he' ? 'Switch to English' : 'עבור לעברית'}
    >
      {locale === 'he' ? 'EN' : 'עב'}
    </button>
  );
}
