import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, CheckCircle, ArrowLeft, Boxes, Ruler, ShieldCheck,
  FileSignature, Wallet, Bot, MapPin, Building2, Layers, Zap, FolderTree
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LinkFolder from "@/components/content/LinkFolder";
import PageEssentialsSection from "@/components/content/PageEssentialsSection";
import JsonLd from "@/components/seo/JsonLd";
import { webPageSchema, softwareSchema } from "@/components/seo/buildSchema";
import { useLanguage } from "@/components/i18n/LanguageContext";

const FOLDER_ICONS = [Layers, Wallet, FileSignature, Building2];
const FOLDER_ITEM_ICONS = [
  [Ruler, Layers],
  [ShieldCheck, Wallet],
  [FileSignature, Bot],
  [MapPin, Building2],
];
const FOLDER_ITEM_PATHS = [
  ["/CostEstimator", "/ProjectStages"],
  ["/Wallet", "/WalletTopup"],
  ["/MyContracts", "/AIEngineers"],
  ["/SurveyClientDashboard", "/MarketEntities"],
];

export default function Solutions() {
  const { t, isRTL } = useLanguage();
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

  const foldersData = t('solutions.folders') || [];
  const folders = foldersData.map((f, fi) => ({
    icon: FOLDER_ICONS[fi] || Layers,
    title: f.title,
    subtitle: f.subtitle,
    items: (f.items || []).map((it, ii) => ({
      icon: (FOLDER_ITEM_ICONS[fi] || [])[ii] || Boxes,
      title: it.title,
      desc: it.desc,
      to: (FOLDER_ITEM_PATHS[fi] || [])[ii] || "#",
      tag: it.tag,
    })),
  }));

  const benefits = t('solutions.benefits') || [];
  const problems = t('solutions.problems') || [];
  const proofData = t('solutions.proof') || [];
  const proofStats = [
    { v: `${stats.engineers || "—"}+`, l: proofData[0]?.label || "" },
    { v: `${stats.firms || "—"}+`, l: proofData[1]?.label || "" },
    { v: "24h", l: proofData[2]?.label || "" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-amber-50/40">
      <JsonLd data={webPageSchema({ name: "حلول بيتلي المتكاملة", description: "ثماني وحدات متكاملة لإدارة المشاريع الهندسية: التخطيط، المالية والضمان، العقود والذكاء الاصطناعي، والميدان والسوق.", path: "/Solutions" })} />
      <JsonLd data={softwareSchema} />
      {/* Hero / H1 */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-10 text-center">
        <Badge variant="outline" className="mb-4 border-[#C9A66B] text-[#C9A66B] bg-[#C9A66B]/5">
          <Sparkles className="w-3 h-3 ml-1" /> {t('solutions.badge')}
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-bold text-[#4A3F35] mb-4 leading-tight">
          {t('solutions.heroTitle')}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
          {t('solutions.heroSubtitle')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/CreateProject"><Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">{t('solutions.startProjectNow')} <ArrowLeft className={`w-4 h-4 mr-1 ${isRTL ? "" : "rotate-180"}`} /></Button></Link>
          <Link to="/CaseStudies"><Button variant="outline" className="border-[#C9A66B] text-[#6B5D4F]">{t('solutions.viewCaseStudies')}</Button></Link>
        </div>
      </section>

      {/* Problem / H2 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-bold text-[#4A3F35] mb-4">{t('solutions.problemTitle')}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {problems.map((x, i) => (
            <Card key={i} className="border-red-100 bg-red-50/40">
              <CardContent className="pt-4">
                <p className="font-semibold text-red-700 mb-1">{x.title}</p>
                <p className="text-sm text-slate-600">{x.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Solution folders / H2 */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FolderTree className="w-6 h-6 text-[#C9A66B]" />
          <h2 className="text-2xl font-bold text-[#4A3F35]">{t('solutions.foldersTitle')}</h2>
        </div>
        <p className="text-slate-500 text-center mb-8">{t('solutions.foldersSubtitle')}</p>
        {folders.map((f, i) => (
          <LinkFolder key={i} {...f} />
        ))}
      </section>

      {/* Benefits / H2 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-2xl font-bold text-[#4A3F35] mb-6 text-center">{t('solutions.benefitsTitle')}</h2>
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
        <h2 className="text-2xl font-bold text-[#4A3F35] mb-6 text-center">{t('solutions.proofTitle')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {proofStats.map((s, i) => (
            <div key={i} className="text-center bg-gradient-to-br from-amber-50/50 to-white rounded-xl border border-[#C9A66B]/20 p-6">
              <p className="text-3xl font-bold text-[#C9A66B]">{s.v}</p>
              <p className="text-sm text-slate-500 mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Page essentials — features/audience/proof/next steps */}
      <PageEssentialsSection
        feature={t('solutions.essentials.feature')}
        audience={t('solutions.essentials.audience')}
        proof={t('solutions.essentials.proof')}
        nextStep={t('solutions.essentials.nextStep')}
        nextTo="/CreateProject"
        nextLabel={t('solutions.essentials.nextLabel')}
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