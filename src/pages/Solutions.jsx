import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, CheckCircle, ArrowLeft, Boxes, Ruler, ShieldCheck,
  FileSignature, Wallet, Bot, MapPin, Building2, Layers, Zap, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const modules = [
  { icon: Ruler,        title: "حاسبة التكاليف",      desc: "تقدير فوري لقيمة المشروع بناءً على المساحة والنطاق.", to: "/CostEstimator", tag: "تخطيط" },
  { icon: Layers,       title: "محاكي مراحل المشروع",desc: "حوكمة واضحة لمراحل التنفيذ من التصميم حتى التسليم.", to: "/ProjectStages", tag: "إدارة" },
  { icon: ShieldCheck,  title: "الضمان والحوالات",    desc: "حماية أموالك في الضمان وإطلاقها عند اعتماد المراحل.", to: "/Wallet", tag: "مالية" },
  { icon: FileSignature,title: "العقود الإلكترونية", desc: "عقود موثقة بآلياً بتوقيع رقمي لكل من العميل والمهندس.", to: "/MyContracts", tag: "قانوني" },
  { icon: Bot,          title: "Bytly AI",           desc: "مساعد ذكي يحلل المخاطر ويوصي بإجراءات وقائية.", to: "/AIEngineers", tag: "ذكاء" },
  { icon: MapPin,       title: "خدمات المسح",        desc: "طلب مساح معتمد وحجز موعد ميداني للموقع.", to: "/SurveyClientDashboard", tag: "ميداني" },
  { icon: Building2,    title: "الكيانات السوقية",   desc: "سوق متكامل للمقاولين والموردين والاستشاريين.", to: "/MarketEntities", tag: "سوق" },
  { icon: Wallet,       title: "المحفظة والمدفوعات",desc: "إدارة الميزانية والمدفوعات بمسار شفاف.", to: "/WalletTopup", tag: "مالية" },
];

const benefits = [
  "كل أدوات المشروع في مكان واحد بدل التشتت بين التطبيقات",
  "حماية مالية كاملة عبر نظام الضمان والمراجعة الفنية",
  "متابعة ذكية أسبوعية تكشف المخاطر قبل وقوعها",
  "عقود موثقة ومراجعة فنية مستقلة لكل تسليم",
];

export default function Solutions() {
  const [stats, setStats] = useState({ engineers: 0, projects: 0, firms: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [eng, firms] = await Promise.all([
          base44.entities.Engineer.list(1, 1),
          base44.entities.EngineeringFirm.list(1, 1),
        ]);
        setStats({ engineers: eng.length, projects: 0, firms: firms.length });
      } catch (_) { /* ignore */ }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-amber-50/40">
      {/* Hero / H1 */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-10 text-center">
        <Badge variant="outline" className="mb-4 border-[#C9A66B] text-[#C9A66B] bg-[#C9A66B]/5">
          <Sparkles className="w-3 h-3 ml-1" /> الحلول
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-bold text-[#4A3F35] mb-4 leading-tight">
          حلول بيتلي المتكاملة لإدارة المشاريع الهندسية
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
          منصة واحدة تجمع التصميم والتنفيذ والمالية والذكاء الاصطناعي — ليتمكن صاحب المشروع من إطلاق عمله بثقة وإتمامه بأمان.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/CreateProject"><Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">ابدأ مشروعك الآن <ArrowLeft className="w-4 h-4 mr-1" /></Button></Link>
          <Link to="/CaseStudies"><Button variant="outline" className="border-[#C9A66B] text-[#6B5D4F]">شاهد دراسات الحالة</Button></Link>
        </div>
      </section>

      {/* Problem / H2 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-bold text-[#4A3F35] mb-4">المشكلة التي نحلها</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { t: "تشتت الأدوات", d: "تصميم في مكان، مالية في آخر، متابعة على واتساب — فتضيع المسؤولية." },
            { t: "ضعف الحماية", d: "دفع مباشر بدون ضمان ولا مراجعة فنية يعرض أموالك للخطر." },
            { t: "غياب المتابعة", d: "لا أحد ينبهك لتأخر مرحلة أو تجاوز ميزانية قبل فوات الأوان." },
          ].map((x, i) => (
            <Card key={i} className="border-red-100 bg-red-50/40">
              <CardContent className="pt-4">
                <p className="font-semibold text-red-700 mb-1">{x.t}</p>
                <p className="text-sm text-slate-600">{x.d}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Solution modules / H2 */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-2xl font-bold text-[#4A3F35] mb-2 text-center">وحدات المنصة في عرض واحد</h2>
        <p className="text-slate-500 text-center mb-8">ثماني وحدات متكاملة تعمل بانسجام لتغطية دورة حياة المشروع كاملة.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((m, i) => (
            <Link key={i} to={m.to}>
              <Card className="h-full border-[#C9A66B]/20 hover:border-[#C9A66B] hover:shadow-lg transition-all hover-lift">
                <CardContent className="pt-5">
                  <div className="w-10 h-10 rounded-lg bg-[#C9A66B]/10 flex items-center justify-center mb-3">
                    <m.icon className="w-5 h-5 text-[#6B5D4F]" />
                  </div>
                  <Badge variant="outline" className="mb-2 text-[10px] text-[#C9A66B] border-[#C9A66B]/30">{m.tag}</Badge>
                  <h3 className="font-semibold text-[#4A3F35] mb-1">{m.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{m.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Benefits / H2 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-2xl font-bold text-[#4A3F35] mb-6 text-center">الفوائد الرئيسية</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-start gap-3 bg-white rounded-xl border border-[#C9A66B]/20 p-4">
              <CheckCircle className="w-5 h-5 text-[#C9A66B] shrink-0 mt-0.5" />
              <p className="text-slate-700">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Proof / H2 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-2xl font-bold text-[#4A3F35] mb-6 text-center">الدليل والأرقام</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { v: `${stats.engineers || "—"}+`, l: "مهندس معتمد" },
            { v: `${stats.firms || "—"}+`, l: "شركة استشارية" },
            { v: "24h", l: "متوسط زمن المعالجة" },
          ].map((s, i) => (
            <div key={i} className="text-center bg-gradient-to-br from-amber-50/50 to-white rounded-xl border border-[#C9A66B]/20 p-6">
              <p className="text-3xl font-bold text-[#C9A66B]">{s.v}</p>
              <p className="text-sm text-slate-500 mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA / H2 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-2xl bg-gradient-to-br from-[#4A3F35] to-[#6B5D4F] p-8 sm:p-10 text-center text-white">
          <Zap className="w-10 h-10 mx-auto mb-3 text-[#C9A66B]" />
          <h2 className="text-2xl font-bold mb-3">جاهز لبدء مشروعك بثقة؟</h2>
          <p className="text-slate-200 mb-6 max-w-xl mx-auto">انضم لبيتلي واحصل على نظام متكامل يحمي أموالك ويضمن جودة التنفيذ من أول خطوة.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/RegisterChoice"><Button className="bg-[#C9A66B] text-[#4A3F35] hover:bg-[#E5D4B8]">سجّل الآن مجاناً</Button></Link>
            <Link to="/ContactUs"><Button variant="outline" className="border-white/40 text-white hover:bg-white/10">تواصل معنا</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}