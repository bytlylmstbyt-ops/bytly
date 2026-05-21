import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Instagram, Linkedin, Twitter, Heart, MessageCircle,
  Repeat2, TrendingUp, RefreshCw, Loader2, AlertCircle,
  ExternalLink, Calendar, Award, Users
} from "lucide-react";

const PLATFORM_CONFIG = {
  instagram: {
    label: "Instagram",
    icon: Instagram,
    color: "#E1306C",
    bg: "bg-[#E1306C]",
    lightBg: "bg-pink-50",
    border: "border-pink-200",
    profile: "https://www.instagram.com/bytlylmstbyt",
  },
  linkedin: {
    label: "LinkedIn",
    icon: Linkedin,
    color: "#0077B5",
    bg: "bg-[#0077B5]",
    lightBg: "bg-blue-50",
    border: "border-blue-200",
    profile: "https://www.linkedin.com/in/bytly-sa",
  },
  twitter: {
    label: "X / Twitter",
    icon: Twitter,
    color: "#000000",
    bg: "bg-black",
    lightBg: "bg-slate-50",
    border: "border-slate-200",
    profile: "https://x.com/bytlylmstbyt?s=21&t=Hgn--h3Qi8vMU1sgHC0Ntg",
  },
};

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "18" }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value?.toLocaleString() ?? "—"}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function PlatformCard({ data, config }) {
  const Icon = config.icon;
  const isError = !!data?.error;

  if (isError) {
    return (
      <Card className={`border-2 ${config.border}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.bg}`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-sm font-semibold">{config.label}</CardTitle>
            <Badge variant="destructive" className="text-xs mr-auto">غير متصل</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{data.error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 ${config.border}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.bg}`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{config.label}</CardTitle>
              {data.username && <p className="text-xs text-slate-400">@{data.username}</p>}
            </div>
          </div>
          <a href={config.profile} target="_blank" rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> عرض
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className={`rounded-lg p-3 text-center ${config.lightBg}`}>
            <p className="text-xl font-bold" style={{ color: config.color }}>{data.total_likes ?? 0}</p>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
              <Heart className="w-3 h-3" /> إعجابات
            </p>
          </div>
          <div className={`rounded-lg p-3 text-center ${config.lightBg}`}>
            <p className="text-xl font-bold" style={{ color: config.color }}>{data.total_comments ?? 0}</p>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
              <MessageCircle className="w-3 h-3" /> تعليقات
            </p>
          </div>
          {data.total_retweets !== undefined && (
            <div className={`rounded-lg p-3 text-center ${config.lightBg}`}>
              <p className="text-xl font-bold" style={{ color: config.color }}>{data.total_retweets}</p>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                <Repeat2 className="w-3 h-3" /> إعادة نشر
              </p>
            </div>
          )}
          <div className={`rounded-lg p-3 text-center ${config.lightBg}`}>
            <p className="text-xl font-bold" style={{ color: config.color }}>{data.avg_engagement ?? 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">متوسط / منشور</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>{data.posts_count ?? 0} منشور محلّل</span>
          <span className="font-semibold" style={{ color: config.color }}>
            إجمالي التفاعل: {data.total_engagement ?? 0}
          </span>
        </div>

        {/* Top Post */}
        {data.top_post && (
          <div className={`rounded-lg p-3 ${config.lightBg} border ${config.border}`}>
            <p className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Award className="w-3 h-3" /> أفضل منشور
            </p>
            <p className="text-xs text-slate-600 line-clamp-2">
              {data.top_post.caption || data.top_post.text || "—"}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span>❤️ {data.top_post.like_count ?? data.top_post.likes ?? 0}</span>
              <span>💬 {data.top_post.comments_count ?? data.top_post.comments ?? 0}</span>
              {data.top_post.url && (
                <a href={data.top_post.url} target="_blank" rel="noopener noreferrer"
                  className="mr-auto text-slate-400 hover:text-slate-600">
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {data.top_post.permalink && (
                <a href={data.top_post.permalink} target="_blank" rel="noopener noreferrer"
                  className="mr-auto text-slate-400 hover:text-slate-600">
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SocialAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke("socialAnalytics", {});
    if (res.data.success) {
      setData(res.data);
      setLastFetch(new Date());
    } else {
      setError(res.data.error || "فشل تحميل البيانات");
    }
    setLoading(false);
  };

  useEffect(() => { fetchAnalytics(); }, []);

  // Build chart data
  const chartData = data ? Object.entries(data.platforms).map(([key, p]) => ({
    name: PLATFORM_CONFIG[key]?.label || key,
    إعجابات: p.total_likes || 0,
    تعليقات: p.total_comments || 0,
    ...(p.total_retweets !== undefined ? { "إعادة نشر": p.total_retweets } : {}),
  })) : [];

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  const weekLabel = `${weekStart.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })} — ${now.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#C9A66B]" />
              تحليلات التواصل الاجتماعي
            </h1>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              التقرير الأسبوعي: {weekLabel}
            </p>
            {lastFetch && (
              <p className="text-xs text-slate-400 mt-0.5">
                آخر تحديث: {lastFetch.toLocaleTimeString('ar-SA')}
              </p>
            )}
          </div>
          <Button onClick={fetchAnalytics} disabled={loading} variant="outline" className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            تحديث البيانات
          </Button>
        </div>

        {loading && !data && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-[#C9A66B] mx-auto" />
              <p className="text-slate-500">جارٍ سحب بيانات التفاعل من المنصات...</p>
            </div>
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="إجمالي التفاعل" value={data.summary.totalEngagement} icon={TrendingUp} color="#C9A66B" />
              <StatCard label="إجمالي الإعجابات" value={data.summary.totalLikes} icon={Heart} color="#E1306C" />
              <StatCard label="إجمالي التعليقات" value={data.summary.totalComments} icon={MessageCircle} color="#0077B5" />
              <StatCard
                label="المنصات النشطة"
                value={Object.values(data.platforms).filter(p => !p.error).length}
                icon={Users}
                color="#6B5D4F"
                sub="من أصل 3"
              />
            </div>

            {/* Chart */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700">مقارنة التفاعل عبر المنصات</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="إعجابات" fill="#E1306C" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="تعليقات" fill="#0077B5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="إعادة نشر" fill="#6B5D4F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Platform Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(data.platforms).map(([key, pData]) => (
                <PlatformCard key={key} data={pData} config={PLATFORM_CONFIG[key]} />
              ))}
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-slate-400 pb-4">
              البيانات مسحوبة من آخر 10 منشورات على كل منصة • {new Date(data.generated_at).toLocaleString('ar-SA')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}