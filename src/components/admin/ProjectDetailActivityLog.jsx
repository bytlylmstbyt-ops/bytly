import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, History, User, Clock, TrendingUp, RefreshCw,
  CheckCircle2, Edit3, Trash2, PlusCircle,
} from "lucide-react";

const ACTION_META = {
  created: { label: "إنشاء", cls: "bg-green-100 text-green-700 border-green-200", icon: PlusCircle },
  updated: { label: "تعديل", cls: "bg-blue-100 text-blue-700 border-blue-200", icon: Edit3 },
  status_changed: { label: "تغيير حالة", cls: "bg-amber-100 text-amber-700 border-amber-200", icon: TrendingUp },
  deleted: { label: "حذف", cls: "bg-red-100 text-red-700 border-red-200", icon: Trash2 },
};

const FIELD_LABELS = {
  status: "الحالة",
  technical_review_status: "المراجعة الفنية",
  payment_status: "حالة الدفع",
  escrow_status: "حالة الضمان",
  escrow_amount: "مبلغ الضمان",
  budget_min: "الحد الأدنى للميزانية",
  budget_max: "الحد الأعلى للميزانية",
  platform_commission: "عمولة المنصة %",
  engineer_payment: "صافي دفع المهندس",
  technical_consultant_fee: "أتعاب المستشار الفني",
  legal_consultant_fee: "أتعاب المستشار القانوني",
  assigned_engineer_id: "المهندس المسؤول",
  "title/description": "بيانات المشروع",
  project: "المشروع",
};

const isMoneyField = (f) =>
  ["escrow_amount", "budget_min", "budget_max", "engineer_payment", "technical_consultant_fee", "legal_consultant_fee"].includes(f);

const fmtVal = (f, v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (isMoneyField(f)) return `${Number(v).toLocaleString("en-US")} ر.س`;
  return String(v);
};

export default function ProjectDetailActivityLog({ projectId, projectTitle }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await base44.entities.TaskActivityLog.filter(
        { project_id: projectId },
        "-created_date",
        100
      ).catch(() => []);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // Realtime: live updates when a new log entry is created for this project
  useEffect(() => {
    const unsub = base44.entities.TaskActivityLog.subscribe((event) => {
      if (event.type === "create" && event.data?.project_id === projectId) {
        setLogs((prev) => [event.data, ...prev]);
      }
    });
    return unsub;
  }, [projectId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#C9A66B]" />
          <p className="text-sm font-medium text-[#4A3F35]">سجل النشاط التفصيلي</p>
          <Badge variant="outline" className="text-xs bg-slate-50">{logs.length} إجراء</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={load} className="text-slate-500 h-8">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="max-h-[420px] overflow-y-auto space-y-2 pl-1">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#C9A66B]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">لا يوجد نشاط مسجل لهذا المشروع بعد</p>
          </div>
        ) : (
          logs.map((log) => {
            const meta = ACTION_META[log.action_type] || {
              label: log.action_type,
              cls: "bg-slate-100 text-slate-600 border-slate-200",
              icon: Clock,
            };
            const Icon = meta.icon;
            const fieldLabel = FIELD_LABELS[log.field_name] || log.field_name || "—";
            const isFinancial = isMoneyField(log.field_name) || log.action_type === "updated";
            const dateObj = log.created_date ? new Date(log.created_date) : null;

            return (
              <div
                key={log.id}
                className="flex gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isFinancial ? "bg-blue-100" : "bg-[#C9A66B]/15"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isFinancial ? "text-blue-600" : "text-[#C9A66B]"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>
                      {meta.label}
                    </Badge>
                    {log.field_name && (
                      <span className="text-[11px] font-medium text-[#4A3F35] bg-slate-100 px-1.5 py-0.5 rounded">
                        {fieldLabel}
                      </span>
                    )}
                    {dateObj && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dateObj.toLocaleDateString("ar-SA")} • {dateObj.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                    {log.summary || log.description || "—"}
                  </p>

                  {log.old_value !== undefined && log.new_value !== undefined && log.field_name !== "title/description" && (
                    <p className="text-[10px] text-slate-500 mt-1 font-mono dir-ltr text-left">
                      <span className="line-through text-red-400">{fmtVal(log.field_name, log.old_value)}</span>
                      <span className="mx-1.5 text-slate-400">→</span>
                      <span className="text-[#6B5D4F] font-medium">{fmtVal(log.field_name, log.new_value)}</span>
                    </p>
                  )}

                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="font-medium text-[#4A3F35]">{log.actor_name || "—"}</span>
                    {log.actor_email && <span className="text-slate-400">({log.actor_email})</span>}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}