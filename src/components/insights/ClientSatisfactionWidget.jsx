import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientSatisfactionWidget({ projectId }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalysis();
  }, [projectId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke("analyzeClientSatisfaction", {
        project_id: projectId
      });
      
      if (response.data.success) {
        setAnalysis(response.data.analysis);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>رضا العميل</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>رضا العميل</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">لم يتمكن من تحليل البيانات</p>
        </CardContent>
      </Card>
    );
  }

  const getSatisfactionColor = (score) => {
    if (score >= 8) return "bg-green-100 text-green-800";
    if (score >= 6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getSatisfactionLabel = (score) => {
    if (score >= 8) return "ممتاز";
    if (score >= 6) return "جيد";
    return "يحتاج انتباه";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>رضا العميل</CardTitle>
          <Badge className={getSatisfactionColor(analysis.satisfaction_score)}>
            {analysis.satisfaction_score}/10 - {getSatisfactionLabel(analysis.satisfaction_score)}
          </Badge>
        </div>
        <CardDescription>تحليل مدفوع بـ AI لرضا العميل</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Positive Sentiments */}
        {analysis.positive_sentiments?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-sm font-medium">النقاط الإيجابية</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.positive_sentiments.map((sentiment, idx) => (
                <Badge key={idx} variant="outline" className="bg-green-50">
                  {sentiment}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Negative Sentiments */}
        {analysis.negative_sentiments?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <p className="text-sm font-medium">النقاط التي تحتاج انتباه</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.negative_sentiments.map((sentiment, idx) => (
                <Badge key={idx} variant="outline" className="bg-red-50 border-red-200">
                  {sentiment}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-medium">التوصيات</p>
            </div>
            <ul className="space-y-1 text-sm">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="text-slate-600">• {rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Summary */}
        {analysis.summary && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-700">{analysis.summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}