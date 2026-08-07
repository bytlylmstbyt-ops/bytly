import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban, Loader2, Search, Filter, Eye, RefreshCw,
  TrendingUp, Clock, CheckCircle2, AlertTriangle, Wallet, XCircle,
  FileText, MapPin, ChevronRight, ChevronLeft, DollarSign, Users, Scale, Download, Loader2 as DownloadSpin
} from "lucide-react";
import { motion } from "framer-motion";
import ProjectDetailModal from "@/components/admin/ProjectDetailModal";
import ProjectActionsMenu from "@/components/admin/ProjectActionsMenu";
import exportProjectsToExcel from "@/components/admin/exportProjects";
import ProjectActivityFeed from "@/components/admin/ProjectActivityFeed";
import BulkActionBar from "@/components/admin/BulkActionBar";
import AddProjectDialog from "@/components/admin/AddProjectDialog";
import { useBulkSelection } from "@/components/admin/useBulkSelection";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { readAdminFilters, writeAdminFilters, useAdminScrollRestore } from "@/components/admin/adminFilterPersistence";

const STATUS_LABELS = {
  open: "مفتوح", in_progress: "قيد التنفيذ", awaiting_technical_review: "بانتظار المراجعة الفنية",
  technical_approved: "معتمد فنيًا", pending_client_approval: "بانتظار موافقة العميل",
  completed: "مكتمل", cancelled: "ملغي", disputed: "نزاع",
};
const STATUS_COLORS = {
  open: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  awaiting_technical_review: "bg-purple-100 text-purple-700 border-purple-200",
  technical_approved: "bg-indigo-100 text-indigo-700 border-indigo-200",
  pending_client_approval: "bg-cyan-100 text-cyan-700 border-cyan-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  disputed: "bg-red-100 text-red-700 border-red-200",
};

function computeCompletion(status) {
  if (status === "completed") return 100;
  if (status === "cancelled") return 0;
  if (status === "in_progress") return 50;
  if (status === "technical_approved") return 90;
  if (status === "pending_client_approval") return 80;
  if (status === "awaiting_technical_review") return 70;
  if (status === "open") return 10;
  return 0;
}

