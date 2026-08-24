import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  RefreshCw, Clock, Rocket, Users, Briefcase, TrendingUp,
  UserPlus, Activity, AlertCircle, Eye, FileText
} from "lucide-react";
import moment from "moment";

const STATUS_COLORS = {
  open: "#C9A66B",
  in_progress: "#3B82F6",
  awaiting_technical_review: "#8B5CF6",
  technical_approved: "#10B981",
  pending_client_approval: "#F59E0B",
  completed: "#22C55E",
  cancelled: "#EF4444",
  disputed: "#F97316",
};
const STATUS_LABELS_AR = {
  open: "مفتوح",
  in_progress: "قيد التنفيذ",
  awaiting_technical_review: "بانتظار المراجعة",
  technical_approved: "معتمد فنياً",
  pending_client_approval: "بانتظار موافقة العميل",
  completed: "مكتمل",
  cancelled: "ملغي",
  disputed: "نزاع",
};

function KpiCard({ title, value, sub, icon: Icon, color, loading }) {
  return (
    <Card className={`border-r-4 ${color} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 mb-1 truncate">{title}</p>
            {loading
              ? <div className="h-7 w-24 bg-slate-100 rounded animate-pulse" />
              : <p className="text-2xl font-bold text-[#4A3F35] leading-tight">{value}</p>}
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color.replace("border-", "bg-").replace("-400", "-50")}`}>
            <Icon className="w-5 h-5 text-[#C9A66B]" />
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

export default function LaunchPerformanceDashboard() {
  const [engineers, setEngineers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [eng, proj] = await Promise.all([
        base44.entities.Engineer.list("-created_date", 500),
        base44.entities.Project.list("-created_date", 500),
      ]);
      setEngineers(eng || []);
      setProjects(proj || []);
    } catch (err) {
      console.error("Error loading launch data:", err);
    }
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  // Build daily series: last 14 days
  const dailyData = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const day = moment().subtract(i, "days");
      const dayStr = day.format("YYYY-MM-DD");
      const dayLabel = day.format("DD/MM");

      const newEngineers = engineers.filter((e) =>
        moment(e.created_date).isSame(day, "day")
      ).length;
      const activeProjects = projects.filter((p) => {
        const created = moment(p.created_date);
        return created.isSameOrBefore(day, "day") &&
          ["open", "in_progress", "awaiting_technical_review", "pending_client_approval"].includes(p.status);
      }).length;
      const newProjects = projects.filter((p) =>
        moment(p.created_date).isSame(day, "day")
      ).length;

      days.push({
        date: dayStr,
        label: dayLabel,
        newEngineers,
        activeProjects,
        newProjects,
      });
    }
    return days;
  }, [engineers, projects]);

  // Last 7 days new engineers (for the bar chart)
  const weeklyData = useMemo(() => dailyData.slice(-7), [dailyData]);

  // Project status distribution (pie)
  const projectStatusData = useMemo(() => {
    const counts = {};
    projects.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS_AR[status] || status,
      value: count,
      status,
    }));
  }, [projects]);

  // KPIs
  const totalEngineers = engineers.length;
  const newEngineers7d = engineers.filter((e) =>
    moment(e.created_date).isAfter(moment().subtract(7, "days"))
  ).length;
  const newEngineers24h = engineers.filter((e) =>
    moment(e.created_date).isAfter(moment().subtract(24, "hours"))
  ).length;
  const activeProjects = projects.filter((p) =>
    ["open", "in_progress", "awaiting_technical_review", "pending_client_approval"].includes(p.status)
  ).length;
  const newProjects7d = projects.filter((p) =>
    moment(p.created_date).isAfter(moment().subtract(7, "days"))
  ).length;
  const approvedEngineers = engineers.filter((e) => e.status === "approved").length;
  const pendingEngineers = engineers.filter((e) => e.status === "pending").length;

  return (
    <div className="min-h-screen bg-slate-50 py-6" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center shrink-0">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#4A3F35]">أداء الإطلاق التجريبي</h1>
              <p className="text-sm text-slate-500 mt-0.5">متابعة لحظية لنمو المهندسين والمشاريع</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              آخر تحديث: {moment(lastRefresh).format("HH:mm:ss")}
            </span>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-green-600 hover:bg-green-700 text-white" : ""}
            >
              <Activity className="w-3.5 h-3.5 ml-1" />
              {autoRefresh ? "تحديث تلقائي" : "تفعيل التحديث التلقائي"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ml-1 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard title="إجمالي المهندسين" value={totalEngineers} icon={Users} color="border-blue-400" loading={loading} />
          <KpiCard title="جدد (24 ساعة)" value={newEngineers24h} icon={UserPlus} color="border-green-400" loading={loading} />
          <KpiCard title="جدد (7 أيام)" value={newEngineers7d} icon={TrendingUp} color="border-[#C9A66B]" loading={loading} />
          <KpiCard title="المشاريع النشطة" value={activeProjects} icon={Briefcase} color="border-purple-400" loading={loading} />
          <KpiCard title="مشاريع جديدة (7 أيام)" value={newProjects7d} icon={FileText} color="border-orange-400" loading={loading} />
          <KpiCard title="بانتظار الموافقة" value={pendingEngineers} icon={AlertCircle} color="border-red-400" loading={loading} />
        </div>

        {/* Charts Row 1: New Engineers (Area) + Active Projects (Line) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#C9A66B]" />
                المهندسون الجدد (آخر 14 يوماً)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="engGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A66B" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#C9A66B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} reversed />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} orientation="right" />
                  <Tooltip
                    contentStyle={{ direction: "rtl", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                    labelStyle={{ color: "#4A3F35", fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="newEngineers" name="مهندسون جدد" stroke="#C9A66B" strokeWidth={2} fill="url(#engGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-500" />
                المشاريع النشطة (آخر 14 يوماً)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} reversed />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} orientation="right" />
                  <Tooltip
                    contentStyle={{ direction: "rtl", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                    labelStyle={{ color: "#4A3F35", fontWeight: 600 }}
                  />
                  <Line type="monotone" dataKey="activeProjects" name="مشاريع نشطة" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2: Weekly bar + Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                المهندسون والمشاريع الجديدة (آخر 7 أيام)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} reversed />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} orientation="right" />
                  <Tooltip
                    contentStyle={{ direction: "rtl", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                    labelStyle={{ color: "#4A3F35", fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="newEngineers" name="مهندسون جدد" fill="#C9A66B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="newProjects" name="مشاريع جديدة" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
                <Eye className="w-4 h-4 text-green-500" />
                توزيع حالات المشاريع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {projectStatusData.map((entry, idx) => (
                      <Cell key={idx} fill={STATUS_COLORS[entry.status] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ direction: "rtl", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary footer */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4 justify-around text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{approvedEngineers}</p>
                <p className="text-xs text-slate-500">مهندس معتمد</p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div>
                <p className="text-2xl font-bold text-amber-600">{pendingEngineers}</p>
                <p className="text-xs text-slate-500">بانتظار الموافقة</p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{activeProjects}</p>
                <p className="text-xs text-slate-500">مشروع نشط</p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div>
                <p className="text-2xl font-bold text-[#C9A66B]">{projects.length}</p>
                <p className="text-xs text-slate-500">إجمالي المشاريع</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}