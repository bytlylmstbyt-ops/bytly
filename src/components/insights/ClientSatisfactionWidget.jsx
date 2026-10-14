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
    try {
      setLoading(true);
      setError(null);
      setAnalysis(null);
      if (!projectId) throw new Error("معرّف المشروع غير متوفر");
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) throw new Error("يرجى تسجيل الدخول لعرض التقييمات");
      const { data: reviews, error: reviewError } = await supabase
        .from("project_reviews")
        .select("rating,quality_rating,communication_rating,delivery_rating,comment,created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (reviewError) throw reviewError;
      const rows = reviews || [];
      if (!rows.length) {
        setAnalysis({ satisfaction_score: null, positive_sentiments: [], negative_sentiments: [], recommendations: ["لا توجد تقييمات مسجلة لهذا المشروع بعد."], summary: "لا تتوفر تقييمات كافية لحساب مؤشر رضا موثوق." , review_count: 0 });
        return;
      }
      const average = (field) => {
        const values = rows.map(row => Number(row[field])).filter(value => Number.isFinite(value) && value >= 1 && value <= 5);
        return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
      };
      const overall = average("rating");
      const score = overall === null ? null : Math.round(overall * 2 * 10) / 10;
      const positive = [];
      const negative = [];
      const communication = average("communication_rating");
      const quality = average("quality_rating");
      const delivery = average("delivery_rating");
      if (quality !== null && quality >= 4) positive.push("جودة الخدمة مرتفعة حسب التقييمات");
      if (communication !== null && communication >= 4) positive.push("التواصل جيد حسب التقييمات");
      if (delivery !== null && delivery >= 4) positive.push("الالتزام بالتسليم جيد حسب التقييمات");
      if (quality !== null && quality < 3) negative.push("تقييم جودة الخدمة منخفض نسبيًا");
      if (communication !== null && communication < 3) negative.push("التواصل يحتاج إلى تحسين");
      if (delivery !== null && delivery < 3) negative.push("التسليم يحتاج إلى متابعة");
      const recommendations = [];
      if (communication !== null && communication < 4) recommendations.push("اتفقوا على تحديثات دورية واضحة بين العميل ومقدم الخدمة.");
      if (delivery !== null && delivery < 4) recommendations.push("راجعوا مواعيد المراحل المتبقية ومسؤوليات التسليم.");
      if (quality !== null && quality < 4) recommendations.push("وثّقوا ملاحظات الجودة وخطة معالجتها قبل اعتماد المرحلة التالية.");
      if (!recommendations.length) recommendations.push("استمروا في توثيق الملاحظات بعد كل مرحلة للحفاظ على جودة الخدمة.");
      setAnalysis({
        satisfaction_score: score,
        positive_sentiments: positive,
        negative_sentiments: negative,
        recommendations,
        summary: score === null ? "التقييمات موجودة لكن لا تتوفر درجات عامة صالحة للحساب." : "متوسط رضا العملاء " + score + " من 10 اعتمادًا على " + rows.length + " تقييمًا مسجلًا. هذا مؤشر حسابي من قاعدة البيانات وليس تحليلًا لغويًا بالذكاء الاصطناعي.",
        review_count: rows.length,
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
          <p className="text-sm text-slate-500">لم يتمكن من تحليل البيانات</p>
        </CardContent>
      </Card>
    );
  }

  const getSatisfactionColor = (score) => {
    if (score === null || score === undefined) return "bg-slate-100 text-slate-700";
    if (score >= 8) return "bg-green-100 text-green-800";
    if (score >= 6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getSatisfactionLabel = (score) => {
    if (score === null || score === undefined) return "لا توجد بيانات كافية";
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
            {analysis.satisfaction_score ?? "—"}/10 - {getSatisfactionLabel(analysis.satisfaction_score)}
          </Badge>
        </div>
        <CardDescription>مؤشر رضا محسوب من التقييمات المسجلة</CardDescription>
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