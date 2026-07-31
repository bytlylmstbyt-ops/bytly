import React from "react";
import { ShieldCheck, Award, Newspaper, BadgeCheck, Lock, FileBadge } from "lucide-react";

const badges = [
  {
    icon: BadgeCheck,
    title: "التزام الكود السعودي SBC",
    desc: "مراجعة فنية مستقلة تتحقق من مطابقة التصاميم للكود السعودي للبناء.",
  },
  {
    icon: ShieldCheck,
    title: "ضمان مالي محمي",
    desc: "أموال العملاء محفوظة في الضمان ولا تُحرَّر إلا عند اعتماد المراحل.",
  },
  {
    icon: Award,
    title: "مهندسون معتمدون",
    desc: "تحقق من عضوية الهيئة السعودية للمهندسين قبل تفعيل الحسابات.",
  },
  {
    icon: Newspaper,
    title: "إشارات استشارية",
    desc: "مكاتب استشارية وشركات هندسية تعتمد بيتلي في مراجعة مشاريعها.",
  },
];

export default function TrustBadgesSection() {
  return (
    <section className="py-14 sm:py-16 bg-[#4A3F35] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-[#C9A66B]/30 rounded-full px-4 py-1.5 mb-4">
            <Lock className="w-4 h-4 text-[#C9A66B]" />
            <span className="text-sm text-[#C9A66B] font-medium">إشارات الثقة والاعتماد</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            ثقة مبنية على معايير واحترافية
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
            نلتزم بالمعايير الوطنية ونوفّر مراجعة فنية مستقلة لحماية مشاريعك وأموالك.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-[#C9A66B]/40 transition-colors"
            >
              <div className="w-11 h-11 rounded-lg bg-[#C9A66B]/15 flex items-center justify-center mb-3">
                <b.icon className="w-5 h-5 text-[#C9A66B]" />
              </div>
              <h3 className="font-semibold mb-1.5 text-sm sm:text-base">{b.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* External trust signal — independent verification badge */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
            <FileBadge className="w-3.5 h-3.5 text-[#C9A66B]" />
            مراجعة فنية مستقلة لكل تسليم
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C9A66B]" />
            توقيع إلكتروني موثّق للعقود
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
            <Award className="w-3.5 h-3.5 text-[#C9A66B]" />
            عضوية الهيئة السعودية للمهندسين
          </span>
        </div>
      </div>
    </section>
  );
}