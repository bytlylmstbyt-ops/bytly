import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, AlertTriangle,
  PenTool, ShieldCheck, Hammer, Home, Flag, CalendarDays
} from "lucide-react";

const PHASES = [
  { key: "design", label: "التصميم", icon: PenTool },
  { key: "permits", label: "المراجعة والتراخيص", icon: ShieldCheck },
  { key: "execution", label: "التنفيذ", icon: Hammer },
  { key: "delivery", label: "التسليم", icon: Home },
];

export default function ProjectTimeline({ project, milestones }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Determine phase status
  const currentPhaseIdx = useMemo(() => {
    const idx = PHASES.findIndex(p => p.key === project.phase);
    return idx >= 0 ? idx : 0;
  }, [project.phase]);

  // Compute milestone stats
  const totalMs = milestones.length;
  const completedMs = milestones.filter(m => m.status === "approved" || m.status === "completed").length;
  const overdueMs = milestones.filter(m => {
    if (m.status === "approved" || m.status === "completed") return false;
    const due = m.due_date || m.deadline;
    return due && new Date(due) < today;
  });

  const startDate = project.start_date ? new Date(project.start_date) : null;
  const deadline = project.deadline ? new Date(project.deadline) : null;

  // Overall progress percentage
  const overallProgress = totalMs > 0 ? (completedMs / totalMs) * 100 : 0;

  // Is project overdue?
  const isOverdue = deadline && project.status !== "completed" && deadline < today;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h3 className="font-bold text-[#1a1a2e] text-lg flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#C9A66B]" />
          الشريط الزمني للمشروع
        </h3>
        {isOverdue && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-3 py-1 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5" />
            المشروع متأخر عن موعد التسليم
          </div>
        )}
      </div>

      {/* Date range */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          {startDate ? startDate.toLocaleDateString("ar-SA") : "غير محدد"}
        </div>
        <div className="flex items-center gap-1.5">
          <Flag className="w-3.5 h-3.5" />
          {deadline ? deadline.toLocaleDateString("ar-SA") : "غير محدد"}
        </div>
      </div>

      {/* Phase Stepper */}
      <div className="relative mb-6">
        {/* Progress line background */}
        <div className="absolute top-6 right-6 left-6 h-1 bg-slate-200 rounded-full" dir="ltr" />
        {/* Progress line fill */}
        <motion.div
          className="absolute top-6 right-6 h-1 bg-gradient-to-l from-[#6B5D4F] to-[#C9A66B] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(currentPhaseIdx / (PHASES.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ maxWidth: "calc(100% - 3rem)" }}
        />

        <div className="relative flex justify-between">
          {PHASES.map((phase, idx) => {
            const Icon = phase.icon;
            const isComplete = idx < currentPhaseIdx;
            const isActive = idx === currentPhaseIdx;
            const phaseHistory = project.phase_history?.find(h => h.phase === phase.key);
            const isOverduePhase = isActive && overdueMs.length > 0;

            return (
              <div key={phase.key} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all relative z-10 ${
                    isComplete
                      ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                      : isActive
                        ? "bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white shadow-lg ring-4 ring-[#C9A66B]/20"
                        : "bg-slate-100 text-slate-400"
                  } ${isOverduePhase ? "ring-4 ring-red-500/20" : ""}`}
                >
                  {isComplete ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                  {isActive && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
                <div className="text-center">
                  <p className={`text-[11px] md:text-xs font-medium ${isActive ? "text-[#C9A66B]" : isComplete ? "text-green-600" : "text-slate-400"}`}>
                    {phase.label}
                  </p>
                  {phaseHistory?.started_at && (
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      {new Date(phaseHistory.started_at).toLocaleDateString("ar-SA", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{completedMs}</p>
          <p className="text-[10px] text-slate-500">مراحل مكتملة</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[#C9A66B]">{totalMs - completedMs}</p>
          <p className="text-[10px] text-slate-500">مراحل متبقية</p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${overdueMs.length > 0 ? "text-red-600" : "text-slate-400"}`}>
            {overdueMs.length}
          </p>
          <p className="text-[10px] text-slate-500">مراحل متأخرة</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500">نسبة الإنجاز الكلية</span>
          <span className="text-xs font-bold text-[#1a1a2e]">{Math.round(overallProgress)}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-l from-[#6B5D4F] to-[#C9A66B] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      {/* Overdue milestones warning */}
      {overdueMs.length > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-medium text-red-700">مراحل متأخرة عن موعدها</p>
            <p className="text-red-600 mt-0.5">{overdueMs.map(m => m.title).join("، ")}</p>
          </div>
        </div>
      )}
    </div>
  );
}