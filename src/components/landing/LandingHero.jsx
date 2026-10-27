import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Sparkles, Building2, BriefcaseBusiness as BriefcaseBusinessIcon } from "lucide-react";
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
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Explain Bytly first so visitors understand the platform before seeing the visual. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-5"
            style={{ backgroundColor: "#F1EBE0", color: "#9C8567" }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isRTL ? "منصة الوساطة الهندسية" : "Engineering Marketplace"}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4" style={{ color: "#1B1C2A" }}>
            {isRTL ? "بيتلي — منصة الوساطة الهندسية" : "Bytly — The Engineering Marketplace"}
          </h1>

          <h2 className="text-lg md:text-2xl font-semibold mb-4 max-w-3xl mx-auto" style={{ color: "#4A4A4A" }}>
            {isRTL
              ? "نربطك بالمهندسين والمكاتب الهندسية والشركات والمقاولين في مكان واحد، من التصميم إلى التنفيذ."
              : "Connect with engineers, design offices, companies, and contractors in one place—from design to execution."}
          </h2>

          <p className="text-sm md:text-base leading-7 max-w-3xl mx-auto mb-7" style={{ color: "#62594F" }}>
            {isRTL
              ? "انشر مشروعك، واستقبل عروضًا من المهندسين المعتمدين، ووقّع العقود الرقمية، وتابع مراحل العمل مع ضمان مالي محجوز ومراجعة استشارية لكل مخرج."
              : "Post your project, receive proposals from qualified engineers, sign digital contracts, and track every stage with funds held securely and consultant review of each deliverable."}
          </p>
        </motion.div>

        {/* Main visual comes after the explanation and before the user chooses a path. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative mb-9 md:mb-11"
        >
          <div className="relative aspect-[16/9] md:aspect-[2/1] rounded-3xl overflow-hidden shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&q=85"
              alt={isRTL ? "واجهة معمارية تعبّر عن خدمات بيتلي الهندسية" : "Architectural showcase representing Bytly's engineering services"}
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,18,15,0.02) 35%, rgba(20,18,15,0.48) 100%)" }} />
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute bottom-3 right-3 left-3 md:bottom-5 md:right-5 md:left-5 rounded-2xl p-3 md:p-4 shadow-lg flex items-center justify-around gap-2"
              style={{ backgroundColor: "rgba(255,255,255,0.94)", backdropFilter: "blur(12px)" }}
            >
              {stats.map(({ icon: Icon, label, value }) => (
                <div key={label} className="text-center min-w-0">
                  <Icon className="w-4 h-4 md:w-5 md:h-5 mx-auto mb-1" style={{ color: "#9C8567" }} />
                  <div className="font-bold text-xs md:text-sm" style={{ color: "#1B1C2A" }}>{value}</div>
                  <div className="text-[9px] md:text-[10px]" style={{ color: "#9C8567" }}>{label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Registration choices remain connected to the existing registration flow. */}
        <div className="text-center">
          <h3 className="text-xl md:text-2xl font-bold mb-5" style={{ color: "#30251B" }}>
            {isRTL ? "كيف ترغب في استخدام بيتلي؟" : "How would you like to use Bytly?"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-start">
            <Link to="/RegisterChoice?flow=client" className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A68D6E] focus-visible:ring-offset-2">
              <div className="h-full rounded-2xl border border-[#DCC8A8] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="font-bold text-[#30251B]">{isRTL ? "أنا صاحب مشروع" : "I’m a project owner"}</span>
                  <Building2 className="h-5 w-5 shrink-0 text-[#A68D6E]" />
                </div>
                <p className="text-sm leading-6 text-[#6B6258]">
                  {isRTL ? "انشر مشروعك، واستقبل العروض، وتابع مراحل التنفيذ." : "Post your project, compare proposals, and track progress."}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#8A6A3D]">
                  {isRTL ? "ابدأ مشروعك" : "Start your project"}
                  <ArrowLeft className={`h-4 w-4 ${isRTL ? "" : "rotate-180"}`} />
                </span>
              </div>
            </Link>

            <Link to="/RegisterChoice?flow=provider" className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A68D6E] focus-visible:ring-offset-2">
              <div className="h-full rounded-2xl border border-[#DCC8A8] bg-[#F5EFE5] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="font-bold text-[#30251B]">{isRTL ? "أنا مقدم خدمة" : "I’m a service provider"}</span>
                  <BriefcaseBusinessIcon className="h-5 w-5 shrink-0 text-[#A68D6E]" />
                </div>
                <p className="text-sm leading-6 text-[#6B6258]">
                  {isRTL ? "اعرض خدماتك، واستقبل طلبات المشاريع، وأدر أعمالك." : "Showcase your services, receive project requests, and manage your work."}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#8A6A3D]">
                  {isRTL ? "انضم كمقدم خدمة" : "Join as a provider"}
                  <ArrowLeft className={`h-4 w-4 ${isRTL ? "" : "rotate-180"}`} />
                </span>
              </div>
            </Link>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center mt-6 text-xs" style={{ color: "#9C8567" }}>
            {trustItems.map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4" style={{ color: "#9C8567" }} />
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}