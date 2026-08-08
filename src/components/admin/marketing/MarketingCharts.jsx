import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/components/i18n/LanguageContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { MousePointerClick, Eye, TrendingUp, Share2, MessageCircle, Heart } from "lucide-react";

const PLATFORM_COLORS = {
  linkedin: "#0077B5",
  twitter: "#000000",
  facebook: "#1877F2",
  instagram: "#E1306C",
  tiktok: "#000000",
  other: "#6B5D4F",
};

const PLATFORM_LABELS = {
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  other: "أخرى",
};

export default function MarketingCharts({ posts }) {
  const { isRTL } = useLanguage();

  // Only include published posts with metrics
  const postsWithMetrics = useMemo(() => {
    return (posts || [])
      .filter(p => p.status === "published" && p.metrics)
      .map(p => ({
        id: p.id,
        platform: p.platform,
        platformLabel: PLATFORM_LABELS[p.platform] || p.platform,
        content: (p.content || "").substring(0, 30) + (p.content?.length > 30 ? "…" : ""),
        reach: p.metrics?.reach || 0,
        clicks: p.metrics?.clicks || 0,
        likes: p.metrics?.likes || 0,
        comments: p.metrics?.comments || 0,
        shares: p.metrics?.shares || 0,
        impressions: p.metrics?.impressions || 0,
        engagement_rate: p.metrics?.engagement_rate || 0,
      }));
  }, [posts]);

  // Aggregate metrics per platform
  const platformData = useMemo(() => {
    const map = {};
    postsWithMetrics.forEach(p => {
      if (!map[p.platform]) {
        map[p.platform] = { platform: p.platformLabel, reach: 0, clicks: 0, likes: 0, comments: 0, shares: 0, impressions: 0, count: 0 };
      }
      const m = map[p.platform];
      m.reach += p.reach;
      m.clicks += p.clicks;
      m.likes += p.likes;
      m.comments += p.comments;
      m.shares += p.shares;
      m.impressions += p.impressions;
      m.count += 1;
    });
    return Object.values(map);
  }, [postsWithMetrics]);

  // Per-post data for bar chart (top 10 by reach)
  const perPostData = useMemo(() => {
    return [...postsWithMetrics]
      .sort((a, b) => b.reach - a.reach)
      .slice(0, 10)
      .map(p => ({
        name: p.content,
        reach: p.reach,
        clicks: p.clicks,
        platform: p.platformLabel,
      }));
  }, [postsWithMetrics]);

  // Pie chart data: engagement breakdown
  const engagementPieData = useMemo(() => {
    const totals = platformData.reduce((acc, p) => {
      acc.likes += p.likes;
      acc.comments += p.comments;
      acc.shares += p.shares;
      return acc;
    }, { likes: 0, comments: 0, shares: 0 });
    return [
      { name: isRTL ? "إعجابات" : "Likes", value: totals.likes, color: "#E1306C" },
      { name: isRTL ? "تعليقات" : "Comments", value: totals.comments, color: "#1877F2" },
      { name: isRTL ? "مشاركات" : "Shares", value: totals.shares, color: "#C9A66B" },
    ].filter(d => d.value > 0);
  }, [platformData, isRTL]);

  if (postsWithMetrics.length === 0) {
    return null;
  }

  const totalReach = platformData.reduce((s, p) => s + p.reach, 0);
  const totalClicks = platformData.reduce((s, p) => s + p.clicks, 0);
  const totalImpressions = platformData.reduce((s, p) => s + p.impressions, 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0";

  const summaryCards = [
    { icon: Eye, label: isRTL ? "إجمالي الوصول" : "Total Reach", value: totalReach.toLocaleString(), color: "text-blue-600", bg: "bg-blue-50" },
    { icon: MousePointerClick, label: isRTL ? "إجمالي النقرات" : "Total Clicks", value: totalClicks.toLocaleString(), color: "text-[#C9A66B]", bg: "bg-[#FEF9EE]" },
    { icon: TrendingUp, label: isRTL ? "معدل النقر CTR" : "Click Rate", value: `${avgCTR}%`, color: "text-green-600", bg: "bg-green-50" },
    { icon: Eye, label: isRTL ? "الظهور" : "Impressions", value: totalImpressions.toLocaleString(), color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-4">
      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="border-[#C9A66B]/20">
              <CardContent className="flex items-center gap-2 p-3">
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${card.bg} shrink-0`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#4A3F35] text-xl truncate">{card.value}</p>
                  <p className="text-xs text-slate-500 truncate">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bar chart: Reach & Clicks per post */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-[#4A3F35] mb-3 flex items-center gap-1.5">
            <BarChart className="w-4 h-4 text-[#C9A66B]" />
            {isRTL ? "الوصول والنقرات لكل منشور" : "Reach & Clicks per Post"}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={perPostData} margin={{ top: 5, right: 10, left: isRTL ? 10 : 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} angle={-15} textAnchor="end" height={60} interval={0} />
              <YAxis tick={{ fontSize: 10, fill: "#64748B" }} orientation={isRTL ? "right" : "left"} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}
                formatter={(value, name) => [value.toLocaleString(), name === "reach" ? (isRTL ? "وصول" : "Reach") : (isRTL ? "نقرات" : "Clicks")]}
              />
              <Legend formatter={(value) => value === "reach" ? (isRTL ? "وصول" : "Reach") : (isRTL ? "نقرات" : "Clicks")} />
              <Bar dataKey="reach" fill="#1877F2" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clicks" fill="#C9A66B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Platform comparison */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-[#4A3F35] mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#C9A66B]" />
              {isRTL ? "مقارنة المنصات" : "Platform Comparison"}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={platformData} layout="vertical" margin={{ top: 5, right: 10, left: isRTL ? 10 : 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748B" }} />
                <YAxis type="category" dataKey="platform" tick={{ fontSize: 11, fill: "#4A3F35" }} width={70} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} formatter={(v) => v.toLocaleString()} />
                <Legend formatter={(value) => {
                  const labels = { reach: isRTL ? "وصول" : "Reach", clicks: isRTL ? "نقرات" : "Clicks", impressions: isRTL ? "ظهور" : "Impressions" };
                  return labels[value] || value;
                }} />
                <Bar dataKey="reach" stackId="a" fill="#1877F2" />
                <Bar dataKey="clicks" stackId="a" fill="#C9A66B" />
                <Bar dataKey="impressions" stackId="a" fill="#A78BFA" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement breakdown pie */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-[#4A3F35] mb-3 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-[#C9A66B]" />
              {isRTL ? "توزيع التفاعل" : "Engagement Breakdown"}
            </h3>
            {engagementPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={engagementPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {engagementPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} formatter={(v) => v.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[280px] text-slate-400">
                <Heart className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">{isRTL ? "لا توجد بيانات تفاعل" : "No engagement data"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Area chart: impressions vs clicks per platform */}
      {platformData.length > 1 && (
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-[#4A3F35] mb-3 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-[#C9A66B]" />
              {isRTL ? "الظهور مقابل النقرات حسب المنصة" : "Impressions vs Clicks by Platform"}
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={platformData} margin={{ top: 5, right: 10, left: isRTL ? 10 : 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A66B" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#C9A66B" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="platform" tick={{ fontSize: 11, fill: "#4A3F35" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} orientation={isRTL ? "right" : "left"} />
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} formatter={(v) => v.toLocaleString()} />
                <Legend formatter={(value) => value === "impressions" ? (isRTL ? "ظهور" : "Impressions") : (isRTL ? "نقرات" : "Clicks")} />
                <Area type="monotone" dataKey="impressions" stroke="#A78BFA" fillOpacity={1} fill="url(#colorImpressions)" />
                <Area type="monotone" dataKey="clicks" stroke="#C9A66B" fillOpacity={1} fill="url(#colorClicks)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}