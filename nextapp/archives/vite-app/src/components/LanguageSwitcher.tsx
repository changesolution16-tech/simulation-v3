import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Switch language"
      title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
    >
      <Languages className="w-4 h-4" />
      <span className="hidden sm:inline">
        {language === 'en' ? 'English' : 'Español'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
