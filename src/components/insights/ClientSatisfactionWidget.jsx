import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
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
    if (!projectId) {
      setError("معرّف المشروع غير متوفر");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setAnalysis(null);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) throw new Error("يرجى تسجيل الدخول لعرض تقييمات المشروع");
      const { data: reviews, error: reviewsError } = await supabase
        .from("project_reviews")
        .select("rating,quality_rating,communication_rating,delivery_rating,comment,created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (reviewsError) throw reviewsError;
      const rows = reviews || [];
      if (!rows.length) {
        setAnalysis(null);
        setError("لا توجد تقييمات مسجلة لهذا المشروع حتى الآن");
        return;
      }
      const average = (field) => {
        const values = rows.map(row => Number(row[field])).filter(value => Number.isFinite(value) && value >= 0 && value <= 5);
        return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
      };
      const overall = average("rating");
      const score = overall == null ? 0 : Math.round(overall * 2 * 10) / 10;
      const positive = [];
      const needsAttention = [];
      const dimensions = [
        ["جودة الخدمة", average("quality_rating")],
        ["التواصل", average("communication_rating")],
        ["الالتزام بالتسليم", average("delivery_rating")],
      ];
      dimensions.forEach(([label, value]) => {
        if (value == null) return;
        if (value >= 4) positive.push(label + " (" + value.toFixed(1) + "/5)");
        if (value < 3) needsAttention.push(label + " (" + value.toFixed(1) + "/5)");
      });
      setAnalysis({
        satisfaction_score: score,
        positive_sentiments: positive,
        negative_sentiments: needsAttention,
        recommendations: overall < 3 ? ["راجع الملاحظات المسجلة مع مقدم الخدمة قبل إغلاق المشروع."] : [],
        summary: "المؤشر مبني على " + rows.length + " تقييم مسجل، ومتوسط التقييم العام " + (overall == null ? "غير متوفر" : overall.toFixed(1) + " من 5") + ". هذا ملخص إحصائي للتقييمات وليس تحليل مشاعر بالذكاء الاصطناعي."
      });
    } catch (err) {
      setError(err?.message || "تعذر تحميل تقييمات المشروع");
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
          <p className="text-sm text-slate-500">لا تتوفر بيانات كافية لعرض مؤشر الرضا</p>
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
        <CardDescription>ملخص إحصائي مبني على تقييمات المشروع</CardDescription>
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