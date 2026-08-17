import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShieldAlert, ArrowUpRight, LayoutDashboard, ChevronLeft } from "lucide-react";
import { ADMIN_CATEGORIES as CATEGORIES } from "@/components/admin/adminSections";
import { usePermissions } from "@/components/auth/usePermissions";
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
  const { can, permissions, loading: permissionsLoading, isAdmin: permissionsAdmin } = usePermissions();
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

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
      </div>
    );
  }

  const categoryResource = {
    board: "settings",
    overview: "analytics",
    assistant: "settings",
    projects: "projects",
    people: "engineers",
    providers: "providers",
    contracts: "contracts",
    payments: "payments",
    disputes: "disputes",
    notifications: "notifications",
    reports: "analytics",
    settings: "settings",
    bim: "projects",
    workflows: "workflows",
    domains: "domains",
    integrations: "integrations",
    email: "email",
    marketing: "marketing",
  };
  const visibleCategories = (isAdmin || permissionsAdmin)
    ? CATEGORIES
    : CATEGORIES.filter((cat) => can(categoryResource[cat.key] || cat.key, "view"));

  if (!isAdmin && !permissionsAdmin && visibleCategories.length === 0 && Object.keys(permissions || {}).length === 0) {
    return <AccessDenied />;
  }
  const safeActiveKey = visibleCategories.some((c) => c.key === activeKey) ? activeKey : visibleCategories[0]?.key;
  const active = visibleCategories.find((c) => c.key === safeActiveKey) || visibleCategories[0] || CATEGORIES[0];

  return (
    <div className="min-h-screen bg-[#F7F8FC] px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row-reverse gap-6 items-stretch" dir="rtl">
        <nav className="w-full md:w-[280px] md:shrink-0 rounded-2xl bg-[#11162A] border border-[#252D47] shadow-xl p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible md:sticky md:top-4 md:h-[calc(100vh-32px)] md:max-h-[calc(100vh-32px)] md:overflow-y-auto" aria-label="قائمة مركز الإدارة">
          {visibleCategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = cat.key === activeKey;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveKey(cat.key)}
                className={`flex items-center gap-2.5 shrink-0 md:shrink text-sm font-medium rounded-lg px-3 py-2.5 text-right transition-colors ${
                  isActive
                    ? "bg-gradient-to-l from-[#5142A4] to-[#6D5CE7] text-white shadow-md"
                    : "text-slate-200 hover:bg-white/10 border border-transparent hover:border-white/10"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span className="whitespace-nowrap md:whitespace-normal flex-1">{cat.label}</span>
                {isActive && <ChevronLeft className="w-3.5 h-3.5 opacity-70" />}
              </button>
            );
          })}
        </nav>

        <main className="flex-1 min-w-0">
        <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="text-right">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F1EEFF] text-[#5142A4] px-3 py-1 text-xs font-medium mb-2">
              <LayoutDashboard className="w-3.5 h-3.5" /> لوحة القيادة التنفيذية
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#25213A]">مركز الإدارة</h1>
            <p className="text-sm text-slate-500 mt-1">نظرة شاملة على أداء المنصة وإدارة العمليات الرئيسية.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 shadow-sm px-4 py-2.5 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600">مركز الإدارة الرئيسي</span>
          </div>
        </div>

        <div className="space-y-5">
          <MonthlyRevenueSummaryPanel />
          <FinancialChartsPanel />
          <ProjectCompletionTrendPanel />
          <EngineerPerformancePanel />
        </div>

        {activeKey === "bim" && <BIMProjectFilesPanel />}

        {visibleCategories.length === 0 && (
          <Card><CardContent className="p-8 text-center text-slate-500">لا توجد إدارات أو صفحات مخصصة لدورك حاليًا.</CardContent></Card>
        )}

        {/* Active category content */}
        <div className="min-w-0">
          <div className="mb-4">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-5 py-4">
              <h2 className="text-lg font-bold text-[#2F2945]">{active.label}</h2>
              <p className="text-xs text-slate-500 mt-1">{active.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {active.items.map((item) => {
              const itemPermission = item.permission || {
                PlatformDashboard: ["analytics", "view"],
                AdminProjects: ["projects", "view"], Projects: ["projects", "view"], ProjectProposals: ["projects", "view"], CompareProposals: ["projects", "view"], DataClassification: ["projects", "view"], PermitApplication: ["projects", "view"],
                AdminEngineers: ["engineers", "view"], AdminClients: ["clients", "view"], RoleManagement: ["settings", "roles"], UserRoleAssignment: ["settings", "roles"], PendingApprovals: ["engineers", "approve"],
                AdminProviders: ["providers", "view"], ConsultingFirms: ["providers", "view"], AdminMarketEntities: ["providers", "view"],
                ContractManager: ["contracts", "view"], ContractArchive: ["contracts", "view"], ContractTemplates: ["contracts", "view"], ContractAmendments: ["contracts", "edit"],
                AdminWallet: ["payments", "view"], AdminWalletDashboard: ["payments", "view"], AdminRefundControl: ["payments", "refund"], AllWithdrawalRequests: ["payments", "process"], InvoiceManager: ["invoices", "view"], RevenueDashboard: ["analytics", "view"], AdminRevenueReport: ["analytics", "view"],
                AdminDisputes: ["disputes", "view"], AdminDisputeManage: ["disputes", "manage"],
                NotificationCenter: ["notifications", "view"], NotificationSettings: ["notifications", "edit"], SentEmailsLog: ["email", "view"],
                AdminReports: ["analytics", "view"], Analytics: ["analytics", "view"], TaskReports: ["analytics", "view"], AdminReviews: ["analytics", "view"],
                AdminCategories: ["settings", "edit"], AdminCommissionSettings: ["settings", "edit"], AdminSubscriptionControl: ["settings", "edit"], Settings: ["settings", "edit"],
                BIMDashboard: ["projects", "view"], BIMQuantitiesReport: ["projects", "view"], BIMSearch: ["projects", "view"], AdminWorkflowAutomation: ["workflows", "view"], AdminDomains: ["domains", "view"], AdminIntegrations: ["integrations", "view"], AdminEmailCenter: ["email", "view"], AdminMarketingCenter: ["marketing", "view"], MarketingHub: ["marketing", "edit"], SocialAnalytics: ["marketing", "view"], AdminSearchGeoAnalytics: ["marketing", "view"],
              }[item.page];
              const allowed = isAdmin || permissionsAdmin || (itemPermission ? can(itemPermission[0], itemPermission[1]) : can(categoryResource[active.key] || active.key, "view"));
              if (!allowed) return null;
              return (
              <Link key={item.page} to={createPageUrl(item.page)}>
                <Card className="h-full border border-slate-200 border-r-4 border-r-[#6D5CE7] hover:shadow-lg hover:-translate-y-0.5 transition-all group bg-white">
                  <CardContent className="p-4 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#4A3F35] text-sm">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#C9A66B] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>
              </Link>
              );
            })}
          </div>
        </div>
        </main>
        </div>
        </div>
        );
        }