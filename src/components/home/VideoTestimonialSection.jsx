import React from "react";
import { motion } from "framer-motion";
import { Play, Quote } from "lucide-react";

/**
 * VideoTestimonialSection — hosts a short client video testimonial.
 * The poster/play UI is ready to be wired to a real recorded video URL.
 */
export default function VideoTestimonialSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A66B]/10 border border-[#C9A66B]/30 mb-4">
            <Play className="w-4 h-4 text-[#C9A66B]" />
            <span className="text-[#6B5D4F] text-sm font-medium">شهادة فيديو من عميل</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">
            ماذا يقول عملاؤنا المهندسون؟
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            شاهد تجربة حقيقية من أحد عملاء الهندسة الذين أنجزوا مشاريعهم عبر بيتلي.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-5 gap-0 items-stretch bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
        >
          {/* Video frame */}
          <div className="md:col-span-3 relative aspect-video bg-[#1a1a2e] group cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=900"
              alt="شهادة عميل بالفيديو"
              loading="lazy"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-7 h-7 text-[#6B5D4F]" style={{ marginRight: -2 }} fill="currentColor" />
              </div>
            </div>
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              فيديو • 1:24
            </div>
          </div>

          {/* Quote */}
          <div className="md:col-span-2 p-6 md:p-8 flex flex-col justify-center">
            <Quote className="w-8 h-8 text-[#C9A66B] mb-3" />
            <p className="text-base md:text-lg text-[#4A3F35] leading-relaxed mb-5">
              «نفّذت ثلاثة مشاريع هندسية عبر بيتلي، وكل مرة كانت الأموال محمية والمراجعة الفنية مستقلة. وفّرت علينا أسابيع من المتابعة اليدوية.»
            </p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white flex items-center justify-center font-bold">
                خ
              </div>
              <div>
                <p className="font-semibold text-[#1a1a2e] text-sm">م. خالد العتيبي</p>
                <p className="text-xs text-slate-500">مدير مشاريع — شركة استشارية</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-4">
              * استبدل هذا الفيديو بشهادة مسجّلة فعلية من أحد عملائك.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}