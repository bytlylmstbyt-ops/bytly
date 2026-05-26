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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200"
         style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-around">
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 py-2 px-4 flex-1 transition-colors select-none ${
                active ? "text-[#C9A66B]" : "text-slate-500"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-[#C9A66B]" : "text-slate-400"}`} />
              <span className="text-[10px] font-medium">{label}</span>
              {active && <span className="w-1 h-1 rounded-full bg-[#C9A66B]" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}