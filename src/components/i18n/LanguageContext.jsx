import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations as baseTranslations } from './translations';
import { extraTranslations } from './extraTranslations';
import { landingTranslations } from '@/components/landing/landingTranslations';

function deepMerge(target, source) {
  const out = { ...(target || {}) };
  for (const k of Object.keys(source || {})) {
    if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) {
      out[k] = deepMerge(target?.[k], source[k]);
    } else {
      out[k] = source[k];
    }
  }
  return out;
}

const translations = {
  ar: deepMerge(deepMerge(baseTranslations.ar, extraTranslations.ar), landingTranslations.ar),
  en: deepMerge(deepMerge(baseTranslations.en, extraTranslations.en), landingTranslations.en)
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // Get saved language from localStorage or default to Arabic
    const saved = localStorage.getItem('bytly_language');
    return saved || 'ar';
  });

  useEffect(() => {
    // Save language preference
    localStorage.setItem('bytly_language', language);
    
    // Update document direction and lang attribute
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Add translate="no" to prevent browser translation
    document.documentElement.setAttribute('translate', 'no');
    
    // Add class to body for additional styling control
    document.body.className = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    return value;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isRTL: language === 'ar'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}