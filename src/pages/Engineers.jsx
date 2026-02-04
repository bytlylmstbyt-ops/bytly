import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Filter, MapPin, Star, CheckCircle, 
  Users, Grid3X3, List, ChevronDown, X,
  Building2, Palette, PenTool, SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export default function Engineers() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialSearch = urlParams.get("search") || "";
  const initialCategory = urlParams.get("category") || "";

  const [engineers, setEngineers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [filters, setFilters] = useState({
    userType: initialCategory ? "all" : "all",
    specialization: initialCategory || "",
    city: "",
    minRating: 0,
    verified: false
  });
  const [sortBy, setSortBy] = useState("-rating");

  useEffect(() => {
    loadEngineers();
  }, [sortBy]);

  const loadEngineers = async () => {
    setIsLoading(true);
    const data = await base44.entities.Engineer.filter(
      { status: "approved" },
      sortBy,
      50
    );
    setEngineers(data);
    setIsLoading(false);
  };

  const filteredEngineers = engineers.filter(eng => {
    const matchesSearch = !searchQuery || 
      eng.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eng.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eng.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filters.userType === "all" || eng.user_type === filters.userType;
    const matchesSpec = !filters.specialization || eng.specialization === filters.specialization;
    const matchesCity = !filters.city || eng.city?.toLowerCase().includes(filters.city.toLowerCase());
    const matchesRating = eng.rating >= filters.minRating;
    const matchesVerified = !filters.verified || eng.is_verified;

    return matchesSearch && matchesType && matchesSpec && matchesCity && matchesRating && matchesVerified;
  });

  const specializations = [
    "تصميم داخلي", "تصميم معماري", "تصميم ديكور", "تصميم إضاءة", 
    "تصميم أثاث", "تصميم حدائق", "رسم معماري", "رسم داخلي", 
    "رسم هندسي 3D", "رسم مخططات", "رسم تنفيذي", "مهندس مدني - رسومات تنفيذية"
  ];

  const userTypes = [
    { value: "all", label: "الكل", icon: Users },
    { value: "engineer", label: "مهندسين", icon: Building2 },
    { value: "architect", label: "معماريين", icon: Palette },
    { value: "civil", label: "مهندس مدني", icon: Building2 },
    { value: "painter", label: "رسامين", icon: PenTool }
  ];

  const clearFilters = () => {
    setFilters({
      userType: "all",
      specialization: "",
      city: "",
      minRating: 0,
      verified: false
    });
    setSearchQuery("");
  };

  const activeFiltersCount = [
    filters.userType !== "all",
    filters.specialization,
    filters.city,
    filters.minRating > 0,
    filters.verified
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#1a1a2e]/90 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('engineers.title')}
            </h1>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              {t('engineers.subtitle')}
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder={t('engineers.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-12 h-14 bg-white border-0 rounded-xl text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            {/* User Type Tabs */}
            <div className="flex bg-white rounded-xl shadow-sm p-1">
              {userTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setFilters(prev => ({ ...prev, userType: type.value }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filters.userType === type.value
                      ? "bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <type.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{type.label}</span>
                </button>
              ))}
            </div>

            {/* Specialization Filter */}
            <Select
              value={filters.specialization}
              onValueChange={(value) => setFilters(prev => ({ ...prev, specialization: value }))}
            >
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="التخصص" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>الكل</SelectItem>
                {specializations.map(spec => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Mobile Filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden relative">
                  <SlidersHorizontal className="w-4 h-4 ml-2" />
                  فلاتر
                  {activeFiltersCount > 0 && (
                    <Badge className="absolute -top-2 -left-2 w-5 h-5 p-0 flex items-center justify-center bg-[#d4a574]">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>فلترة النتائج</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <Label>المدينة</Label>
                    <Input
                      placeholder="أدخل المدينة"
                      value={filters.city}
                      onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>الحد الأدنى للتقييم: {filters.minRating}</Label>
                    <Slider
                      value={[filters.minRating]}
                      onValueChange={([value]) => setFilters(prev => ({ ...prev, minRating: value }))}
                      max={5}
                      step={0.5}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="verified"
                      checked={filters.verified}
                      onCheckedChange={(checked) => setFilters(prev => ({ ...prev, verified: checked }))}
                    />
                    <Label htmlFor="verified">المهندسين الموثقين فقط</Label>
                  </div>

                  <Button onClick={clearFilters} variant="outline" className="w-full">
                    إعادة تعيين الفلاتر
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button variant="ghost" onClick={clearFilters} className="text-slate-500 hidden md:flex">
                <X className="w-4 h-4 ml-1" />
                مسح الفلاتر ({activeFiltersCount})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-rating">الأعلى تقييماً</SelectItem>
                <SelectItem value="-completed_projects">الأكثر مشاريع</SelectItem>
                <SelectItem value="-years_experience">الأكثر خبرة</SelectItem>
                <SelectItem value="-created_date">الأحدث</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="hidden md:flex bg-white rounded-lg shadow-sm p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${viewMode === "grid" ? "bg-slate-100" : ""}`}
              >
                <Grid3X3 className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${viewMode === "list" ? "bg-slate-100" : ""}`}
              >
                <List className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-slate-600">
            {t('engineers.results').replace('{count}', filteredEngineers.length)}
          </p>
        </div>

        {/* Engineers Grid/List */}
        {isLoading ? (
          <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-slate-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-3/4 bg-slate-200 rounded" />
                      <div className="h-3 w-1/2 bg-slate-200 rounded" />
                    </div>
                  </div>
                  <div className="h-16 bg-slate-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEngineers.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
            >
              {filteredEngineers.map((engineer, index) => (
                <motion.div
                  key={engineer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={createPageUrl("EngineerProfile") + `?id=${engineer.id}`}>
                    <Card className={`hover-lift cursor-pointer overflow-hidden border-0 shadow-lg ${
                      viewMode === "list" ? "flex" : ""
                    }`}>
                      {viewMode === "grid" ? (
                        <>
                          <div className="relative h-32 bg-gradient-to-br from-[#1a1a2e] to-[#d4a574]">
                            {engineer.cover_image && (
                              <img src={engineer.cover_image} alt="" className="w-full h-full object-cover opacity-50" />
                            )}
                            {engineer.subscription_type !== "none" && (
                              <Badge className="absolute top-3 left-3 bg-amber-500 text-white">
                                مميز
                              </Badge>
                            )}
                          </div>
                          <CardContent className="relative p-6 pt-0">
                            <Avatar className="w-20 h-20 border-4 border-white -mt-10 shadow-lg">
                              <AvatarImage src={engineer.profile_image} />
                              <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] text-white text-xl">
                                {engineer.full_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="mt-4">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg text-[#1a1a2e]">{engineer.full_name}</h3>
                                {engineer.is_verified && (
                                  <CheckCircle className="w-5 h-5 text-blue-500" />
                                )}
                              </div>
                              <p className="text-sm text-slate-600 mb-2">{engineer.specialization}</p>
                              
                              <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                                <MapPin className="w-4 h-4" />
                                <span>{engineer.city}, {engineer.country}</span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                  <span className="font-semibold">{engineer.rating?.toFixed(1) || "0.0"}</span>
                                  <span className="text-slate-400 text-sm">({engineer.total_reviews || 0})</span>
                                </div>
                                <Badge variant="secondary" className="bg-slate-100">
                                  {engineer.completed_projects || 0} مشروع
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </>
                      ) : (
                        <CardContent className="flex items-center gap-6 p-6 w-full">
                          <Avatar className="w-20 h-20 border-2 border-slate-200">
                            <AvatarImage src={engineer.profile_image} />
                            <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] text-white text-xl">
                              {engineer.full_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-[#1a1a2e]">{engineer.full_name}</h3>
                              {engineer.is_verified && (
                                <CheckCircle className="w-5 h-5 text-blue-500" />
                              )}
                              {engineer.subscription_type !== "none" && (
                                <Badge className="bg-amber-500 text-white">مميز</Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{engineer.specialization}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {engineer.city}, {engineer.country}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                {engineer.rating?.toFixed(1) || "0.0"} ({engineer.total_reviews || 0})
                              </span>
                            </div>
                          </div>

                          <div className="text-left">
                            <Badge variant="secondary" className="bg-slate-100 mb-2">
                              {engineer.completed_projects || 0} مشروع
                            </Badge>
                            <p className="text-sm text-slate-500">{engineer.years_experience || 0} سنة خبرة</p>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="text-center py-16">
            <Users className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">{t('engineers.noResults')}</h3>
            <p className="text-slate-500 mb-4">{t('engineers.noResults')}</p>
            <Button onClick={clearFilters} variant="outline">
              {t('engineers.noResults')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}