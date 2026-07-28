import React from "react";
import { motion } from "framer-motion";
import { Check, X, Table2, ListChecks, HardHat } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

const ComparisonSection = () => {
  const { t } = useLanguage();

  const alternatives = [
    { icon: Table2, key: "spreadsheets" },
    { icon: ListChecks, key: "generalTools" },
    { icon: HardHat, key: "traditionalTracking" },
  ];

  const rows = ["coordination", "compliance", "reporting", "payments", "matching"];

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-3">
            {t("home.comparison.title")}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {t("home.comparison.subtitle")}
          </p>
        </motion.div>

        {/* One-liner comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 rounded-2xl bg-amber-50/60 border border-[#C9A66B]/20 p-5"
        >
          <p className="text-sm md:text-base text-[#4A3F35] font-medium">
            {t("home.comparison.oneLiner")}
          </p>
        </motion.div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-x-auto rounded-2xl border border-slate-200"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-right p-4 font-semibold text-[#1a1a2e]">
                  {t("home.comparison.table.capability")}
                </th>
                {alternatives.map(({ icon: Icon, key }) => (
                  <th key={key} className="p-4 text-center font-semibold text-slate-500">
                    <Icon className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                    {t(`home.comparison.table.${key}`)}
                  </th>
                ))}
                <th className="p-4 text-center font-bold text-white bg-gradient-to-b from-[#6B5D4F] to-[#C9A66B] rounded-tl-xl">
                  <span className="text-[#C9A66B]">✦</span>
                  <div className="mt-1">بيتلي</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={row} className={ri % 2 ? "bg-slate-50/50" : "bg-white"}>
                  <td className="p-4 font-medium text-[#1a1a2e]">
                    {t(`home.comparison.table.rows.${row}`)}
                  </td>
                  {alternatives.map(({ key }) => (
                    <td key={key} className="p-4 text-center">
                      <X className="w-5 h-5 text-red-400 mx-auto" />
                    </td>
                  ))}
                  <td className="p-4 text-center bg-amber-50/40">
                    <Check className="w-5 h-5 text-green-600 mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection;