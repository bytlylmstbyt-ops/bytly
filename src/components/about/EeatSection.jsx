import React from "react";
import { motion } from "framer-motion";
import { GraduationCap, Newspaper, BadgeCheck, BarChart3 } from "lucide-react";

const pillars = [
  {
    icon: GraduationCap,
    title: "الخبرة (Experience)",
    body:
      "فريق هندسي ومالي متخصص — مهندسون معتمدون لدى الهيئة السعودية للمهندسين، ومستشارون فنيون مستقلون يراجعون التسليمات.",
  },
  {
    icon: BadgeCheck,
    title: "الكفاءة (Expertise)",
    body:
      "منصة مبنية على سير عمل هندسي فعلي: تقدير تكلفة، حوكمة مراحل، ضمان مالي، ومراجعة فنية وفق الكود السعودي للبناء (SBC).",
  },
  {
    icon: Newspaper,
    title: "السلطة (Authoritativeness)",
    body:
      "إشارات إعلامية وصِناعية: ذُكرنا في الاقتصادية وArab News وConstruction Week، وشراكات مع جهات هندسية معتمدة.",
  },
  {
    icon: BarChart3,
    title: "الثقة (Trustworthiness)",
    body:
      "إنجازات تشغيلية موثّقة: أكثر من 1000 مهندس، آلاف المشاريع، 98% رضا، ومتوسط استجابة 24 ساعة.",
  },
];

export default function EeatSection() {
  return (
    <section className="py-16 bg-[#F5F0E8]/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A66B]/10 border border-[#C9A66B]/30 mb-3">
            <BadgeCheck className="w-4 h-4 text-[#C9A66B]" />
            <span className="text-[#6B5D4F] text-sm font-medium">E-E-A-T</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#4A3F35] mb-2">
            لماذا يُوثق بنا القطاع الهندسي
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            بيانات اعتماد الفريق، الإشارات الإعلامية، الشهادات، والإنجازات التشغيلية.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {pillars.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-5 border border-[#C9A66B]/20 flex gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center shrink-0">
                <p.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[#4A3F35] mb-1">{p.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{p.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 text-center mt-6">
          * استبدل الإشارات والإنجازات بالأرقام والشهادات الفعلية عند توفّرها.
        </p>
      </div>
    </section>
  );
}