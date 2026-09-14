import React from "react";
import { LanguageProvider, useLanguage } from "@/components/i18n/LanguageContext";
import LandingHero from "@/components/landing/LandingHero";
import LandingAbout from "@/components/landing/LandingAbout";
import LandingBenefits from "@/components/landing/LandingBenefits";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingCategories from "@/components/landing/LandingCategories";
import LandingTrust from "@/components/landing/LandingTrust";
import LandingFinalCTA from "@/components/landing/LandingFinalCTA";

function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  return (
    <button
      onClick={toggleLanguage}
      className="fixed top-4 right-4 z-50 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-[#E5D4B8] rounded-full px-3 py-1.5 shadow-sm hover:bg-white hover:shadow-md transition-all text-xs font-semibold text-[#9C8567]"
      title={language === "ar" ? "Switch to English" : "التبديل للعربية"}
    >
      <span className={language === "ar" ? "text-[#9C8567]" : "text-[#C9B89A]"}>AR</span>
      <span className="text-[#C9B89A]">|</span>
      <span className={language === "en" ? "text-[#9C8567]" : "text-[#C9B89A]"}>EN</span>
    </button>
  );
}

export default function PublicLanding() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A2E]">
        <LanguageToggle />
        <LandingHero />
        <LandingAbout />
        <LandingBenefits />
        <LandingHowItWorks />
        <LandingCategories />
        <LandingTrust />
        <LandingFinalCTA />
      </div>
    </LanguageProvider>
  );
}