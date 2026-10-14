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
    if (!projectId) {
      setError("معرّف المشروع غير متوفر");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setSummary(null);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) throw new Error("يرجى تسجيل الدخول لعرض ملخص المشروع");
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id,title,status,phase,phase_progress,deadline,updated_at")
        .eq("id", projectId)
        .maybeSingle();
      if (projectError) throw projectError;
      if (!project) throw new Error("المشروع غير متاح لهذا الحساب أو لم يعد موجودًا");
      const [{ data: milestones, error: milestonesError }, { data: tasks, error: tasksError }] = await Promise.all([
        supabase.from("project_milestones").select("title,status,progress,due_date").eq("project_id", projectId).order("sequence_no", { ascending: true }).limit(100),
        supabase.from("project_tasks").select("title,status,priority,due_date").eq("project_id", projectId).order("created_at", { ascending: false }).limit(100)
      ]);
      if (milestonesError) throw milestonesError;
      if (tasksError) throw tasksError;
      const stages = milestones || [];
      const projectTasks = tasks || [];
      const completedStages = stages.filter(item => ["completed", "complete", "approved", "done"].includes(String(item.status || "").toLowerCase())).length;
      const completedTasks = projectTasks.filter(item => ["completed", "complete", "done"].includes(String(item.status || "").toLowerCase())).length;
      const overdueStages = stages.filter(item => item.due_date && new Date(item.due_date + "T23:59:59") < new Date() && !["completed", "complete", "approved", "done"].includes(String(item.status || "").toLowerCase()));
      const overdueTasks = projectTasks.filter(item => item.due_date && new Date(item.due_date + "T23:59:59") < new Date() && !["completed", "complete", "done"].includes(String(item.status || "").toLowerCase()));
      const deadline = project.deadline ? new Date(project.deadline + "T00:00:00").toLocaleDateString("ar-SA") : "غير محدد";
      const lines = [
        "ملخص المشروع: " + (project.title || "مشروع بدون عنوان"),
        "الحالة: " + (project.status || "غير محددة") + (project.phase ? " — المرحلة الحالية: " + project.phase : ""),
        "التقدم المسجل: " + (Number.isFinite(Number(project.phase_progress)) ? Number(project.phase_progress) + "%" : "غير محدد"),
        "الموعد النهائي: " + deadline,
        "المراحل: " + completedStages + " مكتملة من أصل " + stages.length,
        "المهام: " + completedTasks + " مكتملة من أصل " + projectTasks.length,
        "المراحل المتأخرة: " + overdueStages.length,
        "المهام المتأخرة: " + overdueTasks.length,
        "آخر تحديث مسجل: " + (project.updated_at ? new Date(project.updated_at).toLocaleString("ar-SA") : "غير متوفر"),
        "",
        "أولوية المتابعة: " + (overdueStages.length + overdueTasks.length > 0 ? "راجع المراحل والمهام المتأخرة مع الفريق." : "لا توجد مراحل أو مهام متأخرة بحسب البيانات المسجلة.")
      ];
      setSummary(lines.join("\\n"));
    } catch (err) {
      setError(err?.message || "تعذر توليد ملخص المشروع");
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
          <p className="text-sm text-slate-500">تعذر إنشاء الملخص من بيانات المشروع المتاحة</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>ملخص تحديث المشروع</CardTitle>
          <CardDescription>ملخص تلقائي من حالة المشروع ومراحله ومهامه</CardDescription>
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