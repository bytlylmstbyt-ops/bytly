import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import BytlyAdvisorChat from "@/components/chatbot/BytlyAdvisorChat";
import MessageNotificationBadge from "@/components/notifications/MessageNotificationBadge";
import NotificationBell from "@/components/notifications/NotificationBell";
import { LanguageProvider, useLanguage } from "@/components/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { 
  Search, MessageSquare, User, Menu, X, 
  LogOut, Briefcase, Settings, Wallet, Bell, 
  PlusCircle, ChevronDown, Instagram, Facebook, Mail, Phone, MessagesSquare, Scale, Linkedin, Twitter, Bot
} from "lucide-react";
import Logo from "@/components/Logo";
import BottomNav from "@/components/mobile/BottomNav";
import BackButton from "@/components/mobile/BackButton";
import PageTransition from "@/components/mobile/PageTransition";
import PullToRefreshWrapper from "@/components/mobile/PullToRefreshWrapper";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function LayoutContent({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        setIsAuthenticated(authenticated);
        if (authenticated) {
          const userData = await base44.auth.me();
          setUser(userData);
        }
      } catch (error) {
        console.log("Not authenticated");
      }
    };
    checkAuth();
  }, []);

  const publicPages = ["Home", "Engineers", "EngineerProfile", "Login", "RegisterEngineer", "RegisterClient"];
  const isPublicPage = publicPages.includes(currentPageName);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isRTL ? "rtl" : "ltr"}>
      <style>{`
        :root {
          --primary: #6B5D4F;
          --primary-dark: #4A3F35;
          --accent: #C9A66B;
          --accent-light: #E5D4B8;
          --gold: #B8936D;
          --bronze: #A07D5C;
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(201, 166, 107, 0.2);
        }

        .gradient-text {
          background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hover-lift {
          transition: all 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(107, 93, 79, 0.15);
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-effect shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Back Button (mobile) + Logo */}
            <div className="flex items-center gap-1">
              <BackButton />
              <Link to={createPageUrl("Home")} className="flex items-center">
                <Logo size="default" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {[
                { to: createPageUrl("Home"), label: t('nav.home'), name: 'Home' },
                { to: createPageUrl("Engineers"), label: t('nav.engineers'), name: 'Engineers' },
                { to: createPageUrl("ConsultingFirms"), label: 'الشركات الاستشارية', name: 'ConsultingFirms' },
                { to: createPageUrl("Projects"), label: 'المشاريع', name: 'Projects' },
                { to: createPageUrl("Gallery"), label: 'معرض الأعمال', name: 'Gallery' },
              ].map(({ to, label, name }) => (
                <Link
                  key={name}
                  to={to}
                  className={`inline-flex items-center justify-center px-3 text-[14px] font-medium transition-colors hover:text-[#C9A66B] rounded-md ${currentPageName === name ? 'text-[#C9A66B]' : 'text-[#6B5D4F]'}`}
                  style={{ minHeight: 44 }}
                >
                  {label}
                </Link>
              ))}

              {/* Bytly Sections Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-[#C9A66B] focus:outline-none ${['CostEstimator','ConstructionTracker','TechnicalResources','PermitApplication','EngineerMatcher','DesignMarketplace','AIEngineers'].includes(currentPageName) ? 'text-[#C9A66B]' : 'text-[#6B5D4F]'}`}>
                    أقسام بيتلي
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <DropdownMenuItem asChild>
                    <Link to="/CostEstimator" className="flex items-center gap-2 cursor-pointer">
                      🧮 حاسبة التكاليف
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/ConstructionTracker" className="flex items-center gap-2 cursor-pointer">
                      🏗️ متابعة البناء
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/TechnicalResources" className="flex items-center gap-2 cursor-pointer">
                      📐 المعايير الفنية
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/PermitApplication" className="flex items-center gap-2 cursor-pointer">
                      🏛️ رخصة البناء
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/EngineerMatcher" className="flex items-center gap-2 cursor-pointer">
                      ✨ ابحث عن مهندسك
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("DesignMarketplace")} className="flex items-center gap-2 cursor-pointer">
                      🎨 متجر التصاميم
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/AIEngineers" className="flex items-center gap-2 cursor-pointer">
                      <Bot className="w-4 h-4 text-[#C9A66B]" />
                      Bytly AI
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link 
                to={createPageUrl("Messages")} 
                className={`text-sm font-medium transition-colors hover:text-[#C9A66B] flex items-center gap-1.5 ${currentPageName === 'Messages' ? 'text-[#C9A66B]' : 'text-[#6B5D4F]'}`}
              >
                <MessagesSquare className="w-4 h-4" />
                المحادثات
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="ghost" />
              {isAuthenticated && user ? (
                  <>
                    <Link to={createPageUrl("Messages")} className="relative p-2 hover:bg-slate-100 rounded-full transition-colors" title={t('nav.messages')}>
                      <MessageSquare className="w-5 h-5 text-slate-600" />
                    </Link>
                  <NotificationBell />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 px-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.profile_image} />
                          <AvatarFallback className="bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white">
                              {user.full_name?.charAt(0) || user.email?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {t('nav.dashboard')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("MyPurchasedProjects")} className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          {t('nav.myProjects')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/MyContracts" className="flex items-center gap-2">
                          <Scale className="w-4 h-4" />
                          عقودي
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Wallet")} className="flex items-center gap-2">
                          <Wallet className="w-4 h-4" />
                          {t('nav.wallet')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("WalletTopup")} className="flex items-center gap-2 text-blue-600">
                          <PlusCircle className="w-4 h-4" />
                          {t('nav.topupWallet')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Settings")} className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          {t('nav.settings')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('nav.logout')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => base44.auth.redirectToLogin()}
                    className="text-[#6B5D4F] hover:text-[#C9A66B]"
                  >
                    {t('nav.login')}
                  </Button>
                  <Link to={createPageUrl("RegisterChoice")}>
                    <Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90">
                      {t('nav.joinBytly')}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button — 44px tap target */}
              <button
                className="md:hidden flex items-center justify-center hover:bg-slate-100 rounded-lg"
                style={{ minWidth: 44, minHeight: 44 }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden glass-effect border-t">
            <div className="px-4 py-2 space-y-0.5">
              {[
                { to: createPageUrl("Home"), label: t('nav.home') },
                { to: createPageUrl("Engineers"), label: t('nav.engineers') },
                { to: createPageUrl("ConsultingFirms"), label: 'الشركات الاستشارية' },
                { to: createPageUrl("Projects"), label: 'المشاريع' },
                { to: createPageUrl("Gallery"), label: 'معرض الأعمال' },
                { to: createPageUrl("Messages"), label: 'المحادثات' },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center px-4 rounded-lg hover:bg-slate-100 text-slate-700 text-[14px] font-medium"
                  style={{ minHeight: 44 }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              {/* Bytly Sections group */}
              <div className="pt-2 pb-1 px-4 text-xs font-semibold text-[#C9A66B] uppercase tracking-wide">أقسام بيتلي</div>
              {[
                { to: "/CostEstimator", label: "🧮 حاسبة التكاليف" },
                { to: "/ConstructionTracker", label: "🏗️ متابعة البناء" },
                { to: "/TechnicalResources", label: "📐 المعايير الفنية" },
                { to: "/PermitApplication", label: "🏛️ رخصة البناء" },
                { to: "/EngineerMatcher", label: "✨ ابحث عن مهندسك" },
                { to: createPageUrl("DesignMarketplace"), label: "🎨 متجر التصاميم" },
                { to: "/AIEngineers", label: "🤖 Bytly AI" },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center px-4 rounded-lg hover:bg-slate-100 text-slate-700 text-[14px]"
                  style={{ minHeight: 44 }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-16 md:pt-20 min-h-screen pb-16 md:pb-0 safe-area-wrapper">
        <PullToRefreshWrapper onRefresh={() => window.location.reload()} className="min-h-screen">
          <PageTransition>
            {children}
          </PageTransition>
        </PullToRefreshWrapper>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Bytly AI Advisor */}
      <BytlyAdvisorChat />

      {/* Footer */}
      <footer className="bg-[#4A3F35] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="mb-4">
                <Logo size="large" isDark={true} />
              </div>
              <p className="text-slate-300 text-sm leading-relaxed max-w-md">
                {t('footer.description')}
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold mb-4 text-[#C9A66B]">{t('footer.quickLinks')}</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link to={createPageUrl("Home")} className="hover:text-[#C9A66B] transition-colors">{t('nav.home')}</Link></li>
                <li><Link to={createPageUrl("Engineers")} className="hover:text-[#C9A66B] transition-colors">{t('nav.engineers')}</Link></li>
                <li><Link to={createPageUrl("Projects")} className="hover:text-[#C9A66B] transition-colors">{t('nav.projects')}</Link></li>
                <li><Link to={createPageUrl("Gallery")} className="hover:text-[#C9A66B] transition-colors">{t('nav.gallery')}</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4 text-[#C9A66B]">{t('footer.termsAndPolicies')}</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link to={createPageUrl("Terms")} className="hover:text-[#C9A66B] transition-colors">{t('footer.terms')}</Link></li>
                <li><Link to={createPageUrl("Privacy")} className="hover:text-[#C9A66B] transition-colors">{t('footer.privacy')}</Link></li>
                <li><Link to={createPageUrl("Copyright")} className="hover:text-[#C9A66B] transition-colors">{t('footer.copyright')}</Link></li>
                <li><Link to="/Certificates" className="hover:text-[#C9A66B] transition-colors flex items-center gap-1">🏅 شهادات المنصة وتراخيصها</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4 text-[#C9A66B]">{t('footer.supportAndHelp')}</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link to={createPageUrl("Complaints")} className="hover:text-[#C9A66B] transition-colors">{t('footer.complaints')}</Link></li>
                <li><Link to={createPageUrl("Support")} className="hover:text-[#C9A66B] transition-colors">{t('footer.technicalSupport')}</Link></li>
                <li><Link to={createPageUrl("ContactUs")} className="hover:text-[#C9A66B] transition-colors">اتصل بنا</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-4 text-[#C9A66B]">{t('footer.contactUs')}</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#C9A66B]" />
                  <a href="mailto:info@mybytly.com" className="hover:text-[#C9A66B]">
                    info@mybytly.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-[#C9A66B]" />
                  <a 
                    href="https://www.instagram.com/bytlylmstbyt" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[#C9A66B]"
                  >
                    @bytlylmstbyt
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-[#C9A66B]" />
                  <a 
                    href="https://www.facebook.com/profile.php?id=61587162083581" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[#C9A66B]"
                  >
                    Bytly - لمسة بيت
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-[#C9A66B]" />
                  <a 
                    href="https://www.linkedin.com/in/bytly-sa" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[#C9A66B]"
                  >
                    Bytly على LinkedIn
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Twitter className="w-4 h-4 text-[#C9A66B]" />
                  <a 
                    href="https://x.com/bytlylmstbyt?s=21&t=Hgn--h3Qi8vMU1sgHC0Ntg" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[#C9A66B]"
                  >
                    Bytly على X
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-[#C9A66B]" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <a 
                    href="https://wa.me/966550028319" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[#C9A66B]"
                  >
                    تواصل عبر الواتساب
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>© {new Date().getFullYear()} {t('footer.rightsReserved')}</p>
          </div>
        </div>
      </footer>
    </div>
    );
    }

    export default function Layout({ children, currentPageName }) {
    return (
    <LanguageProvider>
    <LayoutContent children={children} currentPageName={currentPageName} />
    </LanguageProvider>
    );
    }