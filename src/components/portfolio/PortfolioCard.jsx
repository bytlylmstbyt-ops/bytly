import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Calendar, DollarSign, Eye, MessageSquare, CheckCircle, X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
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

const projectTypeLabels = {
  residential: "سكني",
  commercial: "تجاري",
  industrial: "صناعي",
  renovation: "ترميم",
  interior: "تصميم داخلي",
  landscape: "مناظر طبيعية",
  other: "أخرى",
};

export default function PortfolioCard({ portfolio, engineerName }) {
  const [currentImage, setCurrentImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const images = portfolio.images || [];

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
      // RTL: swipe left = next, right = prev
      if (dx < 0) setCurrentImage((p) => (p + 1) % images.length);
      else setCurrentImage((p) => (p - 1 + images.length) % images.length);
    }
  };

  const onTouchMove = () => {
    touchRef.current.moved = true;
  };

  if (images.length === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 group"
      >
        {/* Image Slider — swipeable on mobile */}
        <div
          className="relative h-64 overflow-hidden bg-slate-100 cursor-pointer"
          onClick={() => setShowLightbox(true)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              src={images[currentImage]}
              alt={portfolio.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </AnimatePresence>

          {/* Nav arrows — always visible on touch, hover on desktop */}
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

          {/* Category badge */}
          {portfolio.category && (
            <div className="absolute top-11 right-3 px-2.5 py-1 rounded-full bg-amber-500/90 text-white text-xs font-medium">
              {categoryLabels[portfolio.category] || portfolio.category}
            </div>
          )}

          {/* Featured badge */}
          {portfolio.is_featured && (
            <div className="absolute top-[4.75rem] right-3 px-2.5 py-1 rounded-full bg-[#6B5D4F]/90 text-white text-xs font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              مميز
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-bold text-lg text-[#1a1a2e] mb-1 line-clamp-1">{portfolio.title}</h3>

          {portfolio.description && (
            <p className="text-slate-500 text-sm mb-3 line-clamp-2">{portfolio.description}</p>
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
            {portfolio.budget && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-100">
                <DollarSign className="w-3 h-3" />
                {portfolio.budget.toLocaleString()} ر.س
              </span>
            )}
          </div>

          {engineerName && (
            <p className="text-xs text-slate-400 mb-3">المصمم: {engineerName}</p>
          )}

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

      {/* Enhanced Lightbox with pinch-zoom */}
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