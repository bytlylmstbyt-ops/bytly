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
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-amber-50/30" dir="rtl">
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
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-[#C9A66B] text-sm mb-4">
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
            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-[#C9A66B]" /> موثقة رسمياً</span>
            <span className="flex items-center gap-1"><Award className="w-3 h-3 text-[#C9A66B]" /> محمية بحقوق الملكية</span>
          </div>

          {/* Beta Launch Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A66B] to-[#e5c995] rounded-full px-5 py-2.5 shadow-lg shadow-[#C9A66B]/30"
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

      {/* Beta Lock — replaces gallery while in trial launch */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14 text-center" dir="rtl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/40 p-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">التراخيص قيد الإطلاق التجريبي</h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
            مستندات التراخيص والشهادات الرسمية غير متاحة للعرض العام حالياً خلال مرحلة الإطلاق التجريبي.
            سيتم كشفها تدريجياً بعد الإطلاق الرسمي.
          </p>
        </motion.div>
      </div>

    </div>
  );
}