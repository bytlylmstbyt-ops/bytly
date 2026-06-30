import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Share2, Facebook, Twitter, Linkedin, Copy, Check } from "lucide-react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2.5;

export default function EnhancedLightbox({ images = [], initialIndex = 0, onClose, portfolio }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const touchRef = useRef({
    mode: null, // 'pan' | 'pinch' | 'swipe' | null
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startPanX: 0,
    startPanY: 0,
    initialDistance: 0,
    initialZoom: 1,
    moved: false,
    tapTimer: null,
    lastTap: 0,
  });

  const containerRef = useRef(null);

  const resetTransforms = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const goToIndex = useCallback((idx) => {
    setCurrentIndex((prev) => {
      const next = (idx + images.length) % images.length;
      if (next !== prev) resetTransforms();
      return next;
    });
  }, [images.length, resetTransforms]);

  const goNext = useCallback(() => goToIndex(currentIndex + 1), [currentIndex, goToIndex]);
  const goPrev = useCallback(() => goToIndex(currentIndex - 1), [currentIndex, goToIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goNext(); // RTL: left = next
      else if (e.key === "ArrowRight") goPrev(); // RTL: right = prev
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const getDistance = (t1, t2) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  };

  const onTouchStart = (e) => {
    const touches = e.touches;
    const t = touchRef.current;
    t.moved = false;

    if (touches.length === 2) {
      // Pinch start
      t.mode = "pinch";
      t.initialDistance = getDistance(touches[0], touches[1]);
      t.initialZoom = zoom;
    } else if (touches.length === 1) {
      const now = Date.now();
      // Double-tap detection
      if (now - t.lastTap < 300) {
        if (zoom > 1) {
          resetTransforms();
        } else {
          setZoom(DOUBLE_TAP_ZOOM);
        }
        t.lastTap = 0;
        t.mode = null;
        return;
      }
      t.lastTap = now;
      t.mode = zoom > 1 ? "pan" : "swipe";
      t.startX = touches[0].clientX;
      t.startY = touches[0].clientY;
      t.lastX = touches[0].clientX;
      t.lastY = touches[0].clientY;
      t.startPanX = pan.x;
      t.startPanY = pan.y;
    }
  };

  const onTouchMove = (e) => {
    const touches = e.touches;
    const t = touchRef.current;
    if (!t.mode) return;

    t.moved = true;

    if (t.mode === "pinch" && touches.length === 2) {
      e.preventDefault();
      const dist = getDistance(touches[0], touches[1]);
      const scale = t.initialZoom * (dist / Math.max(t.initialDistance, 1));
      setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale)));
    } else if (t.mode === "pan" && touches.length === 1) {
      e.preventDefault();
      const dx = touches[0].clientX - t.startX;
      const dy = touches[0].clientY - t.startY;
      setPan({ x: t.startPanX + dx, y: t.startPanY + dy });
    } else if (t.mode === "swipe" && touches.length === 1) {
      // Track last position for swipe end detection
      t.lastX = touches[0].clientX;
      t.lastY = touches[0].clientY;
    }
  };

  const onTouchEnd = (e) => {
    const t = touchRef.current;
    if (!t.mode) return;

    if (t.mode === "swipe" && t.moved) {
      const dx = t.lastX - t.startX;
      const dy = t.lastY - t.startY;
      // Horizontal swipe only when zoom === 1
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        // RTL: swipe left = next, swipe right = prev
        if (dx < 0) goNext();
        else goPrev();
      }
    }

    t.mode = null;
  };

  // Mouse wheel zoom (desktop)
  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
  };

  // Mouse drag pan (desktop) when zoomed
  const mouseDrag = useRef({ active: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0 });

  const onMouseDown = (e) => {
    if (zoom <= 1) return;
    mouseDrag.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  };

  const onMouseMove = (e) => {
    if (!mouseDrag.current.active) return;
    const dx = e.clientX - mouseDrag.current.startX;
    const dy = e.clientY - mouseDrag.current.startY;
    setPan({
      x: mouseDrag.current.startPanX + dx,
      y: mouseDrag.current.startPanY + dy,
    });
  };

  const onMouseUp = () => {
    mouseDrag.current.active = false;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center select-none"
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
      >
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - 0.5))}
            className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
          >
            <ZoomOut className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + 0.5))}
            className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
          >
            <ZoomIn className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
          >
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Side Nav Buttons — hidden on small screens, replaced by swipe */}
      {images.length > 1 && (
        <>
          <button
            onClick={goNext}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm items-center justify-center hover:bg-white/20 active:scale-95 transition-all z-50"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={goPrev}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm items-center justify-center hover:bg-white/20 active:scale-95 transition-all z-50"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`صورة ${currentIndex + 1}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-full max-h-full object-contain"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: touchRef.current.mode === "pan" || touchRef.current.mode === "pinch"
              ? "none"
              : "transform 0.25s ease-out",
            cursor: zoom > 1 ? "grab" : "default",
            willChange: "transform",
          }}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          draggable={false}
        />
      </AnimatePresence>

      {/* Zoom indicator */}
      {zoom > 1 && (
        <div className="absolute bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-medium z-40">
          {Math.round(zoom * 100)}%
        </div>
      )}

      {/* Thumbnail strip — hidden when zoomed */}
      {zoom === 1 && images.length > 1 && (
        <div
          className="absolute bottom-0 left-0 right-0 z-40 flex justify-center gap-2 px-4 py-4 overflow-x-auto bg-gradient-to-t from-black/70 to-transparent"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
        >
          {images.map((image, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); goToIndex(index); }}
              className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                index === currentIndex
                  ? "ring-2 ring-[#C9A66B] scale-110"
                  : "opacity-50 hover:opacity-100"
              }`}
            >
              <img src={image} alt="" className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}

      {/* Share Menu */}
      <AnimatePresence>
        {showShareMenu && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl p-4 min-w-[320px]"
            style={{ top: "calc(env(safe-area-inset-top) + 5rem)" }}
          >
            <div className="text-center mb-3">
              <p className="font-semibold text-slate-800 mb-1">مشاركة العمل</p>
              {portfolio?.title && (
                <p className="text-sm text-slate-600">{portfolio.title}</p>
              )}
            </div>
            
            <div className="grid grid-cols-4 gap-2 mb-3">
              <ShareButton 
                platform="facebook" 
                icon={<Facebook className="w-5 h-5" />}
                color="bg-blue-600 hover:bg-blue-700"
                onClick={() => shareToPlatform('facebook')}
              />
              <ShareButton 
                platform="twitter" 
                icon={<Twitter className="w-5 h-5" />}
                color="bg-sky-500 hover:bg-sky-600"
                onClick={() => shareToPlatform('twitter')}
              />
              <ShareButton 
                platform="linkedin" 
                icon={<Linkedin className="w-5 h-5" />}
                color="bg-blue-700 hover:bg-blue-800"
                onClick={() => shareToPlatform('linkedin')}
              />
              <ShareButton 
                platform="copy" 
                icon={copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                color="bg-slate-600 hover:bg-slate-700"
                onClick={copyLink}
              />
            </div>
            
            <button
              onClick={() => setShowShareMenu(false)}
              className="w-full py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              إغلاق
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  function ShareButton({ platform, icon, color, onClick }) {
    return (
      <button
        onClick={onClick}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${color} text-white`}
      >
        {icon}
        <span className="text-xs font-medium">
          {platform === 'copy' ? 'نسخ' : platform === 'facebook' ? 'فيسبوك' : platform === 'twitter' ? 'تويتر' : 'لينكد إن'}
        </span>
      </button>
    );
  }

  function shareToPlatform(platform) {
    const currentImage = images[currentIndex];
    const shareUrl = window.location.href;
    const text = encodeURIComponent(portfolio?.title || 'أعمالي على منصة بيتلي');
    
    let shareLink = '';
    switch(platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
        break;
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
      setShowShareMenu(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
}