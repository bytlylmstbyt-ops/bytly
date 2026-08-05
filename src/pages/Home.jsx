import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  Search, ArrowLeft, Star, CheckCircle, Users,
  Briefcase, Award, Shield, Palette, Building2,
  PenTool, Sparkles, ChevronLeft, Ruler, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import WelcomeSlides from "@/components/onboarding/WelcomeSlides";
import ProfessionalWelcomeSlides from "@/components/onboarding/ProfessionalWelcomeSlides";
import FirmWelcomeSlides from "@/components/onboarding/FirmWelcomeSlides";
import CorePillarsSection from "@/components/home/CorePillarsSection";
import TopRatedEngineers from "@/components/home/TopRatedEngineers";
import ProblemSection from "@/components/home/ProblemSection";
import SpecialtiesSection from "@/components/home/SpecialtiesSection";
import PurchasingSection from "@/components/home/PurchasingSection";
import DifferentiatorSection from "@/components/home/DifferentiatorSection";
import MissionSection from "@/components/home/MissionSection";
import PartnerLogosStrip from "@/components/home/PartnerLogosStrip";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import TrustBadgesSection from "@/components/home/TrustBadgesSection";
import ProofNumbersSection from "@/components/home/ProofNumbersSection";
import JsonLd from "@/components/seo/JsonLd";
import { webPageSchema } from "@/components/seo/buildSchema";
import PreLaunchSurveyModal from "@/components/survey/PreLaunchSurveyModal";
import { useScrollDepthTracking } from "@/hooks/useScrollDepthTracking";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { ClipboardList } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Home() {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  useScrollDepthTracking('home');
  const [engineers, setEngineers] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userType, setUserType] = useState(null);
  const [showSurvey, setShowSurvey] = useState(false);

  useEffect(() => {
    if (isAuthenticated) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Decouple welcome-check from auth state — runs once when auth resolves.
  useEffect(() => {
    if (isAuthenticated && user) {
      checkUserAndWelcome(user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const handleSurveyClose = () => {
    localStorage.setItem("bytly_survey_seen", "true");
    setShowSurvey(false);
  };

  const checkUserAndWelcome = async (currentUser) => {
    try {
      const hasSeenWelcome = localStorage.getItem(`bytly_seen_welcome_${currentUser.email}`);
      if (hasSeenWelcome) return;

      // Check if user is an engineer
      try {
        const engineers = await base44.entities.Engineer.filter({ email: currentUser.email }, null, 1);
        if (engineers.length > 0) {
          setUserType('engineer');
          setShowWelcome(true);
          return;
        }
      } catch (e) {
        // 401/403 = expired or invalid token — skip welcome, don't crash
        if (e?.status !== 401 && e?.status !== 403) console.warn("Engineer check failed:", e.message);
        else return; // token invalid — no point trying more entity calls
      }

      // Check if user is a firm
      try {
        const firms = await base44.entities.EngineeringFirm.filter({ email: currentUser.email }, null, 1);
        if (firms.length > 0) {
          setUserType('firm');
          setShowWelcome(true);
          return;
        }
      } catch (e) {
        if (e?.status === 401 || e?.status === 403) return;
        console.warn("Firm check failed:", e.message);
      }

      // Check if user is a client
      try {
        const clients = await base44.entities.Client.filter({ email: currentUser.email }, null, 1);
        if (clients.length > 0) {
          setUserType('client');
          setShowWelcome(true);
          return;
        }
      } catch (e) {
        if (e?.status === 401 || e?.status === 403) return;
        console.warn("Client check failed:", e.message);
      }
    } catch (error) {
      console.warn("Welcome check failed:", error.message);
    }
  };

  const handleWelcomeComplete = async () => {
    try {
      const currentUser = user || await base44.auth.me();
      localStorage.setItem(`bytly_seen_welcome_${currentUser.email}`, 'true');
    } catch (error) {
      localStorage.setItem('bytly_seen_welcome', 'true');
    }
    setShowWelcome(false);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [engineersData, portfoliosData] = await Promise.all([
        base44.entities.Engineer.filter({ status: "approved", is_verified: true }, "-rating", 6),
        base44.entities.Portfolio.filter({ is_featured: true }, "-created_date", 8)
      ]);
      
      setEngineers(engineersData);
      setPortfolios(portfoliosData);
    } catch (error) {
      console.error("loadData error:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { icon: Palette, title: t('home.categories.interior'), count: "500+", color: "from-rose-500 to-orange-500" },
    { icon: Building2, title: t('home.categories.architecture'), count: "300+", color: "from-blue-500 to-cyan-500" },
    { icon: Building2, title: t('home.categories.civil'), count: "250+", color: "from-gray-600 to-slate-700" },
    { icon: PenTool, title: t('home.categories.drafting'), count: "200+", color: "from-violet-500 to-purple-500" },
    { icon: Ruler, title: t('home.categories.executive'), count: "150+", color: "from-emerald-500 to-teal-500" },
    { icon: Sparkles, title: t('home.categories.decor'), count: "400+", color: "from-amber-500 to-yellow-500" },
  ];

  const stats = [
    { value: "1000+", label: t('home.hero.stats.engineers') },
    { value: "5000+", label: t('home.hero.stats.projects') },
    { value: "98%", label: t('home.hero.stats.satisfaction') },
    { value: "24/7", label: t('home.hero.stats.support') },
  ];

  return (
    <div className="overflow-hidden">
      <JsonLd data={webPageSchema({ name: "بيتلي — المنظومة الهندسية المتكاملة", description: "منصة هندسية متكاملة تجمع المهندسين والمعماريين والمساحين مع أصحاب المشاريع في المملكة العربية السعودية.", path: "" })} />
      {/* Welcome Onboarding */}
      {showWelcome && userType === 'engineer' && (
        <ProfessionalWelcomeSlides 
          onComplete={handleWelcomeComplete}
          onSkip={handleWelcomeComplete}
        />
      )}
      {showWelcome && userType === 'firm' && (
        <FirmWelcomeSlides 
          onComplete={handleWelcomeComplete}
          onSkip={handleWelcomeComplete}
        />
      )}
      {showWelcome && userType === 'client' && (
        <WelcomeSlides 
          onComplete={handleWelcomeComplete}
          onSkip={handleWelcomeComplete}
        />
      )}

      {/* Hero Section */}
      <section data-section="hero" className="relative min-h-[88vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e]/95 via-[#1a1a2e]/82 to-[#C9A66B]/30" />
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920"
            alt="مساحة تصميم داخلي حديثة كخلفية لصفحة بيتلي الرئيسية للمنظومة الهندسية المتكاملة"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-transparent to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
          <div className="grid lg:grid-cols-2 gap-14 xl:gap-20 items-center">
            {/* Text column */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex md:justify-start mb-8">
                <Badge className="bg-gradient-to-r from-white/15 to-white/5 text-white border-[#C9A66B]/40 px-5 py-2 text-center text-xs sm:text-sm shadow-lg shadow-[#C9A66B]/10 backdrop-blur-md">
                  <Sparkles className="w-4 h-4 ml-2 shrink-0 text-[#C9A66B]" />
                  <span className="leading-tight">{t('home.hero.badge')}</span>
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] font-bold text-white leading-[1.25] mb-7 break-words text-balance px-1">
                {t('home.hero.title')}{" "}
                <span className="inline-block py-1 px-2 text-transparent bg-clip-text bg-gradient-to-r from-[#C9A66B] to-[#E5D4B8]">
                  {t('home.hero.titleHighlight')}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 mb-10 max-w-xl leading-relaxed">
                {t('home.hero.subtitle')}
              </p>

              {/* Marketing Phrase — merged into a single lighter line to reduce clutter before the first CTA */}
              <p className="text-base sm:text-lg font-semibold text-white/95 mb-8 max-w-xl leading-snug">
                {t('marketingPhrase.prefix')}{" "}
                <span className="text-[#C9A66B]">{t('marketingPhrase.highlight')}</span>
              </p>

              {/* Positioning — target audience + reason to choose */}
              <div className="mb-10 space-y-4 max-w-xl">
                <p className="text-sm text-[#E5D4B8] font-medium flex items-start gap-3">
                  <Users className="w-4 h-4 mt-0.5 shrink-0 text-[#C9A66B]" />
                  {t('home.hero.targetAudience')}
                </p>
                <p className="text-sm text-slate-300 flex items-start gap-3">
                  <Shield className="w-4 h-4 mt-0.5 shrink-0 text-[#C9A66B]" />
                  {t('home.hero.reasonToChoose')}
                </p>
              </div>

              {/* Search Box */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2.5 border border-white/20 max-w-xl">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder={t('home.hero.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      enterKeyHint="search"
                      inputMode="search"
                      className="w-full pr-12 h-14 bg-white border-0 rounded-xl text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                  <Link to={createPageUrl("Engineers") + (searchQuery ? `?search=${searchQuery}` : "")}>
                    <Button className="h-14 px-8 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white rounded-xl hover:opacity-90 w-full sm:w-auto">
                      {t('home.hero.searchButton')}
                      <ArrowLeft className="w-5 h-5 mr-2" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl("CreateProject")}>
                    <Button variant="outline" className="h-14 px-8 bg-white/15 text-white border-white/30 hover:bg-white/25 rounded-xl w-full sm:w-auto">
                      <Plus className="w-5 h-5 ml-1" />
                      ابدأ مشروعك
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Stats — separated by a soft divider for breathing room */}
              <div className="mt-14 pt-8 border-t border-white/10 max-w-xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="text-center md:text-right"
                    >
                      <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                      <div className="text-xs sm:text-sm text-slate-400 mt-1.5">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Hero Image/Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block relative"
            >
              <div className="relative">
                <div className="absolute -top-6 -right-6 w-72 h-72 bg-gradient-to-br from-[#C9A66B]/25 to-transparent rounded-full blur-3xl" />
                <div className="relative grid grid-cols-2 gap-5">
                  <div className="space-y-5">
                    <div className="h-44 rounded-2xl overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400"
                        alt="نموذج تصميم داخلي سكني من أعمال منصة بيتلي الهندسية"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="h-60 rounded-2xl overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400"
                        alt="نموذج تصميم معماري وتشطيب من مشاريع بيتلي المنجزة"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-5 pt-10">
                    <div className="h-60 rounded-2xl overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400"
                        alt="نموذج واجهة معمارية خارجية لمشروع هندسي على بيتلي"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="h-44 rounded-2xl overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=400"
                        alt="نموذج تشطيب وديكور داخلي لمشروع هندسي على منصة بيتلي"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Partner / Sector Logos Strip */}
      <div data-section="partners"><PartnerLogosStrip /></div>

      {/* Purchasing Options — how customers start (moved above elite engineers) */}
      <div data-section="purchasing"><PurchasingSection /></div>

      {/* Problem Section — under "how to start with Bytly" */}
      <div data-section="problem"><ProblemSection /></div>

      {/* Differentiator — unique capabilities */}
      <div data-section="differentiator"><DifferentiatorSection /></div>

      {/* Specialties Section */}
      <div data-section="specialties"><SpecialtiesSection /></div>

      {/* Top-Rated Engineers Leaderboard — auth only */}
      {isAuthenticated && <TopRatedEngineers />}

      {/* Portfolio Gallery — auth only */}
      {isAuthenticated && (
      <section data-section="portfolio" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
              {t('home.portfolio.title')}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {t('home.portfolio.subtitle')}
            </p>
          </motion.div>

          {portfolios.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {portfolios.map((portfolio, index) => (
                <motion.div
                  key={portfolio.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className={`group relative overflow-hidden rounded-2xl cursor-pointer ${
                    index === 0 || index === 5 ? "md:col-span-2 md:row-span-2" : ""
                  }`}
                >
                  <Link to={createPageUrl("Gallery") + `?id=${portfolio.id}`}>
                    <div className="aspect-square">
                      <img
                          src={portfolio.images?.[0] || "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=600"}
                          alt={portfolio.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-semibold">{portfolio.title}</h3>
                        <p className="text-white/80 text-sm">{portfolio.category}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Palette className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">{t('home.portfolio.noPortfolios')}</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Link to={createPageUrl("Gallery")}>
              <Button className="bg-gradient-to-r from-[#1A1A2E] to-[#C9A66B] text-white px-8">
                {t('home.portfolio.exploreMore')}
                <ChevronLeft className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      )}

      {/* Core Pillars */}
      <div data-section="pillars"><CorePillarsSection /></div>

      {/* Mission — about us short section */}
      <div data-section="mission"><MissionSection /></div>

      {/* Testimonials — شهادات قصيرة بنتائج قابلة للقياس */}
      <div data-section="testimonials"><TestimonialsSection /></div>

      {/* Trust Badges — إشارات الثقة والاعتماد */}
      <div data-section="trust"><TrustBadgesSection /></div>

      {/* Proof Numbers + Dated element — أرقام الإثبات وعنصر مؤرخ */}
      <div data-section="proof"><ProofNumbersSection /></div>



      {/* Pre-launch Survey Modal */}
      <PreLaunchSurveyModal
        open={showSurvey}
        onClose={handleSurveyClose}
        sourcePage="home"
      />

      {/* CTA Section */}
      <section data-section="cta" className="py-20 bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {t('home.cta.title')}
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              {t('home.cta.subtitle')}
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-white text-[#1a1a2e] hover:bg-white/90 px-8 py-6 text-lg">
                أنشئ حسابك الآن
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
            {/* Microcopy — what happens next */}
            <p className="text-white/80 text-sm mt-4 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-white" />
              {t('home.cta.microcopy')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pre-launch Survey CTA — end of page */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-slate-50 to-[#F5F0E8]/50">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white border border-[#C9A66B]/15 p-8 md:p-10 text-center shadow-xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#C9A66B] to-[#6B5D4F] flex items-center justify-center mb-5 shadow-lg">
              <ClipboardList className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-[#2D2A42] mb-2">
              {t('survey.ctaTitle')}
            </h3>
            <p className="text-[#666666] mb-6 text-sm md:text-base">
              {t('survey.ctaSubtitle')}
            </p>
            <Button
              onClick={() => setShowSurvey(true)}
              className="bg-gradient-to-r from-[#C9A66B] to-[#6B5D4F] text-white px-8 py-3 h-12 hover:opacity-90"
            >
              <ClipboardList className="w-4 h-4" />
              {t('survey.ctaButton')}
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}