export default function AdminProjects() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const _f = useMemo(() => readAdminFilters("AdminProjects"), []);
  const [search, setSearch] = useState(_f.search || "");
  const [statusFilter, setStatusFilter] = useState(_f.statusFilter || "all");
  const [cityFilter, setCityFilter] = useState(_f.cityFilter || "all");
  const [typeFilter, setTypeFilter] = useState(_f.typeFilter || "all");
  const [engineerFilter, setEngineerFilter] = useState(_f.engineerFilter || "all");
  const [clientFilter, setClientFilter] = useState(_f.clientFilter || "all");
  const [dateFrom, setDateFrom] = useState(_f.dateFrom || "");
  const [dateTo, setDateTo] = useState(_f.dateTo || "");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [page, setPage] = useState(_f.page || 1);

  // Persist filters + page so back navigation restores the exact view
  useEffect(() => {
    writeAdminFilters("AdminProjects", { search, statusFilter, cityFilter, typeFilter, engineerFilter, clientFilter, dateFrom, dateTo, page });
  }, [search, statusFilter, cityFilter, typeFilter, engineerFilter, clientFilter, dateFrom, dateTo, page]);
  useAdminScrollRestore("AdminProjects", loading);
  const [exporting, setExporting] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const bulk = useBulkSelection();
  const PAGE_SIZE = 10;

  const handleExport = async () => {
    setExporting(true);
    try {
      // Export the filtered set; if list is incomplete, fetch full filtered set first
      await exportProjectsToExcel({ projects: filtered, clients, engineers });
    } catch (err) {
      alert("فشل التصدير");
    } finally {
      setExporting(false);
    }
  };

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [projectsData, clientsData, engineersData] = await Promise.all([
        base44.entities.Project.list("-created_date", 500).catch(() => []),
        base44.entities.Client.list().catch(() => []),
        base44.entities.Engineer.list().catch(() => []),
      ]);
      setProjects(projectsData);
      setClients(clientsData);
      setEngineers(engineersData);
    } catch (err) {
      console.error("Failed to load", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    base44.auth.me().then((u) => setIsAdmin(u?.role === "admin")).catch(() => {});
  }, []);

  // After any admin action, re-fetch only projects to update table + stats instantly (no full page reload)
  const [activityTick, setActivityTick] = useState(0);
  const handleProjectUpdated = useCallback(async () => {
    try {
      const projectsData = await base44.entities.Project.list("-created_date", 500);
      setProjects(projectsData);
    } catch (err) { console.error(err); }
    setActivityTick((t) => t + 1);
  }, []);

  const runBulk = async (action) => {
    setBulkBusy(true);
    try {
      const ids = bulk.selectedIds;
      if (action === "delete") {
        await Promise.all(ids.map((id) => base44.entities.Project.delete(id)));
      } else {
        const patch = action === "activate" ? { status: "in_progress" }
          : action === "suspend" ? { status: "cancelled" }
          : action === "pause" ? { status: "awaiting_technical_review" } : null;
        if (patch) await Promise.all(ids.map((id) => base44.entities.Project.update(id, patch)));
      }
      await handleProjectUpdated();
      bulk.clear();
    } catch (e) {
      console.error("bulk action failed", e);
    } finally {
      setBulkBusy(false);
    }
  };

  const lookup = useMemo(() => {
    const c = {}, e = {};
    clients.forEach(cl => { c[cl.id] = cl.full_name; });
    engineers.forEach(en => { e[en.id] = en.full_name; });
    return { clients: c, engineers: e };
  }, [clients, engineers]);

  const cities = useMemo(() => {
    const set = new Set();
    projects.forEach(p => { if (p.location) set.add(p.location); });
    return [...set].sort();
  }, [projects]);

  const stats = useMemo(() => {
    const now = new Date();
    const total = projects.length;
    const open = projects.filter(p => p.status === "open").length;
    const inProgress = projects.filter(p => p.status === "in_progress").length;
    const awaiting = projects.filter(p => ["awaiting_technical_review", "pending_client_approval"].includes(p.status)).length;
    const completed = projects.filter(p => p.status === "completed").length;
    const cancelled = projects.filter(p => p.status === "cancelled").length;
    const disputed = projects.filter(p => p.status === "disputed").length;
    const overdue = projects.filter(p => {
      if (!p.deadline || p.status === "completed" || p.status === "cancelled") return false;
      return new Date(p.deadline) < now;
    }).length;
    const totalValue = projects.reduce((s, p) => s + (p.budget_max || p.escrow_amount || 0), 0);
    const escrowTotal = projects.reduce((s, p) => s + (p.escrow_amount || 0), 0);
    return { total, open, inProgress, awaiting, completed, cancelled, disputed, overdue, totalValue, escrowTotal };
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (p.title || "").toLowerCase().includes(q) ||
        (p.id || "").toLowerCase().includes(q) ||
        (p.id || "").slice(-6).toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" ? true :
        statusFilter === "active" ? ["open", "in_progress"].includes(p.status) :
        statusFilter === "pending" ? ["awaiting_technical_review", "technical_approved", "pending_client_approval"].includes(p.status) :
        statusFilter === "suspended" ? ["cancelled", "disputed"].includes(p.status) :
        statusFilter === "completed" ? p.status === "completed" : true;
      const matchCity = cityFilter === "all" || p.location === cityFilter;
      const matchType = typeFilter === "all" || p.project_type === typeFilter;
      const matchEngineer = engineerFilter === "all" || p.assigned_engineer_id === engineerFilter;
      const matchClient = clientFilter === "all" || p.client_id === clientFilter;
      let matchDate = true;
      const cd = p.created_date ? new Date(p.created_date) : null;
      if (cd && dateFrom) matchDate = cd >= new Date(dateFrom);
      if (cd && dateTo) matchDate = matchDate && cd <= new Date(dateTo + "T23:59:59");
      return matchSearch && matchStatus && matchCity && matchType && matchEngineer && matchClient && matchDate;
    });
  }, [projects, search, statusFilter, cityFilter, typeFilter, engineerFilter, clientFilter, dateFrom, dateTo]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const statCards = [
    { label: "إجمالي المشاريع", value: stats.total, icon: FolderKanban, color: "text-[#4A3F35]", bg: "bg-[#F5F0E8]" },
    { label: "مشاريع جديدة", value: stats.open, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "بانتظار الموافقة", value: stats.awaiting, icon: Clock, color: "text-cyan-600", bg: "bg-cyan-50" },
    { label: "قيد التنفيذ", value: stats.inProgress, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "مكتملة", value: stats.completed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "متأخرة", value: stats.overdue, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "ملغاة", value: stats.cancelled, icon: XCircle, color: "text-slate-500", bg: "bg-slate-100" },
    { label: "نزاعات", value: stats.disputed, icon: Scale, color: "text-red-600", bg: "bg-red-50" },
    { label: "إجمالي القيمة", value: `${stats.totalValue.toLocaleString("ar-SA")}`, sub: "ر.س", icon: DollarSign, color: "text-[#C9A66B]", bg: "bg-[#FEF9EE]" },
    { label: "إجمالي الضمان", value: `${stats.escrowTotal.toLocaleString("ar-SA")}`, sub: "ر.س", icon: Wallet, color: "text-[#4A3F35]", bg: "bg-[#F5F0E8]" },
  ];

  const resetFilters = () => {
    setSearch(""); setStatusFilter("all"); setCityFilter("all"); setTypeFilter("all");
    setEngineerFilter("all"); setClientFilter("all"); setDateFrom(""); setDateTo(""); setPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8" dir="rtl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#4A3F35]">لوحة إدارة المشاريع</h1>
              <p className="text-sm text-slate-500">إدارة شاملة لجميع مشاريع المنصة من البداية حتى الاكتمال</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة مشروع
              </Button>
            )}
            <Button variant="outline" onClick={loadData} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ml-2 ${refreshing ? "animate-spin" : ""}`} />
              تحديث البيانات
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <p className="text-lg font-bold text-[#4A3F35] truncate">
                    {s.value}{s.sub && <span className="text-xs font-normal text-slate-400 mr-1">{s.sub}</span>}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="mb-4 border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="ابحث باسم المشروع أو رقمه..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pr-10"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
                <option value="all">كل الحالات</option>
                <option value="active">نشط</option>
                <option value="pending">معلق</option>
                <option value="suspended">موقوف</option>
                <option value="completed">مكتمل</option>
              </select>
              <select value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setPage(1); }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
                <option value="all">كل المدن</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
                <option value="all">كل الأنواع</option>
                <option value="full_construction">بناء كامل</option>
                <option value="express_service">خدمة سريعة</option>
              </select>
              <select value={engineerFilter} onChange={(e) => { setEngineerFilter(e.target.value); setPage(1); }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
                <option value="all">كل المهندسين</option>
                {engineers.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
              <select value={clientFilter} onChange={(e) => { setClientFilter(e.target.value); setPage(1); }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
                <option value="all">كل العملاء</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
              <div className="flex items-center gap-1">
                <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="text-xs" />
                <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="text-xs" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-slate-500">
                <XCircle className="w-4 h-4 ml-1" /> مسح الفلاتر
              </Button>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-400 hidden sm:block">عرض {paged.length} من {filtered.length} مشروع</p>
                <Button
                  size="sm"
                  onClick={handleExport}
                  disabled={exporting || filtered.length === 0}
                  className="bg-[#4A3F35] hover:bg-[#3a322a] text-white"
                >
                  {exporting ? <DownloadSpin className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 ml-1" />}
                  تصدير إكسل
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <BulkActionBar
        selectedCount={bulk.selectedCount}
        entityLabel="مشروع"
        onAction={runBulk}
        onClear={bulk.clear}
        isAdmin={isAdmin}
        busy={bulkBusy}
      />

      {/* Table (desktop) */}
      <Card className="border-0 shadow-sm hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs">
                <th className="text-center py-3 px-3 w-10">
                  <Checkbox
                    checked={paged.length > 0 && paged.every((p) => bulk.isSelected(p.id)) ? true : paged.some((p) => bulk.isSelected(p.id)) ? "indeterminate" : false}
                    onCheckedChange={() => bulk.toggleAll(paged.map((p) => p.id))}
                  />
                </th>
                <th className="text-right py-3 px-3 font-medium">اسم المشروع</th>
                <th className="text-right py-3 px-3 font-medium">رقم المشروع</th>
                <th className="text-right py-3 px-3 font-medium">العميل</th>
                <th className="text-right py-3 px-3 font-medium">المهندس</th>
                <th className="text-right py-3 px-3 font-medium">المدينة</th>
                <th className="text-right py-3 px-3 font-medium">قيمة العقد</th>
                <th className="text-right py-3 px-3 font-medium">الإنجاز</th>
                <th className="text-right py-3 px-3 font-medium">الحالة</th>
                <th className="text-right py-3 px-3 font-medium">تاريخ الإنشاء</th>
                <th className="text-right py-3 px-3 font-medium">آخر تحديث</th>
                <th className="text-center py-3 px-3 font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-12 text-slate-400">لا توجد مشاريع مطابقة</td></tr>
              ) : paged.map(p => {
                const comp = computeCompletion(p.status);
                const checked = bulk.isSelected(p.id);
                return (
                  <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${checked ? "bg-[#C9A66B]/5" : ""}`}>
                    <td className="py-2.5 px-3 text-center">
                      <Checkbox checked={checked} onCheckedChange={() => bulk.toggle(p.id)} />
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px] truncate">
                      <Link to={`/ProjectDetails?id=${p.id}`} className="font-medium text-[#4A3F35] hover:text-[#C9A66B] transition-colors flex items-center gap-1">
                        {p.title || "—"}
                        <ChevronLeft className="w-3.5 h-3.5 text-[#C9A66B] opacity-50 shrink-0" />
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <Link to={`/ProjectDetails?id=${p.id}`} className="text-slate-400 text-xs font-mono hover:text-[#C9A66B] transition-colors">
                        #{p.id.slice(-6)}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{lookup.clients[p.client_id] || "—"}</td>
                    <td className="py-2.5 px-3 text-slate-600">{lookup.engineers[p.assigned_engineer_id] || "—"}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-xs">{p.location || "—"}</td>
                    <td className="py-2.5 px-3 text-slate-600 text-xs">{(p.escrow_amount || p.budget_max || 0).toLocaleString()} ر.س</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#C9A66B] rounded-full" style={{ width: `${comp}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{comp}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge className={`${STATUS_COLORS[p.status] || "bg-slate-100 text-slate-500"} border`} variant="outline">
                        {STATUS_LABELS[p.status] || p.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-400">{p.created_date ? new Date(p.created_date).toLocaleDateString("ar-SA") : "—"}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-400">{p.updated_date ? new Date(p.updated_date).toLocaleDateString("ar-SA") : "—"}</td>
                    <td className="py-2.5 px-3 text-center">
                      <ProjectActionsMenu
                        project={p}
                        engineers={engineers}
                        onView={() => { setSelectedProject(p); setShowDetail(true); }}
                        onUpdated={handleProjectUpdated}
                        onDeleted={handleProjectUpdated}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cards (mobile) */}
      <div className="md:hidden space-y-2">
        {paged.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">لا توجد مشاريع مطابقة</p>
            </CardContent>
          </Card>
        ) : paged.map(p => {
         const comp = computeCompletion(p.status);
         return (
           <Link key={p.id} to={`/ProjectDetails?id=${p.id}`}>
           <Card key={p.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
             <CardContent className="p-3">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-xs text-slate-400 font-mono">#{p.id.slice(-6)}</span>
                 <Badge className={`${STATUS_COLORS[p.status] || ""} border`} variant="outline">{STATUS_LABELS[p.status]}</Badge>
                 <div onClick={(e) => e.preventDefault()} onClickCapture={(e) => e.stopPropagation()}>
                   <ProjectActionsMenu
                     project={p}
                     engineers={engineers}
                     onView={() => {}}
                     onUpdated={handleProjectUpdated}
                     onDeleted={handleProjectUpdated}
                   />
                 </div>
               </div>
               <p className="font-bold text-[#4A3F35] text-sm mb-1 hover:text-[#C9A66B] transition-colors">{p.title || "—"}</p>
                <div className="text-xs text-slate-500 space-y-0.5">
                  <p>العميل: {lookup.clients[p.client_id] || "—"}</p>
                  <p>المهندس: {lookup.engineers[p.assigned_engineer_id] || "—"}</p>
                  <p>المدينة: {p.location || "—"}</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
                    <div className="h-full bg-[#C9A66B] rounded-full" style={{ width: `${comp}%` }} />
                  </div>
                  <span className="text-xs text-slate-500">{comp}%</span>
                  <ChevronLeft className="w-4 h-4 text-slate-300" />
                </div>
                </CardContent>
                </Card>
                </Link>
                );
                })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-500">صفحة {page} من {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Live activity feed — transparent audit of status & financial changes */}
      <div className="mt-6">
        <ProjectActivityFeed refreshKey={activityTick} />
      </div>

      {/* Detail modal */}
      <ProjectDetailModal
        open={showDetail}
        onOpenChange={setShowDetail}
        project={selectedProject}
        lookup={lookup}
      />

      {isAdmin && (
        <AddProjectDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onCreated={() => {
            handleProjectUpdated();
            loadData();
          }}
        />
      )}
    </div>
  );
}