import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Target, Eye, Sparkles, CheckCircle2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function About() {
  const { t, isRTL } = useLanguage();

  const offerings = [
    t('footer.aboutPage.offerings.management'),
    t('footer.aboutPage.offerings.communication'),
    t('footer.aboutPage.offerings.fileSharing'),
    t('footer.aboutPage.offerings.executionTracking'),
    t('footer.aboutPage.offerings.contractsManagement'),
    t('footer.aboutPage.offerings.professionalProfiles'),
  ];

  return (
    <div className="min-h-screen bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#F5F0E8] to-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#4A3F35] mb-4">
            {t('footer.aboutPage.title')}
          </h1>
          <p className="text-lg text-[#6B5D4F] mb-8 max-w-2xl mx-auto leading-relaxed">
            {t('footer.aboutPage.subtitle')}
          </p>
          <Link to={createPageUrl('CreateProject')}>
            <Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90 text-lg px-8 py-6">
              {t('footer.aboutPage.cta')}
            </Button>
          </Link>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16">
        {/* من نحن */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#C9A66B]/15 flex items-center justify-center">
              <Target className="w-6 h-6 text-[#C9A66B]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#4A3F35]">{t('footer.aboutPage.whoWeAreTitle')}</h2>
          </div>
          <p className="text-lg text-[#6B5D4F] leading-relaxed">
            {t('footer.aboutPage.whoWeAreText')}
          </p>
        </section>

        {/* رؤيتنا */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#C9A66B]/15 flex items-center justify-center">
              <Eye className="w-6 h-6 text-[#C9A66B]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#4A3F35]">{t('footer.aboutPage.visionTitle')}</h2>
          </div>
          <p className="text-lg text-[#6B5D4F] leading-relaxed">
            {t('footer.aboutPage.visionText')}
          </p>
        </section>

        {/* ماذا نقدم */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#C9A66B]/15 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#C9A66B]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#4A3F35]">{t('footer.aboutPage.whatWeOfferTitle')}</h2>
          </div>
          <ul className="space-y-4">
            {offerings.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#C9A66B] shrink-0 mt-0.5" />
                <span className="text-lg text-[#6B5D4F]">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}