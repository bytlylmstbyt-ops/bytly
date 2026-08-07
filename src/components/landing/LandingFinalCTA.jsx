import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function LandingFinalCTA() {
  const { isRTL, t } = useLanguage();

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-[#F5F0E8] to-amber-50/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center mb-5">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-[#1a1a2e] mb-4">{t("landing.finalCTA.title")}</h2>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-8">{t("landing.finalCTA.desc")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/RegisterChoice">
              <Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90 text-base px-8 h-12 w-full sm:w-auto">
                {t("landing.finalCTA.cta")}
                <ArrowLeft className={`w-5 h-5 ${isRTL ? "" : "rotate-180"}`} />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}