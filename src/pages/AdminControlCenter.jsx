import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShieldAlert, ArrowUpRight, Globe2, ShieldCheck, Mail, Server, CheckCircle2, AlertTriangle } from "lucide-react";
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#4A3F35]">مركز إدارة المنصة</h1>
        <p className="text-sm text-slate-500 mt-1">
          كل أدوات إدارة بيتلي في مكان واحد — اختر قسمًا من القائمة، ثم افتح الصفحة المناسبة.
        </p>
      </div>

      <div className="mb-6">
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-l from-[#4A3F35] to-[#6B5D4F] p-5 text-white">
            <h2 className="text-lg font-bold flex items-center gap-2"><Globe2 className="w-5 h-5" />مركز إدارة النطاقات</h2>
            <p className="text-sm text-white/75 mt-1">إدارة النطاقات المرتبطة بمنصة بيتلي وحالة الربط والتحقق والأمان والبريد.</p>
          </div>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border p-4"><div className="flex items-center gap-2 text-xs text-slate-500"><Globe2 className="w-4 h-4" />النطاق الأساسي</div><p className="font-bold text-[#4A3F35] mt-2">mybaytly.com</p><span className="inline-flex items-center gap-1 mt-2 rounded-full bg-emerald-100 text-emerald-700 px-2 py-1 text-xs"><CheckCircle2 className="w-3 h-3" />نشط</span></div>
              <div className="rounded-xl border p-4"><div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="w-4 h-4" />SSL</div><p className="font-bold text-[#4A3F35] mt-2">مؤمّن</p><span className="inline-flex items-center gap-1 mt-2 rounded-full bg-emerald-100 text-emerald-700 px-2 py-1 text-xs"><CheckCircle2 className="w-3 h-3" />شهادة صالحة</span></div>
              <div className="rounded-xl border p-4"><div className="flex items-center gap-2 text-xs text-slate-500"><Mail className="w-4 h-4" />نطاق البريد</div><p className="font-bold text-[#4A3F35] mt-2">mybaytly.com</p><span className="inline-flex items-center gap-1 mt-2 rounded-full bg-emerald-100 text-emerald-700 px-2 py-1 text-xs"><CheckCircle2 className="w-3 h-3" />مهيأ</span></div>
            </div>
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-3"><Server className="w-4 h-4 text-[#C9A66B]" /><h3 className="font-bold text-[#4A3F35]">النطاقات المرتبطة</h3></div>
              <div className="bg-white rounded-xl border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><p className="font-semibold">mybaytly.com</p><p className="text-xs text-slate-500 mt-1">النطاق الافتراضي للمنصة • DNS متصل • SSL نشط</p></div><span className="rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1 text-xs font-medium">نشط</span></div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3"><AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" /><div><p className="font-semibold text-amber-900">إدارة شراء وتجديد النطاقات</p><p className="text-sm text-amber-800 mt-1">الشراء والتجديد غير مفعّلين حاليًا لعدم وجود مزود نطاقات مرتبط. يمكن إضافة التكامل لاحقًا دون تغيير هذه الصفحة.</p></div></div>
          </CardContent>
        </Card>
      </div>

      <MonthlyRevenueSummaryPanel />
      <FinancialChartsPanel />
      <ProjectCompletionTrendPanel />
      <EngineerPerformancePanel />

      {activeKey === "bim" && <BIMProjectFilesPanel />}

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {visibleCategories.length === 0 && (
          <Card className="md:col-span-2"><CardContent className="p-8 text-center text-slate-500">لا توجد إدارات أو صفحات مخصصة لدورك حاليًا.</CardContent></Card>
        )}
        {/* Category nav */}
        <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {visibleCategories.map((cat) => {
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
            {active.items.map((item) => {
              const itemPermission = {
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}