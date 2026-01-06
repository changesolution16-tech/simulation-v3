import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useSimulationStore } from '../store';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { currentUser } = useSimulationStore();
  const [language, setLanguageState] = useState<Language>('en');
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load translations immediately on mount and whenever language changes
  useEffect(() => {
    loadTranslations();
  }, [language]);

  useEffect(() => {
    if (currentUser?.id && !isInitialized) {
      loadUserLanguagePreference();
    }
  }, [currentUser, isInitialized]);

  const loadTranslations = async () => {
    try {
      setIsLoading(true);
      console.log('Loading translations for language:', language);
      const translationModule = await import(`../translations/${language}.ts`);
      console.log('Translations loaded:', translationModule.default);
      setTranslations(translationModule.default);
      setTranslationsLoaded(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load translations:', error);
      setTranslationsLoaded(false);
      setIsLoading(false);
    }
  };

  const loadUserLanguagePreference = async () => {
    if (!currentUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!error && data?.preferred_language) {
        setLanguageState(data.preferred_language as Language);
      } else {
        // If column doesn't exist or other error, just use browser language as fallback
        if (error) {
          console.log('Language preference not available in database (column may not exist yet), using browser default');
        }
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('es')) {
          setLanguageState('es');
        }
      }
      setIsInitialized(true);
    } catch (error) {
      console.log('Failed to load language preference, using default:', error);
      setIsInitialized(true);
    }
  };

  const setLanguage = async (lang: Language) => {
    console.log('Changing language from', language, 'to', lang);
    setLanguageState(lang);

    // Try to save preference, but don't fail if column doesn't exist
    if (currentUser?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ preferred_language: lang })
          .eq('id', currentUser.id);

        if (error) {
          console.log('Could not save language preference to database (column may not exist yet):', error.message);
        }
      } catch (error) {
        console.log('Failed to save language preference:', error);
      }
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    // Return key silently while loading - no console warnings during initial load
    if (!translationsLoaded || !translations || Object.keys(translations).length === 0) {
      return key;
    }

    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Key not found - only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Translation key not found: ${key} (Language: ${language})`);
        }
        return key;
      }
    }

    if (typeof value !== 'string') {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Translation value is not a string for key: ${key}`);
      }
      return key;
    }

    if (params) {
      return Object.entries(params).reduce(
        (text, [paramKey, paramValue]) =>
          text.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), String(paramValue)),
        value
      );
    }

    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
