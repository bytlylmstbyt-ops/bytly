import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  Search, MapPin, Star, Briefcase, CheckCircle,
  Building2, Filter, Users, ChevronLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SPECIALIZATIONS = [
  { value: "all", label: "كل التخصصات" },
  { value: "structural", label: "إنشائي" },
  { value: "architectural", label: "معماري" },
  { value: "civil", label: "مدني" },
  { value: "mep", label: "ميكانيكا وكهرباء وسباكة" },
  { value: "fire_safety", label: "الحماية من الحريق" },
  { value: "electrical", label: "كهربائي" },
  { value: "plumbing", label: "سباكة" },
  { value: "hvac", label: "تكييف وتهوية" },
];

const SPEC_LABELS = {
  structural: "إنشائي", mep: "ميكانيكا وكهرباء", fire_safety: "حماية من الحريق",
  architectural: "معماري", civil: "مدني", electrical: "كهربائي",
  plumbing: "سباكة", hvac: "تكييف وتهوية",
};

export default function ConsultingFirms() {
  const [firms, setFirms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  useEffect(() => {
    loadFirms();
  }, []);

  const loadFirms = async () => {
    setIsLoading(true);
    const data = await base44.entities.EngineeringFirm.filter({ status: "approved" });
    setFirms(data);
    setIsLoading(false);
  };

  const cities = ["all", ...new Set(firms.map(f => f.city).filter(Boolean))];

  const filteredFirms = firms.filter(firm => {
    const matchSearch = !searchQuery ||
      firm.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      firm.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSpec = selectedSpec === "all" ||
      firm.specializations?.includes(selectedSpec);
    const matchCity = cityFilter === "all" || firm.city === cityFilter;
    return matchSearch && matchSpec && matchCity;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30" dir="rtl">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#4a3f35] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-[#C9A66B]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">الشركات الاستشارية</h1>
            <p className="text-white/70 max-w-xl mx-auto text-lg">
              تصفح أبرز الشركات الهندسية الاستشارية المعتمدة على منصة بيتلي
            </p>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-white/60">
              <span><strong className="text-[#C9A66B] text-xl">{firms.length}+</strong> شركة معتمدة</span>
              <span><strong className="text-[#C9A66B] text-xl">8</strong> تخصصات</span>
              <span><strong className="text-[#C9A66B] text-xl">100%</strong> موثّقة</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-20 z-30 bg-white/90 backdrop-blur border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="ابحث باسم الشركة أو التخصص..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={selectedSpec} onValueChange={setSelectedSpec}>
              <SelectTrigger className="w-full sm:w-52">
                <Filter className="w-4 h-4 ml-2 text-slate-400" />
                <SelectValue placeholder="التخصص" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALIZATIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cities.length > 1 && (
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <MapPin className="w-4 h-4 ml-2 text-slate-400" />
                  <SelectValue placeholder="المدينة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المدن</SelectItem>
                  {cities.filter(c => c !== "all").map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl h-64 shadow" />
            ))}
          </div>
        ) : filteredFirms.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">لا توجد نتائج</h3>
            <p className="text-slate-500">جرّب تعديل معايير البحث</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(""); setSelectedSpec("all"); setCityFilter("all"); }}>
              إعادة تعيين الفلاتر
            </Button>
          </div>
        ) : (
          <>
            <p className="text-slate-500 text-sm mb-6">{filteredFirms.length} شركة</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFirms.map((firm, index) => (
                <motion.div
                  key={firm.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    {/* Cover */}
                    <div className="h-28 bg-gradient-to-r from-[#1a1a2e] to-[#4a3f35] relative overflow-hidden">
                      {firm.cover_image && (
                        <img src={firm.cover_image} alt="" className="w-full h-full object-cover opacity-40" />
                      )}
                      {firm.is_verified && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-green-500 text-white gap-1">
                            <CheckCircle className="w-3 h-3" />
                            موثّقة
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-5 -mt-8 relative">
                      {/* Logo */}
                      <div className="w-16 h-16 rounded-xl border-4 border-white shadow bg-white overflow-hidden mb-3">
                        {firm.company_logo ? (
                          <img src={firm.company_logo} alt={firm.company_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] flex items-center justify-center">
                            <Building2 className="w-7 h-7 text-white" />
                          </div>
                        )}
                      </div>

                      <h3 className="font-bold text-[#1a1a2e] text-lg mb-1 group-hover:text-[#C9A66B] transition-colors">
                        {firm.company_name}
                      </h3>

                      {firm.city && (
                        <div className="flex items-center gap-1 text-slate-500 text-sm mb-2">
                          <MapPin className="w-3.5 h-3.5" />
                          {firm.city}{firm.country ? `، ${firm.country}` : ""}
                        </div>
                      )}

                      {firm.description && (
                        <p className="text-slate-500 text-sm line-clamp-2 mb-3">{firm.description}</p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                        {firm.total_projects > 0 && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-[#C9A66B]" />
                            {firm.total_projects} مشروع
                          </span>
                        )}
                        {firm.client_satisfaction_rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400" />
                            {firm.client_satisfaction_rating.toFixed(1)}
                          </span>
                        )}
                        {firm.team_size > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {firm.team_size} موظف
                          </span>
                        )}
                      </div>

                      {/* Specializations */}
                      {firm.specializations?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {firm.specializations.slice(0, 3).map(s => (
                            <Badge key={s} variant="secondary" className="text-xs bg-amber-50 text-amber-700">
                              {SPEC_LABELS[s] || s}
                            </Badge>
                          ))}
                          {firm.specializations.length > 3 && (
                            <Badge variant="secondary" className="text-xs">+{firm.specializations.length - 3}</Badge>
                          )}
                        </div>
                      )}

                      <Link to={createPageUrl("FirmProfile") + `?id=${firm.id}`}>
                        <Button className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white gap-2">
                          عرض الملف الكامل
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}