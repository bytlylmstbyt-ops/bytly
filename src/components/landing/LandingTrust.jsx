import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Award, Lock, TrendingUp, Star, Quote } from "lucide-react";

export default function LandingTrust() {
  const values = [
    { icon: ShieldCheck, title: "ضمان مالي محجوز", desc: "أموالك لا تُحرَّر إلا بعد اعتماد المخرج — لا مخاطر مالية." },
    { icon: Lock, title: "عقود رقمية موثقة", desc: "عقود ملزمة قانونياً مع توقيع إلكتروني وتتبع كامل." },
    { icon: Award, title: "مهندسون معتمدون", desc: "تحقق من شهادات القيد والترخيص قبل التعاقد." },
    { icon: TrendingUp, title: "شفافية كاملة", desc: "تتبع لحظي للمراحل والتكاليف والتقييمات." },
  ];

  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-[#1a1a2e] to-[#4A3F35] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-3">لماذا تثق ببيتلي؟</h2>
          <p className="text-slate-300 max-w-2xl mx-auto">
            مبنيّة على حوكمة هندسية صارمة — حماية مالية وفنية وقانونية في كل خطوة.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {values.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <div className="w-11 h-11 rounded-xl bg-[#C9A66B]/20 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-[#C9A66B]" />
              </div>
              <h3 className="font-bold text-sm mb-1">{title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats placeholder — future metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-white/10"
        >
          {[
            { value: "500+", label: "مشروع منجز" },
            { value: "15%", label: "عمولة المنصة" },
            { value: "24h", label: "معالجة الطلبات" },
            { value: "100%", label: "مطابقة الكود السعودي" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-[#C9A66B]">{stat.value}</div>
              <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Testimonial placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 max-w-2xl mx-auto text-center"
        >
          <Quote className="w-8 h-8 text-[#C9A66B]/40 mx-auto mb-3" />
          <p className="text-slate-200 text-sm md:text-base leading-relaxed italic">
            "بيتلي حوّلت طريقة إدارة مشاريعي — من فوضى الجداول والواتساب إلى مسار منظم ومحجوز مالياً.
            كل مرحلة معتمدة فنياً، وكل دفعة محمية."
          </p>
          <div className="flex items-center justify-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-4 h-4 fill-[#C9A66B] text-[#C9A66B]" />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}