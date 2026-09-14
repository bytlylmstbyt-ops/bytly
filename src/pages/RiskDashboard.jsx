import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import RiskOverviewStats from "@/components/risk/RiskOverviewStats";
import ProjectRiskCard from "@/components/risk/ProjectRiskCard";
import RiskDetailPanel from "@/components/risk/RiskDetailPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, ShieldAlert, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RiskDashboard() {
  const [projects, setProjects] = useState([]);
  const [riskResults, setRiskResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const data = await base44.entities.Project.filter({ status: "in_progress" });
    setProjects(data);
    setLoading(false);
  };

  const analyzeProject = async (projectId) => {
    setAnalyzingId(projectId);
    const res = await base44.functions.invoke("analyzeProjectRisks", { project_id: projectId });
    setRiskResults(prev => ({ ...prev, [projectId]: res.data }));
    setAnalyzingId(null);
    return res.data;
  };

  const analyzeAll = async () => {
    setAnalyzingAll(true);
    for (const p of projects) {
      if (!riskResults[p.id]) {
        await analyzeProject(p.id);
      }
    }
    setAnalyzingAll(false);
  };

  const handleSelectProject = async (project) => {
    setSelectedProject(project);
    if (!riskResults[project.id]) {
      await analyzeProject(project.id);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (severityFilter === "all") return true;
    const result = riskResults[p.id];
    if (!result?.analysis) return severityFilter === "unanalyzed";
    const score = result.analysis.overall_risk_score || 0;
    if (severityFilter === "high") return score >= 70;
    if (severityFilter === "medium") return score >= 40 && score < 70;
    if (severityFilter === "low") return score < 40;
    return true;
  });

  const analyzedCount = Object.keys(riskResults).length;
  const highRiskCount = Object.values(riskResults).filter(r => (r?.analysis?.overall_risk_score || 0) >= 70).length;
  const criticalAlerts = Object.values(riskResults).reduce((acc, r) => acc + (r?.analysis?.critical_alerts?.length || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">لوحة تقييم المخاطر</h1>
                <p className="text-sm text-slate-500">تحليل ذكي للمخاطر والتأخيرات المحتملة</p>
              </div>
            </div>
            <Button
              onClick={analyzeAll}
              disabled={analyzingAll || projects.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${analyzingAll ? "animate-spin" : ""}`} />
              {analyzingAll ? "جاري التحليل..." : "تحليل جميع المشاريع"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats */}
        <RiskOverviewStats
          totalProjects={projects.length}
          analyzedCount={analyzedCount}
          highRiskCount={highRiskCount}
          criticalAlerts={criticalAlerts}
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="ابحث عن مشروع..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-44">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="تصفية حسب المخاطر" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المشاريع</SelectItem>
              <SelectItem value="high">مخاطر عالية</SelectItem>
              <SelectItem value="medium">مخاطر متوسطة</SelectItem>
              <SelectItem value="low">مخاطر منخفضة</SelectItem>
              <SelectItem value="unanalyzed">غير محلل</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-700 text-sm">
                المشاريع ({filteredProjects.length})
              </h2>
              {analyzedCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {analyzedCount} محلل
                </Badge>
              )}
            </div>

            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-xl animate-pulse border" />
              ))
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد مشاريع نشطة</p>
              </div>
            ) : (
              filteredProjects.map(project => (
                <ProjectRiskCard
                  key={project.id}
                  project={project}
                  riskData={riskResults[project.id]}
                  isAnalyzing={analyzingId === project.id}
                  isSelected={selectedProject?.id === project.id}
                  onSelect={() => handleSelectProject(project)}
                  onAnalyze={() => analyzeProject(project.id)}
                />
              ))
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            <RiskDetailPanel
              project={selectedProject}
              riskData={selectedProject ? riskResults[selectedProject.id] : null}
              isAnalyzing={analyzingId === selectedProject?.id}
              onAnalyze={() => selectedProject && analyzeProject(selectedProject.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}