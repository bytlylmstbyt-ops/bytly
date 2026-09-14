import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function RiskScoreBadge({ score }) {
  if (score === undefined || score === null) return <Badge variant="outline" className="text-xs">غير محلل</Badge>;
  if (score >= 70) return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">مخاطر عالية</Badge>;
  if (score >= 40) return <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">مخاطر متوسطة</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">مخاطر منخفضة</Badge>;
}

function ScoreBar({ score }) {
  if (score === undefined || score === null) return null;
  const color = score >= 70 ? "bg-red-500" : score >= 40 ? "bg-orange-400" : "bg-emerald-500";
  return (
    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

export default function ProjectRiskCard({ project, riskData, isAnalyzing, isSelected, onSelect, onAnalyze }) {
  const score = riskData?.analysis?.overall_risk_score;
  const alertsCount = riskData?.analysis?.critical_alerts?.length || 0;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md",
        isSelected ? "border-red-400 shadow-md ring-1 ring-red-300" : "border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 text-sm truncate">{project.title}</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{project.location || "—"}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <RiskScoreBadge score={score} />
          <ChevronLeft className="w-4 h-4 text-slate-300" />
        </div>
      </div>

      <ScoreBar score={score} />

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          {score !== undefined && (
            <span className="text-xs text-slate-500">
              نقاط المخاطر: <span className="font-semibold text-slate-700">{score}</span>
            </span>
          )}
          {alertsCount > 0 && (
            <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">
              {alertsCount} تنبيه
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={e => { e.stopPropagation(); onAnalyze(); }}
          disabled={isAnalyzing}
          className="h-7 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 px-2"
        >
          {isAnalyzing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}