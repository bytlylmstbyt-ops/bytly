import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, Briefcase, LayoutDashboard } from "lucide-react";
import { saveScrollPosition, restoreScrollPosition } from "@/hooks/useTabScrollPosition";

const TAB_ROOTS = ["/", "/Engineers", "/Projects", "/Dashboard"];

const navItems = [
  { label: "الرئيسية", icon: Home, path: "/" },
  { label: "المهندسون", icon: Users, path: "/Engineers" },
  { label: "المشاريع", icon: Briefcase, path: "/Projects" },
  { label: "لوحتي", icon: LayoutDashboard, path: "/Dashboard" },
];

// Returns which tab root the given pathname belongs to (or null)
function getTabRoot(pathname) {
  if (pathname === "/") return "/";
  return TAB_ROOTS.find(r => r !== "/" && pathname.startsWith(r)) ?? null;
}

const TAB_LAST_PATH_KEY = "bytly_tab_last_path";

function saveTabPath(tabRoot, fullPath) {
  try {
    const stored = JSON.parse(sessionStorage.getItem(TAB_LAST_PATH_KEY) || "{}");
    stored[tabRoot] = fullPath;
    sessionStorage.setItem(TAB_LAST_PATH_KEY, JSON.stringify(stored));
  } catch {}
}

function getTabPath(tabRoot) {
  try {
    const stored = JSON.parse(sessionStorage.getItem(TAB_LAST_PATH_KEY) || "{}");
    return stored[tabRoot] || tabRoot;
  } catch {
    return tabRoot;
  }
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Whenever location changes, persist the path under its tab root
  useEffect(() => {
    const root = getTabRoot(location.pathname);
    if (root) saveTabPath(root, location.pathname + location.search);
  }, [location.pathname, location.search]);

  // Restore scroll when landing on a tab root page
  useEffect(() => {
    if (TAB_ROOTS.includes(location.pathname)) {
      restoreScrollPosition(location.pathname);
    }
  }, [location.pathname]);

  const handleTabPress = (tabRoot) => {
    const currentRoot = getTabRoot(location.pathname);
    saveScrollPosition(location.pathname);

    if (currentRoot === tabRoot) {
      // Already on this tab — scroll to top if on root, else go back to root
      if (location.pathname === tabRoot) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate(tabRoot);
      }
    } else {
      // Navigate to last visited path within this tab
      const dest = getTabPath(tabRoot);
      navigate(dest);
    }
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around">
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = getTabRoot(location.pathname) === path;
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