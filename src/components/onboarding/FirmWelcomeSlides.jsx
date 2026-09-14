import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Building2, ClipboardCheck, TrendingUp, ArrowLeft, ArrowRight, X, Award, FileCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function FirmWelcomeSlides({ onComplete, onSkip }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: Building2,
      color: "from-indigo-600 to-blue-600",
      title: "أدوات إدارة مشاريع احترافية",
      description: "منصة متكاملة لإدارة جميع مشاريعك الاستشارية بكفاءة عالية. تتبع التقدم، أدِر فريقك، وثّق المراجعات، وأصدر التقارير التفصيلية - كل ذلك من مكان واحد.",
      stats: "توفير 70% من وقت الإدارة الإدارية",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800",
      features: ["إدارة فرق متعددة", "تتبع المراحل الحية", "تقارير أداء شاملة"]
    },
    {
      icon: ClipboardCheck,
      color: "from-purple-600 to-indigo-600",
      title: "التدقيق الفني المتقدم (Track A)",
      description: "قدّم خدمات المراجعة والاعتماد الفني للمشاريع الإنشائية. راجع المطابقة مع كود البناء السعودي (SBC)، اختم المخططات رسمياً، وأصدِر تراخيص البناء البلدية بكفاءة.",
      stats: "أسرع مسار اعتماد في المملكة",
      image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800",
      features: ["مراجعة SBC الكاملة", "اعتماد بلدي رسمي", "ختم المخططات الإنشائية"]
    },
    {
      icon: TrendingUp,
      color: "from-emerald-600 to-teal-600",
      title: "توسّع أعمالك بثقة",
      description: "عزّز حضور شركتك الاستشارية في السوق، استقبل مشاريع جديدة بجودة عالية، وابنِ سمعة قوية. نحن نربطك بعملاء جادين وموثوقين يبحثون عن خبراتك.",
      stats: "أكثر من 1,500 مشروع نشط شهرياً",
      image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800",
      features: ["ملف شركة مميز", "عملاء موثوقون", "مدفوعات آمنة 100%"]
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
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 to-indigo-900/95 backdrop-blur-md z-50 flex items-start justify-center p-4" dir="rtl" style={{ 
      overflow: 'auto',
      WebkitOverflowScrolling: 'touch',
      minHeight: '100vh'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-5xl my-8"
        style={{ marginBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}
      >
        <Card className="overflow-hidden shadow-2xl border-2 border-indigo-200/20 bg-white">
          <button
            onClick={onSkip}
            className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-lg transition-all hover:scale-110"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>

          <div className="grid md:grid-cols-5">
            {/* Image Side */}
            <div className="relative h-80 md:h-auto md:col-span-2 overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.color} opacity-90`} />
              <img
                src={currentSlideData.image}
                alt={currentSlideData.title}
                className="w-full h-full object-cover mix-blend-overlay"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white">
                <div className={`w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-xl border-2 border-white/30`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <div className="text-center space-y-2">
                  {currentSlideData.features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Award className="w-4 h-4" />
                      {feature}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Side */}
            <div className="md:col-span-3 p-10 md:p-14 flex flex-col justify-between bg-gradient-to-br from-white to-slate-50">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <div className="flex gap-2 mb-8">
                      {slides.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 rounded-full transition-all ${
                            idx === currentSlide
                              ? `bg-gradient-to-r ${currentSlideData.color} w-16`
                              : "bg-slate-300 w-10"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 text-xs font-semibold mb-4">
                      <FileCheck className="w-3 h-3" />
                      للشركات الاستشارية
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-5 leading-tight">
                      {currentSlideData.title}
                    </h2>
                    <p className="text-slate-600 text-lg leading-relaxed mb-6">
                      {currentSlideData.description}
                    </p>

                    <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r ${currentSlideData.color} shadow-lg`}>
                      <TrendingUp className="w-4 h-4 text-white" />
                      <span className="text-white font-bold text-sm">
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
                  className="text-slate-600 hover:bg-slate-100"
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
                    className={`bg-gradient-to-r ${currentSlideData.color} text-white hover:opacity-90 px-8 shadow-lg hover:shadow-xl transition-all`}
                  >
                    {currentSlide === slides.length - 1 ? "ابدأ رحلتك" : "التالي"}
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}