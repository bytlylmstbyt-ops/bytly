import React from "react";
import { motion } from "framer-motion";
import { Copyright as CopyrightIcon, Shield, FileCheck, AlertTriangle, Scale, Award, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/components/i18n/LanguageContext";

const SECTION_ICONS = [CopyrightIcon, FileCheck, Shield, AlertTriangle, Scale, Award, Lock, FileCheck];

export default function Copyright() {
  const { t, isRTL, language } = useLanguage();
  const rawSections = t('copyrightPage.sections') || [];
  const sections = rawSections.map((s, i) => ({ ...s, icon: SECTION_ICONS[i] || CopyrightIcon }));
  const cards = t('copyrightPage.cards') || [];
  const reportItems = t('copyrightPage.reportItems') || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-16" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">{t('copyrightPage.title')}</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">{t('copyrightPage.subtitle')}</p>
          <p className="text-sm text-slate-500 mt-2">
            {t('copyrightPage.lastUpdate')}: {new Date().toLocaleDateString(language === 'ar' ? 'ar' : 'en', { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </motion.div>

        <Card className="border-0 shadow-xl mb-8">
          <CardContent className="p-8">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-r-4 border-purple-500 p-6 rounded-lg mb-8">
              <h3 className="font-bold text-purple-900 mb-3 text-lg">{t('copyrightPage.commitmentTitle')}</h3>
              <p className="text-purple-800 leading-relaxed">{t('copyrightPage.commitmentBody')}</p>
            </div>

            <div className="space-y-8">
              {sections.map((section, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-[#1a1a2e]">{section.title}</h2>
                  </div>
                  <ul className="space-y-3 mr-12">
                    {section.content.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {index < sections.length - 1 && <Separator className="mt-6" />}
                </motion.div>
              ))}
            </div>

            <div className="bg-red-50 border-r-4 border-red-500 p-6 rounded-lg mt-8">
              <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {t('copyrightPage.warningTitle')}
              </h3>
              <p className="text-red-800 leading-relaxed">{t('copyrightPage.warningBody')}</p>
            </div>

            <div className="bg-blue-50 border-r-4 border-blue-500 p-6 rounded-lg mt-8">
              <h3 className="font-bold text-blue-900 mb-3">{t('copyrightPage.reportTitle')}</h3>
              <p className="text-blue-800 mb-4">{t('copyrightPage.reportBody')}</p>
              <ul className="space-y-2 text-blue-800 mr-4">
                {reportItems.map((item, i) => (<li key={i}>• {item}</li>))}
              </ul>
              <p className="text-blue-800 mt-4">
                📧 <a href="mailto:bytlylmstbyt@gmail.com" className="font-medium underline">bytlylmstbyt@gmail.com</a>
              </p>
            </div>
          </CardContent>
        </Card>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card, i) => (
            <Card key={i} className="border-0 shadow-lg">
              <CardContent className="p-6">
                {i === 0 ? <Award className="w-12 h-12 mb-4 text-amber-500" /> : <Shield className="w-12 h-12 mb-4 text-green-500" />}
                <h3 className="font-bold text-[#1a1a2e] mb-2">{card.title}</h3>
                <p className="text-sm text-slate-600">{card.desc}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="mt-8 p-6 bg-slate-100 rounded-xl text-center">
          <p className="text-slate-600">{t('copyrightPage.legalContact')}</p>
          <a href="mailto:bytlylmstbyt@gmail.com" className="text-[#C9A66B] font-semibold text-lg mt-2 inline-block hover:underline">
            bytlylmstbyt@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}