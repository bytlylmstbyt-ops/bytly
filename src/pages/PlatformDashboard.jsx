import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import ProjectProfitPanel from "@/components/dashboard/ProjectProfitPanel";
import DailyActiveUsersPanel from "@/components/dashboard/DailyActiveUsersPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, Users, Briefcase, DollarSign,
  Activity, Star, AlertCircle, CheckCircle, Clock, RefreshCw,
  BarChart2, Target, Layers, ArrowUpRight, ArrowDownRight, Cpu, ShieldCheck, Wrench, Scale
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import moment from "moment";

const formatSAR = (n) => new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n || 0);
const fmt = (n, suffix = "") => `${(n || 0).toLocaleString("ar-SA")}${suffix ? " " + suffix : ""}`;

function KpiCard({ title, value, sub, icon: Icon, trend, trendVal, color = "border-[#C9A66B]", loading }) {
  const up = trend === "up";
  return (
    <Card className={`border-r-4 ${color} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 mb-1 truncate">{title}</p>
            {loading
              ? <div className="h-7 w-24 bg-slate-100 rounded animate-pulse" />
              : <p className="text-2xl font-bold text-[#4A3F35] leading-tight">{value}</p>
            }
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className={`p-2 rounded-lg ${color.replace("border-", "bg-").replace("[#C9A66B]", "[#FEF9EE]").replace("green-400","green-50").replace("blue-400","blue-50").replace("red-400","red-50").replace("purple-400","purple-50")}`}>
              <Icon className="w-5 h-5 text-[#C9A66B]" />
            </div>
            {trendVal !== undefined && (
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${up ? "text-green-600" : "text-red-500"}`}>
                {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trendVal}%
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="w-1 h-5 bg-[#C9A66B] rounded-full" />
      <h2 className="text-base font-bold text-[#4A3F35]">{children}</h2>
    </div>
  );
}

const STATUS_COLORS = {
  open: "#C9A66B",
  in_progress: "#3B82F6",
  completed: "#22C55E",
  cancelled: "#EF4444",
  disputed: "#F59E0B",
  pending_client_approval: "#8B5CF6",
};

