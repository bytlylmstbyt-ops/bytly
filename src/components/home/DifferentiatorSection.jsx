import React from "react";
import { motion } from "framer-motion";
import { Layers, GitBranch, ShieldCheck, Cpu, Workflow } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

const DifferentiatorSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Layers,
      key: "dataModel",
      outcome: "coordination",
    },
    {
      icon: Workflow,
      key: "milestoneFramework",
      outcome: "approvals",
    },
    {
      icon: Cpu,
      key: "matchingEngine",
      outcome: "matching",
    },
    {
      icon: ShieldCheck,
      key: "escrowReview",
      outcome: "compliance",
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-amber-50/40 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-[#C9A66B]/15 text-[#6B5D4F] px-4 py-1.5 rounded-full text-xs font-semibold mb-4">
            <GitBranch className="w-3.5 h-3.5" />
            {t("home.differentiator.badge")}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-3 max-w-2xl mx-auto">
            {t("home.differentiator.title")}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {t("home.differentiator.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, key, outcome }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-4 p-6 rounded-2xl border border-[#C9A66B]/20 bg-white hover-lift"
            >
              <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#1a1a2e] mb-1">
                  {t(`home.differentiator.features.${key}.title`)}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-2">
                  {t(`home.differentiator.features.${key}.desc`)}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#C9A66B] bg-[#C9A66B]/10 px-2.5 py-1 rounded-full">
                  {t(`home.differentiator.outcomes.${outcome}`)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Defensible feature spotlight — matching engine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#4A3F35] p-8 text-center"
        >
          <Cpu className="w-10 h-10 text-[#C9A66B] mx-auto mb-3" />
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
            {t("home.differentiator.spotlight.title")}
          </h3>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            {t("home.differentiator.spotlight.desc")}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default DifferentiatorSection;