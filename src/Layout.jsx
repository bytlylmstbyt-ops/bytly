import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { 
  Home, Search, MessageSquare, User, Menu, X, 
  LogOut, Briefcase, Settings, Wallet, Bell, 
  PlusCircle, ChevronDown, Instagram, Facebook, Mail, Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30" dir="rtl">
      <style>{`
        :root {
          --primary: #1a1a2e;
          --primary-light: #16213e;
          --accent: #d4a574;
          --accent-light: #e8c9a8;
          --gold: #c9a227;
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #1a1a2e 0%, #d4a574 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .hover-lift {
          transition: all 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-effect shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] flex items-center justify-center">
                <Home className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl md:text-2xl font-bold gradient-text">بيتلي</h1>
                <p className="text-xs text-slate-500">لمسة بيت</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link 
                to={createPageUrl("Home")} 
                className={`text-sm font-medium transition-colors hover:text-[#d4a574] ${currentPageName === 'Home' ? 'text-[#d4a574]' : 'text-slate-700'}`}
              >
                الرئيسية
              </Link>
              <Link 
                to={createPageUrl("Engineers")} 
                className={`text-sm font-medium transition-colors hover:text-[#d4a574] ${currentPageName === 'Engineers' ? 'text-[#d4a574]' : 'text-slate-700'}`}
              >
                المهندسين
              </Link>
              <Link 
                to={createPageUrl("Projects")} 
                className={`text-sm font-medium transition-colors hover:text-[#d4a574] ${currentPageName === 'Projects' ? 'text-[#d4a574]' : 'text-slate-700'}`}
              >
                المشاريع
              </Link>
              <Link 
                to={createPageUrl("Gallery")} 
                className={`text-sm font-medium transition-colors hover:text-[#d4a574] ${currentPageName === 'Gallery' ? 'text-[#d4a574]' : 'text-slate-700'}`}
              >
                معرض الأعمال
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <>
                  <Link to={createPageUrl("Messages")} className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <MessageSquare className="w-5 h-5 text-slate-600" />
                  </Link>
                  <Link to={createPageUrl("Notifications")} className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <Bell className="w-5 h-5 text-slate-600" />
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 px-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.profile_image} />
                          <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] text-white">
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
                          لوحة التحكم
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("MyPurchasedProjects")} className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          مشاريعي المشتراة
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Wallet")} className="flex items-center gap-2">
                          <Wallet className="w-4 h-4" />
                          المحفظة
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Settings")} className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          الإعدادات
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="w-4 h-4 ml-2" />
                        تسجيل الخروج
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => base44.auth.redirectToLogin()}
                    className="text-slate-700 hover:text-[#d4a574]"
                  >
                    تسجيل الدخول
                  </Button>
                  <Link to={createPageUrl("RegisterChoice")}>
                    <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white hover:opacity-90">
                      انضم إلينا
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
                الرئيسية
              </Link>
              <Link 
                to={createPageUrl("Engineers")} 
                className="block px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700"
                onClick={() => setIsMenuOpen(false)}
              >
                المهندسين
              </Link>
              <Link 
                to={createPageUrl("Projects")} 
                className="block px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700"
                onClick={() => setIsMenuOpen(false)}
              >
                المشاريع
              </Link>
              <Link 
                to={createPageUrl("Gallery")} 
                className="block px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700"
                onClick={() => setIsMenuOpen(false)}
              >
                معرض الأعمال
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-16 md:pt-20 min-h-screen">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a2e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/20 to-[#d4a574] flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">بيتلي</h2>
                  <p className="text-sm text-slate-300">لمسة بيت</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed max-w-md">
                منصة احترافية تجمع مهندسي التصميم الداخلي والمعماريين والرسامين مع أصحاب المشاريع. 
                نساعدك في العثور على أفضل المصممين لتحويل أحلامك إلى واقع.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold mb-4 text-[#d4a574]">روابط سريعة</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link to={createPageUrl("Home")} className="hover:text-[#d4a574] transition-colors">الرئيسية</Link></li>
                <li><Link to={createPageUrl("Engineers")} className="hover:text-[#d4a574] transition-colors">المهندسين</Link></li>
                <li><Link to={createPageUrl("Projects")} className="hover:text-[#d4a574] transition-colors">المشاريع</Link></li>
                <li><Link to={createPageUrl("Gallery")} className="hover:text-[#d4a574] transition-colors">معرض الأعمال</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4 text-[#d4a574]">الشروط والسياسات</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link to={createPageUrl("Terms")} className="hover:text-[#d4a574] transition-colors">الشروط والأحكام</Link></li>
                <li><Link to={createPageUrl("Privacy")} className="hover:text-[#d4a574] transition-colors">سياسة الخصوصية</Link></li>
                <li><Link to={createPageUrl("Copyright")} className="hover:text-[#d4a574] transition-colors">اتفاقية حفظ الحقوق</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4 text-[#d4a574]">الدعم والمساعدة</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link to={createPageUrl("Complaints")} className="hover:text-[#d4a574] transition-colors">الشكاوى والاقتراحات</Link></li>
                <li><Link to={createPageUrl("Support")} className="hover:text-[#d4a574] transition-colors">الدعم الفني</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-4 text-[#d4a574]">تواصل معنا</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#d4a574]" />
                  <a href="mailto:bytlylmstbyt@gmail.com" className="hover:text-[#d4a574]">
                    bytlylmstbyt@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-[#d4a574]" />
                  <a 
                    href="https://www.instagram.com/bytlylmstbyt" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[#d4a574]"
                  >
                    @bytlylmstbyt
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-[#d4a574]" />
                  <a href="#" className="hover:text-[#d4a574]">بيتلي</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>© {new Date().getFullYear()} بيتلي - لمسة بيت. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}