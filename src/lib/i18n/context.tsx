'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { translations, type Locale } from './translations';

const STORAGE_KEY = 'smartcart-locale';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('he');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'he') {
      setLocaleState(stored);
      applyLocaleToDocument(stored);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    applyLocaleToDocument(newLocale);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[locale][key] ?? key;
    },
    [locale],
  );

  // On first mount, apply stored locale direction
  useEffect(() => {
    if (!mounted) return;
    applyLocaleToDocument(locale);
  }, [locale, mounted]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return ctx;
}

function applyLocaleToDocument(locale: Locale) {
  const html = document.documentElement;
  html.setAttribute('dir', locale === 'he' ? 'rtl' : 'ltr');
  html.setAttribute('lang', locale);
}
