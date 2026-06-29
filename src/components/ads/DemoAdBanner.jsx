import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, ExternalLink, X, Megaphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_LABELS = {
  engineering: "هندسة",
  contracting: "مقاولات",
  decor: "ديكور",
  building_materials: "مواد بناء",
  furniture: "أثاث",
  consulting_office: "مكتب استشاري",
  concrete_supply: "توريد خرسانة",
  electrical: "كهربائيات",
  plumbing: "سباكة",
  landscape: "تنسيق حدائق",
};

// Demo click landing page
function DemoClickModal({ ad, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Megaphone className="w-5 h-5" />
            <span className="font-semibold text-sm">محاكاة وجهة الإعلان</span>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق محاكاة الإعلان" className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ad Preview */}
        <div className="p-5">
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-full h-40 object-cover rounded-xl mb-4"
          />
          <div className="flex items-center gap-2 mb-2">
            {ad.logo_url && (
              <img src={ad.logo_url} alt="" className="w-7 h-7 rounded-full object-cover border" />
            )}
            <h3 className="font-bold text-[#1a1a2e] text-base">{ad.advertiser_name}</h3>
            {ad.is_verified_advertiser && (
              <div className="flex items-center gap-0.5 text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 text-xs">
                <CheckCircle className="w-3 h-3" />
                <span>معلن معتمد</span>
              </div>
            )}
          </div>
          <p className="text-slate-700 font-medium mb-1">{ad.title}</p>
          {ad.description && <p className="text-slate-500 text-sm mb-3">{ad.description}</p>}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200 font-medium">
              {CATEGORY_LABELS[ad.category] || ad.category}
            </span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-500 mb-4">
            <p className="font-medium text-slate-700 mb-1">📍 في النسخة الحقيقية:</p>
            <p>سيتم توجيه العميل إلى موقع المعلن أو صفحة التواصل مباشرةً عند النقر على الإعلان.</p>
            <p className="mt-1 font-mono text-slate-400 text-[10px] dir-ltr" dir="ltr">{ad.destination_url}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="أغلق محاكاة الإعلان"
            className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white rounded-xl py-2.5 font-medium text-sm hover:opacity-90 transition-opacity"
          >
            حسناً، فهمت آلية العمل
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Horizontal banner (between content sections)
export function AdHorizontalBanner({ ads }) {
  const [clickedAd, setClickedAd] = useState(null);
  const clickedRef = useRef(false);

  if (!ads || ads.length === 0) return null;
  const ad = ads[0];

  const handleClick = () => {
    if (clickedRef.current) return;
    clickedRef.current = true;
    base44.functions.invoke("trackAdClick", { ad_id: ad.id, timestamp: new Date().toISOString() }).catch(() => {}).finally(() => {
      setTimeout(() => { clickedRef.current = false; }, 700);
    });
    setClickedAd(ad);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-6 rounded-2xl overflow-hidden border border-[#d4a574]/30 bg-gradient-to-r from-amber-50/60 via-white to-[#d4a574]/5 shadow-sm"
        dir="rtl"
      >
        {/* Sponsored label */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#d4a574]" />
          <span className="text-[10px] text-[#d4a574] font-semibold tracking-wide uppercase">محتوى مدعوم</span>
        </div>

        <button
          type="button"
          onClick={handleClick}
          aria-label={`فتح الإعلان ${ad.title}`}
          className="w-full flex items-center gap-4 px-4 pb-4 pt-2 text-right hover:bg-amber-50/50 transition-colors group"
        >
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-24 h-20 object-cover rounded-xl flex-shrink-0 group-hover:opacity-95 transition-opacity shadow-sm"
            loading="lazy"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-bold text-[#1a1a2e] text-sm">{ad.advertiser_name}</span>
              {ad.is_verified_advertiser && (
                <span className="flex items-center gap-0.5 text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 text-[10px]">
                  <CheckCircle className="w-3 h-3" />
                  معتمد
                </span>
              )}
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 mr-auto">
                {CATEGORY_LABELS[ad.category]}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-700 line-clamp-1">{ad.title}</p>
            {ad.description && (
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{ad.description}</p>
            )}
            <div className="flex items-center gap-1 mt-2 text-[#d4a574] text-xs font-medium">
              <span>اعرف أكثر</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </div>
        </button>
      </motion.div>

      <AnimatePresence>
        {clickedAd && <DemoClickModal ad={clickedAd} onClose={() => setClickedAd(null)} />}
      </AnimatePresence>
    </>
  );
}

// Sidebar cards
export function AdSidebarCards({ ads }) {
  const [clickedAd, setClickedAd] = useState(null);
  const clickedRef = useRef(false);

  if (!ads || ads.length === 0) return null;

  return (
    <>
      <div className="mt-5" dir="rtl">
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#d4a574]" />
          <span className="text-[10px] text-[#d4a574] font-semibold tracking-wide uppercase">محتوى مدعوم</span>
        </div>
        <div className="space-y-3">
          {ads.map(ad => (
            <motion.button
              key={ad.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => {
                if (clickedRef.current) return;
                clickedRef.current = true;
                base44.functions.invoke("trackAdClick", { ad_id: ad.id, timestamp: new Date().toISOString() }).catch(() => {}).finally(() => {
                  setTimeout(() => { clickedRef.current = false; }, 700);
                });
                setClickedAd(ad);
              }}
              className="w-full group rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-[#d4a574]/50 transition-all overflow-hidden text-right"
            >
              <div className="relative">
                <img
                  src={ad.image_url}
                  alt={ad.title}
                  className="w-full h-28 object-cover group-hover:opacity-95 transition-opacity"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-bold text-[#1a1a2e] truncate">{ad.advertiser_name}</span>
                  {ad.is_verified_advertiser && (
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" title="معلن معتمد" />
                  )}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{ad.title}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                    {CATEGORY_LABELS[ad.category] || ad.category}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#d4a574] transition-colors" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {clickedAd && <DemoClickModal ad={clickedAd} onClose={() => setClickedAd(null)} />}
      </AnimatePresence>
    </>
  );
}