import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Search, Grid3X3, LayoutGrid, Palette, Building2, PenTool
} from "lucide-react";
import { Input } from "@/components/ui/input";
import ImageGallerySlider from "@/components/portfolio/ImageGallerySlider";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function Gallery() {
  const { t } = useLanguage();
  const [portfolios, setPortfolios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const portfolioData = await base44.entities.Portfolio.list("-created_date", 100);
    setPortfolios(portfolioData);
    setIsLoading(false);
  };

  const categories = [
    { value: "all", label: t('gallery.categories.all'), icon: Grid3X3 },
    { value: "interior", label: t('gallery.categories.interior'), icon: Palette },
    { value: "architecture", label: t('gallery.categories.architecture'), icon: Building2 },
    { value: "painting", label: t('gallery.categories.painting'), icon: PenTool },
    { value: "landscape", label: t('gallery.categories.landscape'), icon: LayoutGrid },
    { value: "furniture", label: t('gallery.categories.furniture'), icon: Grid3X3 },
    { value: "lighting", label: t('gallery.categories.lighting'), icon: Grid3X3 }
  ];

  const filteredPortfolios = portfolios.filter(p => {
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && p.images && p.images.length > 0;
  });

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
              {t('gallery.title')}
            </h1>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              {t('gallery.subtitle')}
            </p>

            <div className="max-w-xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder={t('gallery.searchPlaceholder')}
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
            {t('gallery.showing').replace('{count}', filteredPortfolios.length)}
          </p>
        </div>

        {/* Gallery Grid - Group by Portfolio */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-200 rounded-2xl h-64 mb-4" />
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredPortfolios.length > 0 ? (
          <div className="space-y-16">
            {filteredPortfolios.map((portfolio, index) => (
              <motion.div
                key={portfolio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">{portfolio.title}</h2>
                    {portfolio.description && (
                      <p className="text-slate-600">{portfolio.description}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      {portfolio.category && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full">
                          {categories.find(c => c.value === portfolio.category)?.label || portfolio.category}
                        </span>
                      )}
                      {portfolio.location && (
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">
                          {portfolio.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <ImageGallerySlider images={portfolio.images || []} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Grid3X3 className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">{t('gallery.noPortfolios')}</h3>
            <p className="text-slate-500">{t('gallery.noResults')}</p>
          </div>
        )}
      </div>
    </div>
  );
}