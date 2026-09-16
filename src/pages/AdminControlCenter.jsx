import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShieldAlert, ArrowUpRight, LayoutDashboard, ChevronLeft, KeyRound, PlugZap, ExternalLink, EyeOff, Copy, Check } from "lucide-react";
import { ADMIN_CATEGORIES as CATEGORIES } from "@/components/admin/adminSections";
import { usePermissions } from "@/components/auth/usePermissions";
import { readAdminFilters, writeAdminFilters } from "@/components/admin/adminFilterPersistence";
import MonthlyRevenueSummaryPanel from "@/components/admin/MonthlyRevenueSummaryPanel";
import FinancialChartsPanel from "@/components/admin/FinancialChartsPanel";
import ProjectCompletionTrendPanel from "@/components/admin/ProjectCompletionTrendPanel";
import EngineerPerformancePanel from "@/components/admin/EngineerPerformancePanel";
import BIMProjectFilesPanel from "@/components/admin/BIMProjectFilesPanel";

const PLATFORM_OWNER_EMAIL = "bytlylmstbyt@gmail.com";

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

function AdminMCPPage() {
  const [configured, setConfigured] = useState(false);
  return (
    <div className="space-y-6" dir="rtl">
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="px-6 py-5 border-b border-slate-200 bg-white">
            <h3 className="text-2xl font-bold text-[#25213A]">MCP</h3>
            <p className="text-sm text-slate-500 mt-1">إعداد وصول MCP للمساعدين الذين يعملون بالذكاء الاصطناعي.</p>
          </div>
          <div className="p-8 bg-white text-center">
            <div className="flex justify-center gap-2 mb-8">
              <div className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-xl">✦</div>
              <div className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-xl">✺</div>
              <div className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-xl">◎</div>
            </div>
            <h4 className="text-lg font-bold text-[#25213A] mb-2">اسمح لمساعدي الذكاء الاصطناعي باستخدام تطبيقك</h4>
            <p className="max-w-2xl mx-auto text-sm text-slate-500 leading-7">يمكن لمساعدي الذكاء الاصطناعي المصرح لهم الوصول الآمن إلى بيانات تطبيقك وقدراته عند تفعيل MCP.</p>
            <button type="button" onClick={() => setConfigured((v) => !v)} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#343A46] text-white px-6 py-3 text-sm font-semibold hover:opacity-90">
              <PlugZap className="w-4 h-4" />{configured ? "تم إعداد الوصول" : "إعداد الوصول"}
            </button>
          </div>
        </CardContent>
      </Card>
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <h4 className="font-bold text-[#25213A] mb-3">ما الذي يمكن لمساعد الذكاء الاصطناعي فعله بتطبيقك؟</h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• البحث عن المعلومات واسترجاع البيانات من تطبيقك.</li>
            <li>• اتخاذ إجراءات وإنشاء أو تحديث أو إدارة الأشياء نيابة عن المستخدم.</li>
            <li>• طرح أسئلة على بيانات تطبيقك وتنفيذ المهام المصرح بها.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminSecretsPage() {
  const [copied, setCopied] = useState(null);
  const secrets = [
    { name: "أوتوكاد", key: "AUTODESK_CLIENT_SECRET" },
    { name: "Google OAuth", key: "GOOGLE_OAUTH_CLIENT_SECRET" },
    { name: "واجهة برمجة تطبيقات تويتر", key: "TWITTER_API_KEY" },
    { name: "معرف صفحة فيسبوك", key: "FACEBOOK_PAGE_ID" },
  ];
  const copyName = async (key) => {
    try { await navigator.clipboard.writeText(key); setCopied(key); setTimeout(() => setCopied(null), 1200); } catch {}
  };
  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-2xl font-bold text-[#25213A]">أسرار التطبيق</h3>
          <p className="text-sm text-slate-500 mt-1">إدارة أسماء مفاتيح الأسرار المستخدمة من التطبيق. القيم السرية لا تُعرض داخل الواجهة.</p>
        </div>
        <button type="button" className="rounded-lg bg-[#343A46] text-white px-4 py-2 text-sm font-semibold">+ أضف سرًا</button>
      </div>
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {secrets.map((secret, index) => (
            <div key={secret.key} className={`flex items-center justify-between gap-4 p-5 ${index ? "border-t border-slate-200" : ""}`}>
              <div className="flex items-center gap-3 min-w-0">
                <KeyRound className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-[#4A3F35]">{secret.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono"><EyeOff className="w-3.5 h-3.5" /> ••••••••••••••••</div>
                </div>
              </div>
              <button type="button" onClick={() => copyName(secret.key)} className="p-2 rounded-md hover:bg-slate-100 text-slate-500" title="نسخ اسم المتغير">
                {copied === secret.key ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">تنبيه أمني: لا يتم إظهار أو تخزين قيم المفاتيح السرية في كود الواجهة أو في السجلات.</div>
    </div>
  );
}

function AdminInvestorPage() {
  return (
    <div className="space-y-5" dir="rtl">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-2xl font-bold text-[#25213A]">مركز المستثمر</h3>
            <p className="text-sm text-slate-500 mt-1">الوصول إلى مركز المستثمر الحالي مع الحفاظ على الصفحة وواجهتها كما هي.</p>
          </div>
          <Link to={createPageUrl("InvestorHub")} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white px-5 py-3 text-sm font-semibold shadow-sm">
            فتح مركز المستثمر <ExternalLink className="w-4 h-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminControlCenter() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPlatformOwner, setIsPlatformOwner] = useState(false);
  const { can, permissions, loading: permissionsLoading, isAdmin: permissionsAdmin } = usePermissions();
  const [activeKey, setActiveKey] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (cat && (CATEGORIES.find((c) => c.key === cat) || cat === "platform_tools")) return cat;
    const saved = readAdminFilters("AdminControlCenter");
    if (saved.activeKey && (CATEGORIES.find((c) => c.key === saved.activeKey) || saved.activeKey === "platform_tools")) return saved.activeKey;
    return CATEGORIES[0].key;
  });
  useEffect(() => { writeAdminFilters("AdminControlCenter", { activeKey }); }, [activeKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user || cancelled) { if (!cancelled) setIsAdmin(false); return; }
        const email = (user.email || "").trim().toLowerCase();
        const owner = email === PLATFORM_OWNER_EMAIL;
        setIsPlatformOwner(owner);
        const { data: profile } = await supabase.from("profiles").select("role,email").eq("id", user.id).maybeSingle();
        if (!cancelled) setIsAdmin(owner || profile?.role === "admin");
      } catch (error) {
        console.error("Error loading Supabase admin access:", error);
        if (!cancelled) setIsAdmin(false);
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading || permissionsLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" /></div>;

  const categoryResource = {
    board: "settings", overview: "analytics", assistant: "settings", projects: "projects", people: "engineers", providers: "providers", contracts: "contracts", payments: "payments", disputes: "disputes", notifications: "notifications", reports: "analytics", settings: "settings", bim: "projects", workflows: "workflows", domains: "domains", integrations: "integrations", email: "email", marketing: "marketing",
  };
  const platformToolsCategory = {
    key: "platform_tools", label: "أدوات المنصة", icon: KeyRound, description: "أدوات الإدارة الحساسة ومركز المستثمر.",
    items: [
      { page: "__MCP__", label: "MCP", desc: "إعداد وصول مساعدي الذكاء الاصطناعي إلى التطبيق" },
      { page: "__SECRETS__", label: "أسرار التطبيق", desc: "إدارة أسماء الأسرار مع إخفاء القيم الحساسة" },
      { page: "__INVESTOR__", label: "مركز المستثمر", desc: "فتح مركز المستثمر الحالي من داخل مركز الإدارة" },
    ],
  };
  const baseVisibleCategories = (isAdmin || permissionsAdmin) ? CATEGORIES : CATEGORIES.filter((cat) => can(categoryResource[cat.key] || cat.key, "view"));
  const visibleCategories = (isAdmin || permissionsAdmin) ? [...baseVisibleCategories, platformToolsCategory] : baseVisibleCategories;

  if (!isAdmin && !permissionsAdmin && visibleCategories.length === 0 && Object.keys(permissions || {}).length === 0) return <AccessDenied />;
  const safeActiveKey = visibleCategories.some((c) => c.key === activeKey) ? activeKey : visibleCategories[0]?.key;
  const active = visibleCategories.find((c) => c.key === safeActiveKey) || visibleCategories[0] || CATEGORIES[0];

  const openCategory = (key) => {
    setActiveKey(key);
    const params = new URLSearchParams(window.location.search);
    params.set("cat", key);
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    setTimeout(() => document.getElementById("admin-category-content")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row gap-6 items-stretch" dir="ltr">
        <nav className="order-2 md:order-1 w-full md:w-[280px] md:shrink-0 rounded-2xl bg-[#11162A] border border-[#252D47] shadow-xl p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible md:sticky md:top-4 md:h-[calc(100vh-32px)] md:max-h-[calc(100vh-32px)] md:overflow-y-auto" aria-label="قائمة لوحة التحكم">
          {visibleCategories.map((cat) => {
            const Icon = cat.icon; const isActive = cat.key === activeKey;
            return <button key={cat.key} onClick={() => openCategory(cat.key)} className={`flex items-center gap-2.5 shrink-0 md:shrink text-sm font-medium rounded-lg px-3 py-2.5 text-right transition-colors ${isActive ? "bg-gradient-to-l from-[#5142A4] to-[#6D5CE7] text-white shadow-md" : "text-slate-200 hover:bg-white/10 border border-transparent hover:border-white/10"}`}><Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} /><span className="whitespace-nowrap md:whitespace-normal flex-1">{cat.label}</span>{isActive && <ChevronLeft className="w-3.5 h-3.5 opacity-70" />}</button>;
          })}
        </nav>

        <main className="flex-1 min-w-0" dir="rtl">
          <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="text-right">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F1EEFF] text-[#5142A4] px-3 py-1 text-xs font-medium mb-2"><LayoutDashboard className="w-3.5 h-3.5" /> {isPlatformOwner ? "مالكة المنصة • Super Admin" : "لوحة القيادة التنفيذية"}</div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#25213A]">{isPlatformOwner ? "لوحة تحكم مالكة المنصة" : "لوحة التحكم"}</h1>
              <p className="text-sm text-slate-500 mt-1">نظرة شاملة على أداء المنصة وإدارة العمليات الرئيسية.</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 shadow-sm px-4 py-2.5 text-sm"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-slate-600">{isPlatformOwner ? "المالك الوحيد • صلاحيات Super Admin كاملة" : "لوحة التحكم الرئيسية"}</span></div>
          </div>

          {safeActiveKey === "overview" && <div className="space-y-5"><MonthlyRevenueSummaryPanel /><FinancialChartsPanel /><ProjectCompletionTrendPanel /><EngineerPerformancePanel /></div>}
          {activeKey === "bim" && <BIMProjectFilesPanel />}
          {visibleCategories.length === 0 && <Card><CardContent className="p-8 text-center text-slate-500">لا توجد إدارات أو صفحات مخصصة لدورك حاليًا.</CardContent></Card>}

          {activeKey === "platform_tools" ? (
            <div id="admin-category-content" className="min-w-0 scroll-mt-6">
              <div className="mb-4"><div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-5 py-4"><h2 className="text-lg font-bold text-[#2F2945]">أدوات المنصة</h2><p className="text-xs text-slate-500 mt-1">أدوات الإدارة الحساسة ومركز المستثمر.</p></div></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {active.items.map((item) => <button key={item.page} type="button" onClick={() => document.getElementById(item.page)?.scrollIntoView({ behavior: "smooth" })} className="text-right"><Card className="h-full border border-slate-200 border-r-4 border-r-[#6D5CE7] hover:shadow-lg transition-all bg-white"><CardContent className="p-4"><p className="font-semibold text-[#4A3F35] text-sm">{item.label}</p><p className="text-xs text-slate-500 mt-1">{item.desc}</p></CardContent></Card></button>)}
              </div>
              <div id="__MCP__" className="mb-8"><AdminMCPPage /></div>
              <div id="__SECRETS__" className="mb-8"><AdminSecretsPage /></div>
              <div id="__INVESTOR__" className="mb-8"><AdminInvestorPage /></div>
            </div>
          ) : (
            <div id="admin-category-content" className="min-w-0 scroll-mt-6">
              <div className="mb-4"><div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-5 py-4"><h2 className="text-lg font-bold text-[#2F2945]">{active.label}</h2><p className="text-xs text-slate-500 mt-1">{active.description}</p></div></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {active.items.map((item) => {
                  const itemPermission = item.permission || {
                    PlatformDashboard: ["analytics", "view"], AdminProjects: ["projects", "view"], Projects: ["projects", "view"], ProjectProposals: ["projects", "view"], CompareProposals: ["projects", "view"], DataClassification: ["projects", "view"], PermitApplication: ["projects", "view"], AdminEngineers: ["engineers", "view"], AdminClients: ["clients", "view"], RoleManagement: ["settings", "roles"], UserRoleAssignment: ["settings", "roles"], PendingApprovals: ["engineers", "approve"], AdminProviders: ["providers", "view"], ConsultingFirms: ["providers", "view"], AdminMarketEntities: ["providers", "view"], ContractManager: ["contracts", "view"], ContractArchive: ["contracts", "view"], ContractTemplates: ["contracts", "view"], ContractAmendments: ["contracts", "edit"], AdminWallet: ["payments", "view"], AdminWalletDashboard: ["payments", "view"], AdminRefundControl: ["payments", "refund"], AllWithdrawalRequests: ["payments", "process"], InvoiceManager: ["invoices", "view"], RevenueDashboard: ["analytics", "view"], AdminRevenueReport: ["analytics", "view"], AdminDisputes: ["disputes", "view"], AdminDisputeManage: ["disputes", "manage"], NotificationCenter: ["notifications", "view"], NotificationSettings: ["notifications", "edit"], SentEmailsLog: ["email", "view"], AdminReports: ["analytics", "view"], Analytics: ["analytics", "view"], TaskReports: ["analytics", "view"], AdminReviews: ["analytics", "view"], AdminCategories: ["settings", "edit"], AdminCommissionSettings: ["settings", "edit"], AdminSubscriptionControl: ["settings", "edit"], Settings: ["settings", "edit"], AdminAuthenticationSettings: ["settings", "edit"], BIMDashboard: ["projects", "view"], BIMQuantitiesReport: ["projects", "view"], BIMSearch: ["projects", "view"], AdminWorkflowAutomation: ["workflows", "view"], AdminDomains: ["domains", "view"], AdminIntegrations: ["integrations", "view"], AdminEmailCenter: ["email", "view"], AdminMarketingCenter: ["marketing", "view"], MarketingHub: ["marketing", "edit"], SocialAnalytics: ["marketing", "view"], AdminSearchGeoAnalytics: ["marketing", "view"]
                  }[item.page];
                  const allowed = isAdmin || permissionsAdmin || (itemPermission ? can(itemPermission[0], itemPermission[1]) : can(categoryResource[active.key] || active.key, "view"));
                  if (!allowed) return null;
                  return <Link key={item.page} to={createPageUrl(item.page)}><Card className="h-full border border-slate-200 border-r-4 border-r-[#6D5CE7] hover:shadow-lg hover:-translate-y-0.5 transition-all group bg-white"><CardContent className="p-4 flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-semibold text-[#4A3F35] text-sm">{item.label}</p><p className="text-xs text-slate-500 mt-1">{item.desc}</p></div><ArrowUpRight className="w-4 h-4 text-[#C9A66B] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" /></CardContent></Card></Link>;
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
