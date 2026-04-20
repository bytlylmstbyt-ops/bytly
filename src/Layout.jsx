import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";
import MessageNotificationBadge from "@/components/notifications/MessageNotificationBadge";
import NotificationBell from "@/components/notifications/NotificationBell";
import { LanguageProvider, useLanguage } from "@/components/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { 
  Search, MessageSquare, User, Menu, X, 
  LogOut, Briefcase, Settings, Wallet, Bell, 
  PlusCircle, ChevronDown, Instagram, Facebook, Mail, Phone, MessagesSquare, Scale
} from "lucide-react";
import Logo from "@/components/Logo";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30" dir={isRTL ? "rtl" : "ltr"}>
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
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center">
              <Logo size="default" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link 
                to={createPageUrl("Home")} 
                className={`text-sm font-medium transition-colors hover:text-[#C9A66B] ${currentPageName === 'Home' ? 'text-[#C9A66B]' : 'text-[#6B5D4F]'}`}
              >
                {t('nav.home')}
              </Link>
              <Link 
                to={createPageUrl("Engineers")} 
                className={`text-sm font-medium transition-colors hover:text-[#C9A66B] ${currentPageName === 'Engineers' ? 'text-[#C9A66B]' : 'text-[#6B5D4F]'}`}
              >
                {t('nav.engineers')}
              </Link>
              <Link 
                to={createPageUrl("ConsultingFirms")} 
                className={`text-sm font-medium transition-colors hover:text-[#C9A66B] ${currentPageName === 'ConsultingFirms' ? 'text-[#C9A66B]' : 'text-[#6B5D4F]'}`}
              >
                الشركات الاستشارية
              </Link>

              <Link 
                to={createPageUrl("Projects")} 
                className={`text-sm font-medium transition-colors hover:text-[#C9A66B] ${currentPageName === 'Projects' ? 'text-[#C9A66B]' : 'text-[#6B5D4F]'}`}
              >
                {t('nav.projects')}
              </Link>
              <Link 
                to={createPageUrl("Gallery")} 
                className={`text-sm font-medium transition-colors hover:text-[#C9A66B] ${currentPageName === 'Gallery' ? 'text-[#C9A66B]' : 'text-[#6B5D4F]'}`}
              >
                {t('nav.gallery')}
              </Link>
              <Link 
                to="/TechnicalResources" 
                className={`text-sm font-medium transition-colors hover:text-[#C9A66B] ${currentPageName === 'TechnicalResources' ? 'text-[#C9A66B]' : 'text-[#6B5D4F]'}`}
              >
                المعايير الفنية
              </Link>

              <Link 
                to="/CostEstimator" 
                className={`text-sm font-medium transition-colors hover:text-[#C9A66B] ${currentPageName === 'CostEstimator' ? 'text-[#C9A66B]' : 'text-[#6B5D4F]'}`}
              >
                حاسبة التكاليف
              </Link>
              <Link 
                to="/ConstructionTracker" 
                className={`text-sm font-medium transition-colors hover:text-[#C9A66B] ${currentPageName === 'ConstructionTracker' ? 'text-[#C9A66B]' : 'text-[#6B5D4F]'}`}
              >
                متابعة البناء
              </Link>
              <Link 
                to={createPageUrl("DesignMarketplace")} 
                className={`text-sm font-medium transition-colors hover:text-[#C9A66B] ${currentPageName === 'DesignMarketplace' ? 'text-[#C9A66B]' : 'text-[#6B5D4F]'}`}
              >
                {t('nav.designMarketplace')}
              </Link>
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

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
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
            <div className="px-4 py-4 space-y-2">
              <Link 
                to={createPageUrl("Home")} 
                className="block px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.home')}
              </Link>
              <Link 
                to={createPageUrl("Engineers")} 
                className="block px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.engineers')}
              </Link>
              <Link 
                to={createPageUrl("ConsultingFirms")} 
                className="block px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700"
                onClick={() => setIsMenuOpen(false)}
              >
                الشركات الاستشارية
              </Link>
              <Link 
                to={createPageUrl("Projects")} 
                className="block px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.projects')}
              </Link>
              <Link 
                to={createPageUrl("Gallery")} 
                className="block px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.gallery')}
              </Link>
              <Link 
                to={createPageUrl("DesignMarketplace")} 
                className="block px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.designMarketplace')}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-16 md:pt-20 min-h-screen">
        {children}
      </main>

      {/* Chatbot Widget */}
      <ChatbotWidget />

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