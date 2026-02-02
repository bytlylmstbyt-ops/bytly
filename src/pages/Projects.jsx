import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Search, Filter, MapPin, Clock, DollarSign, 
  Briefcase, PlusCircle, Calendar, Tag, Eye,
  ChevronLeft, Users
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

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");

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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchQuery || 
      project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || project.category === categoryFilter;
    
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
    { value: "interior", label: "تصميم داخلي" },
    { value: "architecture", label: "تصميم معماري" },
    { value: "painting", label: "رسم هندسي" },
    { value: "landscape", label: "تنسيق حدائق" },
    { value: "furniture", label: "تصميم أثاث" },
    { value: "lighting", label: "تصميم إضاءة" }
  ];

  const statusColors = {
    open: "bg-green-100 text-green-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-slate-100 text-slate-700",
    cancelled: "bg-red-100 text-red-700"
  };

  const statusLabels = {
    open: "مفتوح",
    in_progress: "قيد التنفيذ",
    completed: "مكتمل",
    cancelled: "ملغي"
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
              سوق المشاريع
            </h1>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              تصفح المشاريع المتاحة وقدم عروضك لأصحاب المشاريع
            </p>

            <div className="max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="ابحث عن مشروع..."
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
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex bg-white rounded-xl shadow-sm p-1">
              {[
                { value: "", label: "الكل" },
                { value: "open", label: "مفتوح" },
                { value: "in_progress", label: "قيد التنفيذ" }
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
                <SelectValue placeholder="التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>الكل</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Link to={createPageUrl("CreateProject")}>
            <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white">
              <PlusCircle className="w-5 h-5 ml-2" />
              أضف مشروع جديد
            </Button>
          </Link>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-slate-600">
            عرض <span className="font-semibold text-[#1a1a2e]">{filteredProjects.length}</span> مشروع
          </p>
        </div>

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
                              {project.project_type === "full_construction" ? "مشروع إنشائي" : "خدمة سريعة"}
                            </Badge>
                            <Badge className={statusColors[project.status]}>
                              {statusLabels[project.status]}
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
                          {project.total_proposals || 0} عرض
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
            <h3 className="text-xl font-semibold text-slate-700 mb-2">لا توجد مشاريع</h3>
            <p className="text-slate-500 mb-4">لا توجد مشاريع تطابق معايير البحث</p>
          </div>
        )}
      </div>
    </div>
  );
}