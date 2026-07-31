import React from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, ArrowLeft, BookOpen, Ruler, Calculator, Layers,
  Users, FileText, ShieldCheck, Bot, MapPin, HardHat, Boxes, FolderTree
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LinkFolder from "@/components/content/LinkFolder";
import LiveActiveBadge from "@/components/trust/LiveActiveBadge";

const folders = [
  {
    icon: Calculator,
    title: "التخطيط والتكاليف",
    subtitle: "ابدأ بفهم الميزانية ومراحل المشروع قبل أي التزام.",
    items: [
      { icon: Calculator, title: "دليل تقدير التكاليف", desc: "كيف تحدد ميزانية مشروعك الهندسي بدقة وتتجنب الفجوات.", to: "/CostEstimator", tag: "مالية", read: "5 دقائق" },
      { icon: Layers,    title: "مراحل المشروع الهندسي", desc: "شرح كل مرحلة من الفكرة حتى التسليم وما يُنتظر منك فيها.", to: "/ProjectStages", tag: "إدارة", read: "7 دقائق" },
    ],
  },
  {
    icon: Users,
    title: "الأدوار والفِرق",
    subtitle: "افهم متى تحتاج كل طرف في فريقك الهندسي.",
    items: [
      { icon: Users, title: "تنسيق الأدوار", desc: "متى تتدخل الشركة الاستشارية، والمساح، والمقاول، والمورد.", to: "/ConsultingFirms", tag: "أدوار", read: "6 دقائق" },
    ],
  },
  {
    icon: ShieldCheck,
    title: "الحماية والقانون",
    subtitle: "آليات حماية أموالك وضمان حقوقك التعاقدية.",
    items: [
      { icon: ShieldCheck, title: "نظام الضمان والمراجعة", desc: "كيف تحمي أموالك عبر الضمان والمراجعة الفنية المستقلة.", to: "/Wallet", tag: "حماية", read: "6 دقائق" },
      { icon: FileText,    title: "العقود الإلكترونية",    desc: "ما يجب أن يتضمنه عقدك الهندسي وكيف يوقّعه الطرفان رقمياً.", to: "/MyContracts", tag: "قانوني", read: "8 دقائق" },
    ],
  },
  {
    icon: Bot,
    title: "الذكاء والميدان",
    subtitle: "أدوات المتابعة الذكية والخدمات الميدانية والمراجع الفنية.",
    items: [
      { icon: Bot,   title: "Bytly AI ومتابعة المخاطر", desc: "كيف يراقب المساعد الذكي مشروعك أسبوعياً وينبّهك للمخاطر.", to: "/AIEngineers", tag: "ذكاء", read: "4 دقائق" },
      { icon: MapPin, title: "دليل خدمات المسح",          desc: "كيف تطلب مساحاً معتمداً وتحجز موعداً ميدانياً للموقع.", to: "/SurveyClientDashboard", tag: "ميداني", read: "5 دقائق" },
      { icon: Ruler,  title: "الموارد الفنية",            desc: "مراجع فنية للمواد والأنظمة والمعايير السعودية (SBC).", to: "/TechnicalResources", tag: "فني", read: "مرجع" },
    ],
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
        <div className="mt-6 flex justify-center">
          <LiveActiveBadge />
        </div>
      </section>

      {/* Problem framing / H2 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <h2 className="text-2xl font-bold text-[#4A3F35] mb-4">لماذا مركز الموارد؟</h2>
        <p className="text-slate-600 leading-relaxed">
          معظم أصحاب المشاريع يدخلون بدون خلفية عن مراحل العمل الهندسي والتكاليف الحقيقية. يوفر هذا المركز معرفة مركّزة ومباشرة — لا نظريات — بل خطوات عملية تساعدك على فهم ما تشتريه قبل دفع أي ريال.
        </p>
      </section>

      {/* Resources folders / H2 */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FolderTree className="w-6 h-6 text-[#C9A66B]" />
          <h2 className="text-2xl font-bold text-[#4A3F35]">الأدلة مُجمّعة في مجلدات</h2>
        </div>
        <p className="text-slate-500 text-center mb-8">ثمانية أدلة مصنّفة في أربعة مجلدات علوية لتسهيل العثور على ما تحتاجه.</p>
        {folders.map((f, i) => (
          <LinkFolder key={i} {...f} />
        ))}
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