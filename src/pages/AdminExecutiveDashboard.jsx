import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FolderKanban, Wallet, Users, AlertTriangle, ArrowUpRight } from "lucide-react";
import { createPageUrl } from "@/utils";

const cards = [
  { title: "أداء المنصة", desc: "المؤشرات والتقارير التنفيذية", icon: BarChart3, page: "PlatformDashboard", stat: "المؤشرات الرئيسية" },
  { title: "المشاريع", desc: "حالة المشاريع والعروض والعقود", icon: FolderKanban, page: "AdminProjects", stat: "متابعة التشغيل" },
  { title: "الإيرادات", desc: "الإيرادات والعمولات والمدفوعات", icon: Wallet, page: "RevenueDashboard", stat: "المتابعة المالية" },
  { title: "المستخدمون", desc: "المهندسون والعملاء ومقدمو الخدمة", icon: Users, page: "AdminProviders", stat: "صحة قاعدة المستخدمين" },
  { title: "التنبيهات المهمة", desc: "الموافقات والنزاعات والتنبيهات التشغيلية", icon: AlertTriangle, page: "AdminDisputes", stat: "يتطلب متابعة" },
];

export default function AdminExecutiveDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <div className="mb-7"><p className="text-xs font-medium text-[#C9A66B]">مجلس الإدارة / الإدارة التنفيذية</p><h1 className="text-2xl font-bold text-[#4A3F35] mt-1">لوحة المدير التنفيذي</h1><p className="text-sm text-slate-500 mt-1">ملخص تنفيذي للقرارات والمتابعة اليومية، بدون الأدوات التقنية والإعدادات الحساسة.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ title, desc, icon: Icon, page, stat }) => <Link key={page} to={createPageUrl(page)}><Card className="h-full hover:shadow-md transition-shadow"><CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-base text-[#4A3F35]"><span className="flex items-center gap-2"><Icon className="w-5 h-5 text-[#C9A66B]" />{title}</span><ArrowUpRight className="w-4 h-4 text-slate-400" /></CardTitle></CardHeader><CardContent><p className="text-sm text-slate-500">{desc}</p><div className="mt-4 rounded-lg bg-[#FEF9EE] px-3 py-2 text-xs font-medium text-[#6B5D4F]">{stat}</div></CardContent></Card></Link>)}
      </div>
      <Card className="mt-6"><CardContent className="p-5"><p className="text-sm font-semibold text-[#4A3F35]">تنبيه إداري</p><p className="text-sm text-slate-500 mt-1">الوصول إلى الحوكمة، النطاقات، التكاملات، الأتمتة، وإعدادات النظام يبقى خارج لوحة المدير التنفيذي ويظل ضمن صلاحيات مجلس الإدارة أو الإدارة المختصة.</p></CardContent></Card>
    </div>
  );
}
