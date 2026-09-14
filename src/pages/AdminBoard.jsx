import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, BriefcaseBusiness, Target } from "lucide-react";
import { createPageUrl } from "@/utils";

const sections = [
  { label: "الحوكمة والصلاحيات", desc: "الأدوار، صلاحيات الموظفين، التعيين، والمعاينة وسجل التدقيق.", icon: ShieldCheck, page: "RoleManagement" },
  { label: "الإدارة التنفيذية", desc: "الوصول المنظم إلى الإدارات التشغيلية حسب مسؤولية كل مدير.", icon: BriefcaseBusiness, page: "AdminExecutiveManagement" },
  { label: "التخطيط والتغيير الاستراتيجي", desc: "مساحة عليا لإدارة الأهداف والمبادرات والقرارات الاستراتيجية.", icon: Target, page: "AdminStrategicChange" },
];

export default function AdminBoard() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8" dir="rtl">
      <div className="mb-7"><h1 className="text-2xl font-bold text-[#4A3F35]">مجلس الإدارة</h1><p className="text-sm text-slate-500 mt-1">السلطة الإدارية العليا في مركز إدارة بيتلي، ومنها تتم الحوكمة والإشراف على الإدارات التنفيذية والتغيير الاستراتيجي.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map(({ label, desc, icon: Icon, page }) => (
          <Link key={page} to={createPageUrl(page)}><Card className="h-full hover:shadow-md transition-shadow border-r-4 border-[#C9A66B]"><CardContent className="p-5"><Icon className="w-7 h-7 text-[#C9A66B] mb-4"/><h2 className="font-bold text-[#4A3F35]">{label}</h2><p className="text-sm text-slate-500 mt-2 leading-6">{desc}</p></CardContent></Card></Link>
        ))}
      </div>
    </div>
  );
}
