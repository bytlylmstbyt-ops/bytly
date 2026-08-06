import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, ArrowLeft, Calculator, Layers,
  Users, ShieldCheck, Bot, MapPin, Ruler, Boxes, FolderTree
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LinkFolder from "@/components/content/LinkFolder";
import LiveActiveBadge from "@/components/trust/LiveActiveBadge";
import PageEssentialsSection from "@/components/content/PageEssentialsSection";
import JsonLd from "@/components/seo/JsonLd";
import { webPageSchema } from "@/components/seo/buildSchema";
import { useLanguage } from "@/components/i18n/LanguageContext";

const FOLDER_ICONS = [Calculator, Users, ShieldCheck, Bot];
const FOLDER_ITEM_ICONS = [
  [Calculator, Layers],
  [Users],
  [ShieldCheck, BookOpen],
  [Bot, MapPin, Ruler],
];
const FOLDER_ITEM_PATHS = [
  ["/CostEstimator", "/ProjectStages"],
  ["/ConsultingFirms"],
  ["/Wallet", "/MyContracts"],
  ["/AIEngineers", "/SurveyClientDashboard", "/TechnicalResources"],
];

export default function Resources() {
  const { t, isRTL } = useLanguage();
  const foldersData = t('resourcesCenter.folders') || [];
  const folders = foldersData.map((f, fi) => ({
    icon: FOLDER_ICONS[fi] || Calculator,
    title: f.title,
    subtitle: f.subtitle,
    items: (f.items || []).map((it, ii) => ({
      icon: (FOLDER_ITEM_ICONS[fi] || [])[ii] || BookOpen,
      title: it.title,
      desc: it.desc,
      to: (FOLDER_ITEM_PATHS[fi] || [])[ii] || "#",
      tag: it.tag,
      read: it.read,
    })),
  }));
  const process = t('resourcesCenter.process') || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-amber-50/40">
      <JsonLd data={webPageSchema({ name: "مركز الموارد — بيتلي", description: "أدلة عملية حول سير العمل الهندسي وتقدير التكاليف ومراحل المشروع وتنسيق الأدوار.", path: "/Resources" })} />
      {/* Hero / H1 */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
        <Badge variant="outline" className="mb-4 border-[#C9A66B] text-[#C9A66B] bg-[#C9A66B]/5">
          <BookOpen className="w-3 h-3 ml-1" /> {t('resourcesCenter.badge')}
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-bold text-[#4A3F35] mb-4 leading-tight">
          {t('resourcesCenter.title')}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          {t('resourcesCenter.subtitle')}
        </p>
        <div className="mt-6 flex justify-center">
          <LiveActiveBadge />
        </div>
      </section>

      {/* Problem framing / H2 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <h2 className="text-2xl font-bold text-[#4A3F35] mb-4">{t('resourcesCenter.whyTitle')}</h2>
        <p className="text-slate-600 leading-relaxed">
          {t('resourcesCenter.whyBody')}
        </p>
      </section>

      {/* Resources folders / H2 */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FolderTree className="w-6 h-6 text-[#C9A66B]" />
          <h2 className="text-2xl font-bold text-[#4A3F35]">{t('resourcesCenter.foldersTitle')}</h2>
        </div>
        <p className="text-slate-500 text-center mb-8">{t('resourcesCenter.foldersSubtitle')}</p>
        {folders.map((f, i) => (
          <LinkFolder key={i} {...f} />
        ))}
      </section>

      {/* Process steps / H2 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-bold text-[#4A3F35] mb-6 text-center">{t('resourcesCenter.processTitle')}</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {process.map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white font-bold flex items-center justify-center mx-auto mb-2">{i + 1}</div>
              <p className="font-semibold text-[#4A3F35] mb-1 text-sm">{s.title}</p>
              <p className="text-xs text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Page essentials — features/audience/proof/next steps */}
      <PageEssentialsSection
        feature={t('resourcesCenter.essentials.feature')}
        audience={t('resourcesCenter.essentials.audience')}
        proof={t('resourcesCenter.essentials.proof')}
        nextStep={t('resourcesCenter.essentials.nextStep')}
      />

      {/* CTA / H2 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-2xl bg-gradient-to-br from-[#4A3F35] to-[#6B5D4F] p-8 sm:p-10 text-center text-white">
          <Boxes className="w-10 h-10 mx-auto mb-3 text-[#C9A66B]" />
          <h2 className="text-2xl font-bold mb-3">{t('resourcesCenter.cta.title')}</h2>
          <p className="text-slate-200 mb-6 max-w-xl mx-auto">{t('resourcesCenter.cta.desc')}</p>
          <Link to="/RegisterChoice"><Button className="bg-[#C9A66B] text-[#4A3F35] hover:bg-[#E5D4B8]">{t('resourcesCenter.cta.button')} <ArrowLeft className={`w-4 h-4 mr-1 ${isRTL ? "" : "rotate-180"}`} /></Button></Link>
        </div>
      </section>
    </div>
  );
}