import React from "react";
import { motion } from "framer-motion";
import { FileText, Users, ScrollText, ClipboardCheck, Wallet, CheckCircle2 } from "lucide-react";

export default function LandingHowItWorks() {
  const steps = [
    { icon: FileText, title: "انشر مشروعك", desc: "صف احتياجك: التصميم، التنفيذ، أو الاستشارة — وحدد ميزانيتك وموقعك." },
    { icon: Users, title: "استلم العروض", desc: "مهندسون ومقاولون معتمدون يقدمون عروضاً تنافسية مع مطابقة ذكية لتخصصك." },
    { icon: ScrollText, title: "وقّع العقد", desc: "عقد رقمي موثق يحدد المراحل والتسليمات والمدفوعات — ملزم لجميع الأطراف." },
    { icon: ClipboardCheck, title: "تابع المراحل", desc: "كل مرحلة تخضع لمراجعة فنية استشارية مطابقة لكود البناء السعودي قبل الاعتماد." },
    { icon: Wallet, title: "ادفع بأمان", desc: "أموالك محجوزة في ضمان، ولا تُحرَّر إلا بعد اعتماد كل مخرج — حماية مزدوجة." },
    { icon: CheckCircle2, title: "استلم تسليمك", desc: "مخرجات معتمدة وموثقة، تقييم شفاف، وأرشيف رقمي كامل لمشروعك." },
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
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-3">كيف تعمل بيتلي؟</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            من الفكرة إلى التسليم — ست خطوات واضحة تحمي مشروعك في كل مرحلة.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.1 }}
              className="relative p-6 rounded-2xl border border-[#C9A66B]/20 bg-amber-50/20 hover-lift"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-3xl font-bold text-[#C9A66B]/30">{i + 1}</span>
              </div>
              <h3 className="font-bold text-[#1a1a2e] mb-1">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}