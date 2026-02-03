import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Store, Users, ArrowLeft, ArrowRight, X, DollarSign, Sparkles, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ProfessionalWelcomeSlides({ onComplete, onSkip }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: ShieldCheck,
      color: "from-emerald-500 to-green-500",
      title: "الحماية المالية الكاملة (Escrow)",
      description: "أموالك محمية في نظام الضمان المالي. لن يُحرر أي مبلغ إلا بعد موافقة العميل على عملك. احصل على رسومك كاملة بدون قلق أو مماطلة.",
      stats: "99.8% معدل الدفع الآمن",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800",
      highlights: ["دفع مضمون 100%", "لا مماطلة أبداً", "حماية حقوقك"]
    },
    {
      icon: Store,
      color: "from-amber-500 to-orange-500",
      title: "متجر التصاميم - دخل سلبي دائم",
      description: "حوّل تصاميمك السابقة إلى دخل متكرر. بِع مخططاتك الجاهزة مرات لا محدودة، واحصل على 75% من كل عملية بيع. استثمر في إبداعك.",
      stats: "مهندسون يحققون 15,000+ ر.س شهرياً",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
      highlights: ["دخل سلبي متكرر", "بيع غير محدود", "ملكية فكرية محمية"]
    },
    {
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      title: "وصول مباشر لآلاف العملاء",
      description: "اعرض خدماتك لعملاء حقيقيين يبحثون عن محترفين مثلك. لا مسابقات أو منافسة غير عادلة. تواصل مباشر، وأسعار تحددها أنت.",
      stats: "500+ طلب مشروع جديد شهرياً",
      image: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=800",
      highlights: ["عملاء جادون", "أسعارك الخاصة", "تواصل مباشر"]
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const currentSlideData = slides[currentSlide];
  const Icon = currentSlideData.icon;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/90 to-slate-800/95 backdrop-blur-lg z-50 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-6xl"
      >
        <Card className="overflow-hidden shadow-2xl border border-slate-200 bg-white">
          <button
            onClick={onSkip}
            className="absolute top-5 left-5 z-20 w-11 h-11 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all hover:scale-110"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>

          <div className="grid lg:grid-cols-2">
            {/* Content Side - Now on the right in RTL */}
            <div className="p-10 lg:p-16 flex flex-col justify-between bg-gradient-to-br from-white via-slate-50 to-blue-50/30 order-2 lg:order-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="mb-8">
                    <div className="flex gap-2.5 mb-8">
                      {slides.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            idx === currentSlide
                              ? `bg-gradient-to-r ${currentSlideData.color} w-20 shadow-md`
                              : "bg-slate-300 w-12"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 text-xs font-bold mb-5 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      للمهندسين والمصممين المحترفين
                    </div>

                    <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                      {currentSlideData.title}
                    </h2>
                    <p className="text-slate-600 text-lg leading-relaxed mb-8">
                      {currentSlideData.description}
                    </p>

                    {/* Highlights */}
                    <div className="space-y-3 mb-6">
                      {currentSlideData.highlights.map((highlight, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 + 0.2 }}
                          className="flex items-center gap-3 text-sm text-slate-700"
                        >
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${currentSlideData.color} flex items-center justify-center`}>
                            <Lock className="w-3 h-3 text-white" />
                          </div>
                          <span className="font-medium">{highlight}</span>
                        </motion.div>
                      ))}
                    </div>

                    <div className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r ${currentSlideData.color} shadow-lg`}>
                      <DollarSign className="w-5 h-5 text-white" />
                      <span className="text-white font-bold">
                        {currentSlideData.stats}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-8 border-t-2 border-slate-200">
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={currentSlide === 0}
                  className="text-slate-600 hover:bg-slate-100 font-medium"
                >
                  <ArrowRight className="w-4 h-4 ml-2" />
                  السابق
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={onSkip}
                    className="text-slate-500 hover:bg-slate-100"
                  >
                    تخطي
                  </Button>
                  <Button
                    onClick={handleNext}
                    className={`bg-gradient-to-r ${currentSlideData.color} text-white hover:opacity-90 px-10 py-6 text-base shadow-lg hover:shadow-xl transition-all font-bold`}
                  >
                    {currentSlide === slides.length - 1 ? "ابدأ الآن" : "التالي"}
                    <ArrowLeft className="w-5 h-5 mr-2" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Image Side - Now on the left in RTL */}
            <div className="relative h-96 lg:h-auto overflow-hidden order-1 lg:order-2">
              <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.color} opacity-85`} />
              <img
                src={currentSlideData.image}
                alt={currentSlideData.title}
                className="w-full h-full object-cover mix-blend-multiply"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-white">
                <motion.div
                  key={currentSlide}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className={`w-28 h-28 rounded-3xl bg-white/25 backdrop-blur-md flex items-center justify-center shadow-2xl border-4 border-white/40`}
                >
                  <Icon className="w-14 h-14 text-white drop-shadow-lg" />
                </motion.div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}