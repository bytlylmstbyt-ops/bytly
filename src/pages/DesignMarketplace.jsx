import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Search, ShoppingCart, Star, Download, Ruler, Layers, 
  Bed, Bath, Home, Plus, Filter, Grid3X3, List, Tag,
  TrendingUp, Award, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DesignMarketplace() {
  const [designs, setDesigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [styleFilter, setStyleFilter] = useState("");
  const [priceSort, setPriceSort] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    setIsLoading(true);
    const data = await base44.entities.ReadyMadeDesign.filter(
      { status: "active" }, 
      "-created_date", 
      100
    );
    setDesigns(data);
    setIsLoading(false);
  };

  const filteredDesigns = designs
    .filter(design => {
      const matchesSearch = !searchQuery || 
        design.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || design.category === categoryFilter;
      const matchesStyle = !styleFilter || design.design_style === styleFilter;
      return matchesSearch && matchesCategory && matchesStyle;
    })
    .sort((a, b) => {
      if (priceSort === "low") return a.price - b.price;
      if (priceSort === "high") return b.price - a.price;
      if (priceSort === "popular") return (b.total_purchases || 0) - (a.total_purchases || 0);
      return 0;
    });

  const categories = [
    { value: "villa", label: "فلل", icon: Home },
    { value: "apartment", label: "شقق سكنية", icon: Layers },
    { value: "facade", label: "واجهات", icon: Grid3X3 },
    { value: "interior", label: "تصميم داخلي", icon: Bed },
    { value: "landscape", label: "حدائق", icon: Award },
    { value: "commercial", label: "تجاري", icon: ShoppingCart }
  ];

  const styles = [
    { value: "modern", label: "عصري" },
    { value: "classic", label: "كلاسيكي" },
    { value: "islamic", label: "إسلامي" },
    { value: "contemporary", label: "معاصر" },
    { value: "minimalist", label: "بسيط" },
    { value: "luxury", label: "فاخر" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4a574] to-amber-600 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              متجر التصاميم الجاهزة
            </h1>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              مخططات معمارية وتصاميم جاهزة للشراء والتنفيذ الفوري
            </p>

            <div className="max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="ابحث عن تصميم..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-12 h-14 bg-white border-0 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Category Pills */}
        <div className="flex overflow-x-auto gap-3 mb-8 pb-2">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(categoryFilter === cat.value ? "" : cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  categoryFilter === cat.value
                    ? "bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white shadow-lg"
                    : "bg-white border hover:border-[#d4a574]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Select value={styleFilter} onValueChange={setStyleFilter}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="النمط المعماري" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>جميع الأنماط</SelectItem>
                {styles.map(style => (
                  <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceSort} onValueChange={setPriceSort}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="الترتيب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>الأحدث</SelectItem>
                <SelectItem value="low">السعر: الأقل</SelectItem>
                <SelectItem value="high">السعر: الأعلى</SelectItem>
                <SelectItem value="popular">الأكثر مبيعاً</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Link to={createPageUrl("AddDesign")}>
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <Plus className="w-5 h-5 ml-2" />
                أضف تصميم للبيع
              </Button>
            </Link>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-slate-600">
            عرض <span className="font-semibold text-[#1a1a2e]">{filteredDesigns.length}</span> تصميم
          </p>
        </div>

        {/* Designs Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="h-64 bg-slate-200 rounded-t-xl" />
                <CardContent className="p-4">
                  <div className="h-6 w-3/4 bg-slate-200 rounded mb-3" />
                  <div className="h-4 w-1/2 bg-slate-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDesigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDesigns.map((design, index) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={createPageUrl("DesignDetails") + `?id=${design.id}`}>
                  <Card className="group hover-lift cursor-pointer border-0 shadow-lg h-full overflow-hidden">
                    {/* Image */}
                    <div className="relative h-64 overflow-hidden bg-slate-100">
                      <img 
                        src={design.preview_images?.[0] || '/placeholder.jpg'} 
                        alt={design.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {design.is_featured && (
                        <Badge className="absolute top-3 right-3 bg-amber-500 text-white">
                          <Award className="w-3 h-3 ml-1" />
                          مميز
                        </Badge>
                      )}
                      <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                        <Badge className="bg-white/90 text-slate-800">
                          {categories.find(c => c.value === design.category)?.label}
                        </Badge>
                        <Badge className="bg-white/90 text-slate-800">
                          {styles.find(s => s.value === design.design_style)?.label}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <h3 className="text-lg font-bold text-[#1a1a2e] mb-2 line-clamp-1">
                        {design.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-3 text-sm text-slate-600">
                        {design.area_sqm && (
                          <span className="flex items-center gap-1">
                            <Ruler className="w-4 h-4" />
                            {design.area_sqm} م²
                          </span>
                        )}
                        {design.bedrooms && (
                          <span className="flex items-center gap-1">
                            <Bed className="w-4 h-4" />
                            {design.bedrooms}
                          </span>
                        )}
                        {design.bathrooms && (
                          <span className="flex items-center gap-1">
                            <Bath className="w-4 h-4" />
                            {design.bathrooms}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            {design.price?.toLocaleString('ar-SA')} ر.س
                          </p>
                          {design.total_purchases > 0 && (
                            <p className="text-xs text-slate-500">
                              <Download className="w-3 h-3 inline ml-1" />
                              {design.total_purchases} مبيعة
                            </p>
                          )}
                        </div>
                        {design.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className="font-semibold">{design.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ShoppingCart className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">لا توجد تصاميم</h3>
            <p className="text-slate-500">لا توجد تصاميم تطابق معايير البحث</p>
          </div>
        )}
      </div>
    </div>
  );
}