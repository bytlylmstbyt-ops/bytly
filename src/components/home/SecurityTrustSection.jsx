import React from "react";
import { ShieldCheck, Lock, Users, FileCheck } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

const ICONS = [Lock, Users, FileCheck, ShieldCheck];

export default function SecurityTrustSection() {
  const { t } = useLanguage();
  const signals = (t('about.security.signals') || []).map((s, i) => ({ ...s, icon: ICONS[i] || Lock }));

  return (
    <section className="py-12 sm:py-14 bg-gradient-to-b from-amber-50/30 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#C9A66B]/10 border border-[#C9A66B]/30 rounded-full px-4 py-1.5 mb-3">
            <ShieldCheck className="w-4 h-4 text-[#C9A66B]" />
            <span className="text-sm text-[#6B5D4F] font-medium">{t('about.security.badge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#4A3F35] mb-2">{t('about.security.title')}</h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto">{t('about.security.subtitle')}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {signals.map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-white border border-[#C9A66B]/20 rounded-xl p-5"
            >
              <div className="w-10 h-10 rounded-lg bg-[#C9A66B]/10 flex items-center justify-center shrink-0">
                <s.icon className="w-5 h-5 text-[#6B5D4F]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#4A3F35] mb-1 text-sm sm:text-base">{s.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}