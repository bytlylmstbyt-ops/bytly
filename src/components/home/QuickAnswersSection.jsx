import React from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, BadgeCheck, Clock, FileCheck, Wallet, Eye,
} from "lucide-react";

const QA = [
  { icon: ShieldCheck, q: "هل أموالي محمية؟", a: "نعم، تُحجز أموالك في حساب ضمان ولا تُحرَّر للمهندس إلا بعد اعتمادك لكل مرحلة." },
  { icon: BadgeCheck, q: "هل المهندسون موثّقون؟", a: "نعم، نتحقق من قيد المهندس وشهاداته لدى الهيئة السعودية للمهندسين قبل تفعيل حسابه." },
  { icon: Clock, q: "كم يستغرق بدء مشروع؟", a: "تنشئ المشروع وتستقبل العروض عادةً خلال 24 ساعة." },
  { icon: FileCheck, q: "هل تدعم رخص البناء؟", a: "نعم، يمكنك تقديم طلب رخصة البناء ومتابعته عبر المنصة." },
  { icon: Wallet, q: "هل المنصة مجانية للعميل؟", a: "التسجيل وإنشاء المشروع مجانيان؛ تدفع فقط قيمة العرض الذي تختاره." },
  { icon: Eye, q: "هل توجد مراجعة فنية؟", a: "نعم، مستشار فني مستقل يراجع التسليمات قبل اعتمادها." },
];

export default function QuickAnswersSection({ compact = false }) {
  return (
    <section className={compact ? "py-6" : "py-16 bg-gradient-to-b from-white to-amber-50/30"}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {!compact && (
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">إجابات سريعة</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              أهم الأسئلة عن منصة بيتلي في جملة أو جملتين.
            </p>
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QA.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl border border-[#C9A66B]/20 p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <item.icon className="w-5 h-5 text-[#C9A66B] shrink-0" />
                <h3 className="font-semibold text-[#1a1a2e] text-sm">{item.q}</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{item.a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}