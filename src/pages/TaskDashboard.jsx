import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  RadialBarChart, RadialBar,
} from "recharts";
import {
  CheckCircle2, Clock, AlertTriangle, FolderKanban,
  TrendingUp, Users, Zap, ArrowLeft, BarChart2, FileText,
  Loader2, CalendarDays, Target
} from "lucide-react";
import { format, subDays, isWithinInterval } from "date-fns";
import { ar } from "date-fns/locale";
import HeatmapChart from "@/components/dashboard/HeatmapChart";

const STATUS_COLORS = { todo: "#94a3b8", in_progress: "#6366f1", on_hold: "#f59e0b", completed: "#22c55e" };
const STATUS_LABELS = { todo: "انتظار", in_progress: "تنفيذ", on_hold: "معلقة", completed: "مكتملة" };
const PRIORITY_COLORS = { low: "#94a3b8", medium: "#3b82f6", high: "#f59e0b", urgent: "#ef4444" };
const PRIORITY_LABELS = { low: "منخفضة", medium: "متوسطة", high: "مرتفعة", urgent: "عاجلة" };

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">{`${(percent * 100).toFixed(0)}%`}</text>;
};

function StatCard({ label, value, icon: Icon, color, bg, sub, trend }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
            {trend !== undefined && (
              <p className={`text-xs mt-1 ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
                {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% هذا الأسبوع
              </p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TaskDashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.TaskProject.list('-created_date', 100),
      base44.entities.Task.list('-created_date', 500),
    ]).then(([projs, tsks]) => {
      setProjects(projs);
      setTasks(tsks);
    }).finally(() => setLoading(false));
  }, []);

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));

  // ── KPIs ──
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed").length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  const thisWeek = tasks.filter(t => t.created_date && isWithinInterval(new Date(t.created_date), { start: subDays(new Date(), 7), end: new Date() })).length;
  const lastWeek = tasks.filter(t => t.created_date && isWithinInterval(new Date(t.created_date), { start: subDays(new Date(), 14), end: subDays(new Date(), 7) })).length;
  const weekTrend = lastWeek ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;

  // ── Status Chart ──
  const statusData = Object.entries(STATUS_LABELS).map(([key, name]) => ({
    name, value: tasks.filter(t => t.status === key).length, fill: STATUS_COLORS[key]
  })).filter(d => d.value > 0);

  // ── Priority Chart ──
  const priorityData = Object.entries(PRIORITY_LABELS).map(([key, name]) => ({
    name, value: tasks.filter(t => t.priority === key).length, fill: PRIORITY_COLORS[key]
  })).filter(d => d.value > 0);

  // ── Project Completion Bars ──
  const projectBars = projects.slice(0, 8).map(p => {
    const pTasks = tasks.filter(t => t.project_id === p.id);
    const pDone = pTasks.filter(t => t.status === "completed").length;
    return {
      name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name,
      إجمالي: pTasks.length,
      مكتمل: pDone,
      rate: pTasks.length ? Math.round((pDone / pTasks.length) * 100) : 0,
    };
  }).filter(p => p.إجمالي > 0).sort((a, b) => b.إجمالي - a.إجمالي);

  // ── Radial: Overall Completion ──
  const radialData = [{ name: "إنجاز", value: completionRate, fill: "#6366f1" }];

  // ── Top performers ──
  const assigneeMap = {};
  tasks.forEach(t => {
    const key = t.assigned_to || t.created_by || "غير محدد";
    if (!assigneeMap[key]) assigneeMap[key] = { total: 0, done: 0 };
    assigneeMap[key].total++;
    if (t.status === "completed") assigneeMap[key].done++;
  });
  const topPerformers = Object.entries(assigneeMap)
    .map(([e, d]) => ({ email: e, ...d, rate: d.total ? Math.round((d.done / d.total) * 100) : 0 }))
    .sort((a, b) => b.done - a.done)
    .slice(0, 5);

  // ── Recent completed ──
  const recentDone = tasks.filter(t => t.status === "completed" && t.completion_date).sort((a, b) => new Date(b.completion_date) - new Date(a.completion_date)).slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
              <BarChart2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">لوحة التحكم</h1>
              <p className="text-xs text-slate-500">ملخص بصري شامل للمشاريع والمهام</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl("TaskReports")}>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 ml-1 text-purple-500" />تقارير
              </Button>
            </Link>
            <Link to={createPageUrl("TaskManager")}>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <ArrowLeft className="w-4 h-4 ml-1" />إدارة المهام
              </Button>
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
          <StatCard label="إجمالي المهام" value={total} icon={FolderKanban} color="text-slate-700" bg="bg-slate-100" trend={weekTrend} />
          <StatCard label="مكتملة" value={completed} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" sub={`${completionRate}% من الكل`} />
          <StatCard label="قيد التنفيذ" value={inProgress} icon={Zap} color="text-indigo-600" bg="bg-indigo-50" />
          <StatCard label="متأخرة" value={overdue} icon={AlertTriangle} color="text-red-500" bg="bg-red-50" />
          <StatCard label="المشاريع" value={projects.length} icon={Target} color="text-purple-600" bg="bg-purple-50" />
        </div>

        {/* Radial + Status Pie + Priority Pie */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Radial Completion */}
          <Card className="flex flex-col">
            <CardHeader className="pb-1"><CardTitle className="text-sm text-slate-700">معدل الإنجاز الكلي</CardTitle></CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-44 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270} barSize={14}>
                    <RadialBar background={{ fill: "#f1f5f9" }} dataKey="value" cornerRadius={8} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold text-indigo-600">{completionRate}%</span>
                  <span className="text-xs text-slate-400">إنجاز</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 w-full text-center">
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-green-600">{completed}</p>
                  <p className="text-xs text-slate-500">مكتملة</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-slate-600">{total - completed}</p>
                  <p className="text-xs text-slate-500">متبقية</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Pie */}
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-sm text-slate-700">توزيع المهام حسب الحالة</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={75} dataKey="value" labelLine={false} label={<CustomPieLabel />}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(val, name) => [val + " مهمة", name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                {statusData.map((s, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs text-slate-600">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.fill }} />
                    {s.name} ({s.value})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Priority Pie */}
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-sm text-slate-700">توزيع المهام حسب الأولوية</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" outerRadius={75} dataKey="value" labelLine={false} label={<CustomPieLabel />}>
                    {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(val, name) => [val + " مهمة", name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                {priorityData.map((p, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs text-slate-600">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.fill }} />
                    {p.name} ({p.value})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Bars + Top Performers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Project Completion Bar */}
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-sm text-slate-700">أداء المشاريع (مهام مكتملة vs إجمالي)</CardTitle></CardHeader>
            <CardContent>
              {projectBars.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">لا توجد مشاريع</p>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={projectBars} layout="vertical" margin={{ right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" fontSize={10} tick={{ fill: "#94a3b8" }} />
                    <YAxis type="category" dataKey="name" fontSize={10} width={90} tick={{ fill: "#64748b" }} />
                    <Tooltip />
                    <Bar dataKey="إجمالي" fill="#e0e7ff" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="مكتمل" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-sm text-slate-700">أفضل أعضاء الفريق إنجازاً</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {topPerformers.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">لا توجد بيانات</p>
              ) : topPerformers.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                    i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-400" : "bg-indigo-200 text-indigo-700"
                  }`}>
                    {i < 3 ? ["🥇","🥈","🥉"][i] : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{p.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Progress value={p.rate} className="h-1.5 flex-1" />
                      <span className="text-xs text-slate-500 shrink-0">{p.rate}%</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-green-600">{p.done}</p>
                    <p className="text-xs text-slate-400">/{p.total}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Heatmap */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-purple-500" />
              <CardTitle className="text-sm text-slate-700">خريطة حرارية — فترات الذروة في إنشاء المهام (آخر 365 يوم)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <HeatmapChart tasks={tasks} />
          </CardContent>
        </Card>

        {/* Project Cards Grid */}
        <div>
          <h2 className="text-sm font-semibold text-slate-600 mb-3">حالة المشاريع</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {projects.slice(0, 8).map(p => {
              const pTasks = tasks.filter(t => t.project_id === p.id);
              const pDone = pTasks.filter(t => t.status === "completed").length;
              const pInP = pTasks.filter(t => t.status === "in_progress").length;
              const pPct = pTasks.length ? Math.round((pDone / pTasks.length) * 100) : 0;
              const pOverdue = pTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed").length;
              return (
                <Card key={p.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: p.color || "#6366f1" }}>
                        {p.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-800 truncate">{p.name}</p>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {p.status && (
                            <Badge className="text-xs py-0 px-1.5" style={{ background: p.status === "active" ? "#dcfce7", color: "#16a34a" }}>
                              {p.status === "active" ? "نشط" : p.status === "completed" ? "مكتمل" : p.status === "on_hold" ? "معلق" : "مؤرشف"}
                            </Badge>
                          )}
                          {pOverdue > 0 && <Badge className="text-xs py-0 px-1.5 bg-red-50 text-red-600">{pOverdue} متأخرة</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>{pDone} / {pTasks.length} مهمة</span>
                      <span className={`font-semibold ${pPct >= 70 ? "text-green-600" : pPct >= 40 ? "text-amber-600" : "text-slate-500"}`}>{pPct}%</span>
                    </div>
                    <Progress value={pPct} className="h-2" />

                    <div className="flex gap-2 mt-2.5 text-xs">
                      <span className="flex items-center gap-1 text-indigo-600">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />{pInP} تنفيذ
                      </span>
                      <span className="flex items-center gap-1 text-green-600">
                        <div className="w-2 h-2 rounded-full bg-green-500" />{pDone} منجز
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Completed */}
        {recentDone.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <CardTitle className="text-sm text-slate-700">آخر المهام المكتملة</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentDone.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{t.title}</p>
                      <p className="text-xs text-slate-400">{projectMap[t.project_id]?.name || ""}</p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {t.completion_date ? format(new Date(t.completion_date), "d MMM", { locale: ar }) : ""}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}