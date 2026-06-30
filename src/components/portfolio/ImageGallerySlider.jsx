import React, { useState } from "react";
import { motion } from "framer-motion";
import { Maximize2 } from "lucide-react";
import EnhancedLightbox from "@/components/portfolio/EnhancedLightbox";

export default function ImageGallerySlider({ images = [] }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  const openLightbox = (index) => setSelectedImageIndex(index);
  const closeLightbox = () => setSelectedImageIndex(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((image, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(index * 0.04, 0.4) }}
            className="relative aspect-square cursor-pointer group overflow-hidden rounded-xl"
            onClick={() => openLightbox(index)}
          >
            <img
              src={image}
              alt={`صورة ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              draggable={false}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="w-6 h-6 text-white" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enhanced Lightbox with pinch-zoom & swipe */}
      {selectedImageIndex !== null && (
        <EnhancedLightbox
          images={images}
          initialIndex={selectedImageIndex}
          onClose={closeLightbox}
        />
      )}
    </>
  );
}