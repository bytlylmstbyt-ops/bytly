import React from "react";
import { motion } from "framer-motion";
import {
  PenTool, Building2, FileSearch, HardHat, Package, Home,
} from "lucide-react";

export default function LandingBenefits() {
  const roles = [
    {
      icon: PenTool,
      title: "المهندسون",
      desc: "اعرض خدماتك ومعرض أعمالك، استقبل مشاريع مطابقة لتخصصك، واعمل بعقد رقمي وضمان مالي محجوز.",
      points: ["مطابقة ذكية مع المشاريع", "محفظة مالية وتتبع أرصدة", "شهادات معتمدة"],
    },
    {
      icon: Building2,
      title: "الشركات الاستشارية",
      desc: "راجع المخططات والمراحل مطابقة لكود البناء السعودي، واعتمد المخرجات بختم رسمي.",
      points: ["لوحة مراجعة مركزية", "ختم رقمي للمخططات", "إدارة فريق متكاملة"],
    },
    {
      icon: FileSearch,
      title: "المستشارون",
      desc: "قدّم خبرتك القانونية والفنية، راجع العقود، وشارك في حل النزاعات بمنصة موثقة.",
      points: ["مراجعة عقود رقمية", "قوالب قانونية جاهزة", "تتبع النزاعات"],
    },
    {
      icon: HardHat,
      title: "المقاولون",
      desc: "استلم طلبات تنفيذ، قدّم عروض أسعار، وتابع مراحل البناء مع تسليم ومدفوعات محجوزة.",
      points: ["سوق مشاريع تنفيذ", "تتبع مراحل البناء", "اشتراكات مرنة"],
    },
    {
      icon: Package,
      title: "الموردون",
      desc: "اعرض منتجاتك وموادك، استلم طلبات التوريد، وأدر مبيعاتك ومحفظتك في مكان واحد.",
      points: ["كتالوج منتجات", "طلبات توريد مباشرة", "إدارة محفظة مالية"],
    },
    {
      icon: Home,
      title: "أصحاب المشاريع",
      desc: "انشر مشروعك، استلم عروضاً من مهندسين معتمدين، وتابع التنفيذ بضمان مالي كامل وشفافية.",
      points: ["عروض متنافسة", "ضمان مالي محجوز", "متابعة لحظية للمراحل"],
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-amber-50/40 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-3">فوائد المنصة لكل دور</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            مهما كان دورك في دورة حياة المشروع الهندسي، بيتلي تمنحك الأدوات المناسبة لتنجح.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map(({ icon: Icon, title, desc, points }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.1 }}
              className="p-6 rounded-2xl border border-[#C9A66B]/20 bg-white hover-lift"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-[#1a1a2e] mb-2">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">{desc}</p>
              <ul className="space-y-1.5">
                {points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A66B] shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}