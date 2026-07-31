import React from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, ArrowLeft, BookOpen, Ruler, Calculator, Layers,
  Users, FileText, ShieldCheck, Bot, MapPin, HardHat, Boxes
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const resources = [
  {
    icon: Calculator, title: "دليل تقدير التكاليف", desc: "كيف تحدد ميزانية مشروعك الهندسي بدقة وتتجنب الفجوات.",
    to: "/CostEstimator", tag: "مالية", read: "5 دقائق"
  },
  {
    icon: Layers, title: "مراحل المشروع الهندسي", desc: "شرح كل مرحلة من الفكرة حتى التسليم وما يُنتظر منك فيها.",
    to: "/ProjectStages", tag: "إدارة", read: "7 دقائق"
  },
  {
    icon: Users, title: "تنسيق الأدوار", desc: "متى تتدخل الشركة الاستشارية، والمساح، والمقاول، والمورد.",
    to: "/ConsultingFirms", tag: "أدوار", read: "6 دقائق"
  },
  {
    icon: Ruler, title: "الموارد الفنية", desc: "مراجع فنية للمواد والأنظمة والمعايير السعودية (SBC).",
    to: "/TechnicalResources", tag: "فني", read: "مرجع"
  },
  {
    icon: Bot, title: "Bytly AI ومتابعة المخاطر", desc: "كيف يراقب المساعد الذكي مشروعك أسبوعياً وينبّهك للمخاطر.",
    to: "/AIEngineers", tag: "ذكاء", read: "4 دقائق"
  },
  {
    icon: MapPin, title: "دليل خدمات المسح", desc: "كيف تطلب مساحاً معتمداً وتحجز موعداً ميدانياً للموقع.",
    to: "/SurveyClientDashboard", tag: "ميداني", read: "5 دقائق"
  },
  {
    icon: ShieldCheck, title: "نظام الضمان والمراجعة", desc: "كيف تحمي أموالك عبر الضمان والمراجعة الفنية المستقلة.",
    to: "/Wallet", tag: "حماية", read: "6 دقائق"
  },
  {
    icon: FileText, title: "العقود الإلكترونية", desc: "ما يجب أن يتضمنه عقدك الهندسي وكيف يوقّعه الطرفان رقمياً.",
    to: "/MyContracts", tag: "قانوني", read: "8 دقائق"
  },
];

export default function Resources() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-amber-50/40">
      {/* Hero / H1 */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
        <Badge variant="outline" className="mb-4 border-[#C9A66B] text-[#C9A66B] bg-[#C9A66B]/5">
          <BookOpen className="w-3 h-3 ml-1" /> مركز الموارد
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-bold text-[#4A3F35] mb-4 leading-tight">
          مركز المعرفة الهندسية
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          أدلة عملية حول سير العمل الهندسي وتقدير التكاليف ومراحل المشروع وتنسيق الأدوار — لتقرر بثقة قبل البدء.
        </p>
      </section>

      {/* Problem framing / H2 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <h2 className="text-2xl font-bold text-[#4A3F35] mb-4">لماذا مركز الموارد؟</h2>
        <p className="text-slate-600 leading-relaxed">
          معظم أصحاب المشاريع يدخلون بدون خلفية عن مراحل العمل الهندسي والتكاليف الحقيقية. يوفر هذا المركز معرفة مركّزة ومباشرة — لا نظريات — بل خطوات عملية تساعدك على فهم ما تشتريه قبل دفع أي ريال.
        </p>
      </section>

      {/* Resources grid / H2 */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-bold text-[#4A3F35] mb-6">الأدلة المتاحة</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((r, i) => (
            <Link key={i} to={r.to}>
              <Card className="h-full border-[#C9A66B]/20 hover:border-[#C9A66B] hover:shadow-lg transition-all hover-lift">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-lg bg-[#C9A66B]/10 flex items-center justify-center">
                      <r.icon className="w-5 h-5 text-[#6B5D4F]" />
                    </div>
                    <Badge variant="outline" className="text-[10px] text-[#C9A66B] border-[#C9A66B]/30">{r.tag}</Badge>
                  </div>
                  <h3 className="font-semibold text-[#4A3F35] mb-1.5">{r.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">{r.desc}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {r.read}</span>
                    <span className="flex items-center gap-1 text-[#6B5D4F]">قراءة <ArrowLeft className="w-3 h-3" /></span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Process steps / H2 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-bold text-[#4A3F35] mb-6 text-center">المسار القياسي للمعرفة</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { n: "1", t: "افهم التكلفة", d: "ابدأ بدليل التقدير لتحديد ميزانيتك." },
            { n: "2", t: "تعرّف على المراحل", d: "اقرأ مراحل المشروع لتعرف ما ينتظرك." },
            { n: "3", t: "نسّق الأدوار", d: "حدد من تحتاجه: مهندس، استشاري، مساح." },
            { n: "4", t: "ابدأ بثقة", d: "أطلق مشروعك محمياً عبر الضمان." },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white font-bold flex items-center justify-center mx-auto mb-2">{s.n}</div>
              <p className="font-semibold text-[#4A3F35] mb-1 text-sm">{s.t}</p>
              <p className="text-xs text-slate-500">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA / H2 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-2xl bg-gradient-to-br from-[#4A3F35] to-[#6B5D4F] p-8 sm:p-10 text-center text-white">
          <Boxes className="w-10 h-10 mx-auto mb-3 text-[#C9A66B]" />
          <h2 className="text-2xl font-bold mb-3">جاهز لتطبيق ما تعلمته؟</h2>
          <p className="text-slate-200 mb-6 max-w-xl mx-auto">حوّل المعرفة إلى مشروع حقيقي محمي. ابدأ الآن عبر منصة بيتلي.</p>
          <Link to="/RegisterChoice"><Button className="bg-[#C9A66B] text-[#4A3F35] hover:bg-[#E5D4B8]">سجّل وابدأ مجاناً <ArrowLeft className="w-4 h-4 mr-1" /></Button></Link>
        </div>
      </section>
    </div>
  );
}