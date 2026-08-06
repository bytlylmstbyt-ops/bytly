import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, CheckCircle, ArrowLeft, Boxes, Ruler, ShieldCheck,
  FileSignature, Wallet, Bot, MapPin, Building2, Layers, Zap, Users, FolderTree
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LinkFolder from "@/components/content/LinkFolder";
import PageEssentialsSection from "@/components/content/PageEssentialsSection";
import JsonLd from "@/components/seo/JsonLd";
import { webPageSchema, softwareSchema } from "@/components/seo/buildSchema";
import { useLanguage } from "@/components/i18n/LanguageContext";

const folders = [
  {
    icon: Layers,
    title: "التخطيط وإدارة المشروع",
    subtitle: "حدّد الميزانية ووحّد مراحل التنفيذ في مسار واحد.",
    items: [
      { icon: Ruler,  title: "حاسبة التكاليف",       desc: "تقدير فوري لقيمة المشروع بناءً على المساحة والنطاق.", to: "/CostEstimator", tag: "تخطيط" },
      { icon: Layers, title: "محاكي مراحل المشروع", desc: "حوكمة واضحة لمراحل التنفيذ من التصميم حتى التسليم.", to: "/ProjectStages", tag: "إدارة" },
    ],
  },
  {
    icon: Wallet,
    title: "المالية والضمان",
    subtitle: "احمِ أموالك وادفع بمسار شفّاف عبر الضمان.",
    items: [
      { icon: ShieldCheck, title: "الضمان والحوالات",     desc: "حماية أموالك في الضمان وإطلاقها عند اعتماد المراحل.", to: "/Wallet", tag: "مالية" },
      { icon: Wallet,      title: "المحفظة والمدفوعات",   desc: "إدارة الميزانية والمدفوعات بمسار شفاف.", to: "/WalletTopup", tag: "مالية" },
    ],
  },
  {
    icon: FileSignature,
    title: "العقود والذكاء الاصطناعي",
    subtitle: "عقود موثّقة ومراقبة ذكية للمخاطر طوال المشروع.",
    items: [
      { icon: FileSignature, title: "العقود الإلكترونية", desc: "عقود موثقة بآلياً بتوقيع رقمي لكل من العميل والمهندس.", to: "/MyContracts", tag: "قانوني" },
      { icon: Bot,            title: "Bytly AI",          desc: "مساعد ذكي يحلل المخاطر ويوصي بإجراءات وقائية.", to: "/AIEngineers", tag: "ذكاء" },
    ],
  },
  {
    icon: Building2,
    title: "الميدان والسوق",
    subtitle: "خدمات ميدانية وسوق متكامل للمقاولين والموردين.",
    items: [
      { icon: MapPin,    title: "خدمات المسح",      desc: "طلب مساح معتمد وحجز موعد ميداني للموقع.", to: "/SurveyClientDashboard", tag: "ميداني" },
      { icon: Building2, title: "الكيانات السوقية", desc: "سوق متكامل للمقاولين والموردين والاستشاريين.", to: "/MarketEntities", tag: "سوق" },
    ],
  },
];

const benefits = [
  "كل أدوات المشروع في مكان واحد بدل التشتت بين التطبيقات",
  "حماية مالية كاملة عبر نظام الضمان والمراجعة الفنية",
  "متابعة ذكية أسبوعية تكشف المخاطر قبل وقوعها",
  "عقود موثقة ومراجعة فنية مستقلة لكل تسليم",
];

export default function Solutions() {
  const { t } = useLanguage();
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
      <JsonLd data={webPageSchema({ name: "حلول بيتلي المتكاملة", description: "ثماني وحدات متكاملة لإدارة المشاريع الهندسية: التخطيط، المالية والضمان، العقود والذكاء الاصطناعي، والميدان والسوق.", path: "/Solutions" })} />
      <JsonLd data={softwareSchema} />
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

      {/* Solution folders / H2 */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FolderTree className="w-6 h-6 text-[#C9A66B]" />
          <h2 className="text-2xl font-bold text-[#4A3F35]">وحدات المنصة مُجمّعة في مجلدات</h2>
        </div>
        <p className="text-slate-500 text-center mb-8">ثماني وحدات متكاملة مصنّفة في أربعة مجلدات علوية لتسهيل الوصول والتصفح.</p>
        {folders.map((f, i) => (
          <LinkFolder key={i} {...f} />
        ))}
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

      {/* Page essentials — features/audience/proof/next steps */}
      <PageEssentialsSection
        feature="ثماني وحدات متكاملة لتخطيط وتمويل وعقد ومتابعة المشروع في منصة واحدة."
        audience="أصحاب المشاريع والمهندسون والاستشاريون في المملكة العربية السعودية."
        proof="أكثر من 1000 مهندس معتمد وآلاف المشاريع المنجزة عبر المنصة."
        nextStep="ابدأ مشروعك مجاناً أو تصفّح الوحدات أعلاه لاختيار ما يناسبك."
        nextTo="/CreateProject"
        nextLabel="ابدأ مشروعك الآن"
      />

      {/* CTA / H2 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-2xl bg-gradient-to-br from-[#4A3F35] to-[#6B5D4F] p-8 sm:p-10 text-center text-white">
          <Zap className="w-10 h-10 mx-auto mb-3 text-[#C9A66B]" />
          <h2 className="text-2xl font-bold mb-3">{t('solutions.ctaTitle')}</h2>
          <p className="text-slate-200 mb-6 max-w-xl mx-auto">{t('solutions.ctaDesc')}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/RegisterChoice"><Button className="bg-[#C9A66B] text-[#4A3F35] hover:bg-[#E5D4B8]">{t('solutions.ctaRegister')}</Button></Link>
            <Link to="/ContactUs"><Button variant="outline" className="border-white/40 text-white hover:bg-white/10">{t('solutions.ctaContact')}</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}