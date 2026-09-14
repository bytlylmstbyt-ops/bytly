import React from "react";
import { motion } from "framer-motion";
import { Briefcase, Users, Compass } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

const ICONS = [Briefcase, Users, Compass];

export default function AboutOverviewSection() {
  const { t } = useLanguage();
  const blocks = (t('about.overview.blocks') || []).map((b, i) => ({ ...b, icon: ICONS[i] || Briefcase }));

  return (
    <section>
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#4A3F35] mb-2">{t('about.overview.title')}</h2>
        <p className="text-slate-500 max-w-xl mx-auto">{t('about.overview.subtitle')}</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-5">
        {blocks.map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#F5F0E8]/40 rounded-2xl p-5 border border-[#C9A66B]/20"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center mb-3">
              <b.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-[#4A3F35] mb-2">{b.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{b.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}