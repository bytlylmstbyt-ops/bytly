import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, TrendingUp, CheckCircle2, Loader2, ShieldAlert, RefreshCw, Bell, BarChart3 } from "lucide-react";
import RiskMetricsChart from "@/components/risk/RiskMetricsChart";

const categoryLabels = {
  delays: "تأخيرات",
  budget: "الميزانية",
  scope: "نطاق العمل",
  satisfaction: "رضا العميل",
};

const severityConfig = {
  high: { label: "عالية", class: "bg-red-100 text-red-700 border-red-200" },
  medium: { label: "متوسطة", class: "bg-orange-100 text-orange-700 border-orange-200" },
  low: { label: "منخفضة", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

function RiskItem({ risk }) {
  const [expanded, setExpanded] = useState(false);
  const sev = severityConfig[risk.severity] || severityConfig.medium;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-right p-4 hover:bg-slate-50 transition-colors flex items-start gap-3"
      >
        <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${risk.severity === "high" ? "text-red-500" : risk.severity === "medium" ? "text-orange-500" : "text-emerald-500"}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-800 text-sm">{risk.title}</span>
            <Badge className={`text-xs ${sev.class}`}>{sev.label}</Badge>
            <Badge variant="outline" className="text-xs">{categoryLabels[risk.category] || risk.category}</Badge>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-slate-500">
              الاحتمالية: <span className="font-medium text-slate-700">{risk.probability}%</span>
            </span>
            <span className="text-xs text-slate-500">
              التأثير: <span className="font-medium text-slate-700">{risk.impact}/10</span>
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t bg-slate-50 space-y-3">
          <p className="text-sm text-slate-600 mt-3">{risk.description}</p>
          {risk.mitigation_strategies?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                إجراءات وقائية مقترحة:
              </p>
              <ul className="space-y-1.5">
                {risk.mitigation_strategies.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RiskDetailPanel({ project, riskData, isAnalyzing, onAnalyze }) {
  if (!project) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 h-full min-h-64 flex flex-col items-center justify-center text-slate-400 p-8">
        <ShieldAlert className="w-12 h-12 opacity-20 mb-3" />
        <p className="text-sm font-medium">اختر مشروعاً لعرض تفاصيل المخاطر</p>
        <p className="text-xs mt-1">انقر على أي مشروع في القائمة لبدء التحليل</p>
      </div>
    );
  }

  const analysis = riskData?.analysis;
  const metrics = riskData?.metrics;
  const score = analysis?.overall_risk_score;

  const scoreColor = score >= 70 ? "text-red-600" : score >= 40 ? "text-orange-500" : "text-emerald-600";
  const scoreBg = score >= 70 ? "bg-red-50 border-red-200" : score >= 40 ? "bg-orange-50 border-orange-200" : "bg-emerald-50 border-emerald-200";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Panel Header */}
      <div className="p-5 border-b bg-slate-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-800">{project.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{project.location || "—"}</p>
          </div>
          <div className="flex items-center gap-2">
            {score !== undefined && (
              <div className={`px-3 py-1.5 rounded-lg border text-center ${scoreBg}`}>
                <p className={`text-2xl font-bold ${scoreColor}`}>{score}</p>
                <p className="text-xs text-slate-500">مؤشر المخاطر</p>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="gap-1.5"
            >
              {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              تحليل
            </Button>
          </div>
        </div>
      </div>

      {isAnalyzing && !analysis ? (
        <div className="flex flex-col items-center justify-center p-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-red-400" />
          <p className="text-sm">جاري تحليل مخاطر المشروع بالذكاء الاصطناعي...</p>
        </div>
      ) : !analysis ? (
        <div className="flex flex-col items-center justify-center p-16 text-slate-400">
          <BarChart3 className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">لم يتم تحليل هذا المشروع بعد</p>
          <Button onClick={onAnalyze} className="mt-4 bg-red-600 hover:bg-red-700 text-white" size="sm">
            بدء التحليل
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="risks" className="p-4">
          <TabsList className="mb-4">
            <TabsTrigger value="risks" className="gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              المخاطر ({analysis.risks?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              المؤشرات
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              التنبيهات {analysis.critical_alerts?.length > 0 && `(${analysis.critical_alerts.length})`}
            </TabsTrigger>
          </TabsList>

          {/* Risks Tab */}
          <TabsContent value="risks" className="space-y-3 mt-0">
            {analysis.summary && (
              <div className="p-3 bg-slate-50 rounded-lg border text-sm text-slate-600">
                {analysis.summary}
              </div>
            )}
            {analysis.risks?.length > 0 ? (
              analysis.risks
                .sort((a, b) => {
                  const order = { high: 0, medium: 1, low: 2 };
                  return (order[a.severity] || 1) - (order[b.severity] || 1);
                })
                .map((risk, i) => <RiskItem key={i} risk={risk} />)
            ) : (
              <p className="text-center text-slate-400 text-sm py-8">لا توجد مخاطر محددة</p>
            )}
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="mt-0">
            {metrics ? (
              <RiskMetricsChart metrics={metrics} />
            ) : (
              <p className="text-center text-slate-400 text-sm py-8">لا تتوفر بيانات مؤشرات</p>
            )}
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-0">
            {analysis.critical_alerts?.length > 0 ? (
              <div className="space-y-2">
                {analysis.critical_alerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{alert}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-400" />
                <p className="text-sm">لا توجد تنبيهات حرجة</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}