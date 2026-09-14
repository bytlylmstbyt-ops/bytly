import React from "react";
import { motion } from "framer-motion";
import {
  UserPlus, Settings, FolderPlus, Activity, CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

const STAGE_ICONS = [UserPlus, Settings, FolderPlus, Activity, CheckCircle2];

export default function LandingHowItWorks() {
  const { t } = useLanguage();
  const stages = t("landing.howItWorks.stages");

  return (
    <section className="py-16 md:py-24 bg-[#131221]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{t("landing.howItWorks.title")}</h2>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">{t("landing.howItWorks.subtitle")}</p>
        </motion.div>

        <div className="relative">
          <div className="hidden md:block absolute top-[2.75rem] left-[10%] right-[10%] h-px bg-gradient-to-r from-[#C9A66B]/20 via-[#C9A66B] to-[#C9A66B]/20" />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
            {stages.map((stage, i) => {
              const Icon = STAGE_ICONS[i] || CheckCircle2;
              const num = String(i + 1).padStart(2, "0");
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="relative w-[5.5rem] h-[5.5rem] rounded-full border-2 border-[#C9A66B]/40 bg-[#131221] flex items-center justify-center mb-4 z-10">
                    <div className="absolute inset-1 rounded-full border border-[#C9A66B]/15 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-[#C9A66B]" strokeWidth={1.5} />
                    </div>
                  </div>
                  <span className="text-[#C9A66B]/60 font-bold text-sm tracking-widest mb-1">{num}</span>
                  <h3 className="text-white font-bold text-sm md:text-base mb-1.5">{stage.label}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-[12rem]">{stage.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}