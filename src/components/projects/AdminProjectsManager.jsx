import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
  FolderKanban, Loader2, Search, RefreshCw, Plus, Pin, PinOff, EyeOff, Eye,
  Pencil, Trash2, CheckCircle2, XCircle, Pause, TrendingUp, Clock, Scale,
  DollarSign, Wallet, ArrowUpDown, X, MoreVertical, FileText, Receipt, UserRound, MapPin, CalendarDays,
} from "lucide-react";
import AddProjectDialog from "@/components/admin/AddProjectDialog";
import { useBulkSelection } from "@/components/admin/useBulkSelection";
import { logProjectChange, logProjectDeletion, logProjectFlagChange } from "@/components/admin/logProjectChange";

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
const CATEGORY_OPTIONS = [
  { value: "interior", label: "تصميم داخلي" },
  { value: "architecture", label: "عمارة" },
  { value: "painting", label: "دهانات" },
  { value: "landscape", label: "تنسيق حدائق" },
  { value: "furniture", label: "أثاث" },
  { value: "lighting", label: "إضاءة" },
];
const SORTS = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "value", label: "الأعلى قيمة" },
  { value: "proposals", label: "الأكثر عروضاً" },
  { value: "pinned", label: "المثبتة أولاً" },
];
const BULK_ACTIONS = [
  { key: "activate", label: "تفعيل", cls: "bg-green-600 hover:bg-green-700 text-white" },
  { key: "pause", label: "تعليق", cls: "bg-amber-600 hover:bg-amber-700 text-white" },
  { key: "suspend", label: "إيقاف", cls: "bg-red-600 hover:bg-red-700 text-white" },
  { key: "pin", label: "تثبيت", cls: "bg-[#4A3F35] hover:bg-[#3a322a] text-white" },
  { key: "unpin", label: "إلغاء التثبيت", cls: "bg-slate-600 hover:bg-slate-700 text-white" },
  { key: "hide", label: "إخفاء", cls: "bg-slate-700 hover:bg-slate-800 text-white" },
  { key: "show", label: "إظهار", cls: "bg-sky-600 hover:bg-sky-700 text-white" },
  { key: "delete", label: "حذف", cls: "bg-red-700 hover:bg-red-800 text-white", danger: true },
];
const BULK_MAP = {
  activate: { status: "in_progress" }, pause: { status: "awaiting_technical_review" },
  suspend: { status: "cancelled" },
  pin: ["is_pinned", true], unpin: ["is_pinned", false],
  hide: ["is_hidden", true], show: ["is_hidden", false],
};

