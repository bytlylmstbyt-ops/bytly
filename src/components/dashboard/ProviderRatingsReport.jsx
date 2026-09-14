import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Star, User, Building2, Package, TrendingUp, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { key: "engineer", label: "المهندسون", entity: "Engineer", icon: User, nameField: "full_name", link: "/Engineers", color: "blue" },
  { key: "contractor", label: "المقاولون", entity: "Contractor", icon: Building2, nameField: "company_name", link: "/ContractorDashboard", color: "amber" },
  { key: "supplier", label: "الموردون", entity: "Supplier", icon: Package, nameField: "company_name", link: "/SupplierDashboard", color: "emerald" },
];

const COLOR_MAP = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100", bar: "bg-blue-400" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100", bar: "bg-amber-400" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100", bar: "bg-emerald-400" },
};

export default function ProviderRatingsReport() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const results = {};
        for (const cat of CATEGORIES) {
          const list = await base44.entities[cat.entity].list("-rating", 5);
          const all = await base44.entities[cat.entity].list("-rating", 200);
          const rated = all.filter(p => (p.total_reviews || 0) > 0);
          const avg = rated.length > 0
            ? rated.reduce((s, p) => s + (p.rating || 0), 0) / rated.length
            : 0;
          results[cat.key] = { top: list.slice(0, 5), avg: parseFloat(avg.toFixed(1)), total: all.length, reviewed: rated.length };
        }
        setData(results);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Card className="border-0 shadow-lg mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#C9A66B]" />
            <h2 className="font-bold text-[#1a1a2e]">تقرير تقييمات مقدمي الخدمات</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-0 shadow-lg mb-8">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-white">
          <CardTitle className="flex items-center gap-2 text-[#1a1a2e]">
            <TrendingUp className="w-5 h-5 text-[#C9A66B]" />
            تقرير تقييمات مقدمي الخدمات
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4">
            {CATEGORIES.map(cat => {
              const info = data[cat.key] || { top: [], avg: 0, total: 0, reviewed: 0 };
              const colors = COLOR_MAP[cat.color];
              const Icon = cat.icon;

              return (
                <div key={cat.key} className={`rounded-xl border border-slate-100 p-4 ${colors.ring} ring-1`}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${colors.text}`} />
                      </div>
                      <span className="font-bold text-sm text-[#1a1a2e]">{cat.label}</span>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-sm text-[#1a1a2e]">{info.avg}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">متوسط التقييم</p>
                    </div>
                  </div>

                  {/* Stats line */}
                  <div className="flex items-center gap-3 mb-3 text-[11px] text-slate-400">
                    <span>{info.total} مسجل</span>
                    <span>•</span>
                    <span>{info.reviewed} بتقييم</span>
                  </div>

                  {/* Top providers */}
                  <div className="space-y-2">
                    {info.top.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">لا يوجد {cat.label} متاحون</p>
                    ) : (
                      info.top.map((provider, idx) => {
                        const name = provider[cat.nameField] || "غير محدد";
                        const rating = provider.rating || 0;
                        const reviews = provider.total_reviews || 0;
                        return (
                          <div key={provider.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <span className={`text-xs font-bold w-5 h-5 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}>
                              {idx + 1}
                            </span>
                            <Avatar className="w-7 h-7 shrink-0">
                              <AvatarImage src={provider.profile_image || provider.company_logo} />
                              <AvatarFallback className={`text-[10px] ${colors.bg} ${colors.text}`}>
                                {name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700 truncate">{name}</p>
                              <div className="flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                <span className="text-[10px] text-slate-500">{rating.toFixed(1)} ({reviews})</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-slate-400">اعرض التقييمات الكاملة واكتب تقييمك من صفحة تقييم الخدمات</p>
            <Link to="/ServiceReviews">
              <Badge className="bg-amber-50 text-amber-700 cursor-pointer hover:bg-amber-100 transition-colors">
                عرض الكل
                <ChevronLeft className="w-3 h-3 mr-1" />
              </Badge>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}