import React, { useEffect } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/i18n/LanguageContext";
import LandingHero from "@/components/landing/LandingHero";
import LandingAbout from "@/components/landing/LandingAbout";
import LandingBenefits from "@/components/landing/LandingBenefits";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingCategories from "@/components/landing/LandingCategories";
import LandingTrust from "@/components/landing/LandingTrust";
import LandingFinalCTA from "@/components/landing/LandingFinalCTA";

function LandingContent() {
  const { language, toggleLanguage, t } = useLanguage();

  // Update SEO meta tags dynamically based on language
  useEffect(() => {
    document.title = t("landing.seo.title");

    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setOgMeta = (property, content) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", t("landing.seo.description"));
    setMeta("keywords", language === "ar"
      ? "بيتلي, هندسة, السعودية, مهندسون, مقاولون, استشاريون, عقود رقمية, ضمان مالي, كود البناء السعودي"
      : "Bytly, engineering, Saudi Arabia, engineers, contractors, consultants, digital contracts, escrow, Saudi Building Code"
    );
    setOgMeta("og:title", t("landing.seo.title"));
    setOgMeta("og:description", t("landing.seo.description"));
    setOgMeta("og:locale", language === "ar" ? "ar_SA" : "en_US");
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language, t]);

  return (
    <div className="min-h-screen bg-white relative">
      {/* Floating Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={toggleLanguage}
          className="flex items-center gap-2 bg-white shadow-lg border border-[#C9A66B]/20 text-[#6B5D4F] hover:bg-[#F5F0E8] rounded-full px-4 h-10"
          title={language === "ar" ? "Switch to English" : "التبديل للعربية"}
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm font-medium">{t("landing.langSwitch")}</span>
        </Button>
      </div>

      <LandingHero />
      <LandingAbout />
      <LandingBenefits />
      <LandingHowItWorks />
      <LandingCategories />
      <LandingTrust />
      <LandingFinalCTA />
    </div>
  );
}

export default function Landing() {
  return <LandingContent />;
}