import {
  LayoutDashboard, Users, FileText, Wallet, Scale, Bell, BarChart3, Settings as SettingsIcon,
  FolderKanban, Building2, Link2, Mail, Megaphone, Sparkles, Layers, Workflow, Crown,
} from "lucide-react";

// ── Category → page map ────────────────────────────────────────────────────
// Shared between AdminControlCenter (renders the hub) and AdminBreadcrumb
// (renders the trail). Single source of truth for admin section labels.
export const ADMIN_CATEGORIES = [
  {
    key: "developers_investors",
    label: "إدارة المطورين والمستثمرين",
    icon: Building2,
    description: "سجل مستقل للمطورين والمستثمرين الموجودين في بيانات المنصة، منفصل تمامًا عن إدارة العملاء.",
    items: [
      { page: "AdminDeveloperInvestorManagement", label: "قائمة المطورين والمستثمرين", desc: "عرض الاسم والشركة والنوع وجهة الاتصال والمنطقة والجوال والبريد والموقع", priority: "high" },
    ],
  },
  // The remaining categories are defined below in the existing file.
];