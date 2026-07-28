import React from "react";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

const MissionSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-[#F5F0E8] to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center mb-5">
            <Compass className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-4">
            {t("home.mission.title")}
          </h2>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-6">
            {t("home.mission.body")}
          </p>
          <p className="text-[#6B5D4F] font-semibold text-sm md:text-base max-w-xl mx-auto">
            {t("home.mission.vision")}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MissionSection;