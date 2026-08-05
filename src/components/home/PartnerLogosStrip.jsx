import React from "react";
import { Building2, HardHat, Boxes, PenTool, MapPin, Layers } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

const LOGO_ICONS = [Building2, HardHat, Boxes, PenTool, MapPin, Layers];

export default function PartnerLogosStrip() {
  const { t } = useLanguage();
  const labels = t('partnerLogos.labels') || [];

  return (
    <section className="bg-white border-y border-slate-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs sm:text-sm text-slate-400 mb-5 tracking-wide">
          {t('partnerLogos.intro')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12">
          {labels.map((label, i) => {
            const Icon = LOGO_ICONS[i] || Building2;
            return (
              <div key={i} className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <Icon className="w-5 h-5 text-[#6B5D4F]" />
                <span className="text-sm sm:text-base font-semibold text-slate-500 whitespace-nowrap">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}