import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ProjectSummaryWidget({ projectId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateSummary();
  }, [projectId]);

  const generateSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      setSummary(null);
      if (!projectId) throw new Error("معرّف المشروع غير متوفر");
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) throw new Error("يرجى تسجيل الدخول لعرض ملخص المشروع");
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id,title,status,phase,phase_progress,start_date,deadline,budget_min,budget_max,location,description")
        .eq("id", projectId)
        .maybeSingle();
      if (projectError) throw projectError;
      if (!project) throw new Error("المشروع غير موجود أو لا تملك صلاحية الاطلاع عليه");
      const [{ data: tasks, error: taskError }, { data: milestones, error: milestoneError }] = await Promise.all([
        supabase.from("project_tasks").select("id,status,due_date").eq("project_id", projectId).limit(300),
        supabase.from("project_milestones").select("id,status,due_date,amount").eq("project_id", projectId).limit(100),
      ]);
      if (taskError) throw taskError;
      if (milestoneError) throw milestoneError;
      const taskRows = tasks || [];
      const milestoneRows = milestones || [];
      const isDone = value => ["completed", "complete", "done", "approved"].includes(String(value || "").toLowerCase());
      const completedTasks = taskRows.filter(row => isDone(row.status)).length;
      const overdueTasks = taskRows.filter(row => row.due_date && row.due_date < new Date().toISOString().slice(0, 10) && !isDone(row.status)).length;
      const completedMilestones = milestoneRows.filter(row => isDone(row.status)).length;
      const budget = Number(project.budget_max ?? project.budget_min);
      const lines = [
        "ملخص المشروع: " + (project.title || "مشروع بدون عنوان"),
        "الحالة: " + (project.status || "غير محددة"),
        "المرحلة الحالية: " + (project.phase || "غير محددة"),
        "نسبة التقدم المسجلة: " + (Number.isFinite(Number(project.phase_progress)) ? Number(project.phase_progress) + "%" : "غير محددة"),
        "المهام: " + completedTasks + " مكتملة من أصل " + taskRows.length + "؛ المهام المتأخرة: " + overdueTasks + ".",
        "المراحل: " + completedMilestones + " مكتملة من أصل " + milestoneRows.length + ".",
        "الموعد النهائي: " + (project.deadline || "غير محدد"),
        "الميزانية المسجلة: " + (Number.isFinite(budget) && budget >= 0 ? budget.toLocaleString("en-US") + " ريال سعودي" : "غير محددة"),
      ];
      if (project.location) lines.push("الموقع: " + project.location);
      if (project.description) lines.push("وصف المشروع: " + project.description.slice(0, 600));
      if (overdueTasks) lines.push("المتابعة المقترحة: مراجعة المهام المتأخرة وتحديث المواعيد والمسؤوليات.");
      else if (taskRows.length && completedTasks === taskRows.length) lines.push("المتابعة المقترحة: مراجعة التسليم النهائي وإغلاق المشروع بعد اعتماد العميل.");
      else lines.push("المتابعة المقترحة: تحديث حالات المهام والمراحل دوريًا حتى يعكس الملخص الواقع الفعلي.");
      setSummary(lines.join("\\n"));
    } catch (err) {
      setError(err?.message || "تعذر إنشاء ملخص المشروع من بيانات Supabase");
    } finally {
      setLoading(false);
    }
  };

  const copySummary = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      toast.success("تم نسخ الملخص");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ملخص تحديث المشروع</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  if (error || !summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ملخص تحديث المشروع</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">لم يتمكن من توليد الملخص</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>ملخص تحديث المشروع</CardTitle>
          <CardDescription>ملخص مباشر من بيانات المشروع المسجلة</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copySummary}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            نسخ
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={generateSummary}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">
            {summary}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}