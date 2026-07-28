import React from "react";
import { motion } from "framer-motion";
import { UserPlus, Settings, FolderPlus, Activity, CheckCircle } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

const ProcessTimeline = () => {
  const { t } = useLanguage();
  const steps = [
    { icon: UserPlus, key: "register" },
    { icon: Settings, key: "setup" },
    { icon: FolderPlus, key: "create" },
    { icon: Activity, key: "track" },
    { icon: CheckCircle, key: "review" },
  ];

  return (
    <section className="py-16 md:py-20 bg-[#1a1a2e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            {t("home.process.title")}
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto">
            {t("home.process.subtitle")}
          </p>
        </motion.div>

        <div className="relative">
          {/* connecting line */}
          <div className="hidden md:block absolute top-8 right-0 left-0 h-0.5 bg-gradient-to-l from-[#C9A66B]/40 via-[#C9A66B]/60 to-[#C9A66B]/40" />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4 relative">
            {steps.map(({ icon: Icon, key }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="flex flex-col items-center text-center relative"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center mb-4 relative z-10 ring-4 ring-[#1a1a2e]">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-[#C9A66B] text-xs font-bold mb-1">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-semibold text-white text-sm md:text-base mb-1">
                  {t(`home.process.steps.${key}.title`)}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[180px]">
                  {t(`home.process.steps.${key}.desc`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessTimeline;