import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, LayoutDashboard } from "lucide-react";
import { findAdminPage } from "./adminSections";

/**
 * AdminBreadcrumb — shows a back button (preserves scroll via history back)
 * plus a clickable trail rooted at "مركز إدارة المنصة".
 * Renders only on admin section pages (hub itself included).
 */
export default function AdminBreadcrumb({ currentPageName }) {
  const navigate = useNavigate();
  const isHub = currentPageName === "AdminControlCenter";
  const entry = findAdminPage(currentPageName);

  if (!isHub && !entry) return null;

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/AdminControlCenter");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-1" dir="rtl">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#C9A66B] transition-colors shrink-0"
          style={{ minHeight: 36 }}
          aria-label="رجوع"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </button>
        <span className="text-slate-300 shrink-0">|</span>
        <nav className="flex items-center gap-1.5 text-sm flex-wrap">
          <Link
            to="/AdminControlCenter"
            className="flex items-center gap-1 text-slate-500 hover:text-[#C9A66B] transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            مركز إدارة المنصة
          </Link>
          {!isHub && (
            <>
              <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
              <Link
                to={`/AdminControlCenter?cat=${entry.category.key}`}
                className="text-slate-500 hover:text-[#C9A66B] transition-colors"
              >
                {entry.category.label}
              </Link>
              <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-[#4A3F35] font-medium">{entry.item.label}</span>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}