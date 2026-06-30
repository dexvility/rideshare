'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Locale } from '@/i18n/translations';

type T = typeof translations[Locale];

interface LocaleContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: T;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'cs',
  setLocale: () => {},
  t: translations.cs,
});

export function useLocale() {
  return useContext(LocaleContext);
}

interface ProvidersProps {
  children: React.ReactNode;
  // Locale detected server-side from the Accept-Language header. Used as the
  // starting point before we know whether the user has a saved preference.
  detectedLocale?: Locale;
}

export function Providers({ children, detectedLocale = 'cs' }: ProvidersProps) {
  const [locale, setLocaleState] = useState<Locale>(detectedLocale);

  useEffect(() => {
    // A saved choice (the user explicitly toggled the language before)
    // always wins over the browser-detected locale.
    const saved = localStorage.getItem('locale') as Locale | null;
    if (saved && (saved === 'cs' || saved === 'en')) {
      setLocaleState(saved);
    }
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem('locale', l);
  }

  const t: T = translations[locale];

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}
