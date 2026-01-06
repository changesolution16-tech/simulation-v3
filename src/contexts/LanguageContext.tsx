'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import enTranslations from '../translations/en';
import esTranslations from '../translations/es';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: enTranslations,
  es: esTranslations,
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('es')) {
      setLanguageState('es');
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id && mounted) {
      loadUserLanguagePreference();
    }
  }, [session, mounted]);

  const loadUserLanguagePreference = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const user = await response.json();
        if (user.preferred_language) {
          setLanguageState(user.preferred_language as Language);
        }
      }
    } catch (error) {
      console.error('Failed to load language preference:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);

    if (session?.user?.id) {
      try {
        await fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferred_language: lang }),
        });
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
        return params[paramKey]?.toString() || '';
      });
    }

    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
