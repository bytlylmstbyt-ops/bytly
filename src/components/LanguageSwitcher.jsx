import React from 'react';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ variant = "ghost" }) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant={variant}
      onClick={toggleLanguage}
      className="flex items-center gap-2 font-medium"
      title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
    >
      <Globe className="w-4 h-4" />
      <span className="hidden sm:inline">
        {language === 'ar' ? 'العربية' : 'English'}
      </span>
      <span className="sm:hidden">
        {language === 'ar' ? 'ع' : 'EN'}
      </span>
    </Button>
  );
}