export default function PlatformDashboard() {
  const [projects, setProjects] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [revenues, setRevenues] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadData = async () => {
    setLoading(true);
    const [p, e, s, r, rv] = await Promise.all([
      base44.entities.Project.list("-created_date", 500),
      base44.entities.Engineer.list("-created_date", 500),
      base44.entities.Subscription.list("-created_date", 500),
      base44.entities.Review.list("-created_date", 200),
      base44.entities.PlatformRevenue.list("-created_date", 500),
    ]);
    setProjects(p || []);
    setEngineers(e || []);
    setSubscriptions(s || []);
    setReviews(r || []);
    setRevenues(rv || []);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const kpis = useMemo(() => {
    const now = moment();
    const thisMonth = now.month();
    const thisYear = now.year();
    const lastMonth = now.clone().subtract(1, "month");

    // مشاريع
    const activeProjects = projects.filter(p => ["open", "in_progress", "awaiting_technical_review", "technical_approved", "pending_client_approval"].includes(p.status));
    const completedProjects = projects.filter(p => p.status === "completed");
    const thisMonthProjects = projects.filter(p => moment(p.created_date).month() === thisMonth && moment(p.created_date).year() === thisYear);
    const lastMonthProjects = projects.filter(p => moment(p.created_date).month() === lastMonth.month() && moment(p.created_date).year() === lastMonth.year());
    const projectGrowth = lastMonthProjects.length > 0 ? Math.round(((thisMonthProjects.length - lastMonthProjects.length) / lastMonthProjects.length) * 100) : 0;

    // اشتراكات
    const activeSubs = subscriptions.filter(s => s.status === "active");
    const thisMonthSubs = subscriptions.filter(s => moment(s.created_date).month() === thisMonth && moment(s.created_date).year() === thisYear);
    const lastMonthSubs = subscriptions.filter(s => moment(s.created_date).month() === lastMonth.month() && moment(s.created_date).year() === lastMonth.year());
    const subGrowth = lastMonthSubs.length > 0 ? Math.round(((thisMonthSubs.length - lastMonthSubs.length) / lastMonthSubs.length) * 100) : 0;

    // إيرادات
    const totalRevenue = revenues.reduce((s, r) => s + (r.commission_amount || 0), 0);
    const thisMonthRevenue = revenues.filter(r => moment(r.created_date).month() === thisMonth && moment(r.created_date).year() === thisYear).reduce((s, r) => s + (r.commission_amount || 0), 0);
    const lastMonthRevenue = revenues.filter(r => moment(r.created_date).month() === lastMonth.month() && moment(r.created_date).year() === lastMonth.year()).reduce((s, r) => s + (r.commission_amount || 0), 0);
    const revenueGrowth = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

    // تقييمات
    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : "–";

    // مهندسون نشطون (معتمدون)
    const approvedEngineers = engineers.filter(e => e.status === "approved" || e.is_approved);
    const pendingEngineers = engineers.filter(e => e.status === "pending" || (!e.is_approved && !e.status));

    // متوسط تكلفة الاستحواذ: الإجمالي التسويقي / عدد المهندسين (تقديري)
    const estimatedMarketingCost = 10000;
    const cac = approvedEngineers.length > 0 ? Math.round(estimatedMarketingCost / approvedEngineers.length) : 0;

    // توزيع حالات المشاريع
    const statusCounts = {};
    projects.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });

    return {
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      totalProjects: projects.length,
      projectGrowth,
      activeSubs: activeSubs.length,
      subGrowth,
      totalRevenue,
      thisMonthRevenue,
      revenueGrowth,
      avgRating,
      approvedEngineers: approvedEngineers.length,
      pendingEngineers: pendingEngineers.length,
      cac,
      statusCounts,
    };
  }, [projects, engineers, subscriptions, reviews, revenues]);

  // بيانات الرسم البياني للإيرادات (آخر 6 أشهر)
  const revenueChart = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const m = moment().subtract(i, "months");
      const rev = revenues
        .filter(r => moment(r.created_date).month() === m.month() && moment(r.created_date).year() === m.year())
        .reduce((s, r) => s + (r.commission_amount || 0), 0);
      const proj = projects.filter(p => moment(p.created_date).month() === m.month() && moment(p.created_date).year() === m.year()).length;
      months.push({ name: m.format("MMM"), إيرادات: Math.round(rev), مشاريع: proj });
    }
    return months;
  }, [revenues, projects]);

  // توزيع حالات المشاريع للـ Pie
  const statusPieData = useMemo(() => {
    const labels = {
      open: "مفتوح", in_progress: "جارٍ", completed: "مكتمل",
      cancelled: "ملغي", disputed: "نزاع", pending_client_approval: "انتظار موافقة"
    };
    return Object.entries(kpis.statusCounts || {}).map(([k, v]) => ({
      name: labels[k] || k, value: v, fill: STATUS_COLORS[k] || "#94A3B8"
    }));
  }, [kpis.statusCounts]);

  // آخر المشاريع
  const recentProjects = useMemo(() =>
    [...projects].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5),
    [projects]
  );

  const statusLabel = { open: "مفتوح", in_progress: "جارٍ", completed: "مكتمل", cancelled: "ملغي", disputed: "نزاع", pending_client_approval: "موافقة العميل", awaiting_technical_review: "مراجعة فنية" };
  const statusColor = { open: "bg-amber-100 text-amber-700", in_progress: "bg-blue-100 text-blue-700", completed: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700", disputed: "bg-orange-100 text-orange-700", pending_client_approval: "bg-purple-100 text-purple-700", awaiting_technical_review: "bg-slate-100 text-slate-600" };

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#4A3F35]">لوحة تحكم المديرة</h1>
            <p className="text-sm text-slate-500 mt-0.5">مؤشرات الأداء الحية لمنصة بيتلي</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              آخر تحديث: {moment(lastRefresh).format("HH:mm:ss")}
            </span>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A66B] text-white text-xs rounded-lg hover:bg-[#b8955a] disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </button>
          </div>
        </div>

        {/* KPIs Row 1 – المشاريع والإيرادات */}
        <div>
          <SectionTitle>المشاريع والإيرادات</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <KpiCard title="المشاريع النشطة" value={fmt(kpis.activeProjects)} sub={`من إجمالي ${fmt(kpis.totalProjects)} مشروع`} icon={Briefcase} color="border-blue-400" loading={loading} />
            <KpiCard title="مشاريع مكتملة" value={fmt(kpis.completedProjects)} sub="منذ البداية" icon={CheckCircle} color="border-green-400" loading={loading} />
            <KpiCard title="إيرادات هذا الشهر" value={formatSAR(kpis.thisMonthRevenue)} sub="عمولات المنصة" icon={DollarSign} color="border-[#C9A66B]" trend={kpis.revenueGrowth >= 0 ? "up" : "down"} trendVal={Math.abs(kpis.revenueGrowth)} loading={loading} />
            <KpiCard title="إجمالي الإيرادات" value={formatSAR(kpis.totalRevenue)} sub="منذ التأسيس" icon={BarChart2} color="border-[#C9A66B]" loading={loading} />
          </div>
        </div>

        {/* KPIs Row 2 – المهندسون والاشتراكات */}
        <div>
          <SectionTitle>المهندسون والاشتراكات</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <KpiCard title="مهندسون معتمدون" value={fmt(kpis.approvedEngineers)} sub={`${fmt(kpis.pendingEngineers)} بانتظار الموافقة`} icon={Users} color="border-purple-400" loading={loading} />
            <KpiCard title="اشتراكات نشطة" value={fmt(kpis.activeSubs)} sub="مهندسون مشتركون بباقة" icon={Layers} color="border-blue-400" trend={kpis.subGrowth >= 0 ? "up" : "down"} trendVal={Math.abs(kpis.subGrowth)} loading={loading} />
            <KpiCard title="نمو الاشتراكات الشهري" value={`${kpis.subGrowth >= 0 ? "+" : ""}${kpis.subGrowth}%`} sub="مقارنة بالشهر الماضي" icon={TrendingUp} color={kpis.subGrowth >= 0 ? "border-green-400" : "border-red-400"} loading={loading} />
            <KpiCard title="متوسط CAC" value={formatSAR(kpis.cac)} sub="تكلفة اكتساب مهندس" icon={Target} color="border-amber-400" loading={loading} />
          </div>
        </div>

        {/* KPIs Row 3 – الجودة */}
        <div>
          <SectionTitle>جودة الخدمة</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
            <KpiCard title="متوسط تقييم المهندسين" value={`${kpis.avgRating} / 5`} sub={`من ${fmt(reviews.length)} تقييم`} icon={Star} color="border-amber-400" loading={loading} />
            <KpiCard title="نمو المشاريع الشهري" value={`${kpis.projectGrowth >= 0 ? "+" : ""}${kpis.projectGrowth}%`} sub="مقارنة بالشهر الماضي" icon={Activity} color={kpis.projectGrowth >= 0 ? "border-green-400" : "border-red-400"} loading={loading} />
            <KpiCard title="مشاريع بنزاعات" value={fmt(kpis.statusCounts?.disputed || 0)} sub="تحتاج تدخل" icon={AlertCircle} color="border-red-400" loading={loading} />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-3 gap-5">
          {/* Area Chart – الإيرادات والمشاريع */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#4A3F35]">الإيرادات والمشاريع (آخر 6 أشهر)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading
                ? <div className="h-48 bg-slate-100 rounded animate-pulse" />
                : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={revenueChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C9A66B" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#C9A66B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v, n) => [n === "إيرادات" ? formatSAR(v) : v, n]} />
                      <Area type="monotone" dataKey="إيرادات" stroke="#C9A66B" fill="url(#revGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="مشاريع" stroke="#3B82F6" fill="none" strokeWidth={2} strokeDasharray="5 3" />
                    </AreaChart>
                  </ResponsiveContainer>
                )
              }
            </CardContent>
          </Card>

          {/* Pie Chart – توزيع حالات المشاريع */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#4A3F35]">توزيع حالات المشاريع</CardTitle>
            </CardHeader>
            <CardContent>
              {loading
                ? <div className="h-48 bg-slate-100 rounded animate-pulse" />
                : statusPieData.length === 0
                  ? <div className="h-48 flex items-center justify-center text-slate-400 text-sm">لا توجد بيانات</div>
                  : (
                    <div>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                            {statusPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Pie>
                          <Tooltip formatter={(v, n) => [v, n]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-2 space-y-1">
                        {statusPieData.slice(0, 4).map((d) => (
                          <div key={d.name} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.fill }} />
                              {d.name}
                            </span>
                            <span className="font-semibold text-slate-600">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
              }
            </CardContent>
          </Card>
        </div>

        {/* آخر المشاريع */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#4A3F35]">آخر المشاريع المضافة</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading
              ? <div className="h-32 bg-slate-100 rounded animate-pulse mx-4 mb-4" />
              : recentProjects.length === 0
                ? <p className="text-slate-400 text-sm text-center py-8">لا توجد مشاريع</p>
                : (
                  <div className="divide-y">
                    {recentProjects.map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#4A3F35] truncate">{p.title || "مشروع بدون عنوان"}</p>
                          <p className="text-xs text-slate-400">{moment(p.created_date).fromNow()}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {p.budget_max && <span className="text-xs font-semibold text-[#C9A66B]">{formatSAR(p.budget_max)}</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[p.status] || "bg-slate-100 text-slate-600"}`}>
                            {statusLabel[p.status] || p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
            }
          </CardContent>
        </Card>

        {/* ── المستخدمون النشطون يومياً من Google Analytics ── */}
        <DailyActiveUsersPanel />

        {/* ── قسم الربح الصافي المتوقع لكل مشروع ── */}
        <ProjectProfitPanel projects={projects} loading={loading} />

        <p className="text-center text-xs text-slate-300 pb-4">بيانات حية من قاعدة بيانات بيتلي — {moment(lastRefresh).format("DD/MM/YYYY HH:mm")}</p>
      </div>
    </div>
  );
}