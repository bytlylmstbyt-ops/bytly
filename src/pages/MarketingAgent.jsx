import React from "react";
import { Brain, MessageCircle, Linkedin, Users, CalendarDays, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MarketingAgentPanel from "@/components/admin/MarketingAgentPanel";

export default function MarketingAgent() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10" dir="rtl">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white"><Brain className="w-6 h-6" /></div>
          <div><h1 className="text-2xl font-bold text-[#4A3F35]">وكيل التسويق</h1><p className="text-sm text-slate-500">جسم مستقل داخل إدارة التسويق لتحليل المنصة وبناء خطط النمو والعلاقات.</p></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-4"><MessageCircle className="w-5 h-5 mb-2 text-[#C9A66B]" /><p className="font-semibold">التواصل المباشر</p><p className="text-xs text-slate-500 mt-1">عملاء، شركات، مهندسون، مقاولون وموردون.</p></CardContent></Card>
        <Card><CardContent className="p-4"><Linkedin className="w-5 h-5 mb-2 text-[#C9A66B]" /><p className="font-semibold">LinkedIn</p><p className="text-xs text-slate-500 mt-1">محتوى مهني قصير ولقطات حقيقية من بيتلي.</p></CardContent></Card>
        <Card><CardContent className="p-4"><CalendarDays className="w-5 h-5 mb-2 text-[#C9A66B]" /><p className="font-semibold">الفعاليات والعلاقات</p><p className="text-xs text-slate-500 mt-1">مؤتمرات ولقاءات تفتح فرص شراكات وصفقات.</p></CardContent></Card>
        <Card><CardContent className="p-4"><Users className="w-5 h-5 mb-2 text-[#C9A66B]" /><p className="font-semibold">قنوات النمو</p><p className="text-xs text-slate-500 mt-1">SEO/GEO، الإعلانات، الإحالات والشراكات.</p></CardContent></Card>
      </div>
      <Card className="mb-6 border-[#C9A66B]/30"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-[#C9A66B]" />سياسة التشغيل</CardTitle></CardHeader><CardContent className="text-sm text-slate-600 space-y-2"><p>الوكيل يحلل البيانات ويقترح الخطط والمهام، ولا يرسل رسائل أو ينشر محتوى أو ينفق ميزانية دون اعتماد.</p><p>أي لقطة شاشة حقيقية من لوحات بيتلي للنشر يجب مراجعتها أولًا وإخفاء بيانات العملاء والمعلومات الحساسة.</p></CardContent></Card>
      <MarketingAgentPanel />
    </div>
  );
}
