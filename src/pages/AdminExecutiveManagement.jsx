import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, FolderKanban, Wallet, Megaphone, Users, Wrench } from "lucide-react";
import { createPageUrl } from "@/utils";

const departments = [
  { key: "projects", label: "إدارة المشاريع", desc: "المشاريع والعقود والتنفيذ", icon: FolderKanban, page: "AdminProjects" },
  { key: "payments", label: "الإدارة المالية", desc: "المحافظ والفواتير والإيرادات", icon: Wallet, page: "AdminWallet" },
  { key: "marketing", label: "إدارة التسويق", desc: "التسويق والمحتوى وSEO", icon: Megaphone, page: "AdminMarketingCenter" },
  { key: "people", label: "إدارة الموارد والمستخدمين", desc: "المهندسون والعملاء والأدوار", icon: Users, page: "AdminEngineers" },
  { key: "providers", label: "إدارة مقدمي الخدمة", desc: "الشركات والاستشاريون والمقاولون والموردون", icon: Building2, page: "AdminProviders" },
  { key: "integrations", label: "الإدارة التقنية", desc: "التكاملات والنطاقات والأتمتة", icon: Wrench, page: "AdminIntegrations" },
];

export default function AdminExecutiveManagement() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8" dir="rtl">
      <div className="mb-7"><h1 className="text-2xl font-bold text-[#4A3F35]">الإدارة التنفيذية</h1><p className="text-sm text-slate-500 mt-1">بوابة الإدارات التنفيذية في منصة بيتلي. كل إدارة تقود صفحاتها وأدواتها من هنا.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(({ label, desc, icon: Icon, page }) => (
          <Link key={page} to={createPageUrl(page)}><Card className="h-full hover:shadow-md transition-shadow border-r-4 border-[#C9A66B]"><CardContent className="p-5"><Icon className="w-6 h-6 text-[#C9A66B] mb-3"/><h2 className="font-bold text-[#4A3F35]">{label}</h2><p className="text-sm text-slate-500 mt-1">{desc}</p></CardContent></Card></Link>
        ))}
      </div>
    </div>
  );
}
