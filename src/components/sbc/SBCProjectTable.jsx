import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

const STAGE_LABELS = {
  design: "التصميم",
  permits: "التراخيص",
  foundation: "الأساسات",
  structure: "الهيكل",
  finishing: "التشطيب",
  handover: "التسليم",
};

const STAGE_ORDER = ["design", "permits", "foundation", "structure", "finishing", "handover"];

const COMPLIANCE_BADGE = {
  compliant: { label: "مطابق", className: "bg-green-100 text-green-700" },
  compliant_with_notes: { label: "مطابق بملاحظات", className: "bg-amber-100 text-amber-700" },
  non_compliant: { label: "غير مطابق", className: "bg-red-100 text-red-700" },
  pending: { label: "قيد المراجعة", className: "bg-slate-100 text-slate-600" },
};

export default function SBCProjectTable({ projects }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-right">
                <th className="px-4 py-3 font-semibold text-slate-600">المشروع</th>
                <th className="px-4 py-3 font-semibold text-slate-600">المرحلة الحالية</th>
                <th className="px-4 py-3 font-semibold text-slate-600 min-w-[160px]">نسبة الإنجاز</th>
                <th className="px-4 py-3 font-semibold text-slate-600">مطابقة SBC</th>
                <th className="px-4 py-3 font-semibold text-slate-600">المهندس</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const stageIdx = STAGE_ORDER.indexOf(p.current_stage);
                const compliance = p.compliance_status || "pending";
                const cb = COMPLIANCE_BADGE[compliance];
                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-[#1a1a2e] truncate max-w-[200px]">
                          {p.project_title || "مشروع بدون عنوان"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {STAGE_LABELS[p.current_stage] || "—"}
                      </Badge>
                      <span className="text-xs text-slate-400 mr-1">
                        ({stageIdx + 1}/{STAGE_ORDER.length})
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={p.overall_progress || 0} className="h-2 flex-1" />
                        <span className="text-xs font-medium text-slate-600 w-10 text-left">
                          {p.overall_progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cb.className + " text-xs"}>{cb.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {p.engineer_name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/BuildingProgress`}
                        className="inline-flex items-center text-[#C9A66B] hover:underline text-xs font-medium"
                      >
                        التفاصيل
                        <ChevronLeft className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}