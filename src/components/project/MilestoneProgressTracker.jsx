import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Clock, DollarSign, Lightbulb,
  ChevronDown, PenTool, ShieldCheck, Hammer, Home
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PHASES = [
  { key: "design", label: "تصميم", icon: PenTool },
  { key: "permits", label: "مراجعة", icon: ShieldCheck },
  { key: "execution", label: "تنفيذ", icon: Hammer },
  { key: "delivery", label: "تسليم", icon: Home },
];

export default function MilestoneProgressTracker({ project, milestones }) {
  const [expandedId, setExpandedId] = useState(null);

  // Compute financials
  const totalValue = milestones.reduce((s, m) => s + (m.amount || 0), 0);
  const paidAmount = milestones
    .filter(m => m.payment_released || m.status === "approved")
    .reduce((s, m) => s + (m.amount || 0), 0);
  const remainingAmount = totalValue - paidAmount;
  const commissionAmount = totalValue * 0.15;
  const engineerNet = totalValue * 0.85;

  const completedCount = milestones.filter(m => m.status === "approved").length;
  const totalCount = milestones.length;
  const overallProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Determine current phase index based on project.phase
  const currentPhaseIndex = PHASES.findIndex(p => p.key === project.phase);
  const activePhaseIdx = currentPhaseIndex >= 0 ? currentPhaseIndex : 0;

  const statusConfig = {
    pending: { label: "بانتظار البدء", color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200" },
    in_progress: { label: "قيد التنفيذ", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    submitted: { label: "تم التقديم", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
    revision_requested: { label: "مطلوب تعديل", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    approved: { label: "مكتملة", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
  };

  const getMilestoneStatus = (m) => {
    if (m.status === "approved" || m.payment_released) return "approved";
    if (m.status === "submitted") return "submitted";
    if (m.status === "revision_requested") return "revision_requested";
    if (m.status === "in_progress") return "in_progress";
    return "pending";
  };

  return (
    <Card className="border border-slate-200 shadow-sm overflow-hidden">
      <CardContent className="p-5 md:p-6 space-y-6" dir="rtl">
        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-[#333344]">مراحل المشروع</h2>
          <p className="text-sm text-slate-500 mt-0.5">{project.title}</p>
        </div>

        {/* Phase Stepper */}
        <div className="flex items-center justify-between gap-1 md:gap-2">
          {PHASES.map((phase, idx) => {
            const Icon = phase.icon;
            const isComplete = idx < activePhaseIdx;
            const isActive = idx === activePhaseIdx;
            return (
              <React.Fragment key={phase.key}>
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      isComplete
                        ? "bg-green-500 text-white shadow-md"
                        : isActive
                          ? "bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white shadow-lg ring-4 ring-[#C9A66B]/20 scale-105"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isComplete ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <Icon className="w-4 h-4 md:w-5 md:h-5" />}
                  </div>
                  <span className={`text-[11px] md:text-xs font-medium text-center ${isActive ? "text-[#C9A66B]" : isComplete ? "text-green-600" : "text-slate-400"}`}>
                    {phase.label}
                  </span>
                </div>
                {idx < PHASES.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-all ${idx < activePhaseIdx ? "bg-green-500" : "bg-slate-200"}`} style={{ maxWidth: 40 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#333344]">التقدم الكلي</span>
            <span className="text-sm text-slate-500">
              {completedCount} من {totalCount} مراحل مكتملة
            </span>
          </div>
          <div className="relative h-3 rounded-full bg-slate-200 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 right-0 bg-gradient-to-l from-[#6B5D4F] to-[#C9A66B] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            {overallProgress > 0 && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                {Math.round(overallProgress)}%
              </span>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#333344]">الملخص المالي للمشروع:</p>

          {/* Main 3 cards from the design reference */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {/* Work Value - Blue */}
            <div className="p-3 md:p-4 rounded-xl bg-[#e6f0ff] text-center">
              <p className="text-xs text-slate-600 mb-2">قيمة العمل</p>
              <div className="w-2 h-2 rounded-full bg-blue-500 mx-auto mb-2" />
              <p className="text-base md:text-lg font-bold text-blue-700">
                {totalValue.toLocaleString("ar-SA")}
              </p>
              <p className="text-[10px] text-slate-500">ر.س</p>
            </div>

            {/* Commission - Peach */}
            <div className="p-3 md:p-4 rounded-xl bg-[#fff2e6] text-center">
              <p className="text-xs text-slate-600 mb-2">العمولة (15%)</p>
              <div className="w-2 h-2 rounded-full bg-orange-500 mx-auto mb-2" />
              <p className="text-base md:text-lg font-bold text-orange-700">
                {commissionAmount.toLocaleString("ar-SA")}
              </p>
              <p className="text-[10px] text-slate-500">ر.س</p>
            </div>

            {/* Engineer Net - Green */}
            <div className="p-3 md:p-4 rounded-xl bg-[#e8f8e8] text-center">
              <p className="text-xs text-slate-600 mb-2">صافي المهندس</p>
              <div className="w-2 h-2 rounded-full bg-green-500 mx-auto mb-2" />
              <p className="text-base md:text-lg font-bold text-green-700">
                {engineerNet.toLocaleString("ar-SA")}
              </p>
              <p className="text-[10px] text-slate-500">ر.س</p>
            </div>
          </div>

          {/* Paid / Remaining row */}
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500">المدفوع</p>
                <p className="text-sm font-bold text-green-700">
                  {paidAmount.toLocaleString("ar-SA")} <span className="text-[10px] font-normal">ر.س</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500">المتبقي</p>
                <p className="text-sm font-bold text-amber-700">
                  {remainingAmount.toLocaleString("ar-SA")} <span className="text-[10px] font-normal">ر.س</span>
                </p>
              </div>
            </div>
          </div>

          {/* Footer info */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50">
            <Lightbulb className="w-4 h-4 text-[#C9A66B] shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              العمولة نسبة ثابتة 15% من قيمة المشروع، تُجمع بشكل متناسب مع كل مرحلة
            </p>
          </div>
        </div>

        {/* Interactive Milestone Cards */}
        {totalCount > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-sm font-semibold text-[#333344] pt-2">المراحل ({totalCount})</p>
            {milestones.map((m, idx) => {
              const status = getMilestoneStatus(m);
              const cfg = statusConfig[status] || statusConfig.pending;
              const isExpanded = expandedId === m.id;
              const isPaid = m.payment_released || m.status === "approved";

              return (
                <div
                  key={m.id}
                  className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-all cursor-pointer hover:shadow-md`}
                  onClick={() => setExpandedId(isExpanded ? null : m.id)}
                >
                  <div className="p-3 flex items-center gap-3">
                    {/* Step number */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isPaid ? "bg-green-500 text-white" : status === "in_progress" ? "bg-blue-500 text-white" : "bg-white text-slate-500 border border-slate-200"
                    }`}>
                      {isPaid ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>

                    {/* Title + status */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isPaid ? "text-slate-500" : "text-[#333344]"}`}>
                        {m.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>
                          {cfg.label}
                        </Badge>
                        {m.percentage && (
                          <span className="text-[10px] text-slate-400">{m.percentage}%</span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-left shrink-0">
                      <p className="text-sm font-bold text-[#333344]">{(m.amount || 0).toLocaleString("ar-SA")}</p>
                      <p className="text-[10px] text-slate-400">ر.س</p>
                    </div>

                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-0 space-y-3 border-t border-slate-200/50">
                          {m.description && (
                            <p className="text-xs text-slate-600 pt-2">{m.description}</p>
                          )}

                          {/* Financial breakdown */}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-lg bg-blue-50/50">
                              <p className="text-[10px] text-slate-500">قيمة المرحلة</p>
                              <p className="text-xs font-bold text-blue-700">{(m.amount || 0).toLocaleString("ar-SA")}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-orange-50/50">
                              <p className="text-[10px] text-slate-500">العمولة</p>
                              <p className="text-xs font-bold text-orange-700">{((m.amount || 0) * 0.15).toLocaleString("ar-SA")}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-green-50/50">
                              <p className="text-[10px] text-slate-500">صافي المهندس</p>
                              <p className="text-xs font-bold text-green-700">{((m.amount || 0) * 0.85).toLocaleString("ar-SA")}</p>
                            </div>
                          </div>

                          {/* Deliverable files */}
                          {m.deliverable_files && m.deliverable_files.length > 0 && (
                            <div>
                              <p className="text-[10px] text-slate-500 mb-1">الملفات المقدمة ({m.deliverable_files.length}):</p>
                              <div className="flex flex-wrap gap-1.5">
                                {m.deliverable_files.map((url, i) => (
                                  <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[10px] text-blue-600 hover:underline px-2 py-0.5 rounded bg-blue-50"
                                  >
                                    ملف {i + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Revision notes */}
                          {m.revision_notes && (
                            <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                              <p className="text-[10px] font-medium text-amber-700">ملاحظات التعديل:</p>
                              <p className="text-xs text-amber-600 mt-0.5">{m.revision_notes}</p>
                            </div>
                          )}

                          {/* Payment info */}
                          {isPaid && m.payment_release_date && (
                            <div className="flex items-center gap-1.5 text-[10px] text-green-600">
                              <DollarSign className="w-3 h-3" />
                              <span>تم تحرير الدفعة في {new Date(m.payment_release_date).toLocaleDateString("ar-SA")}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}