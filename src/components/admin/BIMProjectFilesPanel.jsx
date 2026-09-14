import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, FolderKanban, FileBox, Search, Building2, ChevronDown, ChevronLeft,
  Calendar, RefreshCw, ExternalLink, Layers, Folder, AlertCircle,
} from "lucide-react";

const SOURCE_LABELS = {
  manual: { label: "يدوي", variant: "secondary" },
  bim360: { label: "BIM 360", variant: "default" },
};

export default function BIMProjectFilesPanel() {
  const [models, setModels] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [expandedProjects, setExpandedProjects] = useState({});
  const [sourceFilter, setSourceFilter] = useState("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [modelsData, projectsData] = await Promise.all([
          base44.entities.BIMModel.list("-created_date", 500),
          base44.entities.Project.list("-created_date", 500),
        ]);
        setModels(modelsData || []);
        setProjects(projectsData || []);
      } catch (err) {
        setError("تعذّر تحميل نماذج BIM. حاول مرة أخرى لاحقًا.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const projectMap = useMemo(() => {
    const map = {};
    (projects || []).forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [projects]);

  // Group models by project_id (or "unassigned")
  const grouped = useMemo(() => {
    const groups = {};
    (models || []).forEach((m) => {
      const key = m.project_id || "_unassigned";
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  }, [models]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = {};
    Object.entries(grouped).forEach(([pid, items]) => {
      const proj = projectMap[pid];
      const projTitle = proj?.title || (pid === "_unassigned" ? "غير مرتبط بمشروع" : pid);
      const matched = items.filter((m) => {
        const matchesSearch = !q ||
          m.name?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.floor_level?.toLowerCase().includes(q) ||
          m.building_type?.toLowerCase().includes(q);
        const matchesSource = sourceFilter === "all" || m.source === sourceFilter;
        return matchesSearch && matchesSource;
      });
      const titleMatches = q && projTitle.toLowerCase().includes(q);
      if (matched.length > 0 || titleMatches) {
        result[pid] = titleMatches ? items : matched;
      }
    });
    return result;
  }, [grouped, projectMap, search, sourceFilter]);

  const toggleProject = (pid) => {
    setExpandedProjects((prev) => ({ ...prev, [pid]: !prev[pid] }));
  };

  const groupEntries = Object.entries(filteredGroups);
  const totalModels = Object.values(filteredGroups).reduce((s, arr) => s + arr.length, 0);

  return (
    <Card className="border-r-4 border-[#C9A66B] overflow-hidden">
      <CardContent className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4A3F35]/5 flex items-center justify-center">
              <Folder className="w-5 h-5 text-[#C9A66B]" />
            </div>
            <div>
              <h3 className="font-bold text-[#4A3F35] text-base">مجلدات وملفات BIM حسب المشروع</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                استعراض جميع نماذج BIM مصنّفة حسب المشروع لتسهيل الوصول
              </p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0 border-[#C9A66B]/40 text-[#4A3F35]">
            <Layers className="w-3 h-3 ml-1" />
            {totalModels} نموذج
          </Badge>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="ابحث باسم النموذج، الطابق، نوع المبنى..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            {[
              { key: "all", label: "الكل" },
              { key: "bim360", label: "BIM 360" },
              { key: "manual", label: "يدوي" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSourceFilter(opt.key)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  sourceFilter === opt.key
                    ? "bg-[#4A3F35] text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#C9A66B] animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        ) : groupEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileBox className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">
              {search || sourceFilter !== "all" ? "لا توجد نتائج مطابقة" : "لا توجد نماذج BIM بعد"}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {groupEntries.map(([pid, items]) => {
              const proj = projectMap[pid];
              const projTitle = proj?.title || (pid === "_unassigned" ? "غير مرتبط بمشروع" : "مشروع محذوف");
              const isExpanded = expandedProjects[pid] ?? true;
              return (
                <div key={pid} className="rounded-lg border border-slate-200 overflow-hidden">
                  {/* Project folder header */}
                  <button
                    onClick={() => toggleProject(pid)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-right"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        : <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
                      }
                      <FolderKanban className="w-4 h-4 text-[#C9A66B] shrink-0" />
                      <span className="text-sm font-semibold text-[#4A3F35] truncate">{projTitle}</span>
                      {pid !== "_unassigned" && proj?.status && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 shrink-0">
                          {proj.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400">{items.length} ملف</span>
                      {pid !== "_unassigned" && (
                        <Link
                          to={`/ProjectDetails?id=${pid}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#C9A66B] hover:text-[#4A3F35]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </button>

                  {/* Files */}
                  {isExpanded && (
                    <div className="divide-y divide-slate-100">
                      {items.map((m) => {
                        const src = SOURCE_LABELS[m.source] || SOURCE_LABELS.manual;
                        return (
                          <div key={m.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[#FEF9EE]/50 transition-colors">
                            <div className="w-8 h-8 rounded-md bg-[#C9A66B]/10 flex items-center justify-center shrink-0 mt-0.5">
                              <FileBox className="w-4 h-4 text-[#C9A66B]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium text-[#4A3F35] truncate">{m.name}</p>
                                <Badge variant={src.variant} className="text-[10px] py-0 px-1.5">{src.label}</Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap text-[11px] text-slate-400">
                                {m.floor_level && (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" /> {m.floor_level}
                                  </span>
                                )}
                                {m.building_type && <span>{m.building_type}</span>}
                                {m.last_bim360_sync && (
                                  <span className="flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3" />
                                    {new Date(m.last_bim360_sync).toLocaleDateString("ar-SA")}
                                  </span>
                                )}
                                {m.created_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(m.created_date).toLocaleDateString("ar-SA")}
                                  </span>
                                )}
                              </div>
                              {m.description && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{m.description}</p>
                              )}
                            </div>
                            {m.model_urn && (
                              <Link
                                to="/BIMDashboard"
                                className="text-[#C9A66B] hover:text-[#4A3F35] shrink-0"
                                title="فتح في لوحة BIM"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}