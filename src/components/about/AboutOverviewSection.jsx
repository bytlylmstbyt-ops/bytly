import React from "react";
import { motion } from "framer-motion";
import { Briefcase, Users, Compass } from "lucide-react";

const blocks = [
  {
    icon: Briefcase,
    title: "ماذا نفعل",
    body:
      "نوفر منصة واحدة لإدارة دورة حياة المشروع الهندسي — من تقدير التكلفة واختيار المهندس، إلى توقيع العقد رقمياً، متابعة التنفيذ، وإطلاق الدفعات عبر الضمان مع مراجعة فنية مستقلة لكل تسليم.",
  },
  {
    icon: Users,
    title: "من نخدم",
    body:
      "أصحاب المشاريع الإسكانية والتجارية، المهندسون والمعماريون، الشركات الاستشارية، المساحون، المقاولون، والموردون في المملكة العربية السعودية.",
  },
  {
    icon: Compass,
    title: "لماذا نوجد",
    body:
      "لأن سوق الهندسة اعتمد على دفع مباشر بلا حماية ومتابعة يدوية بلا إنذار مبكر — فأنشأنا بيتلي ليوحّد الأدوات، يحمي الأموال، ويكشف المخاطر قبل أن تتحوّل إلى خسارة.",
  },
];

export default function AboutOverviewSection() {
  return (
    <section>
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#4A3F35] mb-2">نبذة عن بيتلي</h2>
        <p className="text-slate-500 max-w-xl mx-auto">
          ماذا نفعل، من نخدم، ولماذا وُجدت المنصة في سوق الهندسة.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-5">
        {blocks.map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#F5F0E8]/40 rounded-2xl p-5 border border-[#C9A66B]/20"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center mb-3">
              <b.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-[#4A3F35] mb-2">{b.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{b.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}