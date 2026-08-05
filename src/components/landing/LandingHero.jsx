import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, LogIn, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function LandingHero() {
  const { isRTL } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#F5F0E8] via-white to-amber-50/40">
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A66B]/10 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#6B5D4F]/8 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-right"
          >
            <div className="inline-flex items-center gap-2 bg-[#C9A66B]/15 text-[#6B5D4F] px-4 py-1.5 rounded-full text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              المنظومة الهندسية المتكاملة في السعودية
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-[#1a1a2e] leading-tight mb-6">
              بيتلي — منصة الوساطة الهندسية
              <span className="block text-2xl md:text-3xl mt-2 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] bg-clip-text text-transparent">
                تربطك بالمهندسين والشركات والمقاولين في مكان واحد
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              من التصميم إلى التنفيذ: نشر مشروع، استلم عروضاً من مهندسين معتمدين، وقّع عقوداً رقمية،
              وتابع المراحل بضمان مالي محجوز ومراجعة استشارية لكل مخرج.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/register">
                <Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90 text-base px-8 h-12 w-full sm:w-auto">
                  أنشئ حسابك الآن
                  <ArrowLeft className={`w-5 h-5 ${isRTL ? "" : "rotate-180"}`} />
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start mt-8 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#C9A66B]" />
                ضمان مالي محجوز
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#C9A66B]" />
                مطابقة كود البناء السعودي
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C9A66B]" />
                مطابقة ذكية للمهندسين
              </span>
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80"
                alt="منصة بيتلي الهندسية"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/60 via-transparent to-transparent" />

              {/* Floating stat card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-4 right-4 left-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-lg flex items-center justify-around gap-2"
              >
                {[
                  { icon: Building2, label: "مشاريع", value: "+500" },
                  { icon: ShieldCheck, label: "ضمان", value: "100%" },
                  { icon: Sparkles, label: "مطابقة", value: "ذكية" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="text-center">
                    <Icon className="w-5 h-5 text-[#C9A66B] mx-auto mb-1" />
                    <div className="font-bold text-sm text-[#1a1a2e]">{value}</div>
                    <div className="text-[10px] text-slate-500">{label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}