import React from "react";
import { motion } from "framer-motion";
import { Shield, Award, Rocket } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function Certificates() {
  const { t, isRTL } = useLanguage();
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-amber-50/30" dir={isRTL ? "rtl" : "ltr"}>
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1a1a2e] via-[#2d2d4e] to-[#1a1a2e] py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute border border-white rounded-full"
              style={{ width: `${40 + i * 30}px`, height: `${40 + i * 30}px`, top: "50%", left: "50%",
                transform: "translate(-50%,-50%)", animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-[#C9A66B] text-sm mb-4">
            <Award className="w-4 h-4" />
            {t('certificatesPage.badge')}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{t('certificatesPage.title')}</h1>
          <p className="text-white/60 max-w-xl mx-auto text-sm leading-relaxed">{t('certificatesPage.subtitle')}</p>
          <div className="flex items-center justify-center gap-6 mt-6 text-white/50 text-xs">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-[#C9A66B]" /> {t('certificatesPage.verifiedBadge')}</span>
            <span className="flex items-center gap-1"><Award className="w-3 h-3 text-[#C9A66B]" /> {t('certificatesPage.copyrightBadge')}</span>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A66B] to-[#e5c995] rounded-full px-5 py-2.5 shadow-lg shadow-[#C9A66B]/30"
          >
            <Rocket className="w-4 h-4 text-[#1a1a2e]" />
            <span className="text-[#1a1a2e] text-sm font-bold">{t('certificatesPage.betaBadge')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1a1a2e] animate-pulse" />
          </motion.div>
          <p className="text-white/50 text-xs mt-2 max-w-md mx-auto">{t('certificatesPage.betaCaption')}</p>
        </motion.div>
      </div>

      {/* Beta Lock */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14 text-center" dir={isRTL ? "rtl" : "ltr"}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/40 p-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">{t('certificatesPage.lockTitle')}</h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">{t('certificatesPage.lockBody')}</p>
        </motion.div>
      </div>
    </div>
  );
}