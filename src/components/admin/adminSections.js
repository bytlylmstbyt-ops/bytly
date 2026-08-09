import {
  LayoutDashboard, Users, FileText, Wallet, Scale, Bell, BarChart3, Settings as SettingsIcon,
  FolderKanban, Building2, Link2, Mail, Megaphone, Sparkles,
} from "lucide-react";

// ── Category → page map ────────────────────────────────────────────────────
// Shared between AdminControlCenter (renders the hub) and AdminBreadcrumb
// (renders the trail). Single source of truth for admin section labels.
export const ADMIN_CATEGORIES = [
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
    key: "assistant",
    label: "مساعد الإدارة المركزي",
    icon: Sparkles,
    description: "وكيل ذكاء اصطناعي موحّد — أسئلة عن البيانات أو طلبات تعديل، بدون اختيار نوع الطلب مسبقًا.",
    items: [
      { page: "AdminAIAssistant", label: "مساعد الإدارة المركزي", desc: "اكتب طلبك مباشرة — سؤال بيانات (قراءة فقط) أو طلب تعديل (خطة + معاينة قبل أي تنفيذ) — يفهم الوكيل نوع طلبك تلقائيًا" },
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
      { page: "PermitApplication", label: "طلب رخصة البناء", desc: "تقديم ومتابعة طلبات رخص البناء عبر بلدي" },
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
  {
    key: "integrations",
    label: "التكاملات",
    icon: Link2,
    description: "إدارة جميع التكاملات والخدمات الخارجية المتصلة بالمنصة.",
    items: [
      { page: "AdminIntegrations", label: "لوحة التكاملات", desc: "عرض وإدارة جميع التكاملات وحالة الاتصال" },
    ],
  },
  {
    key: "email",
    label: "إدارة البريد الإلكتروني",
    icon: Mail,
    description: "إدارة بريد المنصة والقوالب والحملات والإحصائيات.",
    items: [
      { page: "AdminEmailCenter", label: "مركز البريد الإلكتروني", desc: "إدارة شاملة للبريد والقوالب والحملات المجدولة" },
    ],
  },
  {
    key: "marketing",
    label: "مركز التسويق",
    icon: Megaphone,
    description: "إدارة حسابات التواصل الاجتماعي والمنشورات والتحليلات.",
    items: [
      { page: "AdminMarketingCenter", label: "مركز التسويق", desc: "إدارة منصات التواصل والمنشورات والمسودات" },
      { page: "MarketingHub", label: "مولد المحتوى", desc: "توليد ونشر المحتوى التسويقي بالذكاء الاصطناعي" },
      { page: "SocialAnalytics", label: "تحليلات التواصل الاجتماعي", desc: "تقارير التفاعل عبر المنصات" },
    ],
  },
];

// Flat lookup: pageName -> { category, item }. First occurrence wins.
export const ADMIN_PAGE_MAP = (() => {
  const map = {};
  ADMIN_CATEGORIES.forEach((cat) => {
    cat.items.forEach((item) => {
      if (!map[item.page]) map[item.page] = { category: cat, item };
    });
  });
  return map;
})();

export function findAdminPage(pageName) {
  return ADMIN_PAGE_MAP[pageName] || null;
}