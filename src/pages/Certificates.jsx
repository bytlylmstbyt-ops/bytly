import React from "react";
import { motion } from "framer-motion";
import { Shield, Award, Hash, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CERTIFICATES = [
  {
    id: 1,
    title: "شهادة تسجيل مصنف",
    subtitle: "الهيئة السعودية للملكية الفكرية",
    subtitle_en: "Saudi Authority for Intellectual Property",
    reg_number: "26-12-71723621",
    hijri_date: "25/10/1447 هـ",
    gregorian_date: "13/04/2026 م",
    product_title: "بيتلي لمسة بيت",
    product_type: "مصنفات برمجيات وتطبيقات الحاسب الآلي",
    authors: ["رؤى عبدالله عمر الخواجة"],
    rights_holders: ["رؤى عبدالله عمر الخواجة"],
    image_url: "https://media.base44.com/images/public/69741d7bf3195aeab86a1582/fc78de108_image.png",
    category: "ملكية فكرية",
    status: "ساري",
    color: "#0d9488",
  },
  // Future certificates can be added here
];

const CertCard = ({ cert }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4 }} transition={{ duration: 0.3 }}
    className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden">

    {/* Top accent */}
    <div className="h-1.5 w-full" style={{ backgroundColor: cert.color }} />

    <div className="p-5" dir="rtl">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-bold text-[#1a1a2e] text-base">{cert.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{cert.subtitle}</p>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cert.color + "15" }}>
          <Shield className="w-5 h-5" style={{ color: cert.color }} />
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-3">
        <div className="flex items-center gap-2 text-slate-600">
          <Hash className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-xs text-slate-400 mb-0.5">رقم التسجيل</p>
            <span className="font-mono text-sm font-semibold text-[#1a1a2e]">{cert.reg_number}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <Badge style={{ backgroundColor: cert.color + "15", color: cert.color }} className="border-0 text-xs">
          {cert.category}
        </Badge>
        <Badge className="bg-green-100 text-green-700 border-0 text-xs">{cert.status}</Badge>
      </div>
    </div>
  </motion.div>
);

export default function Certificates() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30" dir="rtl">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1a1a2e] via-[#2d2d4e] to-[#1a1a2e] py-20 px-4 text-center relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0 opacity-5">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute border border-white rounded-full"
              style={{ width: `${40 + i * 30}px`, height: `${40 + i * 30}px`, top: "50%", left: "50%",
                transform: "translate(-50%,-50%)", animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-[#d4a574] text-sm mb-4">
            <Award className="w-4 h-4" />
            وثائق رسمية معتمدة
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            التراخيص والشهادات الرسمية
          </h1>
          <p className="text-white/60 max-w-xl mx-auto text-sm leading-relaxed">
            جميع الشهادات والتراخيص الرسمية الصادرة لمنصة Bytly — لمسة بيت، موثقة من الجهات الحكومية السعودية المختصة.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-white/50 text-xs">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-[#d4a574]" /> موثقة رسمياً</span>
            <span className="flex items-center gap-1"><Award className="w-3 h-3 text-[#d4a574]" /> محمية بحقوق الملكية</span>
          </div>

          {/* Beta Launch Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 inline-flex items-center gap-2 bg-gradient-to-r from-[#d4a574] to-[#e5c995] rounded-full px-5 py-2.5 shadow-lg shadow-[#d4a574]/30"
          >
            <Rocket className="w-4 h-4 text-[#1a1a2e]" />
            <span className="text-[#1a1a2e] text-sm font-bold">المنصة في مرحلة الإطلاق التجريبي</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1a1a2e] animate-pulse" />
          </motion.div>
          <p className="text-white/50 text-xs mt-2 max-w-md mx-auto">
            نحن في مرحلة الإطلاق التجريبي — نجمع ملاحظاتكم لتحسين الخدمة قبل الإطلاق الرسمي
          </p>
        </motion.div>
      </div>

      {/* Gallery */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-[#1a1a2e]">معرض الشهادات</h2>
            <p className="text-slate-400 text-sm mt-0.5">{CERTIFICATES.length} شهادة مسجلة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CERTIFICATES.map(cert => (
            <CertCard key={cert.id} cert={cert} />
          ))}

          {/* Upcoming licenses */}
          {[
            { title: "السجل التجاري", sub: "وزارة التجارة السعودية" },
            { title: "رخصة الاستثمار", sub: "هيئة الاستثمار السعودية" },
          ].map((item) => (
            <motion.div key={item.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/40 flex flex-col items-center justify-center p-10 text-center min-h-[320px] gap-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2z" opacity=".15" fill="currentColor"/>
                  <path d="M12 6v6l3 3"/>
                  <path d="M5.6 5.6l.7.7M18.4 5.6l-.7.7M5.6 18.4l.7-.7M18.4 18.4l-.7-.7"/>
                  <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
                </svg>
              </div>
              <div>
                <p className="font-bold text-slate-700 text-base">{item.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                قيد العمل
              </span>
              <p className="text-xs text-slate-400 max-w-[160px] leading-relaxed">المنصة في مرحلة توسع قانوني مستمر</p>
            </motion.div>
          ))}
        </div>

        {/* Trust banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-12 bg-gradient-to-r from-[#1a1a2e] to-[#2d2d4e] rounded-2xl p-6 text-center">
          <Shield className="w-8 h-8 text-[#d4a574] mx-auto mb-3" />
          <h3 className="text-white font-bold mb-2">حماية الملكية الفكرية</h3>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            منصة Bytly — لمسة بيت مسجلة ومحمية بموجب قوانين الملكية الفكرية السعودية.
            أي نسخ أو استخدام غير مصرح به يُعد انتهاكاً للقانون.
          </p>
          <p className="text-[#d4a574] text-xs mt-3">رقم التسجيل: 26-12-71723621 | الهيئة السعودية للملكية الفكرية</p>
        </motion.div>
      </div>

    </div>
  );
}