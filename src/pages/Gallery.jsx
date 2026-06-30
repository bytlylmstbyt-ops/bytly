import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Search, Grid3X3, Building2, Home, Store, Factory, Paintbrush, Trees, Layers, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PortfolioCard from "@/components/portfolio/PortfolioCard";

const DESIGN_CATEGORIES = [
  { value: "all", label: "الكل", icon: Grid3X3 },
  { value: "interior", label: "تصميم داخلي", icon: Paintbrush },
  { value: "architecture", label: "معماري", icon: Building2 },
  { value: "civil_engineering", label: "هندسة مدنية", icon: Layers },
  { value: "landscape", label: "مناظر طبيعية", icon: Trees },
  { value: "structural_design", label: "تصميم إنشائي", icon: Layers },
  { value: "painting", label: "رسم وديكور", icon: Paintbrush },
  { value: "furniture", label: "أثاث", icon: Grid3X3 },
  { value: "lighting", label: "إضاءة", icon: Grid3X3 },
  { value: "executive_drawing", label: "رسم تنفيذي", icon: Grid3X3 },
];

const DESIGN_STYLES = [
  { value: "all", label: "جميع الأنماط" },
  { value: "modern", label: "مودرن", keywords: ["مودرن", "حديث", "عصري", "معاصر", "modern", "contemporary"] },
  { value: "classic", label: "كلاسيك", keywords: ["كلاسيك", "تقليدي", "كلاسيكي", "classic", "traditional"] },
  { value: "islamic", label: "إسلامي", keywords: ["إسلامي", "عربي", "شرقي", "islamic", "arabic"] },
  { value: "minimalist", label: "مينيماليست", keywords: ["مينيماليست", "بسيط", "تبسيطي", "minimalist", "minimal"] },
  { value: "luxury", label: "فاخر", keywords: ["فاخر", "فخم", "ترف", "luxury", "luxurious"] },
  { value: "industrial", label: "صناعي", keywords: ["صناعي", "صناعة", "industrial"] },
  { value: "scandinavian", label: "اسكندنافي", keywords: ["اسكندنافي", "شمالي", "scandinavian", "nordic"] },
  { value: "bohemian", label: "بوهيمي", keywords: ["بوهيمي", "bohemian", "boho"] },
  { value: "mediterranean", label: "متوسطي", keywords: ["متوسطي", "بحر أبيض", "mediterranean"] },
];

const PROJECT_TYPES = [
  { value: "all", label: "جميع الأنواع" },
  { value: "residential", label: "سكني", icon: Home },
  { value: "commercial", label: "تجاري", icon: Store },
  { value: "industrial", label: "صناعي", icon: Factory },
  { value: "renovation", label: "ترميم", icon: Building2 },
  { value: "interior", label: "تصميم داخلي", icon: Paintbrush },
  { value: "landscape", label: "مناظر طبيعية", icon: Trees },
  { value: "other", label: "أخرى", icon: Grid3X3 },
];

const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "featured", label: "المميزة أولاً" },
];

export default function Gallery() {
  const [portfolios, setPortfolios] = useState([]);
  const [engineers, setEngineers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProjectType, setSelectedProjectType] = useState("all");
  const [selectedStyle, setSelectedStyle] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [portfolioData, engineerData] = await Promise.all([
      base44.entities.Portfolio.list("-created_date", 200),
      base44.entities.Engineer.list("-created_date", 200),
    ]);

    // Map engineers by id
    const engineerMap = {};
    engineerData.forEach(e => { engineerMap[e.id] = e.full_name; });

    setPortfolios(portfolioData);
    setEngineers(engineerMap);
    setIsLoading(false);
  };

  const filteredPortfolios = portfolios
    .filter(p => {
      if (!p.images || p.images.length === 0) return false;
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
      if (selectedProjectType !== "all" && p.project_type !== selectedProjectType) return false;
      
      // Smart style filtering
      if (selectedStyle !== "all") {
        const styleConfig = DESIGN_STYLES.find(s => s.value === selectedStyle);
        if (styleConfig) {
          const searchText = `${p.description || ''} ${p.title || ''} ${p.tags?.join(' ') || ''}`.toLowerCase();
          const matchesStyle = styleConfig.keywords.some(keyword => 
            searchText.includes(keyword.toLowerCase())
          );
          if (!matchesStyle) return false;
        }
      }
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          engineers[p.engineer_id]?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "featured") return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      if (sortBy === "oldest") return new Date(a.created_date) - new Date(b.created_date);
      return new Date(b.created_date) - new Date(a.created_date);
    });

  const activeFiltersCount = (selectedCategory !== "all" ? 1 : 0) + (selectedProjectType !== "all" ? 1 : 0) + (selectedStyle !== "all" ? 1 : 0);

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedProjectType("all");
    setSelectedStyle("all");
    setSearchQuery("");
    setSortBy("newest");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30" dir="rtl">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#1a1a2e] via-[#2d2d4e] to-[#1a1a2e] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              معرض الأعمال الهندسية
            </h1>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto text-lg">
              اكتشف أجمل المشاريع من مهندسين ومصممين معتمدين — وتواصل معهم مباشرةً
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="ابحث بالاسم، النوع، أو الموقع..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-12 h-13 bg-white border-0 rounded-2xl text-slate-800 placeholder:text-slate-400 shadow-lg text-base py-3"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#C9A66B]">{portfolios.length}+</div>
                <div className="text-slate-400 text-sm">مشروع معروض</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#C9A66B]">{Object.keys(engineers).length}+</div>
                <div className="text-slate-400 text-sm">مهندس ومصمم</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#C9A66B]">{DESIGN_CATEGORIES.length - 1}</div>
                <div className="text-slate-400 text-sm">تخصص</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Design Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {DESIGN_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.value
                  ? "bg-gradient-to-r from-[#1a1a2e] to-[#6B5D4F] text-white shadow-lg scale-105"
                  : "bg-white text-slate-600 hover:bg-slate-100 shadow-sm border border-slate-100"
              }`}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Project Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium">نوع المشروع:</span>
              <div className="flex flex-wrap gap-1.5">
                {PROJECT_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedProjectType(type.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedProjectType === type.value
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Design Style Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium">النمط:</span>
              <div className="flex flex-wrap gap-1.5">
                {DESIGN_STYLES.map(style => (
                  <button
                    key={style.value}
                    onClick={() => setSelectedStyle(style.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedStyle === style.value
                        ? "bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#C9A66B]"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Clear filters */}
            {activeFiltersCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearFilters}
                className="text-xs border-red-200 text-red-500 hover:bg-red-50"
              >
                <X className="w-3 h-3 ml-1" />
                مسح الفلاتر ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-slate-500 text-sm">
            عرض <span className="font-semibold text-[#1a1a2e]">{filteredPortfolios.length}</span> مشروع
            {searchQuery && <span> لـ "<span className="text-[#C9A66B]">{searchQuery}</span>"</span>}
          </p>
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl overflow-hidden shadow">
                <div className="bg-slate-200 h-64" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-8 bg-slate-200 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPortfolios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPortfolios.map((portfolio, index) => (
              <motion.div
                key={portfolio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.5) }}
              >
                <PortfolioCard
                  portfolio={portfolio}
                  engineerName={engineers[portfolio.engineer_id]}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Grid3X3 className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">لا توجد نتائج</h3>
            <p className="text-slate-400 mb-6">جرّب تغيير الفلاتر أو البحث بكلمات مختلفة</p>
            <Button onClick={clearFilters} variant="outline" className="border-[#C9A66B] text-[#6B5D4F]">
              مسح جميع الفلاتر
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}