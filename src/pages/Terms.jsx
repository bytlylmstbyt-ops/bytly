import React from "react";
import { motion } from "framer-motion";
import { FileText, Shield, Users, AlertCircle, CheckCircle, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/components/i18n/LanguageContext";

const SECTION_ICONS = [Users, Shield, FileText, Scale, Shield, AlertCircle, Users, Scale, FileText, AlertCircle, Users];

export default function Terms() {
  const { t, isRTL, language } = useLanguage();
  const rawSections = t('termsPage.sections') || [];
  const sections = rawSections.map((s, i) => ({ ...s, icon: SECTION_ICONS[i] || FileText }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-16" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">{t('termsPage.title')}</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">{t('termsPage.subtitle')}</p>
          <p className="text-sm text-slate-500 mt-2">
            {t('termsPage.lastUpdate')}: {new Date().toLocaleDateString(language === 'ar' ? 'ar' : 'en', { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </motion.div>

        <Card className="border-0 shadow-xl mb-8">
          <CardContent className="p-8">
            <div className="prose prose-slate max-w-none">
              <div className="bg-blue-50 border-r-4 border-blue-500 p-6 rounded-lg mb-8">
                <p className="text-blue-900 font-medium">{t('termsPage.intro')}</p>
              </div>

              {sections.map((section, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-[#1a1a2e]">{section.title}</h2>
                  </div>
                  <ul className="space-y-3 mr-12">
                    {section.content.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-600">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {index < sections.length - 1 && <Separator className="mt-8" />}
                </motion.div>
              ))}

              <div className="bg-amber-50 border-r-4 border-amber-500 p-6 rounded-lg mt-8">
                <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {t('termsPage.contactTitle')}
                </h3>
                <p className="text-amber-800">
                  {t('termsPage.contactBody')}
                  <a href="mailto:bytlylmstbyt@gmail.com" className="font-medium underline mr-1">bytlylmstbyt@gmail.com</a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}