import React from 'react';
import { en } from './translations/en';
import { ar } from './translations/ar';

export type Language = 'en' | 'ar';
export type Translations = typeof en;

const STORAGE_KEY = 'riskms_lang_v1';

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  strings: Translations;
  isRTL: boolean;
};

const I18nContext = React.createContext<I18nContextValue | undefined>(undefined);

const isLanguage = (value: string | null): value is Language => value === 'en' || value === 'ar';

const getInitialLanguage = (): Language => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isLanguage(stored)) return stored;

  const browserLang = (navigator.language || '').toLowerCase();
  if (browserLang.startsWith('ar')) return 'ar';

  return 'en';
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = React.useState<Language>(() => getInitialLanguage());

  const strings = language === 'ar' ? ar : en;
  const isRTL = language === 'ar';

  const setLanguage = React.useCallback((next: Language) => {
    setLanguageState(next);
  }, []);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);

    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [isRTL, language]);

  const value = React.useMemo<I18nContextValue>(() => {
    return {
      language,
      setLanguage,
      strings,
      isRTL,
    };
  }, [isRTL, language, setLanguage, strings]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
};
