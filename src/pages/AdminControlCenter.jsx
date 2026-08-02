import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  LayoutDashboard, Users, FileText, Wallet, Scale, Bell, BarChart3, Settings as SettingsIcon,
  FolderKanban, Building2, Loader2, ShieldAlert, ArrowUpRight
} from "lucide-react";
import MonthlyRevenueSummaryPanel from "@/components/admin/MonthlyRevenueSummaryPanel";
import FinancialChartsPanel from "@/components/admin/FinancialChartsPanel";
import ProjectCompletionTrendPanel from "@/components/admin/ProjectCompletionTrendPanel";

// ── Category → page map ────────────────────────────────────────────────────
// Every entry here points at a page that already exists in the app.
// Nothing about those pages changes — this screen only links to them.
const CATEGORIES = [
  {
    key: "overview",
    label: "نظرة عامة",
    icon: LayoutDashboard,
    description: "المؤشرات الرئيسية لأداء المنصة.",
    items: [
      { page: "PlatformDashboard", label: "لوحة أداء المنصة", desc: "مؤشرات المشاريع، الإيرادات، والمهندسين" },
    ],
  },
  {
    key: "projects",
    label: "إدارة المشاريع",
    icon: FolderKanban,
    description: "كل ما يخص المشاريع وإدارتها من لوحة واحدة.",
    items: [
      { page: "AdminProjects", label: "لوحة إدارة المشاريع", desc: "نظرة شاملة وإدارة كل مشاريع المنصة" },
      { page: "Projects", label: "سوق المشاريع", desc: "تصفح جميع المشاريع المنشورة" },
      { page: "ProjectProposals", label: "إدارة العروض", desc: "متابعة عروض المشاريع" },
      { page: "CompareProposals", label: "مقارنة العروض", desc: "مقارنة عروض مشروع معين" },
      { page: "DataClassification", label: "تصنيف بيانات المشاريع", desc: "تنظيم وتصنيف بيانات المشاريع" },
    ],
  },
  {
    key: "people",
    label: "المستخدمون والمهندسون",
    icon: Users,
    description: "إدارة المهندسين، العملاء، الأدوار، والطلبات المعلقة.",
    items: [
      { page: "AdminEngineers", label: "إدارة المهندسين", desc: "مراجعة واعتماد ملفات المهندسين" },
      { page: "AdminClients", label: "إدارة العملاء", desc: "قائمة العملاء وبياناتهم" },
      { page: "RoleManagement", label: "إدارة الأدوار", desc: "تعريف أدوار المستخدمين وصلاحياتها" },
      { page: "UserRoleAssignment", label: "تعيين الأدوار للمستخدمين", desc: "ربط المستخدمين بالأدوار" },
      { page: "PendingApprovals", label: "الموافقات المعلقة", desc: "طلبات بانتظار المراجعة" },
    ],
  },
  {
    key: "providers",
    label: "مقدمو الخدمة",
    icon: Building2,
    description: "الشركات الهندسية والاستشارية والاستشاريون والمقاولون والموردون.",
    items: [
      { page: "AdminProviders", label: "لوحة مقدمي الخدمة", desc: "إدارة الشركات الهندسية والاستشارية والاستشاريين والمقاولين والموردين" },
      { page: "ConsultingFirms", label: "الشركات الاستشارية", desc: "تصفح الشركات الاستشارية المعتمدة" },
      { page: "AdminMarketEntities", label: "كيانات السوق", desc: "الشركات والموردون في السوق" },
    ],
  },
  {
    key: "contracts",
    label: "العقود",
    icon: FileText,
    description: "أرشيف العقود، القوالب، والتعديلات.",
    items: [
      { page: "ContractManager", label: "إدارة العقود", desc: "عرض ومتابعة جميع العقود" },
      { page: "ContractArchive", label: "أرشيف العقود", desc: "العقود المكتملة والمؤرشفة" },
      { page: "ContractTemplates", label: "قوالب العقود", desc: "إدارة قوالب العقود الجاهزة" },
      { page: "ContractAmendments", label: "تعديلات العقود", desc: "طلبات تعديل العقود القائمة" },
    ],
  },
  {
    key: "payments",
    label: "المدفوعات والمحفظة",
    icon: Wallet,
    description: "المحافظ، الإيرادات، طلبات السحب، والفواتير.",
    items: [
      { page: "AdminWallet", label: "إدارة المحافظ", desc: "أرصدة ومعاملات المحافظ" },
      { page: "AdminWalletDashboard", label: "لوحة المحافظ", desc: "نظرة عامة على حركة المحافظ" },
      { page: "AdminRefundControl", label: "إدارة المبالغ المستردة", desc: "طلبات الاسترداد" },
      { page: "AllWithdrawalRequests", label: "طلبات السحب", desc: "جميع طلبات سحب الأرصدة" },
      { page: "InvoiceManager", label: "إدارة الفواتير", desc: "فواتير المشاريع والمراحل" },
      { page: "RevenueDashboard", label: "لوحة الإيرادات", desc: "إيرادات المنصة" },
      { page: "AdminRevenueReport", label: "تقرير الإيرادات", desc: "تقرير مفصل بالإيرادات والعمولات" },
    ],
  },
  {
    key: "disputes",
    label: "النزاعات",
    icon: Scale,
    description: "متابعة وإدارة النزاعات بين الأطراف.",
    items: [
      { page: "AdminDisputes", label: "قائمة النزاعات", desc: "جميع النزاعات المفتوحة والمغلقة" },
      { page: "AdminDisputeManage", label: "إدارة نزاع", desc: "مراجعة واتخاذ قرار بشأن نزاع" },
    ],
  },
  {
    key: "notifications",
    label: "الإشعارات",
    icon: Bell,
    description: "مركز الإشعارات وسجل الرسائل المرسلة.",
    items: [
      { page: "NotificationCenter", label: "مركز الإشعارات", desc: "إدارة الإشعارات المرسلة للمستخدمين" },
      { page: "NotificationSettings", label: "إعدادات الإشعارات", desc: "ضبط قنوات وأنواع الإشعارات" },
      { page: "SentEmailsLog", label: "سجل الرسائل المرسلة", desc: "متابعة رسائل البريد الصادرة" },
    ],
  },
  {
    key: "reports",
    label: "التقارير والتحليلات",
    icon: BarChart3,
    description: "تقارير الأداء والتحليلات التفصيلية.",
    items: [
      { page: "AdminReports", label: "تقارير المنصة", desc: "تقارير شاملة عن نشاط المنصة" },
      { page: "Analytics", label: "التحليلات", desc: "تحليلات الاستخدام والزوار" },
      { page: "TaskReports", label: "تقارير المهام", desc: "متابعة إنجاز المهام" },
      { page: "AdminReviews", label: "إدارة التقييمات", desc: "مراجعة تقييمات المستخدمين" },
    ],
  },
  {
    key: "settings",
    label: "إعدادات المنصة",
    icon: SettingsIcon,
    description: "التصنيفات، العمولات، والاشتراكات.",
    items: [
      { page: "AdminCategories", label: "إدارة التصنيفات", desc: "تصنيفات المشاريع والخدمات" },
      { page: "AdminCommissionSettings", label: "إعدادات العمولة", desc: "نسب عمولة المنصة" },
      { page: "AdminSubscriptionControl", label: "إدارة الاشتراكات", desc: "باقات واشتراكات مزودي الخدمة" },
      { page: "AdminMarketEntities", label: "إدارة كيانات السوق", desc: "الشركات والموردون في السوق" },
      { page: "Settings", label: "الإعدادات العامة", desc: "إعدادات الحساب والمنصة" },
    ],
  },
];

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
  const [activeKey, setActiveKey] = useState(CATEGORIES[0].key);

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