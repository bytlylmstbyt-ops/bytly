import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  FileText, Download, Filter, Loader2, RefreshCw,
  CheckSquare, FolderOpen, Clock, AlertCircle, TrendingUp,
  FileSpreadsheet, FileType2, User, Calendar
} from "lucide-react";
import { format, parseISO, isWithinInterval, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

const STATUS_LABELS = { todo: "انتظار", in_progress: "تنفيذ", on_hold: "معلقة", completed: "مكتملة" };
const STATUS_COLORS = { todo: "#94a3b8", in_progress: "#3b82f6", on_hold: "#f59e0b", completed: "#22c55e" };
const PRIORITY_LABELS = { low: "منخفضة", medium: "متوسطة", high: "مرتفعة", urgent: "عاجلة" };
const PRIORITY_COLORS = { low: "#94a3b8", medium: "#3b82f6", high: "#f59e0b", urgent: "#ef4444" };

function StatCard({ label, value, sub, color = "text-slate-800", icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
          {sub && <p className="text-xs text-slate-400">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TaskReports() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projs, tsks] = await Promise.all([
        base44.entities.TaskProject.list('-created_date', 100),
        base44.entities.Task.list('-created_date', 500),
      ]);
      setProjects(projs);
      setTasks(tsks);
    } catch (e) { toast.error("فشل التحميل"); }
    finally { setLoading(false); }
  };

  // Date range logic
  const getDateBounds = () => {
    const now = new Date();
    if (dateRange === "7d") return { from: subDays(now, 7), to: now };
    if (dateRange === "30d") return { from: subDays(now, 30), to: now };
    if (dateRange === "90d") return { from: subDays(now, 90), to: now };
    if (dateRange === "this_month") return { from: startOfMonth(now), to: endOfMonth(now) };
    if (dateRange === "custom" && customFrom && customTo) return { from: new Date(customFrom), to: new Date(customTo) };
    return null;
  };

  // Filtered tasks
  const filteredTasks = tasks.filter(t => {
    if (projectFilter !== "all" && t.project_id !== projectFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (ownerFilter.trim() && !t.assigned_to?.toLowerCase().includes(ownerFilter.toLowerCase()) && !t.created_by?.toLowerCase().includes(ownerFilter.toLowerCase())) return false;
    const bounds = getDateBounds();
    if (bounds) {
      const d = t.created_date ? new Date(t.created_date) : null;
      if (!d || !isWithinInterval(d, bounds)) return false;
    }
    return true;
  });

  const filteredProjects = projects.filter(p => {
    if (projectFilter !== "all" && p.id !== projectFilter) return false;
    const bounds = getDateBounds();
    if (bounds) {
      const d = p.created_date ? new Date(p.created_date) : null;
      if (!d || !isWithinInterval(d, bounds)) return false;
    }
    return true;
  });

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));

  // Stats
  const total = filteredTasks.length;
  const completed = filteredTasks.filter(t => t.status === "completed").length;
  const inProgress = filteredTasks.filter(t => t.status === "in_progress").length;
  const overdue = filteredTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed").length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  // Charts data
  const statusChartData = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    name: label,
    value: filteredTasks.filter(t => t.status === key).length,
    color: STATUS_COLORS[key],
  })).filter(d => d.value > 0);

  const priorityChartData = Object.entries(PRIORITY_LABELS).map(([key, label]) => ({
    name: label,
    value: filteredTasks.filter(t => t.priority === key).length,
    color: PRIORITY_COLORS[key],
  })).filter(d => d.value > 0);

  const projectChartData = projects
    .map(p => ({
      name: p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name,
      مهام: filteredTasks.filter(t => t.project_id === p.id).length,
      مكتملة: filteredTasks.filter(t => t.project_id === p.id && t.status === "completed").length,
    }))
    .filter(d => d.مهام > 0)
    .slice(0, 8);

  // Assignees
  const assigneeMap = {};
  filteredTasks.forEach(t => {
    const key = t.assigned_to || t.created_by || "غير محدد";
    if (!assigneeMap[key]) assigneeMap[key] = { total: 0, completed: 0 };
    assigneeMap[key].total++;
    if (t.status === "completed") assigneeMap[key].completed++;
  });
  const assigneeData = Object.entries(assigneeMap)
    .map(([email, d]) => ({ email, ...d, rate: d.total ? Math.round((d.completed / d.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ["العنوان", "المشروع", "الحالة", "الأولوية", "المسؤول", "تاريخ الاستحقاق", "تاريخ الإنشاء", "التكلفة", "الإنجاز %"],
      ...filteredTasks.map(t => [
        t.title,
        projectMap[t.project_id]?.name || "",
        STATUS_LABELS[t.status] || t.status,
        PRIORITY_LABELS[t.priority] || t.priority,
        t.assigned_to || "",
        t.due_date || "",
        t.created_date ? format(new Date(t.created_date), "yyyy-MM-dd") : "",
        t.cost || 0,
        t.progress || 0,
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `تقرير_المهام_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("تم تصدير CSV ✓");
  };

  // Export PDF
  const exportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFont("helvetica");
      
      // Title
      doc.setFontSize(18);
      doc.text("Task Performance Report", 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 14, 28);
      doc.text(`Total Tasks: ${total} | Completed: ${completed} | In Progress: ${inProgress} | Overdue: ${overdue}`, 14, 34);
      doc.text(`Completion Rate: ${completionRate}%`, 14, 40);

      // Table header
      let y = 52;
      doc.setFontSize(9);
      doc.setFillColor(59, 130, 246);
      doc.rect(14, y - 5, 269, 8, "F");
      doc.setTextColor(255, 255, 255);
      const headers = ["Title", "Project", "Status", "Priority", "Assignee", "Due Date", "Progress%"];
      const colWidths = [70, 45, 25, 25, 45, 28, 28];
      let x = 16;
      headers.forEach((h, i) => { doc.text(h, x, y); x += colWidths[i]; });
      
      doc.setTextColor(0, 0, 0);
      y += 8;

      filteredTasks.slice(0, 50).forEach((t, idx) => {
        if (y > 190) { doc.addPage(); y = 20; }
        if (idx % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(14, y - 4, 269, 7, "F"); }
        doc.setFontSize(8);
        x = 16;
        const row = [
          (t.title || "").slice(0, 30),
          (projectMap[t.project_id]?.name || "").slice(0, 18),
          STATUS_LABELS[t.status] || t.status,
          PRIORITY_LABELS[t.priority] || t.priority,
          (t.assigned_to || "").slice(0, 20),
          t.due_date || "-",
          `${t.progress || 0}%`,
        ];
        row.forEach((v, i) => { doc.text(String(v), x, y); x += colWidths[i]; });
        y += 7;
      });

      if (filteredTasks.length > 50) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`... and ${filteredTasks.length - 50} more tasks`, 14, y + 4);
      }

      doc.save(`task-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("تم تصدير PDF ✓");
    } catch (e) { toast.error("فشل التصدير"); }
    finally { setExporting(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">تقارير الأداء</h1>
              <p className="text-xs text-slate-500">تحليل شامل للمشاريع والمهام</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ml-1 ${loading ? "animate-spin" : ""}`} />تحديث
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <FileSpreadsheet className="w-4 h-4 ml-1 text-green-600" />تصدير CSV
            </Button>
            <Button size="sm" onClick={exportPDF} disabled={exporting} className="bg-purple-600 hover:bg-purple-700 text-white">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <FileType2 className="w-4 h-4 ml-1" />}
              تصدير PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex items-center gap-2 text-slate-500">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">الفلاتر:</span>
              </div>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="كل المشاريع" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المشاريع</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="كل الحالات" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="النطاق الزمني" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأوقات</SelectItem>
                  <SelectItem value="7d">آخر 7 أيام</SelectItem>
                  <SelectItem value="30d">آخر 30 يوم</SelectItem>
                  <SelectItem value="90d">آخر 90 يوم</SelectItem>
                  <SelectItem value="this_month">هذا الشهر</SelectItem>
                  <SelectItem value="custom">نطاق مخصص</SelectItem>
                </SelectContent>
              </Select>
              {dateRange === "custom" && (
                <>
                  <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="w-36 h-9 text-sm" />
                  <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="w-36 h-9 text-sm" />
                </>
              )}
              <div className="relative">
                <User className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  value={ownerFilter}
                  onChange={e => setOwnerFilter(e.target.value)}
                  placeholder="فلتر بالمسؤول..."
                  className="w-44 h-9 text-sm pr-8"
                />
              </div>
              {(projectFilter !== "all" || statusFilter !== "all" || dateRange !== "all" || ownerFilter) && (
                <Button variant="ghost" size="sm" className="text-xs text-slate-500" onClick={() => { setProjectFilter("all"); setStatusFilter("all"); setDateRange("all"); setOwnerFilter(""); setCustomFrom(""); setCustomTo(""); }}>
                  مسح الفلاتر ✕
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatCard label="إجمالي المهام" value={total} icon={CheckSquare} color="text-slate-700" />
              <StatCard label="مكتملة" value={completed} icon={CheckSquare} color="text-green-600" sub={`${completionRate}% إنجاز`} />
              <StatCard label="قيد التنفيذ" value={inProgress} icon={Clock} color="text-blue-600" />
              <StatCard label="متأخرة" value={overdue} icon={AlertCircle} color="text-red-600" />
              <StatCard label="المشاريع" value={filteredProjects.length} icon={FolderOpen} color="text-purple-600" />
            </div>

            {/* Completion rate bar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />معدل إنجاز المهام الكلي
                  </span>
                  <span className={`text-lg font-bold ${completionRate >= 70 ? "text-green-600" : completionRate >= 40 ? "text-amber-600" : "text-red-600"}`}>
                    {completionRate}%
                  </span>
                </div>
                <Progress value={completionRate} className="h-3" />
              </CardContent>
            </Card>

            <Tabs defaultValue="charts">
              <TabsList>
                <TabsTrigger value="charts" className="text-xs">الرسوم البيانية</TabsTrigger>
                <TabsTrigger value="projects" className="text-xs">حسب المشروع</TabsTrigger>
                <TabsTrigger value="team" className="text-xs">حسب الفريق</TabsTrigger>
                <TabsTrigger value="table" className="text-xs">جدول المهام</TabsTrigger>
              </TabsList>

              {/* Charts */}
              <TabsContent value="charts">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  {/* Status Pie */}
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">توزيع الحالات</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                            {statusChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Priority Pie */}
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">توزيع الأولويات</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={priorityChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                            {priorityChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Project Bar */}
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">المهام حسب المشروع</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={projectChartData} layout="vertical">
                          <XAxis type="number" fontSize={10} />
                          <YAxis type="category" dataKey="name" fontSize={9} width={70} />
                          <Tooltip />
                          <Bar dataKey="مهام" fill="#6366f1" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="مكتملة" fill="#22c55e" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* By Project */}
              <TabsContent value="projects">
                <div className="space-y-3 mt-2">
                  {filteredProjects.map(p => {
                    const pTasks = filteredTasks.filter(t => t.project_id === p.id);
                    const pDone = pTasks.filter(t => t.status === "completed").length;
                    const pPct = pTasks.length ? Math.round((pDone / pTasks.length) * 100) : 0;
                    const pOverdue = pTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed").length;
                    return (
                      <Card key={p.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: p.color }}>
                              {p.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-800">{p.name}</h3>
                              <p className="text-xs text-slate-500">{pTasks.length} مهمة</p>
                            </div>
                            <div className="flex gap-3 text-center">
                              <div><p className="text-lg font-bold text-green-600">{pDone}</p><p className="text-xs text-slate-400">مكتملة</p></div>
                              <div><p className="text-lg font-bold text-blue-600">{pTasks.filter(t => t.status === "in_progress").length}</p><p className="text-xs text-slate-400">تنفيذ</p></div>
                              {pOverdue > 0 && <div><p className="text-lg font-bold text-red-600">{pOverdue}</p><p className="text-xs text-slate-400">متأخرة</p></div>}
                              <div><p className={`text-lg font-bold ${pPct >= 70 ? "text-green-600" : pPct >= 40 ? "text-amber-600" : "text-slate-600"}`}>{pPct}%</p><p className="text-xs text-slate-400">إنجاز</p></div>
                            </div>
                          </div>
                          <Progress value={pPct} className="h-2" />
                        </CardContent>
                      </Card>
                    );
                  })}
                  {filteredProjects.length === 0 && <p className="text-center text-slate-400 py-8">لا توجد مشاريع</p>}
                </div>
              </TabsContent>

              {/* By Team */}
              <TabsContent value="team">
                <div className="space-y-3 mt-2">
                  {assigneeData.map(a => (
                    <Card key={a.email}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                          {a.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{a.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={a.rate} className="h-1.5 flex-1" />
                            <span className="text-xs text-slate-500 shrink-0">{a.rate}%</span>
                          </div>
                        </div>
                        <div className="flex gap-3 text-center shrink-0">
                          <div><p className="text-base font-bold text-slate-700">{a.total}</p><p className="text-xs text-slate-400">كل</p></div>
                          <div><p className="text-base font-bold text-green-600">{a.completed}</p><p className="text-xs text-slate-400">منجز</p></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {assigneeData.length === 0 && <p className="text-center text-slate-400 py-8">لا توجد بيانات فريق</p>}
                </div>
              </TabsContent>

              {/* Table */}
              <TabsContent value="table">
                <div className="mt-2 overflow-x-auto rounded-xl border bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        {["المهمة", "المشروع", "الحالة", "الأولوية", "المسؤول", "الاستحقاق", "الإنجاز", "التكلفة"].map(h => (
                          <th key={h} className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredTasks.slice(0, 100).map(t => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 max-w-[200px]">
                            <p className="truncate font-medium text-slate-800">{t.title}</p>
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 text-xs">{projectMap[t.project_id]?.name || "—"}</td>
                          <td className="px-3 py-2.5">
                            <Badge className="text-xs" style={{ backgroundColor: STATUS_COLORS[t.status] + "20", color: STATUS_COLORS[t.status] }}>
                              {STATUS_LABELS[t.status] || t.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant="outline" className="text-xs">{PRIORITY_LABELS[t.priority] || t.priority}</Badge>
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 text-xs truncate max-w-[120px]">{t.assigned_to || "—"}</td>
                          <td className="px-3 py-2.5 text-xs">
                            {t.due_date ? (
                              <span className={new Date(t.due_date) < new Date() && t.status !== "completed" ? "text-red-600 font-medium" : "text-slate-500"}>
                                {format(new Date(t.due_date), "d MMM", { locale: ar })}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${t.progress || 0}%` }} />
                              </div>
                              <span className="text-xs text-slate-500">{t.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-500">{t.cost ? `${t.cost.toLocaleString()} ر.س` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTasks.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>لا توجد مهام تطابق الفلاتر المحددة</p>
                    </div>
                  )}
                  {filteredTasks.length > 100 && (
                    <p className="text-xs text-slate-400 text-center py-2 border-t">عرض أول 100 مهمة من {filteredTasks.length}</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}