import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Search, X, FolderOpen, CheckSquare, FileText, Flag,
  Loader2, Filter, User, Clock
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

const TYPE_CONFIG = {
  project:   { label: "مشروع",   icon: FolderOpen,   color: "bg-blue-100 text-blue-700",   border: "border-blue-200" },
  task:      { label: "مهمة",    icon: CheckSquare,  color: "bg-indigo-100 text-indigo-700", border: "border-indigo-200" },
  milestone: { label: "معلم",    icon: Flag,         color: "bg-purple-100 text-purple-700", border: "border-purple-200" },
  document:  { label: "مستند",   icon: FileText,     color: "bg-amber-100 text-amber-700",   border: "border-amber-200" },
};

const STATUS_LABELS = {
  todo: "انتظار", in_progress: "تنفيذ", on_hold: "معلقة", completed: "مكتملة",
  active: "نشط", archived: "مؤرشف", pending: "قادم",
  contract: "عقد", specification: "مواصفات", design: "تصميم",
  report: "تقرير", invoice: "فاتورة", other: "أخرى",
};

function highlight(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function ResultItem({ item, query, onClick }) {
  const cfg = TYPE_CONFIG[item._type];
  const Icon = cfg.icon;
  return (
    <button
      onClick={() => onClick(item)}
      className={`w-full text-right flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors ${cfg.border} bg-white`}
    >
      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${cfg.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-slate-800 truncate">
            {highlight(item._title, query)}
          </p>
          <Badge className={`text-xs py-0 ${cfg.color}`}>{cfg.label}</Badge>
          {item.status && (
            <Badge variant="outline" className="text-xs py-0">{STATUS_LABELS[item.status] || item.status}</Badge>
          )}
        </div>
        {item._subtitle && (
          <p className="text-xs text-slate-500 mt-0.5 truncate">{highlight(item._subtitle, query)}</p>
        )}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {item._date && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(parseISO(item._date), 'd MMM yyyy', { locale: ar })}
            </span>
          )}
          {item._owner && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <User className="w-3 h-3" />{item._owner}
            </span>
          )}
          {item._project && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <FolderOpen className="w-3 h-3" />{item._project}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function GlobalSearchPanel({ open, onClose, projects, tasks, onEditTask, onOpenProject }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("");
  const inputRef = useRef(null);

  const projectMap = Object.fromEntries((projects || []).map(p => [p.id, p]));

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTypeFilter("all");
      setStatusFilter("all");
      setDateFilter("all");
      setOwnerFilter("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(() => runSearch(), 300);
    return () => clearTimeout(timer);
  }, [query, typeFilter, statusFilter, dateFilter, ownerFilter]);

  const runSearch = async () => {
    setLoading(true);
    try {
      const q = query.toLowerCase().trim();
      let allResults = [];

      // Search projects
      if (typeFilter === "all" || typeFilter === "project") {
        const projs = (projects || []).filter(p =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        ).map(p => ({
          ...p,
          _type: "project",
          _title: p.name,
          _subtitle: p.description,
          _date: p.created_date,
          _owner: p.owner_email,
        }));
        allResults.push(...projs);
      }

      // Search tasks
      if (typeFilter === "all" || typeFilter === "task") {
        const tsks = (tasks || []).filter(t =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.assigned_to?.toLowerCase().includes(q)
        ).map(t => ({
          ...t,
          _type: "task",
          _title: t.title,
          _subtitle: t.description || t.assigned_to,
          _date: t.created_date,
          _owner: t.assigned_to || t.created_by,
          _project: projectMap[t.project_id]?.name,
        }));
        allResults.push(...tsks);
      }

      // Search milestones
      if (typeFilter === "all" || typeFilter === "milestone") {
        const milestones = await base44.entities.ProjectMilestone2.list('-created_date', 200);
        const ms = milestones.filter(m =>
          m.title?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q)
        ).map(m => ({
          ...m,
          _type: "milestone",
          _title: m.title,
          _subtitle: m.description,
          _date: m.due_date || m.created_date,
          _project: projectMap[m.project_id]?.name,
        }));
        allResults.push(...ms);
      }

      // Search documents
      if (typeFilter === "all" || typeFilter === "document") {
        const docs = await base44.entities.Document.list('-created_date', 200);
        const filtered = docs.filter(d =>
          d.name?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q)
        ).map(d => ({
          ...d,
          _type: "document",
          _title: d.name,
          _subtitle: d.description || d.file_type,
          _date: d.created_date,
          _owner: d.uploaded_by || d.created_by,
          status: d.document_type,
        }));
        allResults.push(...filtered);
      }

      // Apply status filter
      if (statusFilter !== "all") {
        allResults = allResults.filter(r => r.status === statusFilter);
      }

      // Apply date filter
      if (dateFilter !== "all") {
        const now = new Date();
        allResults = allResults.filter(r => {
          if (!r._date) return false;
          const d = new Date(r._date);
          if (dateFilter === "today") return d.toDateString() === now.toDateString();
          if (dateFilter === "week") return (now - d) / (1000 * 60 * 60 * 24) <= 7;
          if (dateFilter === "month") return (now - d) / (1000 * 60 * 60 * 24) <= 30;
          return true;
        });
      }

      // Apply owner filter
      if (ownerFilter.trim()) {
        allResults = allResults.filter(r =>
          r._owner?.toLowerCase().includes(ownerFilter.toLowerCase()) ||
          r.created_by?.toLowerCase().includes(ownerFilter.toLowerCase())
        );
      }

      setResults(allResults);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item) => {
    if (item._type === "task") {
      onEditTask?.(item);
      onClose();
    } else if (item._type === "project") {
      onOpenProject?.(item);
      onClose();
    } else if (item._type === "document" && item.file_url) {
      window.open(item.file_url, "_blank");
    }
  };

  const groupedResults = results.reduce((acc, r) => {
    if (!acc[r._type]) acc[r._type] = [];
    acc[r._type].push(r);
    return acc;
  }, {});

  const typeOrder = ["project", "task", "milestone", "document"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden" dir="rtl">
        {/* Search Input */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="ابحث في المشاريع، المهام، المعالم، المستندات..."
              className="pr-10 pl-10 text-base h-11"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute left-3 top-3 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-2 border-b bg-slate-50 flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              <SelectItem value="project">مشاريع</SelectItem>
              <SelectItem value="task">مهام</SelectItem>
              <SelectItem value="milestone">معالم</SelectItem>
              <SelectItem value="document">مستندات</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="todo">انتظار</SelectItem>
              <SelectItem value="in_progress">تنفيذ</SelectItem>
              <SelectItem value="on_hold">معلقة</SelectItem>
              <SelectItem value="completed">مكتملة</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="pending">قادم</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأوقات</SelectItem>
              <SelectItem value="today">اليوم</SelectItem>
              <SelectItem value="week">هذا الأسبوع</SelectItem>
              <SelectItem value="month">هذا الشهر</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={ownerFilter}
            onChange={e => setOwnerFilter(e.target.value)}
            placeholder="فلتر بالمسؤول..."
            className="h-7 text-xs w-36"
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {query.length < 2 && (
            <div className="text-center py-12 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">اكتب كلمتين على الأقل للبحث</p>
              <p className="text-xs mt-1">يشمل البحث: المشاريع، المهام، المعالم، والمستندات</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">لا توجد نتائج لـ "{query}"</p>
              <p className="text-xs mt-1">جرّب كلمات مختلفة أو قلّل من الفلاتر</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <p className="text-xs text-slate-500">{results.length} نتيجة</p>
              {typeOrder.map(type => {
                const group = groupedResults[type];
                if (!group?.length) return null;
                const cfg = TYPE_CONFIG[type];
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-2">
                      <cfg.icon className="w-4 h-4 text-slate-400" />
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{cfg.label}ات ({group.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {group.map(item => (
                        <ResultItem key={`${item._type}-${item.id}`} item={item} query={query} onClick={handleItemClick} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}