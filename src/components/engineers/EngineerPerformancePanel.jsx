import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Star, TrendingUp, Award } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis, Cell
} from "recharts";

/**
 * لوحة أداء رسومية تعرض إنجازات المهندس وتقييمات العملاء
 * لتعزيز الثقة وجذب أصحاب المشاريع الجدد
 */
export default function EngineerPerformancePanel({ engineer, reviews = [] }) {
  const completedProjects = engineer?.completed_projects || 0;
  const totalReviews = engineer?.total_reviews || reviews.length || 0;
  const rating = engineer?.rating || 0;
  const yearsExperience = engineer?.years_experience || 0;

  // توزيع التقييمات (5★ → 1★)
  const ratingDistribution = useMemo(() => {
    const dist = [5, 4, 3, 2, 1].map(stars => ({
      stars: `${stars}★`,
      count: reviews.filter(r => Math.round(r.rating) === stars).length,
      fill: stars === 5 ? "#10b981" : stars === 4 ? "#84cc16" : stars === 3 ? "#f59e0b" : stars === 2 ? "#f97316" : "#ef4444"
    }));
    return dist;
  }, [reviews]);

  // درجة الأداء الإجمالية (من 100)
  const performanceScore = useMemo(() => {
    if (totalReviews === 0 && completedProjects === 0) return 0;
    const ratingScore = (rating / 5) * 60;
    const projectScore = Math.min(completedProjects / 50, 1) * 25;
    const reviewScore = Math.min(totalReviews / 50, 1) * 15;
    return Math.round(ratingScore + projectScore + reviewScore);
  }, [rating, completedProjects, totalReviews]);

  const radialData = [{ name: "performance", value: performanceScore, fill: "#C9A66B" }];

  const metrics = [
    { icon: Briefcase, label: "مشروع مكتمل", value: completedProjects, color: "from-blue-500 to-cyan-500", bg: "bg-blue-50", text: "text-blue-600" },
    { icon: Star, label: "متوسط التقييم", value: rating.toFixed(1), color: "from-amber-500 to-orange-500", bg: "bg-amber-50", text: "text-amber-600" },
    { icon: Award, label: "عدد التقييمات", value: totalReviews, color: "from-purple-500 to-indigo-500", bg: "bg-purple-50", text: "text-purple-600" },
    { icon: TrendingUp, label: "سنوات الخبرة", value: yearsExperience, color: "from-green-500 to-emerald-500", bg: "bg-green-50", text: "text-green-600" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#6B5D4F] via-[#C9A66B] to-[#C9A66B]" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#C9A66B]" />
            لوحة الأداء والإنجازات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {metrics.map((metric, idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 p-4 text-center hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg ${metric.bg} flex items-center justify-center mx-auto mb-2`}>
                  <metric.icon className={`w-5 h-5 ${metric.text}`} />
                </div>
                <p className="text-2xl font-bold text-[#1a1a2e]">{metric.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{metric.label}</p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Score — Radial */}
            <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-600 mb-2">درجة الأداء الإجمالية</p>
              <div className="w-40 h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold text-[#1a1a2e]">{performanceScore}</span>
                  <span className="text-xs text-slate-400">من 100</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                {performanceScore >= 80 ? "أداء ممتاز 🏆" : performanceScore >= 60 ? "أداء جيد جداً ✓" : performanceScore >= 40 ? "أداء جيد" : "بداية واعدة"}
              </p>
            </div>

            {/* Rating Distribution — Bar Chart */}
            <div className="bg-slate-50/50 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-600 mb-2 text-center">توزيع تقييمات العملاء</p>
              {totalReviews > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={ratingDistribution} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="stars" width={35} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                      {ratingDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[160px] flex items-center justify-center">
                  <p className="text-sm text-slate-400">لا توجد تقييمات بعد</p>
                </div>
              )}
            </div>
          </div>

          {/* Trust Banner */}
          {(completedProjects > 0 || totalReviews > 0) && (
            <div className="mt-6 flex items-center gap-3 bg-gradient-to-l from-[#C9A66B]/10 to-[#C9A66B]/5 border border-[#C9A66B]/20 rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {completedProjects > 0 && `أنجز ${completedProjects} مشروع بنجاح`}
                {completedProjects > 0 && totalReviews > 0 && " • "}
                {totalReviews > 0 && `حصل على ${totalReviews} تقييم من عملاء راضين`}
                {rating >= 4.5 && " • تقييم استثنائي يعكس التزام المهندس بالجودة والاحترافية"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}