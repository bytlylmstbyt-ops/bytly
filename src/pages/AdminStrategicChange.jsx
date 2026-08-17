import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Lightbulb, ClipboardCheck } from "lucide-react";

export default function AdminStrategicChange() {
  const items = [
    [Target, "الأهداف الاستراتيجية", "تحديد ومتابعة أهداف المنصة ومؤشرات نجاحها."],
    [Lightbulb, "المبادرات والتغيير", "تسجيل المبادرات الاستراتيجية ومتابعة تقدمها."],
    [ClipboardCheck, "القرارات والمتابعة", "مساحة منظمة للقرارات العليا وإجراءات المتابعة."],
  ];
  return <div className="max-w-6xl mx-auto px-4 py-8" dir="rtl"><h1 className="text-2xl font-bold text-[#4A3F35]">التخطيط والتغيير الاستراتيجي</h1><p className="text-sm text-slate-500 mt-1 mb-7">إدارة التوجه الاستراتيجي للمنصة من مستوى مجلس الإدارة.</p><div className="grid md:grid-cols-3 gap-4">{items.map(([Icon,title,desc])=><Card key={title}><CardContent className="p-5"><Icon className="w-6 h-6 text-[#C9A66B] mb-3"/><h2 className="font-bold">{title}</h2><p className="text-sm text-slate-500 mt-2">{desc}</p></CardContent></Card>)}</div></div>;
}
