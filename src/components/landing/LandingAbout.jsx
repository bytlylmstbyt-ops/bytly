import React from "react";
import { motion } from "framer-motion";
import { Target, Users, Link2, Workflow } from "lucide-react";

export default function LandingAbout() {
  const points = [
    { icon: Users, title: "ربط كل الأطراف", desc: "أصحاب المشاريع، المهندسون، الشركات الاستشارية، المقاولون والموردون — في منصة واحدة مترابطة." },
    { icon: Link2, title: "مسار موحّد", desc: "من نشر المشروع إلى التسليم النهائي: عروض، عقود رقمية، مراحل، مدفوعات محجوزة ومراجعة استشارية." },
    { icon: Workflow, title: "حوكمة هندسية", desc: "كل مخرج يمر بمراجعة فنية مطابقة لكود البناء السعودي قبل الاعتماد — لا ثغرات ولا اجتهاد فردي." },
  ];

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center mb-4">
            <Target className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-4">عن بيتلي</h2>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
            مهمتنا تمكين كل صاحب مشروع هندسي ومقاول ومطور عقاري من تنفيذ مشاريعه بكفاءة وشفافية وأمان —
            عبر منظومة رقمية واحدة تربط التصميم بالتنفيذ، وتحمي حقوق كل طرف، وتقلل الهدر في الوقت والمال.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {points.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl border border-[#C9A66B]/20 bg-amber-50/30 hover-lift"
            >
              <div className="w-12 h-12 rounded-xl bg-[#C9A66B]/15 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-[#C9A66B]" />
              </div>
              <h3 className="font-bold text-[#1a1a2e] mb-2">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}