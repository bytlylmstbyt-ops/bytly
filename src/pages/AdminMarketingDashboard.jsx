import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Mail, Search, Globe2, BarChart3, ArrowUpRight } from "lucide-react";
import { createPageUrl } from "@/utils";

const cards = [
  { title: "مركز التسويق", desc: "الحملات والمحتوى والقنوات التسويقية", icon: Megaphone, page: "AdminMarketingCenter" },
  { title: "البريد والقوالب", desc: "قوالب البريد والرسائل والسجل", icon: Mail, page: "AdminEmailCenter" },
  { title: "تحسين محركات البحث", desc: "SEO والتحليل الجغرافي وإصلاحات الظهور", icon: Search, page: "AdminSearchGeoAnalytics" },
  { title: "النطاقات", desc: "إدارة النطاقات والربط وإعدادات DNS", icon: Globe2, page: "AdminDomains" },
  { title: "تحليلات التسويق", desc: "قياس الأداء والنتائج التسويقية", icon: BarChart3, page: "SocialAnalytics" },
];

export default function AdminMarketingDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <div className="mb-7"><p className="text-xs font-medium text-[#C9A66B]">مجلس الإدارة / الإدارة التنفيذية / إدارة التسويق</p><h1 className="text-2xl font-bold text-[#4A3F35] mt-1">لوحة مدير التسويق</h1><p className="text-sm text-slate-500 mt-1">مساحة تسويقية موحدة للحملات والمحتوى والبريد وSEO والنطاقات والتحليلات.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ title, desc, icon: Icon, page }) => <Link key={page} to={createPageUrl(page)}><Card className="h-full hover:shadow-md transition-shadow"><CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-base text-[#4A3F35]"><span className="flex items-center gap-2"><Icon className="w-5 h-5 text-[#C9A66B]" />{title}</span><ArrowUpRight className="w-4 h-4 text-slate-400" /></CardTitle></CardHeader><CardContent><p className="text-sm text-slate-500">{desc}</p></CardContent></Card></Link>)}
      </div>
    </div>
  );
}