export default function AdminProjectsManager() {
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [actor, setActor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [formOpen, setFormOpen] = useState(false);
  const [formProject, setFormProject] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingBulk, setPendingBulk] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectRelations, setProjectRelations] = useState({ contracts: [], invoices: [], payments: [] });
  const [projectDetailsLoading, setProjectDetailsLoading] = useState(false);
  const bulk = useBulkSelection();

  const refreshProjects = useCallback(async () => {
    const p = await base44.entities.Project.list("-created_date", 500).catch(() => []);
    setProjects(p);
  }, []);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [p, c, e, me] = await Promise.all([
        base44.entities.Project.list("-created_date", 500).catch(() => []),
        base44.entities.Client.list().catch(() => []),
        base44.entities.Engineer.list().catch(() => []),
        base44.auth.me().catch(() => null),
      ]);
      setProjects(p); setClients(c); setEngineers(e); setActor(me);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const lookup = useMemo(() => {
    const c = {}, e = {};
    clients.forEach(cl => { c[cl.id] = cl.full_name; });
    engineers.forEach(en => { e[en.id] = en.full_name; });
    return { clients: c, engineers: e };
  }, [clients, engineers]);

  const cities = useMemo(() => {
    const s = new Set(); projects.forEach(p => { if (p.location) s.add(p.location); });
    return [...s].sort();
  }, [projects]);

  const stats = useMemo(() => {
    const total = projects.length;
    const open = projects.filter(p => p.status === "open").length;
    const inProgress = projects.filter(p => p.status === "in_progress").length;
    const awaiting = projects.filter(p => ["awaiting_technical_review", "pending_client_approval"].includes(p.status)).length;
    const completed = projects.filter(p => p.status === "completed").length;
    const disputed = projects.filter(p => p.status === "disputed").length;
    const hidden = projects.filter(p => p.is_hidden).length;
    const pinned = projects.filter(p => p.is_pinned).length;
    const totalValue = projects.reduce((s, p) => s + (p.budget_max || p.escrow_amount || 0), 0);
    return { total, open, inProgress, awaiting, completed, disputed, hidden, pinned, totalValue };
  }, [projects]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const arr = projects.filter(p => {
      const ms = !q || (p.title || "").toLowerCase().includes(q) || (p.id || "").toLowerCase().includes(q) || (p.id || "").slice(-6).toLowerCase().includes(q);
      const mst = statusFilter === "all" ? true
        : statusFilter === "active" ? ["open", "in_progress"].includes(p.status)
        : statusFilter === "pending" ? ["awaiting_technical_review", "technical_approved", "pending_client_approval"].includes(p.status)
        : statusFilter === "suspended" ? ["cancelled", "disputed"].includes(p.status)
        : statusFilter === "completed" ? p.status === "completed" : true;
      const mcat = categoryFilter === "all" || p.category === categoryFilter;
      const mcity = cityFilter === "all" || p.location === cityFilter;
      const mtype = typeFilter === "all" || p.project_type === typeFilter;
      const mvis = visibilityFilter === "all" ? true : visibilityFilter === "hidden" ? !!p.is_hidden : !p.is_hidden;
      return ms && mst && mcat && mcity && mtype && mvis;
    });
    arr.sort((a, b) => {
      switch (sort) {
        case "oldest": return new Date(a.created_date) - new Date(b.created_date);
        case "value": return (b.budget_max || b.escrow_amount || 0) - (a.budget_max || a.escrow_amount || 0);
        case "proposals": return (b.total_proposals || 0) - (a.total_proposals || 0);
        case "pinned": return (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) || new Date(b.created_date) - new Date(a.created_date);
        default: return new Date(b.created_date) - new Date(a.created_date);
      }
    });
    return arr;
  }, [projects, search, statusFilter, categoryFilter, cityFilter, typeFilter, visibilityFilter, sort]);

  const openAdd = () => { setFormProject(null); setFormOpen(true); };
  const openEdit = (p) => { setFormProject(p); setFormOpen(true); };
  const openProjectDetails = async (project) => {
    setSelectedProject(project);
    setProjectDetailsLoading(true);
    try {
      const [contracts, invoices, payments] = await Promise.all([
        base44.entities.Contract.filter({ project_id: project.id }).catch(() => []),
        base44.entities.Invoice.filter({ project_id: project.id }).catch(() => []),
        base44.entities.Payment.filter({ project_id: project.id }).catch(() => []),
      ]);
      setProjectRelations({ contracts, invoices, payments });
    } finally { setProjectDetailsLoading(false); }
  };
  const onFormDone = async () => { setFormOpen(false); setFormProject(null); await refreshProjects(); };

  // single-row ops
  const setStatus = async (p, status) => {
    setBusy(true);
    try { await base44.entities.Project.update(p.id, { status }); await logProjectChange(p, { status }, actor); await refreshProjects(); toast({ title: "تم تحديث حالة المشروع" }); }
    finally { setBusy(false); }
  };
  const togglePin = async (p) => {
    setBusy(true);
    try {
      const val = !p.is_pinned;
      await base44.entities.Project.update(p.id, { is_pinned: val });
      await logProjectFlagChange(p, actor, "is_pinned", p.is_pinned, val, val ? `تم تثبيت المشروع «${p.title}»` : `تم إلغاء تثبيت المشروع «${p.title}»`);
      await refreshProjects();
    } finally { setBusy(false); }
  };
  const toggleHide = async (p) => {
    setBusy(true);
    try {
      const val = !p.is_hidden;
      await base44.entities.Project.update(p.id, { is_hidden: val });
      await logProjectFlagChange(p, actor, "is_hidden", p.is_hidden, val, val ? `تم إخفاء المشروع «${p.title}» عن السوق` : `تم إظهار المشروع «${p.title}» في السوق`);
      await refreshProjects();
    } finally { setBusy(false); }
  };
  const doDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try { await base44.entities.Project.delete(pendingDelete.id); await logProjectDeletion(pendingDelete, actor); await refreshProjects(); toast({ title: "تم حذف المشروع" }); }
    finally { setBusy(false); setPendingDelete(null); }
  };

  const runBulk = async (action) => {
    setBusy(true);
    try {
      const ids = bulk.selectedIds;
      const items = projects.filter(p => ids.includes(p.id));
      if (action === "delete") {
        await Promise.all(ids.map(id => base44.entities.Project.delete(id)));
        await Promise.all(items.map(p => logProjectDeletion(p, actor)));
      } else {
        const cfg = BULK_MAP[action];
        if (Array.isArray(cfg)) {
          const [field, val] = cfg;
          await Promise.all(ids.map(id => base44.entities.Project.update(id, { [field]: val })));
          await Promise.all(items.map(p => logProjectFlagChange(p, actor, field, p[field], val, `${val ? "تفعيل" : "إلغاء"} ${field === "is_pinned" ? "التثبيت" : "الإخفاء"} لـ «${p.title}»`)));
        } else {
          const patch = cfg;
          await Promise.all(ids.map(id => base44.entities.Project.update(id, patch)));
          await Promise.all(items.map(p => logProjectChange(p, patch, actor)));
        }
      }
      await refreshProjects();
      bulk.clear();
      toast({ title: "تم تنفيذ الإجراء الجماعي" });
    } finally { setBusy(false); setPendingBulk(null); }
  };

  const resetFilters = () => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); setCityFilter("all"); setTypeFilter("all"); setVisibilityFilter("all"); setSort("newest"); };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "إجمالي المشاريع", value: stats.total, icon: FolderKanban, color: "text-[#4A3F35]", bg: "bg-[#F5F0E8]" },
    { label: "مفتوحة", value: stats.open, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "قيد التنفيذ", value: stats.inProgress, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "بانتظار الموافقة", value: stats.awaiting, icon: Clock, color: "text-cyan-600", bg: "bg-cyan-50" },
    { label: "مكتملة", value: stats.completed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "نزاعات", value: stats.disputed, icon: Scale, color: "text-red-600", bg: "bg-red-50" },
    { label: "مثبتة", value: stats.pinned, icon: Pin, color: "text-[#C9A66B]", bg: "bg-[#FEF9EE]" },
    { label: "مخفية", value: stats.hidden, icon: EyeOff, color: "text-slate-600", bg: "bg-slate-100" },
    { label: "إجمالي القيمة", value: stats.totalValue.toLocaleString("ar-SA"), sub: "ر.س", icon: DollarSign, color: "text-[#C9A66B]", bg: "bg-[#FEF9EE]" },
  ];

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
              <h1 className="text-2xl font-bold text-[#4A3F35]">إدارة سوق المشاريع</h1>
              <p className="text-sm text-slate-500">واجهة إدارية كاملة: إضافة، تعديل، تثبيت، إخفاء، وإجراءات جماعية — مع تسجيل كل عملية في سجل النشاط</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openAdd} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90">
              <Plus className="w-4 h-4 ml-2" /> إضافة مشروع
            </Button>
            <Button variant="outline" onClick={loadAll} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ml-2 ${refreshing ? "animate-spin" : ""}`} /> تحديث
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
              <Input placeholder="ابحث باسم المشروع أو رقمه..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
                <option value="all">كل الحالات</option>
                <option value="active">نشط</option>
                <option value="pending">معلق</option>
                <option value="suspended">موقوف</option>
                <option value="completed">مكتمل</option>
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
                <option value="all">كل التصنيفات</option>
                {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
                <option value="all">كل المدن</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
                <option value="all">كل الأنواع</option>
                <option value="full_construction">بناء كامل</option>
                <option value="express_service">خدمة سريعة</option>
              </select>
              <select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
                <option value="all">الظاهر والمخفي</option>
                <option value="visible">الظاهر فقط</option>
                <option value="hidden">المخفي فقط</option>
              </select>
              <div className="relative">
                <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer appearance-none pr-9">
                  {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-slate-500">
                <XCircle className="w-4 h-4 ml-1" /> مسح الفلاتر
              </Button>
              <p className="text-xs text-slate-400">عرض {filtered.length} من {projects.length} مشروع</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk action bar */}
      {bulk.selectedCount > 0 && (
        <div className="sticky top-2 z-30 mb-3 rounded-xl border border-[#C9A66B]/30 bg-[#4A3F35] text-white shadow-lg px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="bg-[#C9A66B] text-[#4A3F35] rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm">{bulk.selectedCount}</span>
            <span className="text-sm">تم تحديد {bulk.selectedCount} مشروع</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {BULK_ACTIONS.map(a => (
              <Button key={a.key} size="sm" className={a.cls} disabled={busy} onClick={() => a.danger ? setPendingBulk(a.key) : runBulk(a.key)}>
                {a.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={bulk.clear} disabled={busy}>
              <X className="w-4 h-4 ml-1" /> إلغاء التحديد
            </Button>
          </div>
        </div>
      )}

      {/* Table (desktop) */}
      <Card className="border-0 shadow-sm hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs">
                <th className="text-center py-3 px-3 w-10">
                  <Checkbox
                    checked={filtered.length > 0 && filtered.every((p) => bulk.isSelected(p.id)) ? true : filtered.some((p) => bulk.isSelected(p.id)) ? "indeterminate" : false}
                    onCheckedChange={() => bulk.toggleAll(filtered.map((p) => p.id))}
                  />
                </th>
                <th className="text-right py-3 px-3 font-medium">رقم</th>
                <th className="text-right py-3 px-3 font-medium">المشروع</th>
                <th className="text-right py-3 px-3 font-medium">العميل</th>
                <th className="text-right py-3 px-3 font-medium">المدينة</th>
                <th className="text-right py-3 px-3 font-medium">القيمة</th>
                <th className="text-right py-3 px-3 font-medium">الحالة</th>
                <th className="text-right py-3 px-3 font-medium">علامات</th>
                <th className="text-center py-3 px-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">لا توجد مشاريع مطابقة</td></tr>
              ) : filtered.map(p => {
                const checked = bulk.isSelected(p.id);
                return (
                  <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${checked ? "bg-[#C9A66B]/5" : ""} ${p.is_hidden ? "opacity-60" : ""}`}>
                    <td className="py-2.5 px-3 text-center"><Checkbox checked={checked} onCheckedChange={() => bulk.toggle(p.id)} /></td>
                    <td className="py-2.5 px-3 text-slate-400 text-xs font-mono">#{p.id.slice(-6)}</td>
                    <td className="py-2.5 px-3 font-medium text-[#4A3F35] max-w-[220px] truncate"><button type="button" onClick={() => openProjectDetails(p)} className="hover:text-[#C9A66B] hover:underline text-right truncate max-w-full">{p.title || "—"}</button></td>
                    <td className="py-2.5 px-3 text-slate-600">{lookup.clients[p.client_id] || "—"}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-xs">{p.location || "—"}</td>
                    <td className="py-2.5 px-3 text-slate-600 text-xs">{(p.escrow_amount || p.budget_max || 0).toLocaleString()} ر.س</td>
                    <td className="py-2.5 px-3"><Badge className={`${STATUS_COLORS[p.status] || "bg-slate-100 text-slate-500"} border`} variant="outline">{STATUS_LABELS[p.status] || p.status}</Badge></td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1">
                        {p.is_pinned && <Badge className="bg-[#C9A66B]/15 text-[#C9A66B] border-[#C9A66B]/30" variant="outline"><Pin className="w-3 h-3 ml-1" />مثبت</Badge>}
                        {p.is_hidden && <Badge className="bg-slate-200 text-slate-600 border-slate-300" variant="outline"><EyeOff className="w-3 h-3 ml-1" />مخفي</Badge>}
                        {!p.is_pinned && !p.is_hidden && <span className="text-xs text-slate-300">—</span>}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busy}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openEdit(p)}><Pencil className="w-4 h-4 ml-2" /> تعديل</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatus(p, "in_progress")}><CheckCircle2 className="w-4 h-4 ml-2 text-green-600" /> تفعيل</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatus(p, "awaiting_technical_review")}><Pause className="w-4 h-4 ml-2 text-amber-600" /> تعليق</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatus(p, "cancelled")}><XCircle className="w-4 h-4 ml-2 text-red-600" /> إيقاف</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => togglePin(p)}>{p.is_pinned ? <PinOff className="w-4 h-4 ml-2" /> : <Pin className="w-4 h-4 ml-2 text-[#C9A66B]" />}{p.is_pinned ? "إلغاء التثبيت" : "تثبيت"}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleHide(p)}>{p.is_hidden ? <Eye className="w-4 h-4 ml-2" /> : <EyeOff className="w-4 h-4 ml-2 text-slate-600" />}{p.is_hidden ? "إظهار" : "إخفاء"}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => setPendingDelete(p)}><Trash2 className="w-4 h-4 ml-2" /> حذف</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        {filtered.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center"><FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">لا توجد مشاريع مطابقة</p></CardContent></Card>
        ) : filtered.map(p => (
          <Card key={p.id} className={`border-0 shadow-sm ${p.is_hidden ? "opacity-60" : ""}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox checked={bulk.isSelected(p.id)} onCheckedChange={() => bulk.toggle(p.id)} />
                  <span className="text-xs text-slate-400 font-mono">#{p.id.slice(-6)}</span>
                  <Badge className={`${STATUS_COLORS[p.status] || ""} border`} variant="outline">{STATUS_LABELS[p.status]}</Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busy}><MoreVertical className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => openEdit(p)}><Pencil className="w-4 h-4 ml-2" /> تعديل</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatus(p, "in_progress")}><CheckCircle2 className="w-4 h-4 ml-2 text-green-600" /> تفعيل</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatus(p, "awaiting_technical_review")}><Pause className="w-4 h-4 ml-2 text-amber-600" /> تعليق</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatus(p, "cancelled")}><XCircle className="w-4 h-4 ml-2 text-red-600" /> إيقاف</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => togglePin(p)}>{p.is_pinned ? "إلغاء التثبيت" : "تثبيت"}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleHide(p)}>{p.is_hidden ? "إظهار" : "إخفاء"}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={() => setPendingDelete(p)}><Trash2 className="w-4 h-4 ml-2" /> حذف</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <button type="button" onClick={() => openProjectDetails(p)} className="font-bold text-[#4A3F35] text-sm mb-1 hover:text-[#C9A66B] hover:underline text-right">{p.title || "—"}</button>
              <div className="text-xs text-slate-500 space-y-0.5">
                <p>العميل: {lookup.clients[p.client_id] || "—"}</p>
                <p>المدينة: {p.location || "—"}</p>
              </div>
              {(p.is_pinned || p.is_hidden) && (
                <div className="flex items-center gap-1 mt-2">
                  {p.is_pinned && <Badge className="bg-[#C9A66B]/15 text-[#C9A66B] border-[#C9A66B]/30" variant="outline"><Pin className="w-3 h-3 ml-1" />مثبت</Badge>}
                  {p.is_hidden && <Badge className="bg-slate-200 text-slate-600 border-slate-300" variant="outline"><EyeOff className="w-3 h-3 ml-1" />مخفي</Badge>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project details */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#4A3F35]">ملف المشروع الكامل</DialogTitle>
            <DialogDescription>تفاصيل المشروع وحالته المالية والتعاقدية من البيانات الفعلية.</DialogDescription>
          </DialogHeader>
          {selectedProject && <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-[#F8F5EF] border border-[#E8DFD1]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-bold text-[#4A3F35]">{selectedProject.title || "مشروع بدون اسم"}</h3><Badge className={`${STATUS_COLORS[selectedProject.status] || "bg-slate-100"} border`} variant="outline">{STATUS_LABELS[selectedProject.status] || selectedProject.status}</Badge></div><p className="text-sm text-slate-500 mt-2">{selectedProject.description || "لا يوجد وصف"}</p></div><Button variant="outline" size="sm" onClick={() => { setSelectedProject(null); openEdit(selectedProject); }}>تعديل</Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs text-slate-600"><span><UserRound className="inline w-3.5 h-3.5 ml-1"/>{lookup.clients[selectedProject.client_id] || "العميل غير معروف"}</span><span><MapPin className="inline w-3.5 h-3.5 ml-1"/>{selectedProject.location || "بدون موقع"}</span><span><CalendarDays className="inline w-3.5 h-3.5 ml-1"/>{selectedProject.deadline || "بدون موعد"}</span><span>{selectedProject.category || "بدون تصنيف"}</span></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[{l:"تقدم المرحلة",v:`${selectedProject.phase_progress || 0}%`},{l:"العروض",v:selectedProject.total_proposals || 0},{l:"الضمان",v:`${(selectedProject.escrow_amount || 0).toLocaleString('ar-SA')} ر.س`},{l:"الدفع",v:selectedProject.payment_status || "غير مدفوع"}].map(x => <Card key={x.l}><CardContent className="p-4"><p className="font-bold text-lg">{x.v}</p><p className="text-xs text-slate-500">{x.l}</p></CardContent></Card>)}
            </div>
            <Card><CardContent className="p-4"><h4 className="font-bold mb-3">مسار المشروع</h4><div className="flex flex-wrap gap-2 items-center">{[["design","التصميم"],["permits","التراخيص"],["execution","التنفيذ"],["delivery","التسليم"]].map(([key,label],idx) => <React.Fragment key={key}><Badge variant={selectedProject.phase === key ? "default" : "outline"}>{label}</Badge>{idx < 3 && <span className="text-slate-300">←</span>}</React.Fragment>)}</div>{selectedProject.phase_history?.length > 0 && <p className="text-xs text-slate-500 mt-3">عدد انتقالات المرحلة: {selectedProject.phase_history.length}</p>}</CardContent></Card>
            {projectDetailsLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#C9A66B]"/></div> : <div className="grid md:grid-cols-3 gap-4">
              <Card><CardContent className="p-4"><h4 className="font-bold mb-3 flex items-center gap-2"><FileText className="w-4 h-4"/> العقود</h4><p className="text-2xl font-bold">{projectRelations.contracts.length}</p>{projectRelations.contracts.slice(0,3).map(c => <p key={c.id} className="text-xs text-slate-500 mt-2 truncate">{c.contract_number || c.name || "عقد"} · {c.status || "—"}</p>)}</CardContent></Card>
              <Card><CardContent className="p-4"><h4 className="font-bold mb-3 flex items-center gap-2"><Receipt className="w-4 h-4"/> الفواتير</h4><p className="text-2xl font-bold">{projectRelations.invoices.length}</p>{projectRelations.invoices.slice(0,3).map(i => <p key={i.id} className="text-xs text-slate-500 mt-2 truncate">{i.invoice_number || "فاتورة"} · {(i.total_amount || i.amount || 0).toLocaleString('ar-SA')} ر.س</p>)}</CardContent></Card>
              <Card><CardContent className="p-4"><h4 className="font-bold mb-3 flex items-center gap-2"><Wallet className="w-4 h-4"/> المدفوعات</h4><p className="text-2xl font-bold">{projectRelations.payments.length}</p>{projectRelations.payments.slice(0,3).map(p => <p key={p.id} className="text-xs text-slate-500 mt-2 truncate">{(p.amount || 0).toLocaleString('ar-SA')} ر.س · {p.status || "—"}</p>)}</CardContent></Card>
            </div>}
            <div className="flex flex-wrap gap-2 text-xs text-slate-500"><span>المراجعة الفنية: {selectedProject.technical_review_status || "غير محددة"}</span><span>·</span><span>الموافقة النهائية: {selectedProject.client_final_approval ? "تمت" : "لم تتم"}</span><span>·</span><span>المرفقات: {selectedProject.attachments?.length || 0}</span></div>
          </div>}
        </DialogContent>
      </Dialog>

      {/* Add / Edit dialog */}
      <AddProjectDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={formProject}
        onCreated={onFormDone}
        onUpdated={onFormDone}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف المشروع</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف «{pendingDelete?.title}» نهائيًا. لا يمكن التراجع.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} disabled={busy} className="bg-red-600 hover:bg-red-700">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirm */}
      <AlertDialog open={!!pendingBulk} onOpenChange={(o) => !o && setPendingBulk(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الإجراء الجماعي</AlertDialogTitle>
            <AlertDialogDescription>سيتم تطبيق «حذف» على {bulk.selectedCount} مشروع نهائيًا. لا يمكن التراجع. هل أنت متأكد؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => runBulk(pendingBulk)} disabled={busy} className="bg-red-600 hover:bg-red-700">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد التنفيذ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}