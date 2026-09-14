import React from "react";
import { motion } from "framer-motion";
import { Award, Newspaper, BadgeCheck, ShieldCheck, Star } from "lucide-react";

const awards = [
  { icon: Award, title: "جائزة التميّز الهندسي", sub: "التقنية والمشاريع • 2025", color: "from-amber-400 to-yellow-500" },
  { icon: ShieldCheck, title: "ملتزمون بالكود السعودي", sub: "مراجعات SBC معتمدة", color: "from-emerald-400 to-teal-500" },
  { icon: BadgeCheck, title: "شريك معتمد", sub: "برنامج شركاء بيتلي", color: "from-blue-400 to-cyan-500" },
];

const media = ["الاقتصادية", "Arab News", "الرياضية", "Construction Week"];

/**
 * AwardsRecognitionSection — awards, media mentions, and third-party
 * credibility badges (partner / industry certifications).
 */
export default function AwardsRecognitionSection() {
  return (
    <section className="py-16 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A66B]/10 border border-[#C9A66B]/30 mb-3">
            <Star className="w-4 h-4 text-[#C9A66B]" />
            <span className="text-[#6B5D4F] text-sm font-medium">تقدير واعتماد</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">
            موثوق ومُعتمد في القطاع الهندسي
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            جوائز وإشارات إعلامية وشراكات تعزّز ثقة العملاء والمهندسين بمنصة بيتلي.
          </p>
        </div>

        {/* Awards / credibility badges */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {awards.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center shrink-0`}>
                <a.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#1a1a2e] text-sm">{a.title}</p>
                <p className="text-xs text-slate-500">{a.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Media mentions */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Newspaper className="w-4 h-4" />
            <span className="text-xs font-medium">ذُكرنا في</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {media.map((m, i) => (
              <span key={i} className="text-slate-400 font-semibold text-sm md:text-base tracking-wide">
                {m}
              </span>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-slate-300 text-center mt-6">
          * استبدل هذه العناصر بالجوائز والإشارات الفعلية عند توفّرها.
        </p>
      </div>
    </section>
  );
}