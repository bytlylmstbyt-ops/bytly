import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Shield, Clock, DollarSign, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function ProjectRiskAnalysis({ projectId }) {
  const [analysis, setAnalysis] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeRisks();
  }, [projectId]);

  const analyzeRisks = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke("analyzeProjectRisks", {
        project_id: projectId
      });

      if (response.data.success) {
        setAnalysis(response.data.analysis);
        setMetrics(response.data.metrics);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskIcon = (category) => {
    switch (category) {
      case "delays":
        return <Clock className="w-4 h-4" />;
      case "budget":
        return <DollarSign className="w-4 h-4" />;
      case "scope":
        return <Zap className="w-4 h-4" />;
      case "satisfaction":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getRiskScoreColor = (score) => {
    if (score >= 70) return "text-red-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>تحليل مخاطر المشروع</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>تحليل مخاطر المشروع</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">لم يتمكن من تحليل المخاطر</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Risk Score */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">درجة المخاطرة الإجمالية</CardTitle>
              <CardDescription>تقييم شامل لمخاطر المشروع</CardDescription>
            </div>
            <div className={`text-4xl font-bold ${getRiskScoreColor(analysis.overall_risk_score)}`}>
              {analysis.overall_risk_score}%
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                analysis.overall_risk_score >= 70
                  ? "bg-red-600"
                  : analysis.overall_risk_score >= 40
                  ? "bg-yellow-600"
                  : "bg-green-600"
              }`}
              style={{ width: `${analysis.overall_risk_score}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {analysis.critical_alerts?.length > 0 && (
        <div className="space-y-2">
          {analysis.critical_alerts.map((alert, idx) => (
            <Alert key={idx} className="border-red-300 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{alert}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Card className="p-3">
            <p className="text-xs text-slate-600">نسبة الإنجاز</p>
            <p className="text-xl font-bold text-blue-600">{metrics.completion_rate.toFixed(0)}%</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-slate-600">المهام المتأخرة</p>
            <p className="text-xl font-bold text-orange-600">{metrics.overdue_tasks}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-slate-600">استخدام الميزانية</p>
            <p className="text-xl font-bold text-green-600">{metrics.budget_utilization.toFixed(0)}%</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-slate-600">صحة الجدول</p>
            <p className="text-xl font-bold text-purple-600">{metrics.schedule_health.toFixed(0)}%</p>
          </Card>
        </div>
      )}

      {/* Risks List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>المخاطر المكتشفة</CardTitle>
            <Button size="sm" variant="outline" onClick={analyzeRisks} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysis.risks && analysis.risks.length > 0 ? (
            analysis.risks.map((risk, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`border rounded-lg p-4 space-y-2 ${getSeverityColor(risk.severity)}`}
              >
                <div className="flex items-start gap-3">
                  {getRiskIcon(risk.category)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{risk.title}</p>
                      <Badge variant="outline" className="text-xs">
                        احتمالية: {risk.probability}%
                      </Badge>
                    </div>
                    <p className="text-xs mt-1 opacity-90">{risk.description}</p>

                    {/* Mitigation Strategies */}
                    {risk.mitigation_strategies?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                        <p className="text-xs font-semibold mb-1">استراتيجيات التخفيف:</p>
                        <ul className="space-y-0.5">
                          {risk.mitigation_strategies.slice(0, 2).map((strategy, sIdx) => (
                            <li key={sIdx} className="text-xs">
                              • {strategy}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-6">
              <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600">لا توجد مخاطر كبيرة مكتشفة</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {analysis.summary && (
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-sm">الملخص التحليلي</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}