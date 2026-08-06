import React from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, UserX, FileCheck, Bell, Cookie } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/components/i18n/LanguageContext";

const SECTION_ICONS = [Database, Eye, Lock, Shield, Cookie, UserX, Bell, FileCheck];
const CARD_ICONS = [Lock, Shield, FileCheck];
const CARD_COLORS = ["text-blue-500", "text-green-500", "text-purple-500"];

export default function Privacy() {
  const { t, isRTL, language } = useLanguage();
  const rawSections = t('privacyPage.sections') || [];
  const sections = rawSections.map((s, i) => ({ ...s, icon: SECTION_ICONS[i] || Shield }));
  const cards = t('privacyPage.cards') || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-16" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">{t('privacyPage.title')}</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">{t('privacyPage.subtitle')}</p>
          <p className="text-sm text-slate-500 mt-2">
            {t('privacyPage.lastUpdate')}: {new Date().toLocaleDateString(language === 'ar' ? 'ar' : 'en', { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </motion.div>

        <Card className="border-0 shadow-xl mb-8">
          <CardContent className="p-8">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-r-4 border-blue-500 p-6 rounded-lg mb-8">
              <h3 className="font-bold text-blue-900 mb-3 text-lg">{t('privacyPage.introTitle')}</h3>
              <p className="text-blue-800 leading-relaxed">{t('privacyPage.introBody')}</p>
            </div>

            <div className="space-y-8">
              {sections.map((section, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-[#1a1a2e]">{section.title}</h2>
                  </div>
                  {section.content.map((block, blockIndex) => (
                    <div key={blockIndex} className="mr-12 mb-4">
                      {block.subtitle && <p className="font-semibold text-slate-700 mb-3">{block.subtitle}</p>}
                      <ul className="space-y-2">
                        {block.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A66B] mt-2 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {index < sections.length - 1 && <Separator className="mt-6" />}
                </motion.div>
              ))}
            </div>

            <div className="bg-green-50 border-r-4 border-green-500 p-6 rounded-lg mt-8">
              <h3 className="font-bold text-green-900 mb-3">{t('privacyPage.contactTitle')}</h3>
              <p className="text-green-800 mb-4">{t('privacyPage.contactBody')}</p>
              <div className="space-y-2 text-green-800">
                <p>📧 {t('privacyPage.emailLabel')}: <a href="mailto:bytlylmstbyt@gmail.com" className="font-medium underline">bytlylmstbyt@gmail.com</a></p>
                <p>📍 {t('privacyPage.location')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => {
            const Icon = CARD_ICONS[i] || Lock;
            return (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <Icon className={`w-12 h-12 mx-auto mb-4 ${CARD_COLORS[i] || "text-blue-500"}`} />
                  <h3 className="font-bold text-[#1a1a2e] mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-600">{card.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}