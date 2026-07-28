import React from "react";
import { motion } from "framer-motion";
import { Package, CreditCard, FileText, UserPlus } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

const PurchasingSection = () => {
  const { t } = useLanguage();
  const steps = [
    { icon: UserPlus, key: "register" },
    { icon: Package, key: "package" },
    { icon: FileText, key: "quote" },
    { icon: CreditCard, key: "subscription" },
  ];

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-3">
            {t("home.purchasing.title")}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {t("home.purchasing.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {steps.map(({ icon: Icon, key }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl border border-[#C9A66B]/20 bg-gradient-to-br from-amber-50/60 to-white p-6 text-center hover-lift"
            >
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#6B5D4F] text-white text-sm font-bold flex items-center justify-center">
                {i + 1}
              </div>
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-[#1a1a2e] mb-1 text-sm md:text-base">
                {t(`home.purchasing.steps.${key}.title`)}
              </h3>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                {t(`home.purchasing.steps.${key}.desc`)}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-slate-500 text-sm mb-4">
            {t("home.purchasing.footer")}
          </p>
          <Link to={createPageUrl("RegisterChoice")}>
            <Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white px-8">
              {t("home.purchasing.cta")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PurchasingSection;