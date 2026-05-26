import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, Briefcase, LayoutDashboard } from "lucide-react";
import { saveScrollPosition, restoreScrollPosition } from "@/hooks/useTabScrollPosition";

const navItems = [
  { label: "الرئيسية", icon: Home, path: "/" },
  { label: "المهندسون", icon: Users, path: "/Engineers" },
  { label: "المشاريع", icon: Briefcase, path: "/Projects" },
  { label: "لوحتي", icon: LayoutDashboard, path: "/Dashboard" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Restore scroll when landing on a tab page
  useEffect(() => {
    if (navItems.some(item => item.path === location.pathname)) {
      restoreScrollPosition(location.pathname);
    }
  }, [location.pathname]);

  const handleTabPress = (path) => {
    // Save current page scroll before navigating away
    saveScrollPosition(location.pathname);
    // If tapping the active tab, scroll back to top
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(path);
    }
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around">
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => handleTabPress(path)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 select-none transition-colors"
              style={{ minHeight: 44, minWidth: 44, paddingTop: 8, paddingBottom: 8 }}
            >
              <Icon className={`w-5 h-5 ${active ? "text-[#C9A66B]" : "text-slate-400"}`} />
              <span className={`text-[14px] font-medium leading-tight ${active ? "text-[#C9A66B]" : "text-slate-500"}`}>
                {label}
              </span>
              {active && <span className="w-1 h-1 rounded-full bg-[#C9A66B]" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}