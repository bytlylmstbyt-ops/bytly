import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, RefreshCw, ZoomIn, X, Sparkles, ImageIcon } from "lucide-react";

export default function AIImageGallery({ images, onRegenerate, loading }) {
  const [zoomed, setZoomed] = useState(null);

  const handleDownload = async (url, idx) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `bytly-design-${idx + 1}.png`;
    a.target = "_blank";
    a.click();
  };

  if (loading) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="aspect-square bg-white/5 border border-white/10 rounded-xl overflow-hidden relative"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <Sparkles className="w-4 h-4 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <span className="text-xs text-slate-500">جاري التوليد...</span>
            </div>
            {/* shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {images.map((url, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.12 }}
            className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 cursor-pointer bg-slate-900"
            onClick={() => setZoomed(url)}
          >
            <img
              src={url}
              alt={`design-${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-2 left-2 right-2 flex gap-1 justify-center">
                <button
                  onClick={e => { e.stopPropagation(); handleDownload(url, i); }}
                  className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                  title="تحميل"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setZoomed(url); }}
                  className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                  title="تكبير"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
            <div className="absolute top-1.5 right-1.5 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
              {i + 1}
            </div>
          </motion.div>
        ))}
      </div>

      {onRegenerate && (
        <motion.button
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={onRegenerate}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-xs text-slate-400 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          توليد تصاميم جديدة
        </motion.button>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setZoomed(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-3xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <img src={zoomed} alt="zoomed" className="w-full rounded-2xl shadow-2xl border border-white/10" />
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => handleDownload(zoomed, 0)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
                >
                  <Download className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => setZoomed(null)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Bytly AI Generated
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}