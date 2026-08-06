import React from "react";
import { Activity } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function LiveActiveBadge({ label }) {
  const { t, language } = useLanguage();
  const activeLabel = label || t('liveBadge.active');
  const months = t('liveBadge.months') || [];
  const now = new Date();
  const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-medium"
      dir={dir}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
      </span>
      <Activity className="w-3.5 h-3.5" />
      <span>{activeLabel}</span>
      <span className="text-emerald-400">•</span>
      <span className="text-emerald-600/80">{t('liveBadge.lastUpdate')}: {dateStr}</span>
    </div>
  );
}