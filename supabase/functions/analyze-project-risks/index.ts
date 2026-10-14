import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://mybytly.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const asNumber = (value: unknown, fallback = 0) => { const n = Number(value); return Number.isFinite(n) ? n : fallback; };
const isComplete = (status: unknown) => ["completed", "complete", "done", "approved"].includes(String(status || "").toLowerCase());

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authorization = req.headers.get("Authorization");
  if (!url || !anonKey) return json({ success: false, error: "Service is not configured" }, 503);
  if (!authorization?.startsWith("Bearer ")) return json({ success: false, error: "Authentication required" }, 401);
  const supabase = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return json({ success: false, error: "Invalid session" }, 401);
  let body: { project_id?: string };
  try { body = await req.json(); } catch { return json({ success: false, error: "Invalid JSON body" }, 400); }
  const projectId = String(body?.project_id || "").trim();
  if (!projectId) return json({ success: false, error: "Project ID is required" }, 400);
  // Use the caller JWT so Supabase RLS remains the authority for project visibility.
  const { data: project, error: projectError } = await supabase.from("projects")
    .select("id,title,client_user_id,assigned_engineer_id,assigned_contractor_id,assigned_supplier_id,technical_consultant_id,budget_min,budget_max,deadline,phase_progress,status")
    .eq("id", projectId).maybeSingle();
  if (projectError) return json({ success: false, error: "Could not load project under current permissions" }, 403);
  if (!project) return json({ success: false, error: "Project not found or access denied" }, 404);
  const [{ data: tasks, error: taskError }, { data: milestones, error: milestoneError }] = await Promise.all([
    supabase.from("project_tasks").select("id,status,due_date,progress,estimated_hours").eq("project_id", projectId).limit(500),
    supabase.from("project_milestones").select("id,status,due_date,progress,amount,completed_at").eq("project_id", projectId).limit(200),
  ]);
  if (taskError || milestoneError) return json({ success: false, error: "Could not load project tasks or milestones under current permissions" }, 403);
  const today = new Date().toISOString().slice(0, 10);
  const taskRows = tasks || []; const milestoneRows = milestones || [];
  const completedTasks = taskRows.filter((row: any) => isComplete(row.status)).length;
  const overdueTasks = taskRows.filter((row: any) => row.due_date && row.due_date < today && !isComplete(row.status));
  const totalTaskCount = taskRows.length;
  const completionRate = totalTaskCount ? Math.round(completedTasks / totalTaskCount * 100) : Math.max(0, Math.min(100, Math.round(asNumber(project.phase_progress, 0))));
  const budget = Math.max(asNumber(project.budget_max, asNumber(project.budget_min, 0)), 0);
  const completedMilestoneAmount = milestoneRows.filter((row: any) => isComplete(row.status)).reduce((sum: number, row: any) => sum + Math.max(0, asNumber(row.amount)), 0);
  const budgetUtilization = budget > 0 ? Math.min(100, Math.round(completedMilestoneAmount / budget * 100)) : 0;
  const deadlineDays = project.deadline ? Math.ceil((new Date(project.deadline + "T23:59:59Z").getTime() - Date.now()) / 86400000) : null;
  const overdueRatio = totalTaskCount ? overdueTasks.length / totalTaskCount : 0;
  const scheduleHealth = Math.max(0, Math.min(100, Math.round(100 - overdueRatio * 100 - (deadlineDays !== null && deadlineDays < 0 && completionRate < 100 ? 30 : 0))));
  const risks: any[] = []; const criticalAlerts: string[] = [];
  if (overdueTasks.length) {
    const severity = overdueTasks.length >= 3 || overdueRatio >= 0.35 ? "high" : "medium";
    risks.push({ category: "delays", title: "مهام متأخرة عن موعدها", severity, description: "يوجد " + overdueTasks.length + " من " + totalTaskCount + " مهام تجاوزت موعدها ولم تُغلق بعد.", mitigation_strategies: ["تحديث المواعيد مع المسؤولين عن المهام", "ترتيب المهام المتأخرة حسب تأثيرها على المسار الحرج"] });
    if (severity === "high") criticalAlerts.push("توجد مهام متأخرة متعددة؛ راجع خطة التنفيذ فورًا.");
  }
  if (deadlineDays !== null && deadlineDays < 0 && completionRate < 100) {
    risks.push({ category: "delays", title: "تجاوز الموعد النهائي للمشروع", severity: "high", description: "الموعد النهائي المحدد للمشروع مضى، وما زالت هناك أعمال غير مكتملة.", mitigation_strategies: ["اعتماد خطة تعافٍ بمهام ومسؤوليات واضحة", "الاتفاق على موعد تسليم محدث مع الأطراف"] });
    criticalAlerts.push("تجاوز المشروع موعده النهائي مع بقاء أعمال غير مكتملة.");
  }
  if (budget > 0 && completedMilestoneAmount > budget) {
    risks.push({ category: "budget", title: "تجاوز الميزانية المخططة", severity: "high", description: "قيمة المراحل المكتملة تتجاوز الميزانية القصوى المسجلة للمشروع.", mitigation_strategies: ["مطابقة الفواتير والمراحل مع الميزانية المعتمدة", "مراجعة أي تغييرات نطاق قبل الموافقة عليها"] });
    criticalAlerts.push("قد تكون هناك زيادة في قيمة المراحل مقارنة بالميزانية المسجلة.");
  }
  if (!taskRows.length && !milestoneRows.length) risks.push({ category: "scope", title: "لا توجد مهام أو مراحل مسجلة", severity: "low", description: "لا تتوفر بيانات كافية لتقييم تقدم المشروع تفصيليًا.", mitigation_strategies: ["إضافة المراحل والمهام الأساسية", "تحديد المسؤولين والمواعيد المتوقعة"] });
  const score = Math.max(0, Math.min(100, Math.round(overdueRatio * 45 + (deadlineDays !== null && deadlineDays < 0 && completionRate < 100 ? 30 : 0) + (budget > 0 && completedMilestoneAmount > budget ? 25 : 0) + (!taskRows.length && !milestoneRows.length ? 10 : 0))));
  const metrics = { completion_rate: completionRate, overdue_tasks: overdueTasks.length, budget_utilization: budgetUtilization, schedule_health: scheduleHealth };
  const analysis = { overall_risk_score: score, critical_alerts: criticalAlerts, risks, summary: risks.length ? "تقييم مبني على بيانات Supabase الحالية: تم رصد " + risks.length + " مؤشرات مخاطر. راجع المواعيد والميزانية والمهام قبل اتخاذ قرارات تنفيذية." : "لا تظهر مؤشرات تأخير أو تجاوز ميزانية من البيانات المتاحة حاليًا. تأكد من اكتمال تحديث المهام والمراحل." };
  return json({ success: true, project_id: projectId, analysis, metrics, source: "supabase_project_tasks_and_milestones" });
});