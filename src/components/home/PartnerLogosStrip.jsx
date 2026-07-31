import React from "react";
import { Building2, HardHat, Boxes, PenTool, MapPin, Layers } from "lucide-react";

// شريط شعارات — يعرض أنواع الجهات والقطاعات التي تستخدم المنصة
// ملاحظة: نصوص تعريفية لأن الشعارات الفعلية للشركاء تُضاف لاحقاً عند توفرها.
const logos = [
  { icon: Building2, label: "مكاتب استشارية" },
  { icon: HardHat, label: "مقاولون معتمدون" },
  { icon: Boxes, label: "موردو مواد" },
  { icon: PenTool, label: "مهندسون معماريون" },
  { icon: MapPin, label: "مساحون مرخصون" },
  { icon: Layers, label: "القطاع السكني" },
];

export default function PartnerLogosStrip() {
  return (
    <section className="bg-white border-y border-slate-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs sm:text-sm text-slate-400 mb-5 tracking-wide">
          جهات وممارسون يستخدمون منصة بيتلي في إدارة مشاريعهم الهندسية
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12">
          {logos.map((logo, i) => (
            <div key={i} className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <logo.icon className="w-5 h-5 text-[#6B5D4F]" />
              <span className="text-sm sm:text-base font-semibold text-slate-500 whitespace-nowrap">
                {logo.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}