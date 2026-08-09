import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShieldAlert, ArrowUpRight } from "lucide-react";
import { ADMIN_CATEGORIES as CATEGORIES } from "@/components/admin/adminSections";
import { readAdminFilters, writeAdminFilters } from "@/components/admin/adminFilterPersistence";
import MonthlyRevenueSummaryPanel from "@/components/admin/MonthlyRevenueSummaryPanel";
import FinancialChartsPanel from "@/components/admin/FinancialChartsPanel";
import ProjectCompletionTrendPanel from "@/components/admin/ProjectCompletionTrendPanel";
import EngineerPerformancePanel from "@/components/admin/EngineerPerformancePanel";
import BIMProjectFilesPanel from "@/components/admin/BIMProjectFilesPanel";

// Category map imported from @/components/admin/adminSections

function AccessDenied() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full border-r-4 border-red-400">
        <CardContent className="p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#4A3F35] mb-2">هذه الصفحة مخصصة للمشرفين فقط</h2>
          <p className="text-sm text-slate-500">غير مصرح لك بالوصول إلى مركز إدارة المنصة.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminControlCenter() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeKey, setActiveKey] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (cat && CATEGORIES.find((c) => c.key === cat)) return cat;
    const saved = readAdminFilters("AdminControlCenter");
    if (saved.activeKey && CATEGORIES.find((c) => c.key === saved.activeKey)) return saved.activeKey;
    return CATEGORIES[0].key;
  });
  useEffect(() => { writeAdminFilters("AdminControlCenter", { activeKey }); }, [activeKey]);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        setIsAdmin(user?.role === "admin");
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  const active = CATEGORIES.find((c) => c.key === activeKey) || CATEGORIES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#4A3F35]">مركز إدارة المنصة</h1>
        <p className="text-sm text-slate-500 mt-1">
          كل أدوات إدارة بيتلي في مكان واحد — اختر قسمًا من القائمة، ثم افتح الصفحة المناسبة.
        </p>
      </div>

      <MonthlyRevenueSummaryPanel />
      <FinancialChartsPanel />
      <ProjectCompletionTrendPanel />
      <EngineerPerformancePanel />

      {activeKey === "bim" && <BIMProjectFilesPanel />}

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Category nav */}
        <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = cat.key === activeKey;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveKey(cat.key)}
                className={`flex items-center gap-2.5 shrink-0 md:shrink text-sm font-medium rounded-lg px-3 py-2.5 text-right transition-colors ${
                  isActive
                    ? "bg-[#4A3F35] text-white"
                    : "text-[#4A3F35] hover:bg-[#FEF9EE] border border-transparent hover:border-[#C9A66B]/30"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#C9A66B]" : "text-[#C9A66B]"}`} />
                <span className="whitespace-nowrap md:whitespace-normal">{cat.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active category content */}
        <div>
          <div className="mb-4">
            <h2 className="text-base font-bold text-[#4A3F35]">{active.label}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{active.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {active.items.map((item) => (
              <Link key={item.page} to={createPageUrl(item.page)}>
                <Card className="h-full border-r-4 border-[#C9A66B] hover:shadow-md transition-shadow group">
                  <CardContent className="p-4 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#4A3F35] text-sm">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#C9A66B] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}