import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Grid3X3, LayoutGrid, X, ChevronLeft, ChevronRight,
  Heart, Share2, ExternalLink, User, Palette, Building2, PenTool
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Gallery() {
  const [portfolios, setPortfolios] = useState([]);
  const [engineers, setEngineers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [portfolioData, engineerData] = await Promise.all([
      base44.entities.Portfolio.list("-created_date", 100),
      base44.entities.Engineer.filter({ status: "approved" })
    ]);
    
    const engineerMap = {};
    engineerData.forEach(eng => {
      engineerMap[eng.id] = eng;
    });
    
    setPortfolios(portfolioData);
    setEngineers(engineerMap);
    setIsLoading(false);
  };

  const categories = [
    { value: "all", label: "الكل", icon: Grid3X3 },
    { value: "interior", label: "تصميم داخلي", icon: Palette },
    { value: "architecture", label: "معماري", icon: Building2 },
    { value: "painting", label: "رسم", icon: PenTool },
    { value: "landscape", label: "حدائق", icon: LayoutGrid },
    { value: "furniture", label: "أثاث", icon: Grid3X3 },
    { value: "lighting", label: "إضاءة", icon: Grid3X3 }
  ];

  const filteredPortfolios = portfolios.filter(p => {
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Flatten all images with portfolio info
  const allImages = filteredPortfolios.flatMap(p => 
    (p.images || []).map(img => ({
      url: img,
      portfolio: p,
      engineer: engineers[p.engineer_id]
    }))
  );

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#1a1a2e]/90 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              معرض الأعمال
            </h1>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              استلهم من أفضل التصاميم والأعمال المنفذة من قبل مهندسينا
            </p>

            <div className="max-w-xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="ابحث في المعرض..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-12 h-12 bg-white border-0 rounded-xl text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.value
                  ? "bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white shadow-lg"
                  : "bg-white text-slate-600 hover:bg-slate-100 shadow"
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="mb-6 text-center">
          <p className="text-slate-600">
            عرض <span className="font-semibold text-[#1a1a2e]">{allImages.length}</span> صورة
          </p>
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div 
                key={i} 
                className="break-inside-avoid animate-pulse bg-slate-200 rounded-2xl"
                style={{ height: `${Math.random() * 200 + 200}px` }}
              />
            ))}
          </div>
        ) : allImages.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {allImages.map((item, index) => (
              <motion.div
                key={`${item.portfolio.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="break-inside-avoid group relative overflow-hidden rounded-2xl cursor-pointer"
                onClick={() => {
                  setSelectedImage(item);
                  setCurrentImageIndex(index);
                }}
              >
                <img
                  src={item.url}
                  alt={item.portfolio.title}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold mb-1">{item.portfolio.title}</h3>
                    {item.engineer && (
                      <p className="text-white/80 text-sm flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.engineer.full_name}
                      </p>
                    )}
                  </div>
                  <div className="absolute top-3 left-3 flex gap-2">
                    <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                      <Heart className="w-4 h-4 text-white" />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                      <Share2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Grid3X3 className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">لا توجد أعمال</h3>
            <p className="text-slate-500">لا توجد أعمال تطابق معايير البحث</p>
          </div>
        )}
      </div>

      {/* Image Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl p-0 bg-black/95 border-0 overflow-hidden">
          {selectedImage && (
            <div className="relative">
              <img
                src={allImages[currentImageIndex]?.url}
                alt={allImages[currentImageIndex]?.portfolio.title}
                className="w-full max-h-[80vh] object-contain"
              />
              
              {/* Navigation */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                </>
              )}

              {/* Info Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white text-xl font-semibold mb-1">
                      {allImages[currentImageIndex]?.portfolio.title}
                    </h3>
                    {allImages[currentImageIndex]?.engineer && (
                      <Link 
                        to={createPageUrl("EngineerProfile") + `?id=${allImages[currentImageIndex].engineer.id}`}
                        className="text-white/80 hover:text-white flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        {allImages[currentImageIndex].engineer.full_name}
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" size="icon">
                      <Heart className="w-5 h-5" />
                    </Button>
                    <Button variant="secondary" size="icon">
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Image Counter */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/10 text-white text-sm">
                {currentImageIndex + 1} / {allImages.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}