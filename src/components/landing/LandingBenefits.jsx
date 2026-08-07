import React from "react";
import { motion } from "framer-motion";
import {
  PenTool, Building2, FileSearch, HardHat, Package, Home,
} from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

const ROLE_ICONS = [PenTool, Building2, FileSearch, HardHat, Package, Home];

export default function LandingBenefits() {
  const { t } = useLanguage();
  const roles = t("landing.benefits.roles");

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-amber-50/40 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-3">{t("landing.benefits.title")}</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">{t("landing.benefits.subtitle")}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role, i) => {
            const Icon = ROLE_ICONS[i] || PenTool;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.1 }}
                className="p-6 rounded-2xl border border-[#C9A66B]/20 bg-white hover-lift"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-[#1a1a2e] mb-2">{role.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">{role.desc}</p>
                <ul className="space-y-1.5">
                  {role.points.map((p, pi) => (
                    <li key={pi} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C9A66B] shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}