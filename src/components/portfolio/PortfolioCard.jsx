import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Calendar, Eye, MessageSquare, CheckCircle, X, Maximize2, Tag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import EnhancedLightbox from "@/components/portfolio/EnhancedLightbox";

const categoryLabels = {
  interior: "تصميم داخلي",
  architecture: "معماري",
  painting: "رسم وديكور",
  landscape: "مناظر طبيعية",
  furniture: "أثاث",
  lighting: "إضاءة",
  civil_engineering: "هندسة مدنية",
  structural_design: "تصميم إنشائي",
  executive_drawing: "رسم تنفيذي",
};

const categoryColors = {
  interior: "from-rose-500 to-pink-600",
  architecture: "from-blue-500 to-indigo-600",
  painting: "from-purple-500 to-violet-600",
  landscape: "from-green-500 to-emerald-600",
  furniture: "from-amber-500 to-orange-600",
  lighting: "from-yellow-500 to-amber-600",
  civil_engineering: "from-slate-500 to-gray-700",
  structural_design: "from-cyan-500 to-blue-700",
  executive_drawing: "from-teal-500 to-cyan-700",
};

const projectTypeLabels = {
  residential: "سكني",
  commercial: "تجاري",
  industrial: "صناعي",
  renovation: "ترميم",
  interior: "تصميم داخلي",
  landscape: "مناظر طبيعية",
  other: "أخرى",
};

export default function PortfolioCard({ portfolio, engineerName, onTagClick, activeTag }) {
  const [currentImage, setCurrentImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const images = portfolio.images || [];
  const tags = portfolio.tags || [];
  const styleLabel = portfolio.style ? portfolio.style : null;

  const touchRef = useRef({ startX: 0, startY: 0, moved: false });

  const nextImage = (e) => {
    e?.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e?.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchRef.current = { startX: t.clientX, startY: t.clientY, moved: false };
  };

  const onTouchEnd = (e) => {
    if (!touchRef.current.moved) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.startX;
    const dy = t.clientY - touchRef.current.startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) setCurrentImage((p) => (p + 1) % images.length);
      else setCurrentImage((p) => (p - 1 + images.length) % images.length);
    }
  };

  const onTouchMove = () => {
    touchRef.current.moved = true;
  };

  if (images.length === 0) return null;

  const gradient = categoryColors[portfolio.category] || "from-[#6B5D4F] to-[#C9A66B]";

  // Collect quick tags: style + tags array (max 4)
  const quickTags = [...(styleLabel ? [styleLabel] : []), ...tags].slice(0, 4);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 group relative"
      >
        {/* Image Slider */}
        <div
          className="relative h-72 overflow-hidden bg-slate-100 cursor-pointer"
          onClick={() => setShowLightbox(true)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImage}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              src={images[currentImage]}
              alt={portfolio.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              draggable={false}
            />
          </AnimatePresence>

          {/* Gradient overlay for better text readability on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

          {/* Hover overlay with title */}
          <div className="absolute bottom-0 right-0 left-0 p-4 translate-y-2 group-hover:translate-y-0 opacity-80 group-hover:opacity-100 transition-all duration-300">
            <h3 className="font-bold text-lg text-white mb-1 drop-shadow-lg">{portfolio.title}</h3>
            {engineerName && (
              <div className="flex items-center gap-1.5 text-white/80 text-xs">
                <User className="w-3 h-3" />
                {engineerName}
              </div>
            )}
          </div>

          {/* Nav arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white md:opacity-0 md:group-hover:opacity-100 opacity-80 transition-opacity hover:bg-black/60 active:scale-90"
                aria-label="السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white md:opacity-0 md:group-hover:opacity-100 opacity-80 transition-opacity hover:bg-black/60 active:scale-90"
                aria-label="التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Progress dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrentImage(i); }}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentImage ? "bg-white w-4" : "bg-white/50 w-1.5"
                    }`}
                    aria-label={`الصورة ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Image count badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {images.length}
          </div>

          {/* Fullscreen hint */}
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-80">
            <Maximize2 className="w-3.5 h-3.5" />
          </div>

          {/* Category badge with gradient */}
          {portfolio.category && (
            <div className={`absolute top-11 right-3 px-3 py-1 rounded-full bg-gradient-to-r ${gradient} text-white text-xs font-bold shadow-lg`}>
              {categoryLabels[portfolio.category] || portfolio.category}
            </div>
          )}

          {/* Featured badge */}
          {portfolio.is_featured && (
            <div className="absolute top-[4.75rem] right-3 px-2.5 py-1 rounded-full bg-[#6B5D4F]/90 text-white text-xs font-medium flex items-center gap-1 shadow-lg">
              <CheckCircle className="w-3 h-3" />
              مميز
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Description */}
          {portfolio.description && (
            <p className="text-slate-500 text-sm mb-3 line-clamp-2">{portfolio.description}</p>
          )}

          {/* Quick Tags */}
          {quickTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {quickTags.map((tag, i) => {
                const isActive = activeTag === tag;
                return (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTagClick?.(tag);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white border-transparent shadow-md"
                        : "bg-amber-50/50 text-[#6B5D4F] border-amber-100 hover:bg-amber-100/60 hover:border-amber-200"
                    }`}
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                  </button>
                );
              })}
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 mb-4">
            {portfolio.project_type && (
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
                {projectTypeLabels[portfolio.project_type] || portfolio.project_type}
              </span>
            )}
            {portfolio.location && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-600 text-xs rounded-full border border-slate-100">
                <MapPin className="w-3 h-3" />
                {portfolio.location}
              </span>
            )}
            {portfolio.year && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-600 text-xs rounded-full border border-slate-100">
                <Calendar className="w-3 h-3" />
                {portfolio.year}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90"
              onClick={() => setShowQuoteModal(true)}
            >
              <MessageSquare className="w-3.5 h-3.5 ml-1" />
              طلب عرض سعر
            </Button>
            {portfolio.engineer_id && (
              <Link to={`/EngineerProfile?id=${portfolio.engineer_id}`}>
                <Button size="sm" variant="outline" className="border-[#C9A66B] text-[#6B5D4F] hover:bg-amber-50">
                  الملف الشخصي
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Enhanced Lightbox */}
      <AnimatePresence>
        {showLightbox && (
          <EnhancedLightbox
            images={images}
            initialIndex={currentImage}
            onClose={() => setShowLightbox(false)}
          />
        )}
      </AnimatePresence>

      {/* Quote Request Modal */}
      <AnimatePresence>
        {showQuoteModal && (
          <QuoteRequestModal
            portfolio={portfolio}
            engineerName={engineerName}
            onClose={() => setShowQuoteModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function QuoteRequestModal({ portfolio, engineerName, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-[#1a1a2e]">طلب عرض سعر</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-100">
          <p className="text-sm text-amber-800 font-medium">{portfolio.title}</p>
          {engineerName && <p className="text-xs text-amber-600 mt-1">المصمم: {engineerName}</p>}
        </div>

        <p className="text-slate-600 text-sm mb-4">
          لطلب عرض سعر من هذا المصمم، يمكنك إرسال طلب مباشر من صفحة طلب العرض أو التواصل عبر رسائل المنصة.
        </p>

        <div className="flex gap-3">
          <Link
            to={`/RequestQuote${portfolio.engineer_id ? `?engineer_id=${portfolio.engineer_id}` : ''}`}
            className="flex-1"
            onClick={onClose}
          >
            <Button className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90">
              إرسال طلب عرض سعر
            </Button>
          </Link>
          <Button variant="outline" onClick={onClose} className="border-slate-200">
            إلغاء
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}