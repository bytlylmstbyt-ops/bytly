import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Users, Briefcase, LayoutDashboard } from "lucide-react";

const navItems = [
  { label: "الرئيسية", icon: Home, path: "/" },
  { label: "المهندسون", icon: Users, path: "/Engineers" },
  { label: "المشاريع", icon: Briefcase, path: "/Projects" },
  { label: "لوحتي", icon: LayoutDashboard, path: "/Dashboard" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around">
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              /* min 44px tap target */
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 select-none transition-colors`}
              style={{ minHeight: 44, minWidth: 44, paddingTop: 8, paddingBottom: 8 }}
            >
              <Icon className={`w-5 h-5 ${active ? "text-[#C9A66B]" : "text-slate-400"}`} />
              {/* min 14px nav text */}
              <span className={`text-[14px] font-medium leading-tight ${active ? "text-[#C9A66B]" : "text-slate-500"}`}>
                {label}
              </span>
              {active && <span className="w-1 h-1 rounded-full bg-[#C9A66B]" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}