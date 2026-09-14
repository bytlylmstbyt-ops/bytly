import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SBCOverviewStats from "@/components/sbc/SBCOverviewStats";
import SBCProjectProgressChart from "@/components/sbc/SBCProjectProgressChart";
import SBCComplianceChart from "@/components/sbc/SBCComplianceChart";
import SBCPhaseRadarChart from "@/components/sbc/SBCPhaseRadarChart";
import SBCProjectTable from "@/components/sbc/SBCProjectTable";
import { Loader2, ClipboardList, Filter } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const STAGES = ["design", "permits", "foundation", "structure", "finishing", "handover"];

const STAGE_LABELS = {
  design: "التصميم",
  permits: "التراخيص",
  foundation: "الأساسات",
  structure: "الهيكل",
  finishing: "التشطيب",
  handover: "التسليم",
};

export default function SBCProgressDashboard() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stageFilter, setStageFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [progressList, reviewList] = await Promise.all([
        base44.entities.BuildingProgress.list("-updated_date", 100),
        base44.entities.TechnicalReview.list("-updated_date", 100),
      ]);
      setProjects(progressList || []);
      setReviews(reviewList || []);
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Build compliance lookup by project_id
  const complianceByProject = {};
  (reviews || []).forEach((r) => {
    if (r.project_id) complianceByProject[r.project_id] = r.compliance_status || "pending";
  });

  // Merge compliance into projects
  const mergedProjects = projects.map((p) => ({
    ...p,
    compliance_status: complianceByProject[p.project_id] || "pending",
  }));

  const filteredProjects =
    stageFilter === "all"
      ? mergedProjects
      : mergedProjects.filter((p) => p.current_stage === stageFilter);

  // Overview stats
  const totalProjects = mergedProjects.length;
  const avgProgress =
    totalProjects > 0
      ? mergedProjects.reduce((sum, p) => sum + (p.overall_progress || 0), 0) / totalProjects
      : 0;

  const complianceCounts = { compliant: 0, compliant_with_notes: 0, non_compliant: 0, pending: 0 };
  mergedProjects.forEach((p) => {
    const status = p.compliance_status || "pending";
    complianceCounts[status] = (complianceCounts[status] || 0) + 1;
  });
  const reviewedTotal = complianceCounts.compliant + complianceCounts.compliant_with_notes + complianceCounts.non_compliant;
  const complianceRate =
    reviewedTotal > 0
      ? ((complianceCounts.compliant + complianceCounts.compliant_with_notes) / reviewedTotal) * 100
      : 0;
  const pendingReviews = complianceCounts.pending;

  // Per-project stacked bar data
  const projectChartData = mergedProjects.map((p) => {
    const stages = p.stages && Array.isArray(p.stages) ? p.stages : [];
    const stageMap = {};
    STAGES.forEach((s, idx) => {
      const stageData = stages.find((st) => st.stage === s || st.name === s);
      stageMap[s] = stageData ? (stageData.progress || stageData.percentage || 0) : 0;
    });
    // If no stages array, estimate from overall progress distributed by current stage
    if (stages.length === 0 && p.overall_progress) {
      const currentIdx = STAGES.indexOf(p.current_stage);
      STAGES.forEach((s, idx) => {
        if (idx < currentIdx) stageMap[s] = Math.round(100 / STAGES.length);
        else if (idx === currentIdx) stageMap[s] = p.overall_progress % Math.round(100 / STAGES.length);
      });
    }
    const name = (p.project_title || "مشروع").substring(0, 20);
    return { name, ...stageMap };
  });

  // Radar data: average progress per stage across all projects
  const phaseAverages = {};
  STAGES.forEach((stage) => {
    const values = mergedProjects
      .map((p) => {
        const stages = p.stages && Array.isArray(p.stages) ? p.stages : [];
        const sd = stages.find((st) => st.stage === stage || st.name === stage);
        return sd ? (sd.progress || sd.percentage || 0) : null;
      })
      .filter((v) => v !== null);
    phaseAverages[stage] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
          <p className="text-slate-500 text-sm">جارٍ تحميل بيانات سير المشاريع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#1a1a2e] flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-[#C9A66B]" />
                لوحة سير المشاريع — معايير SBC
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                ملخص مرئي للتقدم الفعلي في كل مرحلة هندسية وحالة المطابقة للكود السعودي
              </p>
            </div>
            {/* Stage Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <SelectValue placeholder="كل المراحل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المراحل</SelectItem>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Overview Stats */}
        <SBCOverviewStats
          stats={{
            totalProjects,
            avgProgress,
            complianceRate,
            pendingReviews,
          }}
        />

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SBCProjectProgressChart data={projectChartData} />
          </div>
          <SBCComplianceChart data={complianceCounts} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SBCPhaseRadarChart data={phaseAverages} />
          {/* SBC Stage Summary Card */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-[#1a1a2e] mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#C9A66B]" />
              ملخص المراحل الهندسية
            </h3>
            <div className="space-y-3">
              {STAGES.map((stage) => {
                const count = mergedProjects.filter((p) => p.current_stage === stage).length;
                const pct = totalProjects > 0 ? (count / totalProjects) * 100 : 0;
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-20 shrink-0">{STAGE_LABELS[stage]}</span>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-end px-2 text-xs font-medium text-slate-700">
                        {count} مشروع
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Project Table */}
        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">تفاصيل المشاريع</h2>
          {filteredProjects.length === 0 ? (
            <div className="rounded-xl border bg-white p-12 text-center text-slate-400">
              لا توجد مشاريع في هذه المرحلة
            </div>
          ) : (
            <SBCProjectTable projects={filteredProjects} />
          )}
        </div>
      </div>
    </div>
  );
}