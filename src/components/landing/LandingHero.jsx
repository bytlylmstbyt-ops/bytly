import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function LandingHero() {
  const { isRTL, t } = useLanguage();

  const stats = [
    { icon: Sparkles, label: t("landing.hero.stat3Label"), value: t("landing.hero.stat3Value") },
    { icon: ShieldCheck, label: t("landing.hero.stat2Label"), value: t("landing.hero.stat2Value") },
    { icon: Building2, label: t("landing.hero.stat1Label"), value: t("landing.hero.stat1Value") },
  ];

  const trustItems = [
    { icon: ShieldCheck, text: t("landing.hero.trust1") },
    { icon: Building2, text: t("landing.hero.trust2") },
    { icon: Sparkles, text: t("landing.hero.trust3") },
  ];

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: "#FDFBF7" }}>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Text Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-start"
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
              style={{ backgroundColor: "#F1EBE0", color: "#9C8567" }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t("landing.hero.badge")}
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl md:text-[2.75rem] font-bold leading-tight mb-3" style={{ color: "#1B1C2A" }}>
              {t("landing.hero.title")}
            </h1>

            {/* Subheading */}
            <h2 className="text-xl md:text-2xl font-semibold mb-4" style={{ color: "#4A4A4A" }}>
              {t("landing.hero.subtitle")}
            </h2>

            {/* Description */}
            <p className="text-sm md:text-base leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0" style={{ color: "#4A4A4A" }}>
              {t("landing.hero.desc")}
            </p>

            {/* CTA Button */}
            <div className="flex justify-center lg:justify-start mb-8">
              <Link to="/RegisterChoice">
                <Button
                  className="text-white text-base px-8 h-12 rounded-xl hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#A68D6E" }}
                >
                  {t("landing.hero.cta")}
                  <ArrowLeft className={`w-5 h-5 ${isRTL ? "" : "rotate-180"}`} />
                </Button>
              </Link>
            </div>

            {/* Trust Tags */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center lg:justify-start text-xs" style={{ color: "#9C8567" }}>
              {trustItems.map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4" style={{ color: "#9C8567" }} />
                  {text}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Image Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80"
                alt={t("landing.hero.imgAlt")}
                className="w-full h-full object-cover"
              />

              {/* Stats Overlay Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-4 right-4 left-4 rounded-2xl p-4 shadow-lg flex items-center justify-around gap-2"
                style={{ backgroundColor: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)" }}
              >
                {stats.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="text-center">
                    <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: "#9C8567" }} />
                    <div className="font-bold text-sm" style={{ color: "#1B1C2A" }}>{value}</div>
                    <div className="text-[10px]" style={{ color: "#9C8567" }}>{label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}