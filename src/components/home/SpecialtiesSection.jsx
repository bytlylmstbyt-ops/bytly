import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette, Building2, HardHat, PenTool, Ruler, Sparkles,
  CheckCircle2, Lightbulb, FileCheck, ShieldCheck, Calculator, UserRound, ChevronLeft
} from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

const SPECIALTIES = [
  { id: "interior", icon: Palette, color: "#F4514D", count: "500+" },
  { id: "architecture", icon: Building2, color: "#2997D6", count: "300+" },
  { id: "civil", icon: HardHat, color: "#4A5568", count: "250+" },
  { id: "drafting", icon: PenTool, color: "#8A4AF3", count: "200+" },
  { id: "executive", icon: Ruler, color: "#00C853", count: "150+" },
  { id: "decor", icon: Sparkles, color: "#FFAB00", count: "400+" },
];

export default function SpecialtiesSection() {
  const { t, language } = useLanguage();
  const [selected, setSelected] = useState(0);
  const specialty = SPECIALTIES[selected];

  const charterPoints = t('specialtiesSection.charter.points') || [];

  return (
    <section className="py-20 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
            {t('specialtiesSection.title')}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {t('specialtiesSection.subtitle')}
          </p>
        </motion.div>

        {/* Category Tabs */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 mb-8">
          {SPECIALTIES.map((spec, index) => {
            const isActive = index === selected;
            return (
              <button
                key={spec.id}
                onClick={() => setSelected(index)}
                className={`rounded-2xl p-4 text-center transition-all duration-200 ${
                  isActive
                    ? "bg-white border-2 shadow-lg"
                    : "bg-white border border-[#EBEBEB] hover:shadow-md opacity-70 hover:opacity-100"
                }`}
                style={isActive ? { borderColor: spec.color } : {}}
              >
                <div
                  className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2"
                  style={{ backgroundColor: spec.color }}
                >
                  <spec.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-sm text-[#333333]">{t(`specialtiesSection.specialties.${spec.id}.title`)}</h3>
                <p className="text-xs text-slate-400">{spec.count} {t('specialtiesSection.specialistsCount')}</p>
              </button>
            );
          })}
        </div>

        {/* Detail Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={specialty.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-xl border border-[#EBEBEB] overflow-hidden"
          >
            <div className="grid lg:grid-cols-[320px_1fr]">
              {/* Left: Charter Sidebar */}
              <div className="bg-[#F9F7F2] p-6 lg:p-8 border-l border-[#EBEBEB]">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <FileCheck className="w-5 h-5 text-[#C9A66B]" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-bold text-[#333333]">{t('specialtiesSection.charter.title')}</h3>
                </div>

                <ul className="space-y-3 mb-6">
                  {charterPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" strokeWidth={1.5} />
                      <span className="text-sm text-[#555555] leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="bg-white rounded-xl p-4 border border-[#F0E6D6]">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-[#C9A66B] shrink-0" strokeWidth={1.5} />
                    <span className="text-sm font-bold text-[#C9A66B]">{t('specialtiesSection.charter.advisory')}</span>
                  </div>
                  <p className="text-xs text-[#777777] leading-relaxed">{t('specialtiesSection.charter.advisoryText')}</p>
                </div>
              </div>

              {/* Right: Details */}
              <div className="p-6 lg:p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-1">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: specialty.color }}
                  >
                    <specialty.icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-[#333333]">{t(`specialtiesSection.specialties.${specialty.id}.title`)}</h3>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#666666] bg-[#F5F5F5] px-3 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.5} />
                    {t('specialtiesSection.bytlyProtection')}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">{t('specialtiesSection.guideLabel')}</p>

                {/* Description */}
                <div className="bg-[#F9F9F9] rounded-xl p-4 mb-5">
                  <p className="text-sm text-[#555555] leading-relaxed">{t(`specialtiesSection.specialties.${specialty.id}.description`)}</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <div className="bg-[#F9F9F9] rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">{t('specialtiesSection.buildingCodeLabel')}</p>
                    <p className="text-sm font-medium text-[#C9A66B] leading-relaxed">{t(`specialtiesSection.specialties.${specialty.id}.buildingCode`)}</p>
                  </div>
                  <div className="bg-[#F9F9F9] rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">{t('specialtiesSection.durationLabel')}</p>
                    <p className="text-sm font-bold text-[#333333]">{t(`specialtiesSection.specialties.${specialty.id}.duration`)}</p>
                  </div>
                  <div className="bg-[#F9F9F9] rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">{t('specialtiesSection.priceLabel')}</p>
                    <p className="text-sm font-bold text-[#333333]">{t(`specialtiesSection.specialties.${specialty.id}.price`)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/CostEstimator"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#C9A66B] text-[#C9A66B] text-sm font-medium hover:bg-[#C9A66B]/5 transition-colors"
                  >
                    <Calculator className="w-4 h-4" strokeWidth={1.5} />
                    {t('specialtiesSection.budgetAction')}
                  </Link>
                  <Link
                    to={`/Engineers?category=${encodeURIComponent(t(`specialtiesSection.specialties.${specialty.id}.title`))}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1A1A1A] text-white text-sm font-medium hover:bg-[#333333] transition-colors flex-1"
                  >
                    {t('specialtiesSection.hireAction')} {t(`specialtiesSection.specialties.${specialty.id}.title`)}
                    <UserRound className="w-4 h-4" strokeWidth={1.5} />
                    <ChevronLeft className={`w-4 h-4 ${language === 'ar' ? '' : 'rotate-180'}`} strokeWidth={1.5} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}