import {
  LayoutDashboard, Users, FileText, Wallet, Scale, Bell, BarChart3, Settings as SettingsIcon, Award,
  FolderKanban, Building2, Link2, Mail, Megaphone, Sparkles, Layers, Workflow, Crown, MessageCircle,
} from "lucide-react";

export const ADMIN_CATEGORIES = [
  { key: "board", label: "مجلس الإدارة", icon: Crown, description: "السلطة الإدارية العليا: الحوكمة، الإدارة التنفيذية، والتغيير الاستراتيجي.", items: [
    { page: "AdminBoard", label: "مجلس الإدارة", desc: "السلطة العليا والإشراف المؤسسي" },
    { page: "RoleManagement", label: "الحوكمة والصلاحيات", desc: "الأدوار والصلاحيات وسجل التدقيق" },
    { page: "AdminExecutiveManagement", label: "الإدارة التنفيذية", desc: "الوصول المنظم إلى الإدارات التنفيذية" },
    { page: "AdminExecutiveDashboard", label: "لوحة المدير التنفيذي", desc: "ملخص المؤشرات والقرارات والمتابعة التنفيذية" },
    { page: "AdminStrategicChange", label: "التخطيط والتغيير الاستراتيجي", desc: "الأهداف والمبادرات والقرارات الاستراتيجية" },
  ] },
  { key: "overview", label: "نظرة عامة", icon: LayoutDashboard, description: "المؤشرات الرئيسية لأداء المنصة.", items: [{ page: "PlatformDashboard", label: "لوحة أداء المنصة", desc: "مؤشرات المشاريع، الإيرادات، والمهندسين" }] },
  { key: "conversations", label: "مركز المحادثات", icon: MessageCircle, description: "مركز مستقل لمتابعة محادثات المنصة ورسائلها." , items: [
    { page: "AdminConversationsCenter", label: "مركز المحادثات", desc: "عرض المحادثات والرسائل والنشاط من مكان واحد", priority: "high" },
    { page: "Messages", label: "محادثات المستخدمين", desc: "واجهة المحادثات والرسائل للمستخدمين" },
    { page: "ProjectChat", label: "محادثات المشاريع", desc: "غرف محادثات المشاريع والمشاركين" },
  ] },
  { key: "assistant", label: "مساعد الإدارة المركزي", icon: Sparkles, description: "وكيل ذكاء اصطناعي موحّد — أسئلة عن البيانات أو طلبات تعديل، بدون اختيار نوع الطلب مسبقًا.", items: [{ page: "AdminAIAssistant", label: "مساعد الإدارة المركزي", desc: "اكتب طلبك مباشرة — سؤال بيانات (قراءة فقط) أو طلب تعديل (خطة + معاينة قبل أي تنفيذ) — يفهم الوكيل نوع طلبك تلقائيًا" }] },
  { key: "projects", label: "إدارة المشاريع", icon: FolderKanban, description: "كل ما يخص المشاريع وإدارتها من لوحة واحدة.", items: [
    { page: "AdminOperationsDashboard", label: "لوحة مدير العمليات", desc: "ملخص المشاريع والعروض والعقود والتنفيذ" },
    { page: "AdminProjects", label: "لوحة إدارة المشاريع", desc: "نظرة شاملة وإدارة كل مشاريع المنصة", permission: ["projects", "view"], priority: "critical" },
    { page: "Projects", label: "سوق المشاريع", desc: "تصفح جميع المشاريع المنشورة" },
    { page: "ProjectProposals", label: "إدارة العروض", desc: "متابعة عروض المشاريع" },
    { page: "CompareProposals", label: "مقارنة العروض", desc: "مقارنة عروض مشروع معين" },
    { page: "DataClassification", label: "تصنيف بيانات المشاريع", desc: "تنظيم وتصنيف بيانات المشاريع" },
    { page: "AdminCategories", label: "إدارة التصنيفات", desc: "تصنيفات المشاريع والخدمات" },
    { page: "PermitApplication", label: "طلب رخصة البناء", desc: "تقديم ومتابعة طلبات رخص البناء عبر بلدي" },
  ] },
  { key: "people", label: "إدارة المستخدمين", icon: Users, description: "مركز موحد لإدارة المهندسين والعملاء ومقدمي الخدمة وعلاقات العملاء والأدوار والموافقات.", items: [
    { page: "AdminUserManagementCenter", label: "مركز إدارة المستخدمين", desc: "بوابة موحدة لكل عمليات المستخدمين والعملاء والأدوار" },
    { page: "AdminEngineers", label: "إدارة المهندسين", desc: "مراجعة واعتماد ملفات المهندسين", priority: "critical" },
    { page: "AdminClients", label: "إدارة العملاء", desc: "قائمة العملاء وبياناتهم", priority: "critical" },
    { page: "AdminReviews", label: "تقييمات العملاء", desc: "مراجعة تقييمات العملاء وملاحظاتهم" },
    { page: "AdminClients", label: "علاقات العملاء CRM", desc: "متابعة علاقات العملاء والتواصل" },
    { page: "AdminProviders", label: "الشركات ومقدمو الخدمة", desc: "الشركات والمقاولون والاستشاريون والموردون", priority: "critical" },
    { page: "AdminMarketEntities", label: "إدارة كيانات السوق", desc: "الشركات والموردون في السوق" },
    { page: "RoleManagement", label: "إدارة الأدوار", desc: "تعريف أدوار المستخدمين وصلاحياتها" },
    { page: "UserRoleAssignment", label: "تعيين الأدوار للمستخدمين", desc: "ربط المستخدمين بالأدوار" },
    { page: "PendingApprovals", label: "الموافقات المعلقة", desc: "طلبات بانتظار المراجعة", priority: "critical" },
  ] },
  { key: "developers_investors", label: "إدارة المطورين والمستثمرين", icon: Building2, description: "سجل مستقل للمطورين والمستثمرين المنقولين من بيانات المنصة، منفصل عن إدارة العملاء.", items: [
    { page: "AdminDeveloperInvestorManagement", label: "قائمة المطورين والمستثمرين", desc: "عرض الاسم والشركة والنوع والمنطقة والجوال والبريد وحجم الاستثمار", priority: "high" },
  ] },
  { key: "providers", label: "مقدمو الخدمة", icon: Building2, description: "الشركات الهندسية والاستشارية والاستشاريون والمقاولون والموردون.", items: [
    { page: "AdminProviders", label: "لوحة مقدمي الخدمة", desc: "إدارة الشركات الهندسية والاستشارية والاستشاريين والمقاولين والموردين" },
    { page: "ConsultingFirms", label: "الشركات الاستشارية", desc: "تصفح الشركات الاستشارية المعتمدة" },
    { page: "AdminMarketEntities", label: "كيانات السوق", desc: "الشركات والموردون في السوق" },
  ] },
  { key: "contracts", label: "العقود", icon: FileText, description: "أرشيف العقود، القوالب، والتعديلات.", items: [
    { page: "ContractManager", label: "إدارة العقود", desc: "عرض ومتابعة جميع العقود" },
    { page: "ContractArchive", label: "أرشيف العقود", desc: "العقود المكتملة والمؤرشفة" },
    { page: "ContractTemplates", label: "قوالب العقود", desc: "إدارة قوالب العقود الجاهزة" },
    { page: "ContractAmendments", label: "تعديلات العقود", desc: "طلبات تعديل العقود القائمة" },
  ] },
  { key: "payments", label: "الإدارة المالية", icon: Wallet, description: "المحافظ، الإيرادات، طلبات السحب، والفواتير.", items: [
    { page: "AdminFinanceDashboard", label: "لوحة المدير المالي", desc: "ملخص مالي للفواتير والإيرادات والسحوبات والاستردادات" },
    { page: "AdminWallet", label: "إدارة المحافظ", desc: "أرصدة ومعاملات المحافظ", permission: ["payments", "view"], priority: "critical" },
    { page: "AdminWalletDashboard", label: "لوحة المحافظ", desc: "نظرة عامة على حركة المحافظ" },
    { page: "AdminRefundControl", label: "إدارة المبالغ المستردة", desc: "طلبات الاسترداد" },
    { page: "AllWithdrawalRequests", label: "طلبات السحب", desc: "جميع طلبات سحب الأرصدة" },
    { page: "InvoiceManager", label: "إدارة الفواتير", desc: "فواتير المشاريع والمراحل" },
    { page: "AdminCommissionSettings", label: "إدارة العمولات", desc: "نسب عمولة المنصة" },
    { page: "AdminSubscriptionControl", label: "إدارة الاشتراكات", desc: "باقات واشتراكات مزودي الخدمة" },
    { page: "RevenueDashboard", label: "لوحة الإيرادات", desc: "إيرادات المنصة" },
    { page: "AdminRevenueReport", label: "تقرير الإيرادات", desc: "تقرير مفصل بالإيرادات والعمولات" },
  ] },
  { key: "disputes", label: "النزاعات", icon: Scale, description: "متابعة وإدارة النزاعات بين الأطراف.", items: [
    { page: "AdminDisputes", label: "قائمة النزاعات", desc: "جميع النزاعات المفتوحة والمغلقة" },
    { page: "AdminDisputeManage", label: "إدارة نزاع", desc: "مراجعة واتخاذ قرار بشأن نزاع" },
    { page: "FileDispute", label: "تقديم النزاع", desc: "نموذج تقديم النزاع مع المشروع والمرحلة والأدلة والمستندات" },
  ] },
  { key: "notifications", label: "الإشعارات", icon: Bell, description: "مركز الإشعارات وسجل الرسائل المرسلة.", items: [
    { page: "NotificationCenter", label: "مركز الإشعارات", desc: "إدارة الإشعارات المرسلة للمستخدمين" },
    { page: "NotificationSettings", label: "إعدادات الإشعارات", desc: "ضبط قنوات وأنواع الإشعارات" },
    { page: "SentEmailsLog", label: "سجل الرسائل المرسلة", desc: "متابعة رسائل البريد الصادرة" },
  ] },
  { key: "quality_certifications", label: "شهادات الجودة والاعتماد", icon: Award, description: "إدارة شهادات الجودة والاعتماد للمشاريع المكتملة، ومراجعة الشهادات التي يحصل عليها العملاء بعد إتمام المشروع والتقييم.", items: [
    { page: "AllCertifications", label: "جميع الشهادات", desc: "عرض ومراجعة جميع المشاريع المعتمدة وشهادات الجودة المرتبطة بها", priority: "high" },
    { page: "CertificationPage", label: "صفحة شهادة الجودة", desc: "عرض الشهادة التفصيلية للمشروع ومحتواها وتصميمها وإصدار نسخة PDF", priority: "high" },
  ] },
  { key: "reports", label: "التقارير والتحليلات", icon: BarChart3, description: "تقارير الأداء والتحليلات التفصيلية.", items: [
    { page: "AdminReports", label: "تقارير المنصة", desc: "تقارير شاملة عن نشاط المنصة" },
    { page: "Analytics", label: "التحليلات", desc: "تحليلات الاستخدام والزوار" },
    { page: "TaskReports", label: "تقارير المهام", desc: "متابعة إنجاز المهام" },
    { page: "AdminReviews", label: "إدارة التقييمات", desc: "مراجعة تقييمات المستخدمين" },
  ] },
  { key: "settings", label: "إعدادات المنصة", icon: SettingsIcon, description: "الإعدادات العامة والتكوين الأساسي للمنصة.", items: [
    { page: "AdminPlatformSettings", label: "إعدادات التطبيق ووثائق API", desc: "شعار التطبيق، الوصف، الصورة الاجتماعية، ووثائق واجهة برمجة التطبيقات" },
    { page: "Settings", label: "الإعدادات العامة", desc: "إعدادات الحساب والمنصة" },
    { page: "AdminAuthenticationSettings", label: "إعدادات المصادقة", desc: "إعدادات تسجيل الدخول والمصادقة" },
  ] },
  { key: "bim", label: "BIM", icon: Layers, description: "إدارة ملفات ومخرجات BIM والتقارير الهندسية.", items: [
    { page: "BIMDashboard", label: "لوحة BIM", desc: "ملفات ومشاريع BIM" },
    { page: "BIMQuantitiesReport", label: "تقرير كميات BIM", desc: "تقرير الكميات المستخرج من نماذج BIM" },
    { page: "BIMSearch", label: "بحث BIM", desc: "البحث في بيانات نماذج BIM" },
  ] },
  { key: "workflows", label: "الأتمتة وسير العمل", icon: Workflow, description: "بناء ومتابعة سير العمل والأتمتة.", items: [
    { page: "AdminWorkflowAutomation", label: "أتمتة سير العمل", desc: "إدارة عمليات الأتمتة" },
    { page: "WorkflowBuilder", label: "منشئ سير العمل", desc: "إنشاء وتعديل مسارات العمل" },
  ] },
  { key: "domains", label: "النطاقات", icon: Link2, description: "إدارة النطاق المجاني، النطاقات المخصصة، إعادة التوجيه، وعنوان إرسال البريد.", items: [{ page: "AdminDomains", label: "النطاقات", desc: "شراء وربط النطاقات، إدارة إعادة التوجيه وعنوان الإرسال" }] },
  { key: "integrations", label: "التكاملات", icon: Link2, description: "إدارة جميع التكاملات والخدمات الخارجية المتصلة بالمنصة.", items: [{ page: "AdminIntegrations", label: "لوحة التكاملات", desc: "عرض وإدارة جميع التكاملات وحالة الاتصال", priority: "high" }] },
  { key: "email", label: "إدارة البريد الإلكتروني", icon: Mail, description: "إدارة بريد المنصة والقوالب والحملات والإحصائيات.", items: [{ page: "AdminEmailCenter", label: "مركز البريد الإلكتروني", desc: "إدارة شاملة للبريد والقوالب والحملات المجدولة" }] },
  { key: "ads", label: "مركز الإعلانات", icon: Megaphone, description: "إدارة الإعلانات والمعلنين وطلبات الإعلان من مركز واحد.", items: [
    { page: "AdManager", label: "مدير الإعلانات", desc: "إنشاء وتعديل ومتابعة الإعلانات" },
    { page: "AdvertiseWithUs", label: "أعلن معنا", desc: "واجهة التعريف بالإعلان والباقات وبدء طلب الإعلان" },
    { page: "AdvertiserDirectory", label: "المعلنون", desc: "قائمة المعلنين وإجمالي إعلاناتهم وظهورهم ونقراتهم" },
    { page: "AdvertiserGateway", label: "بوابة المعلن", desc: "لوحة الإعلانات وتقرير الأداء والمشاهدات والنقرات" },
  ] },
  { key: "marketing", label: "إدارة التسويق", icon: Megaphone, description: "إدارة التسويق والعلاقات والقنوات والمحتوى والتحليلات.", items: [
    { page: "AdminMarketingDashboard", label: "لوحة مدير التسويق", desc: "ملخص التسويق والبريد وSEO والنطاقات والتحليلات" },
    { page: "MarketingAgent", label: "وكيل التسويق", desc: "جسم مستقل لتحليل المنصة وبناء خطط التواصل المباشر وLinkedIn والفعاليات والقنوات التسويقية", permission: ["marketing", "view"], priority: "high" },
    { page: "AdminMarketingCenter", label: "مركز التسويق", desc: "إدارة منصات التواصل والمنشورات والمسودات", permission: ["marketing", "view"] },
    { page: "MarketingHub", label: "مولد المحتوى", desc: "توليد ونشر المحتوى التسويقي بالذكاء الاصطناعي" },
    { page: "SocialAnalytics", label: "تحليلات التواصل الاجتماعي", desc: "تقارير التفاعل عبر المنصات" },
    { page: "AdminSearchGeoAnalytics", label: "محركات البحث والتحليل الجغرافي", desc: "متابعة جاهزية SEO وتحليل مصادر الزيارات والمدن والصفحات النشطة", permission: ["marketing", "view"] },
    { page: "AdminDomains", label: "إدارة النطاقات", desc: "ربط النطاقات وإعدادات DNS", permission: ["domains", "view"] },
    { page: "AdminEmailCenter", label: "مركز البريد والقوالب", desc: "إدارة البريد والقوالب والأتمتة", permission: ["email", "view"] },
  ] },
];

export const ADMIN_PAGE_MAP = (() => {
  const map = {};
  ADMIN_CATEGORIES.forEach((cat) => cat.items.forEach((item) => { if (!map[item.page]) map[item.page] = { category: cat, item }; }));
  return map;
})();

export function findAdminPage(pageName) { return ADMIN_PAGE_MAP[pageName] || null; }