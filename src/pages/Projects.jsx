import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Search, Filter, MapPin, Clock, DollarSign, 
  Briefcase, PlusCircle, Calendar, Tag, Eye,
  ChevronLeft, Users, X, SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { AdHorizontalBanner } from "@/components/ads/DemoAdBanner";
import { useAds } from "@/hooks/useAds";

export default function Projects() {
  const { t } = useLanguage();
  const { ads: projectAds } = useAds({ placement: "project_details", tags: ["مدني", "مقاولات", "إنشائي"], maxAds: 1 });
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [projectTypeFilter, setProjectTypeFilter] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [currentEngineer, setCurrentEngineer] = useState(null);

  useEffect(() => {
    loadProjects();
  }, [statusFilter]);

  const loadProjects = async () => {
    setIsLoading(true);
    
    // Get current user and engineer profile
    const user = await base44.auth.me();
    setCurrentUser(user);
    
    const engineerData = await base44.entities.Engineer.filter({ email: user.email });
    if (engineerData && engineerData.length > 0) {
      setCurrentEngineer(engineerData[0]);
    }
    
    const filter = statusFilter ? { status: statusFilter } : {};
    const data = await base44.entities.Project.filter(filter, "-created_date", 50);
    setProjects(data);
    setIsLoading(false);
  };

  const activeFiltersCount = [locationFilter, dateFrom, dateTo, projectTypeFilter, categoryFilter].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setDateFrom("");
    setDateTo("");
    setProjectTypeFilter("");
    setCategoryFilter("");
    setStatusFilter("open");
  };

  const filteredProjects = projects.filter(project => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      project.title?.toLowerCase().includes(q) ||
      project.description?.toLowerCase().includes(q) ||
      project.location?.toLowerCase().includes(q);
    const matchesCategory = !categoryFilter || project.category === categoryFilter;
    const matchesLocation = !locationFilter || project.location?.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = !projectTypeFilter || project.project_type === projectTypeFilter;
    const matchesDateFrom = !dateFrom || new Date(project.created_date) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(project.created_date) <= new Date(dateTo + "T23:59:59");
    
    if (!matchesLocation || !matchesType || !matchesDateFrom || !matchesDateTo) return false;

    // Smart filtering based on engineer specialization
    if (currentEngineer) {
      const engineerType = currentEngineer.user_type;
      const specialization = currentEngineer.specialization?.toLowerCase() || "";
      
      // Filter projects based on engineer type
      const relevantCategories = {
        'architect': ['architecture'],
        'engineer': ['interior', 'furniture', 'lighting'],
        'painter': ['painting'],
        'civil': ['civil_engineering']
      };
      
      const allowedCategories = relevantCategories[engineerType] || [];
      const matchesSpecialization = allowedCategories.length === 0 || allowedCategories.includes(project.category);
      
      return matchesSearch && matchesCategory && matchesSpecialization;
    }
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: "interior", label: t('projects.categories.interior') },
    { value: "architecture", label: t('projects.categories.architecture') },
    { value: "painting", label: t('projects.categories.painting') },
    { value: "landscape", label: t('projects.categories.landscape') },
    { value: "furniture", label: t('projects.categories.furniture') },
    { value: "lighting", label: t('projects.categories.lighting') }
  ];

  const statusColors = {
    open: "bg-green-100 text-green-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-slate-100 text-slate-700",
    cancelled: "bg-red-100 text-red-700"
  };

  const statusLabels = {
    open: t('projects.status.open'),
    inProgress: t('projects.status.inProgress'),
    completed: t('projects.status.completed'),
    cancelled: t('projects.status.cancelled')
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
              {t('projects.title')}
            </h1>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              {t('projects.subtitle')}
            </p>

            <div className="max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="ابحث في العنوان، الوصف، أو الموقع..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pr-12 h-14 bg-white border-0 rounded-xl text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`px-4 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
                      showAdvanced || activeFiltersCount > 0
                        ? "bg-[#d4a574] text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden sm:inline">فلاتر متقدمة</span>
                    {activeFiltersCount > 0 && (
                      <span className="bg-white text-[#d4a574] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 bg-white rounded-2xl p-4 shadow-lg border border-slate-100"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">الموقع</label>
                      <div className="relative">
                        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="مثال: الرياض، جدة..."
                          value={locationFilter}
                          onChange={(e) => setLocationFilter(e.target.value)}
                          className="pr-9 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">نوع المشروع</label>
                      <Select value={projectTypeFilter} onValueChange={setProjectTypeFilter}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="جميع الأنواع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>جميع الأنواع</SelectItem>
                          <SelectItem value="full_construction">بناء كامل</SelectItem>
                          <SelectItem value="express_service">خدمة سريعة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">من تاريخ</label>
                      <div className="relative">
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="pr-9 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">إلى تاريخ</label>
                      <div className="relative">
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="pr-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="mt-3 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      مسح جميع الفلاتر
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex bg-white rounded-xl shadow-sm p-1">
              {[
                { value: "", label: t('projects.filters.all') },
                { value: "open", label: t('projects.filters.open') },
                { value: "in_progress", label: t('projects.filters.inProgress') }
              ].map(status => (
                <button
                  key={status.value}
                  onClick={() => setStatusFilter(status.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === status.value
                      ? "bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder={t('projects.filters.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>{t('projects.filters.allCategories')}</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Link to={createPageUrl("CreateProject")}>
            <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white">
              <PlusCircle className="w-5 h-5 ml-2" />
              {t('projects.addProject')}
            </Button>
          </Link>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-slate-600">
            {t('projects.results').replace('{count}', filteredProjects.length)}
          </p>
        </div>

        {/* Contextual Ad Banner - between filters and project list */}
        <AdHorizontalBanner ads={projectAds} />

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 w-3/4 bg-slate-200 rounded mb-4" />
                  <div className="h-20 bg-slate-200 rounded mb-4" />
                  <div className="flex gap-2">
                    <div className="h-8 w-24 bg-slate-200 rounded" />
                    <div className="h-8 w-24 bg-slate-200 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={createPageUrl("ProjectDetails") + `?id=${project.id}`}>
                  <Card className="hover-lift cursor-pointer border-0 shadow-lg h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={project.project_type === "full_construction" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}>
                              {project.project_type === "full_construction" ? t('projects.types.fullConstruction') : t('projects.types.expressService')}
                            </Badge>
                            <Badge className={statusColors[project.status]}>
                              {statusLabels[project.status] || statusLabels.open}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-bold text-[#1a1a2e] mb-1">
                            {project.title}
                          </h3>
                        </div>
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                          <Tag className="w-3 h-3 ml-1" />
                          {categories.find(c => c.value === project.category)?.label || project.category}
                        </Badge>
                      </div>

                      <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                        {project.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
                        {project.budget_min && project.budget_max && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {project.budget_min.toLocaleString()} - {project.budget_max.toLocaleString()} ر.س
                          </span>
                        )}
                        {project.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {project.location}
                          </span>
                        )}
                        {project.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(project.deadline).toLocaleDateString("ar")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-sm text-slate-500">
                          <Users className="w-4 h-4 inline ml-1" />
                          {project.total_proposals || 0} {t('projects.proposals')}
                        </span>
                        <span className="text-sm text-slate-500">
                          <Clock className="w-4 h-4 inline ml-1" />
                          {new Date(project.created_date).toLocaleDateString("ar")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Briefcase className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">{t('projects.noProjects')}</h3>
            <p className="text-slate-500 mb-4">{t('projects.noResults')}</p>
          </div>
        )}
      </div>
    </div>
  );
}