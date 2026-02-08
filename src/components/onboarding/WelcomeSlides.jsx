import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Users, TrendingUp, ArrowLeft, ArrowRight, X } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function WelcomeSlides({ onComplete, onSkip }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: Shield,
      color: "from-green-500 to-emerald-500",
      title: "دفع آمن ومضمون",
      description: "نحمي أموالك في نظام الضمان (Escrow) حتى تستلم التصميم كاملاً. لن يُحرر المبلغ للمهندس إلا بعد موافقتك.",
      stats: "98% من العملاء راضون عن نظام الحماية",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600"
    },
    {
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      title: "إدارة احترافية",
      description: "تابع مشاريعك من لوحة تحكم واحدة، اعتمد المراحل، راجع التصاميم، وتواصل مع فريقك بسهولة.",
      stats: "توفير 60% من وقت الإدارة",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600"
    },
    {
      icon: TrendingUp,
      color: "from-purple-500 to-indigo-500",
      title: "احترافية وجودة عالية",
      description: "جميع المهندسين موثقون ومعتمدون. اختر من بين مئات المحترفين أو اشترِ تصاميم جاهزة للتنفيذ الفوري.",
      stats: "1000+ مهندس معتمد",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600"
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto p-4 flex items-center justify-center" dir="rtl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-4xl my-8"
      >
        <Card className="overflow-hidden shadow-2xl">
          {/* Close Button */}
          <button
            onClick={onSkip}
            className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>

          <div className="grid md:grid-cols-2">
            {/* Image Side */}
            <div className="relative h-64 md:h-auto bg-slate-100 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-transparent" />
              <img
                src={currentSlideData.image}
                alt={currentSlideData.title}
                className="w-full h-full object-cover"
              />
              <div className={`absolute top-6 right-6 w-16 h-16 rounded-2xl bg-gradient-to-br ${currentSlideData.color} flex items-center justify-center shadow-xl`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Content Side */}
            <div className="p-8 md:p-12 flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-6">
                    <div className="flex gap-2 mb-6">
                      {slides.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1 rounded-full transition-all ${
                            idx === currentSlide
                              ? "bg-gradient-to-r " + currentSlideData.color + " w-12"
                              : "bg-slate-200 w-8"
                          }`}
                        />
                      ))}
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                      {currentSlideData.title}
                    </h2>
                    <p className="text-slate-600 leading-relaxed mb-6">
                      {currentSlideData.description}
                    </p>

                    <div className={`inline-block px-4 py-2 rounded-lg bg-gradient-to-r ${currentSlideData.color} bg-opacity-10 text-sm font-medium`}>
                      <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                        {currentSlideData.stats}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t">
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={currentSlide === 0}
                  className="text-slate-600"
                >
                  <ArrowRight className="w-4 h-4 ml-2" />
                  السابق
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={onSkip}
                    className="text-slate-500"
                  >
                    تخطي
                  </Button>
                  <Button
                    onClick={handleNext}
                    className={`bg-gradient-to-r ${currentSlideData.color} text-white hover:opacity-90 px-6`}
                  >
                    {currentSlide === slides.length - 1 ? "ابدأ الآن" : "التالي"}
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