import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Sparkles, Building2, BriefcaseBusiness as BriefcaseBusinessIcon } from "lucide-react";
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

            {/* Role-based entry points: keep the existing account registration flow behind each choice. */}
            <div className="mb-8">
              <p className="text-sm font-semibold mb-3" style={{ color: "#6B5D4F" }}>
                {isRTL ? "كيف ترغب في استخدام بيتلي؟" : "How would you like to use Bytly?"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto lg:mx-0">
                <Link to="/RegisterChoice?flow=client" className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A68D6E] focus-visible:ring-offset-2">
                  <div className="h-full rounded-2xl border border-[#DCC8A8] bg-white p-4 text-start shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="font-bold text-[#30251B]">{isRTL ? "أنا صاحب مشروع" : "I’m a project owner"}</span>
                      <Building2 className="h-5 w-5 shrink-0 text-[#A68D6E]" />
                    </div>
                    <p className="text-sm leading-6 text-[#6B6258]">{isRTL ? "ابحث عن المتخصصين، واطلب عروض الأسعار، وتابع مشروعك." : "Find professionals, request quotes, and manage your project."}</p>
                    <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#8A6A3D]">
                      {isRTL ? "ابدأ مشروعك" : "Start your project"}
                      <ArrowLeft className={`h-4 w-4 ${isRTL ? "" : "rotate-180"}`} />
                    </span>
                  </div>
                </Link>
                <Link to="/RegisterChoice?flow=provider" className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A68D6E] focus-visible:ring-offset-2">
                  <div className="h-full rounded-2xl border border-[#DCC8A8] bg-[#F5EFE5] p-4 text-start shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="font-bold text-[#30251B]">{isRTL ? "أنا مقدم خدمة" : "I’m a service provider"}</span>
                      <BriefcaseBusinessIcon className="h-5 w-5 shrink-0 text-[#A68D6E]" />
                    </div>
                    <p className="text-sm leading-6 text-[#6B6258]">{isRTL ? "اعرض خدماتك، واستقبل الطلبات، وأدر مشاريعك ومستحقاتك." : "Showcase services, receive requests, and manage projects and earnings."}</p>
                    <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#8A6A3D]">
                      {isRTL ? "انضم كمقدم خدمة" : "Join as a provider"}
                      <ArrowLeft className={`h-4 w-4 ${isRTL ? "" : "rotate-180"}`} />
                    </span>
                  </div>
                </Link>
              </div>
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