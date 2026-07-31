import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Building2, ShieldCheck } from "lucide-react";
import BytlyAdvisorChat from "@/components/chatbot/BytlyAdvisorChat";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import LandingAbout from "@/components/landing/LandingAbout";
import LandingBenefits from "@/components/landing/LandingBenefits";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingTrust from "@/components/landing/LandingTrust";
import LandingFinalCTA from "@/components/landing/LandingFinalCTA";

const HERO_IMG =
  "https://media.base44.com/images/public/69741d7bf3195aeab86a1582/adb6fb572_generated_image.png";

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="flex flex-col items-center text-center gap-1">
      <Icon className="w-6 h-6 text-[#A68966]" />
      <div className="text-xl font-bold text-[#1A1A2E] leading-none">{value}</div>
      <div className="text-xs text-[#6B5D4F]">{label}</div>
    </div>
  );
}

function FooterBadge({ icon: Icon, text }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-[#1A1A2E]">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#F5F0E8]">
        <Icon className="w-4 h-4 text-[#A68966]" />
      </span>
      {text}
    </div>
  );
}

function Hero() {
  return (
    <main className="max-w-6xl mx-auto w-full px-6 md:px-10 py-10 md:py-16 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
      {/* Left — hero card with stats overlay */}
      <div className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-[4/5] md:aspect-[5/6] order-2 md:order-1">
        <img
          src={HERO_IMG}
          alt="مهندس يعمل على مخطط هندسي"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute bottom-5 inset-x-5 bg-white/85 backdrop-blur-md rounded-2xl p-4 flex justify-around shadow-lg">
          <Stat icon={Building2} value="500+" label="مشاريع" />
          <Stat icon={ShieldCheck} value="100%" label="ضمان" />
          <Stat icon={Sparkles} value="✨" label="ذكية مطابقة" />
        </div>
      </div>

      {/* Right — content */}
      <div className="order-1 md:order-2 flex flex-col gap-5">
        <span className="inline-flex items-center gap-2 self-end text-sm font-medium text-[#A68966] bg-[#F5F0E8] px-3 py-1.5 rounded-full">
          <Sparkles className="w-4 h-4" />
          المنظومة الهندسية المتكاملة في السعودية
        </span>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-[#1A1A2E]">
          بيتلي — منصة الوساطة الهندسية
        </h1>

        <h2 className="text-lg md:text-xl font-medium text-[#6B5D4F]">
          تربطك بالمهندسين والشركات والمقاولين في مكان واحد
        </h2>

        <p className="text-base md:text-lg text-[#4A3F35] leading-relaxed">
          من التصميم إلى التنفيذ: نشر مشروع، استلم عروضاً من مهندسين معتمدين، وقّع
          عقوداً رقمية، وتابع المراحل بضمان مالي محجوز ومراجعة استشارية لكل مخرج.
        </p>

        <div className="flex flex-wrap gap-3 mt-2">
          <Link
            to="/RegisterChoice"
            className="inline-flex items-center gap-2 bg-[#A68966] hover:bg-[#8f7355] text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-colors"
          >
            أنشئ حسابك الآن →
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white border border-[#D1D1D1] hover:border-[#A68966] text-[#1A1A2E] font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            تسجيل الدخول ←
          </Link>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 mt-6 pt-6 border-t border-[#E5D4B8]/60">
          <FooterBadge icon={ShieldCheck} text="ضمان مالي محجوز" />
          <FooterBadge icon={Building2} text="مطابقة كود البناء السعودي" />
          <FooterBadge icon={Sparkles} text="مطابقة ذكية للمهندسين" />
        </div>
      </div>
    </main>
  );
}

export default function PublicLanding() {
  return (
    <LanguageProvider>
      <div
        dir="rtl"
        className="min-h-screen bg-[#FFFEF9] text-[#1A1A2E]"
        style={{ fontFamily: "'Tajawal','Cairo',system-ui,sans-serif" }}
      >
        <Hero />
        <LandingAbout />
        <LandingBenefits />
        <LandingHowItWorks />
        <LandingTrust />
        <LandingFinalCTA />
        <BytlyAdvisorChat />
      </div>
    </LanguageProvider>
  );
}