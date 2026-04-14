import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Award, X, ZoomIn, Calendar, Hash, User, FileText, Building2, ExternalLink } from "lucide-react";
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

const WatermarkedImage = ({ src, alt }) => (
  <div className="relative select-none overflow-hidden rounded-xl shadow-2xl" onContextMenu={e => e.preventDefault()}>
    <img src={src} alt={alt} className="w-full object-contain pointer-events-none" draggable={false} />
    {/* Watermark grid */}
    <div className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(107,93,79,0.07) 60px, rgba(107,93,79,0.07) 120px)",
      }}
    />
    {[...Array(12)].map((_, i) => (
      <div key={i} className="absolute text-[#6B5D4F] font-bold opacity-10 rotate-[-35deg] select-none pointer-events-none"
        style={{
          fontSize: "22px",
          top: `${(i % 4) * 28}%`,
          left: `${Math.floor(i / 4) * 40 - 5}%`,
          whiteSpace: "nowrap",
          letterSpacing: "2px",
        }}>
        Bytly © بيتلي
      </div>
    ))}
  </div>
);

const CertificateModal = ({ cert, onClose }) => (
  <AnimatePresence>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()} dir="rtl">

        <button onClick={onClose}
          className="absolute top-4 left-4 z-10 w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cert.color + "20" }}>
              <Shield className="w-4 h-4" style={{ color: cert.color }} />
            </div>
            <Badge style={{ backgroundColor: cert.color + "20", color: cert.color }} className="border-0">
              {cert.category}
            </Badge>
            <Badge className="bg-green-100 text-green-700 border-0 mr-auto">{cert.status}</Badge>
          </div>

          <WatermarkedImage src={cert.image_url} alt={cert.title} />

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Hash, label: "رقم التسجيل", value: cert.reg_number },
              { icon: Calendar, label: "تاريخ التسجيل", value: `${cert.hijri_date} / ${cert.gregorian_date}` },
              { icon: FileText, label: "عنوان المصنف", value: cert.product_title },
              { icon: Building2, label: "نوع المصنف", value: cert.product_type },
              { icon: User, label: "المؤلف", value: cert.authors.join("، ") },
              { icon: User, label: "صاحب الحق", value: cert.rights_holders.join("، ") },
            ].map(row => (
              <div key={row.label} className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <row.icon className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">{row.label}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">{row.value}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 text-center mt-4">
            جميع حقوق الملكية الفكرية محفوظة لـ Bytly — لمسة بيت © {new Date().getFullYear()}
          </p>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const CertCard = ({ cert, onClick }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4 }} transition={{ duration: 0.3 }}
    className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden cursor-pointer"
    onClick={onClick}>

    {/* Top accent */}
    <div className="h-1.5 w-full" style={{ backgroundColor: cert.color }} />

    {/* Image preview */}
    <div className="relative overflow-hidden bg-slate-50 h-52">
      <img src={cert.image_url} alt={cert.title}
        className="w-full h-full object-contain p-3 pointer-events-none group-hover:scale-105 transition-transform duration-500"
        draggable={false} onContextMenu={e => e.preventDefault()} />
      {/* Watermark overlay on card too */}
      <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-black/40 rounded-lg px-4 py-2 flex items-center gap-2 text-white text-sm">
          <ZoomIn className="w-4 h-4" />
          عرض الشهادة
        </div>
      </div>
      <div className="absolute top-2 right-2">
        <Badge className="bg-green-100 text-green-700 border-0 text-xs">{cert.status}</Badge>
      </div>
    </div>

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

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <Hash className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono text-xs">{cert.reg_number}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs">{cert.hijri_date}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs">{cert.authors[0]}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <Badge style={{ backgroundColor: cert.color + "15", color: cert.color }} className="border-0 text-xs">
          {cert.category}
        </Badge>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <ZoomIn className="w-3 h-3" />
          انقر للتكبير
        </span>
      </div>
    </div>
  </motion.div>
);

export default function Certificates() {
  const [selected, setSelected] = useState(null);

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
            <CertCard key={cert.id} cert={cert} onClick={() => setSelected(cert)} />
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

      {selected && <CertificateModal cert={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}