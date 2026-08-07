import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  PenTool, Building2, FileSearch, HardHat, Package, Briefcase,
} from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

const CAT_ICONS = [PenTool, Building2, FileSearch, HardHat, Package, Briefcase];
const CAT_LINKS = ["/Engineers", "/ConsultingFirms", "/Engineers", "/ContractorDashboard", "/SupplierDashboard", "/Projects"];

export default function LandingCategories() {
  const { t } = useLanguage();
  const categories = t("landing.categories.items");

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-white to-amber-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-3">{t("landing.categories.title")}</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">{t("landing.categories.subtitle")}</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat, i) => {
            const Icon = CAT_ICONS[i] || Briefcase;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.08 }}
              >
                <Link
                  to={CAT_LINKS[i] || "/Engineers"}
                  className="block p-5 rounded-2xl border border-[#C9A66B]/20 bg-white hover:border-[#C9A66B]/50 hover-lift text-center"
                >
                  <div className="w-12 h-12 mx-auto rounded-xl bg-[#C9A66B]/15 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-[#C9A66B]" />
                  </div>
                  <h3 className="font-bold text-[#1a1a2e] text-sm md:text-base">{cat.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{cat.desc}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}