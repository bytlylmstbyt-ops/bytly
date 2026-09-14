import React from "react";
import { ShieldCheck, Award, Newspaper, BadgeCheck, Lock, FileBadge } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

const BADGE_ICONS = [BadgeCheck, ShieldCheck, Award, Newspaper];
const SIGNAL_ICONS = [FileBadge, ShieldCheck, Award];

export default function TrustBadgesSection() {
  const { t } = useLanguage();
  const badges = t('trustBadges.badges') || [];
  const signals = t('trustBadges.signals') || [];

  return (
    <section className="py-14 sm:py-16 bg-[#4A3F35] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-[#C9A66B]/30 rounded-full px-4 py-1.5 mb-4">
            <Lock className="w-4 h-4 text-[#C9A66B]" />
            <span className="text-sm text-[#C9A66B] font-medium">{t('trustBadges.badge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            {t('trustBadges.title')}
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
            {t('trustBadges.subtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b, i) => {
            const Icon = BADGE_ICONS[i] || BadgeCheck;
            return (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-[#C9A66B]/40 transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-[#C9A66B]/15 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-[#C9A66B]" />
                </div>
                <h3 className="font-semibold mb-1.5 text-sm sm:text-base">{b.title}</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
        </div>

        {/* External trust signal — independent verification badge */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300">
          {signals.map((signal, i) => {
            const Icon = SIGNAL_ICONS[i] || FileBadge;
            return (
              <span key={i} className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                <Icon className="w-3.5 h-3.5 text-[#C9A66B]" />
                {signal}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}