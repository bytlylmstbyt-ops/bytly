import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, ExternalLink, X, Play } from "lucide-react";
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

// Autoplay muted video/GIF with intersection observer (lazy load)
function AdMedia({ ad, className }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (videoRef.current) {
          if (entry.isIntersecting) {
            videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
          }
        }
      },
      { threshold: 0.4 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (ad.media_type === "video" && ad.video_url) {
    return (
      <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
        {!isVisible && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 z-10">
            <Play className="w-6 h-6 text-white/80" />
          </div>
        )}
        <video
          ref={videoRef}
          src={ad.video_url}
          muted
          loop
          playsInline
          preload="none"
          poster={ad.image_url}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  if (ad.media_type === "gif" && ad.video_url) {
    return (
      <div ref={containerRef} className={`overflow-hidden ${className}`}>
        <img
          src={isVisible ? ad.video_url : ad.image_url || ad.video_url}
          alt={ad.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <img
      src={ad.image_url}
      alt={ad.title}
      loading="lazy"
      className={`object-cover ${className}`}
    />
  );
}

// ─── IN-FEED CARD (blends with project cards) ───────────────────────────────
export function AdInFeedCard({ ad, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);
  const clickedRef = useRef(false);

  if (dismissed) return null;

  const handleDismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const handleClick = () => {
    if (clickedRef.current) return;
    clickedRef.current = true;
    // include client timestamp and prevent rapid double-clicks
    base44.functions.invoke("trackAdClick", { ad_id: ad.id, timestamp: new Date().toISOString() }).catch(() => {}).finally(() => {
      setTimeout(() => { clickedRef.current = false; }, 700);
    });
    window.open(ad.destination_url, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="relative rounded-2xl border border-[#C9A66B]/30 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 shadow-sm overflow-hidden group"
      dir="rtl"
    >
      {/* Sponsored tag + dismiss */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C9A66B]" />
          <span className="text-[10px] text-[#C9A66B] font-semibold tracking-wide">محتوى مدعوم</span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="إغلاق الإعلان"
          className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600"
          title="إغلاق الإعلان"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <button type="button" onClick={handleClick} aria-label="فتح الإعلان في نافذة جديدة" className="w-full text-right px-4 pb-4 pt-1 flex gap-4 items-center hover:bg-amber-50/30 transition-colors">
        <AdMedia
          ad={ad}
          className="w-24 h-20 rounded-xl flex-shrink-0 shadow-sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            {ad.logo_url && (
              <img src={ad.logo_url} alt="" className="w-5 h-5 rounded-full object-cover border border-slate-100" />
            )}
            <span className="font-bold text-[#1a1a2e] text-sm truncate">{ad.advertiser_name}</span>
            {ad.is_verified_advertiser && (
              <span className="flex items-center gap-0.5 text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-1.5 py-0.5 text-[10px]">
                <CheckCircle className="w-3 h-3" />معتمد
              </span>
            )}
            <span className="mr-auto text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
              {CATEGORY_LABELS[ad.category] || ad.category}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-700 line-clamp-1">{ad.title}</p>
          {ad.description && (
            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{ad.description}</p>
          )}
          <div className="flex items-center gap-1 mt-2 text-[#C9A66B] text-xs font-medium">
            <span>اعرف أكثر</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </button>
    </motion.div>
  );
}

// ─── SIDEBAR CARD ────────────────────────────────────────────────────────────
export function AdSidebarCard({ ad, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);
  const clickedRef = useRef(false);

  if (dismissed) return null;

  const handleDismiss = (e) => {
    e.stopPropagation();
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const handleClick = () => {
    if (clickedRef.current) return;
    clickedRef.current = true;
    base44.functions.invoke("trackAdClick", { ad_id: ad.id, timestamp: new Date().toISOString() }).catch(() => {}).finally(() => {
      setTimeout(() => { clickedRef.current = false; }, 700);
    });
    window.open(ad.destination_url, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="relative rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden group"
      dir="rtl"
    >
      {/* Dismiss button */}
      <button
            type="button"
            onClick={handleDismiss}
            aria-label="إغلاق الإعلان"
            className="absolute top-2 left-2 z-10 w-5 h-5 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors text-white"
            title="إغلاق"
          >
        <X className="w-3 h-3" />
      </button>

          <button type="button" onClick={handleClick} aria-label="فتح الإعلان في نافذة جديدة" className="w-full text-right">
        <AdMedia ad={ad} className="w-full h-32 rounded-none" />
        <div className="p-3">
          <div className="flex items-center gap-1 mb-1">
            {ad.logo_url && (
              <img src={ad.logo_url} alt="" className="w-4 h-4 rounded-full object-cover" />
            )}
            <span className="text-xs font-bold text-[#1a1a2e] truncate">{ad.advertiser_name}</span>
            {ad.is_verified_advertiser && (
              <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-600 line-clamp-2">{ad.title}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
              {CATEGORY_LABELS[ad.category] || ad.category}
            </span>
            <span className="text-[10px] text-[#C9A66B] font-medium">محتوى مدعوم</span>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

// ─── SIDEBAR LIST (multiple cards) ───────────────────────────────────────────
export function AdSidebarSection({ ads }) {
  const [visibleAds, setVisibleAds] = useState(ads || []);

  useEffect(() => {
    setVisibleAds(ads || []);
  }, [ads]);

  const dismiss = (id) => setVisibleAds(prev => prev.filter(a => a.id !== id));

  if (!visibleAds.length) return null;

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#C9A66B]" />
        <span className="text-[10px] text-[#C9A66B] font-semibold tracking-wide">محتوى مدعوم</span>
      </div>
      <AnimatePresence>
        {visibleAds.map(ad => (
          <AdSidebarCard key={ad.id} ad={ad} onDismiss={() => dismiss(ad.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── IN-FEED LIST (injected every N items) ───────────────────────────────────
export function AdInFeedSection({ ads }) {
  const [visibleAds, setVisibleAds] = useState(ads || []);

  useEffect(() => {
    setVisibleAds(ads || []);
  }, [ads]);

  const dismiss = (id) => setVisibleAds(prev => prev.filter(a => a.id !== id));

  if (!visibleAds.length) return null;

  return (
    <AnimatePresence>
      {visibleAds.map(ad => (
        <AdInFeedCard key={ad.id} ad={ad} onDismiss={() => dismiss(ad.id)} />
      ))}
    </AnimatePresence>
  );
}