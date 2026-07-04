import React from "react";
import { motion } from "framer-motion";
import { Building2, ShieldCheck, Clock } from "lucide-react";

const PROBLEMS = [
  {
    icon: Building2,
    title: "فجوة الإشراف الهندسي",
    description: "إخضاع العمليات والاتفاقيات لإشراف مستشارين قانونيين ومهندسين استشاريين لتقليل نسب التأخير وتجنب سوء الفهم.",
  },
  {
    icon: ShieldCheck,
    title: "اختلاف التوقعات وغياب الضامن",
    description: "نعمل كطرف ضامن يضمن التزام المصمم بمعايير التسليم، وفي الوقت نفسه يضمن استلام المهندس لمستحقاته المالية.",
  },
  {
    icon: Clock,
    title: "تعثر المواعيد وضياع الوقت",
    description: "أغلب تعثرات المشاريع المعمارية تعود لسوء التنظيم والتواصل وضياع الحقوق، وليس لضعف التصميم نفسه.",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-20 bg-[#FCFCFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-[#888888]">
            المشكلة التي نحلها في السوق العقاري السعودي
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROBLEMS.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="bg-white border border-[#EBEBEB] rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 rounded-full bg-[#F7F2E8] flex items-center justify-center mb-6">
                <item.icon className="w-7 h-7 text-[#C9A66B]" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-[#333333] mb-3">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#666666]">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}