import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BarChart3, Users, Eye, MousePointerClick, RefreshCw, TrendingUp } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";

const PIE_COLORS = ["#C9A66B", "#1877F2", "#E1306C", "#0077B5", "#6B5D4F", "#A78BFA", "#34D399"];

export default function GoogleAnalyticsPanel() {
  const { isRTL } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);

  const fetchData = async (d = days) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("fetchMarketingAnalytics", { days: d });
      if (res.data?.success) setData(res.data);
    } catch (e) {
      console.error("GA fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(30); }, []);

  const summaryCards = data ? [
    { icon: Users, label: isRTL ? "إجمالي المستخدمين" : "Total Users", value: data.summary.totalUsers.toLocaleString(), color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Eye, label: isRTL ? "إجمالي الجلسات" : "Total Sessions", value: data.summary.totalSessions.toLocaleString(), color: "text-[#C9A66B]", bg: "bg-[#FEF9EE]" },
    { icon: TrendingUp, label: isRTL ? "مشاهدات الصفحات" : "Page Views", value: data.summary.totalPageViews.toLocaleString(), color: "text-purple-600", bg: "bg-purple-50" },
    { icon: MousePointerClick, label: isRTL ? "متوسط الجلسات/يوم" : "Avg Sessions/Day", value: data.summary.avgSessionsPerDay.toLocaleString(), color: "text-green-600", bg: "bg-green-50" },
  ] : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#C9A66B]" />
          {isRTL ? "تحليلات Google Analytics" : "Google Analytics Insights"}
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => { setDays(Number(e.target.value)); fetchData(Number(e.target.value)); }}
            className="h-9 text-xs border border-slate-200 rounded-md px-2 bg-white"
          >
            <option value={7}>{isRTL ? "آخر 7 أيام" : "Last 7 days"}</option>
            <option value={30}>{isRTL ? "آخر 30 يوم" : "Last 30 days"}</option>
            <option value={90}>{isRTL ? "آخر 90 يوم" : "Last 90 days"}</option>
          </select>
          <Button size="sm" variant="outline" onClick={() => fetchData()} disabled={loading} className="h-9">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : !data ? (
        <Card className="border-slate-200"><CardContent className="text-center py-16 text-slate-400">
          <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{isRTL ? "تعذّر تحميل بيانات Google Analytics" : "Failed to load Google Analytics data"}</p>
        </CardContent></Card>
      ) : (
        <>
          {data.property_name && (
            <p className="text-xs text-slate-500">{isRTL ? "الخاصية" : "Property"}: {data.property_name}</p>
          )}

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

          {/* Sessions trend (area chart) */}
          {data.trend && data.trend.length > 0 && (
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-[#4A3F35] mb-3">{isRTL ? "اتجاه الجلسات" : "Sessions Trend"}</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.trend} margin={{ top: 5, right: 10, left: isRTL ? 10 : 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C9A66B" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#C9A66B" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1877F2" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#1877F2" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748B" }} tickFormatter={(v) => v.substring(5)} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748B" }} orientation={isRTL ? "right" : "left"} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} />
                    <Legend formatter={(v) => v === "sessions" ? (isRTL ? "جلسات" : "Sessions") : v === "activeUsers" ? (isRTL ? "مستخدمون نشطون" : "Active Users") : (isRTL ? "مستخدمون جدد" : "New Users")} />
                    <Area type="monotone" dataKey="sessions" stroke="#C9A66B" fillOpacity={1} fill="url(#colorSessions)" />
                    <Area type="monotone" dataKey="activeUsers" stroke="#1877F2" fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Traffic sources bar chart */}
            {data.sources && data.sources.length > 0 && (
              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold text-[#4A3F35] mb-3">{isRTL ? "مصادر الزيارات" : "Traffic Sources"}</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.sources.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 10, left: isRTL ? 10 : 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#64748B" }} />
                      <YAxis type="category" dataKey="source" tick={{ fontSize: 10, fill: "#4A3F35" }} width={80} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} formatter={(v) => v.toLocaleString()} />
                      <Legend formatter={(v) => v === "sessions" ? (isRTL ? "جلسات" : "Sessions") : (isRTL ? "مستخدمون" : "Users")} />
                      <Bar dataKey="sessions" stackId="a" fill="#C9A66B" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="users" stackId="a" fill="#1877F2" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Top landing pages */}
            {data.topPages && data.topPages.length > 0 && (
              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold text-[#4A3F35] mb-3">{isRTL ? "أهم الصفحات المقصودة" : "Top Landing Pages"}</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.topPages} layout="vertical" margin={{ top: 5, right: 10, left: isRTL ? 10 : 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#64748B" }} />
                      <YAxis type="category" dataKey="page" tick={{ fontSize: 9, fill: "#4A3F35" }} width={100} tickFormatter={(v) => v.length > 15 ? v.substring(0, 15) + "…" : v} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} formatter={(v) => v.toLocaleString()} />
                      <Legend formatter={(v) => v === "sessions" ? (isRTL ? "جلسات" : "Sessions") : (isRTL ? "مشاهدات" : "Views")} />
                      <Bar dataKey="sessions" stackId="a" fill="#A78BFA" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="pageViews" stackId="a" fill="#34D399" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Source/medium table */}
          {data.sources && data.sources.length > 0 && (
            <Card className="border-slate-200">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr className={`text-xs text-slate-500 ${isRTL ? "text-right" : "text-left"}`}>
                        <th className="p-3 font-medium">{isRTL ? "المصدر" : "Source"}</th>
                        <th className="p-3 font-medium">{isRTL ? "الوسيط" : "Medium"}</th>
                        <th className="p-3 font-medium">{isRTL ? "الجلسات" : "Sessions"}</th>
                        <th className="p-3 font-medium">{isRTL ? "المستخدمون" : "Users"}</th>
                        <th className="p-3 font-medium hidden sm:table-cell">{isRTL ? "المشاهدات" : "Views"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sources.map((s, idx) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="p-3"><Badge variant="outline" className="text-xs">{s.source || "—"}</Badge></td>
                          <td className="p-3 text-slate-600 text-xs">{s.medium || "—"}</td>
                          <td className="p-3 font-medium text-slate-700">{s.sessions.toLocaleString()}</td>
                          <td className="p-3 text-slate-600">{s.users.toLocaleString()}</td>
                          <td className="p-3 text-slate-600 hidden sm:table-cell">{s.pageViews.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}