import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban, Loader2, Search, Filter, Eye, RefreshCw,
  TrendingUp, Clock, CheckCircle2, AlertTriangle, Wallet, FileText, Users
} from "lucide-react";
import { motion } from "framer-motion";

const STATUS_LABELS = {
  open: "مفتوح",
  in_progress: "قيد التنفيذ",
  awaiting_technical_review: "بانتظار المراجعة الفنية",
  technical_approved: "معتمد فنيًا",
  pending_client_approval: "بانتظار موافقة العميل",
  completed: "مكتمل",
  cancelled: "ملغي",
  disputed: "نزاع",
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

export default function AdminProjects() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const loadProjects = async () => {
    setRefreshing(true);
    try {
      const list = await base44.entities.Project.list("-created_date", 500);
      setProjects(list);
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const stats = useMemo(() => {
    const total = projects.length;
    const open = projects.filter(p => p.status === "open").length;
    const inProgress = projects.filter(p => p.status === "in_progress").length;
    const completed = projects.filter(p => p.status === "completed").length;
    const disputed = projects.filter(p => p.status === "disputed").length;
    const awaiting = projects.filter(p =>
      ["awaiting_technical_review", "pending_client_approval"].includes(p.status)
    ).length;
    const escrowTotal = projects.reduce((sum, p) => sum + (p.escrow_amount || 0), 0);
    return { total, open, inProgress, completed, disputed, awaiting, escrowTotal };
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = !search ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.location?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, search, statusFilter]);

  const statCards = [
    { label: "إجمالي المشاريع", value: stats.total, icon: FolderKanban, color: "text-[#4A3F35]", bg: "bg-[#F5F0E8]" },
    { label: "مفتوحة", value: stats.open, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "قيد التنفيذ", value: stats.inProgress, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "بانتظار موافقة", value: stats.awaiting, icon: AlertTriangle, color: "text-cyan-600", bg: "bg-cyan-50" },
    { label: "مكتملة", value: stats.completed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "نزاعات", value: stats.disputed, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    { label: "إجمالي الضمان", value: `${stats.escrowTotal.toLocaleString()} ر.س`, icon: Wallet, color: "text-[#C9A66B]", bg: "bg-[#FEF9EE]" },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10" dir="rtl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#4A3F35]">لوحة إدارة المشاريع</h1>
              <p className="text-sm text-slate-500">إدارة شاملة لجميع مشاريع المنصة في مكان واحد</p>
            </div>
          </div>
          <Button variant="outline" onClick={loadProjects} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ml-2 ${refreshing ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <p className="text-xl font-bold text-[#4A3F35] truncate">{s.value}</p>
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
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="ابحث بعنوان المشروع أو الموقع..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#C9A66B] cursor-pointer"
              >
                <option value="all">كل الحالات</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">لا توجد مشاريع مطابقة</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.02, 0.3) }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow group">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="font-bold text-[#4A3F35] truncate">{project.title || "بدون عنوان"}</h3>
                        <Badge className={`${STATUS_COLORS[project.status] || "bg-slate-100 text-slate-500"} border`} variant="outline">
                          {STATUS_LABELS[project.status] || project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-1 mb-2">
                        {project.description || "لا يوجد وصف"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                        {project.location && <span className="flex items-center gap-1">📍 {project.location}</span>}
                        {project.category && <span className="flex items-center gap-1">🏷️ {project.category}</span>}
                        {project.total_proposals > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {project.total_proposals} عرض</span>}
                        {project.escrow_amount > 0 && <span className="flex items-center gap-1"><Wallet className="w-3 h-3 text-[#C9A66B]" /> {project.escrow_amount.toLocaleString()} ر.س</span>}
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {new Date(project.created_date).toLocaleDateString("ar-SA")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={createPageUrl("ProjectDetails") + `?id=${project.id}`}>
                        <Button variant="outline" size="sm" className="hover:border-[#C9A66B] hover:text-[#C9A66B]">
                          <Eye className="w-4 h-4 ml-1" />
                          عرض
                        </Button>
                      </Link>
                      <Link to={createPageUrl("ProjectMilestones") + `?project_id=${project.id}`}>
                        <Button variant="ghost" size="sm">
                          المراحل
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer count */}
      <p className="text-center text-xs text-slate-400 mt-6">
        عرض {filtered.length} من {projects.length} مشروع
      </p>
    </div>
  );
}