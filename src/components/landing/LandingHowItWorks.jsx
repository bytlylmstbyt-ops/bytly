import React from "react";
import { motion } from "framer-motion";
import {
  UserPlus, Settings, FolderPlus, Activity, CheckCircle2,
} from "lucide-react";

export default function LandingHowItWorks() {
  const stages = [
    { icon: UserPlus, num: "01", label: "التسجيل", desc: "أنشئ حسابك وحدد دورك في دقائق." },
    { icon: Settings, num: "02", label: "الإعداد", desc: "أكمل ملفك ووثائقك الاعتمادية." },
    { icon: FolderPlus, num: "03", label: "إنشاء المشروع", desc: "اطرح متطلباتك وحدد الميزانية والمراحل." },
    { icon: Activity, num: "04", label: "المتابعة", desc: "تابع المراحل بنظام الإشارات والتنبيهات اللحظية." },
    { icon: CheckCircle2, num: "05", label: "المراجعة والاعتماد", desc: "اعتمد المخرجات وحرر الدفعات من الضمان." },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#131221]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            مسار العمل من التسجيل إلى التسليم
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
            خمس خطوات واضحة من لحظة تسجيلك حتى اعتماد مخرجات مشروعك
          </p>
        </motion.div>

        {/* Horizontal Timeline */}
        <div className="relative">
          {/* Connecting line — hidden on mobile, shown on md+ */}
          <div className="hidden md:block absolute top-[2.75rem] left-[10%] right-[10%] h-px bg-gradient-to-r from-[#C8AA82]/20 via-[#C8AA82] to-[#C8AA82]/20" />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
            {stages.map(({ icon: Icon, num, label, desc }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Circular node */}
                <div className="relative w-[5.5rem] h-[5.5rem] rounded-full border-2 border-[#C8AA82]/40 bg-[#131221] flex items-center justify-center mb-4 z-10">
                  <div className="absolute inset-1 rounded-full border border-[#C8AA82]/15 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-[#C8AA82]" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Step number */}
                <span className="text-[#C8AA82]/60 font-bold text-sm tracking-widest mb-1">
                  {num}
                </span>

                {/* Label */}
                <h3 className="text-white font-bold text-sm md:text-base mb-1.5">{label}</h3>

                {/* Description */}
                <p className="text-slate-400 text-xs leading-relaxed max-w-[12rem]">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}