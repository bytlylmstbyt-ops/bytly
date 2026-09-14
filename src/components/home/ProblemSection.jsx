import React from "react";
import { motion } from "framer-motion";
import { Building2, ShieldCheck, Clock } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

const PROBLEM_KEYS = [
  { icon: Building2, key: "supervision" },
  { icon: ShieldCheck, key: "guarantee" },
  { icon: Clock, key: "delays" },
];

export default function ProblemSection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-[#FCFCFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-[#888888]">
            {t('problemSection.title')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROBLEM_KEYS.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="bg-white border border-[#EBEBEB] rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 rounded-full bg-[#F7F2E8] flex items-center justify-center mb-6">
                <item.icon className="w-7 h-7 text-[#C9A66B]" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-[#333333] mb-3">
                {t(`problemSection.problems.${item.key}.title`)}
              </h3>
              <p className="text-sm leading-relaxed text-[#666666]">
                {t(`problemSection.problems.${item.key}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}