import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const asText = (value: unknown) => typeof value === "string" ? value.trim() : "";
const formatDate = (value: unknown) => {
  if (!value) return "غير محدد";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "غير محدد" : date.toLocaleDateString("ar-SA");
};
function haversafeDays(value: unknown, now: number) {
  if (!value) return null;
  const date = new Date(String(value)).getTime();
  return Number.isFinite(date) ? Math.floor((now - date) / 86400000) : null;
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply({ success: false, error: "Method not allowed" }, 405);
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return reply({ success: false, error: "Authentication required" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!url || !anonKey || !serviceKey || !geminiKey) return reply({ success: false, error: "خدمة مساعد المشروع غير مكتملة الإعداد في Supabase." }, 503);
  const authClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: authData, error: authError } = await authClient.auth.getUser();
  const user = authData?.user;
  if (authError || !user) return reply({ success: false, error: "جلسة الدخول غير صالحة." }, 401);
  let body: { project_id?: string; user_message?: string; conversation_history?: Array<{ role?: string; content?: string }>; attachments?: string[] };
  try { body = await req.json(); } catch { return reply({ success: false, error: "Invalid JSON body" }, 400); }
  const projectId = asText(body.project_id);
  const userMessage = asText(body.user_message);
  if (!projectId || !userMessage) return reply({ success: false, error: "project_id and user_message are required" }, 400);
  if (userMessage.length > 8000) return reply({ success: false, error: "الرسالة طويلة جدًا؛ اختصرها ثم أعد المحاولة." }, 400);

  const db = createClient(url, serviceKey);
  const [{ data: project, error: projectError }, { data: profile }] = await Promise.all([
    db.from("projects").select("*").eq("id", projectId).maybeSingle(),
    db.from("profiles").select("role").eq("user_id", user.id).maybeSingle(),
  ]);
  if (projectError) return reply({ success: false, error: "تعذر تحميل بيانات المشروع." }, 500);
  if (!project) return reply({ success: false, error: "المشروع غير موجود." }, 404);
  const isAdmin = String(profile?.role || "").toLowerCase() === "admin";
  const isOwner = project.client_user_id === user.id;
  let isAssignedEngineer = false;
  if (project.assigned_engineer_id) {
    const { data: engineer } = await db.from("engineers").select("user_id").eq("id", project.assigned_engineer_id).maybeSingle();
    isAssignedEngineer = engineer?.user_id === user.id;
  }
  if (!isOwner && !isAdmin && !isAssignedEngineer) return reply({ success: false, error: "غير مصرح لك بالاطلاع على هذا المشروع." }, 403);

  const [{ data: milestones, error: milestoneError }, { data: reviews, error: reviewError }] = await Promise.all([
    db.from("project_milestones").select("title,status,due_date,amount,sequence_no,progress").eq("project_id", projectId).order("sequence_no", { ascending: true }).limit(100),
    db.from("project_reviews").select("rating").eq("project_id", projectId).limit(100),
  ]);
  if (milestoneError || reviewError) return reply({ success: false, error: "تعذر تحميل مراحل المشروع أو تقييماته." }, 500);
  const stages = milestones || [];
  const now = Date.now();
  const delayAlerts: Array<{ milestone: string; daysOverdue: number; status: string }> = [];
  for (const milestone of stages) {
    if (milestone.due_date && !["completed", "cancelled"].includes(String(milestone.status || "").toLowerCase())) {
      const overdue = haversafeDays(milestone.due_date, now);
      if (overdue !== null && overdue > 0) delayAlerts.push({ milestone: milestone.title || "مرحلة", daysOverdue: overdue, status: String(milestone.status || "pending") });
    }
  }
  const deadline = project.deadline || project.end_date;
  if (deadline) {
    const daysToDeadline = Math.floor((new Date(String(deadline)).getTime() - now) / 86400000);
    if (Number.isFinite(daysToDeadline) && daysToDeadline < 0) delayAlerts.push({ milestone: "الموعد النهائي للمشروع", daysOverdue: Math.abs(daysToDeadline), status: "overdue" });
    else if (Number.isFinite(daysToDeadline) && daysToDeadline <= 7) delayAlerts.push({ milestone: "الموعد النهائي للمشروع", daysOverdue: -daysToDeadline, status: "warning" });
  }
  const ratings = (reviews || []).map(r => Number(r.rating)).filter(Number.isFinite);
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;
  const context = {
    project: {
      title: project.title || "غير محدد", description: project.description || "", status: project.status || project.lifecycle_status || "غير محدد",
      category: project.category || project.project_type || "غير محدد", location: project.location || project.address || "غير محدد",
      budget_min: project.budget_min ?? null, budget_max: project.budget_max ?? null,
      created_at: formatDate(project.created_at), deadline: formatDate(deadline), attachments: project.attachments || [],
    },
    milestones: stages.map(m => ({ title: m.title, status: m.status, due_date: formatDate(m.due_date), amount: m.amount, progress: m.progress })),
    total_milestones: stages.length,
    completed_milestones: stages.filter(m => String(m.status || "").toLowerCase() === "completed").length,
    review_count: ratings.length,
    average_rating: avgRating,
    delay_alerts: delayAlerts,
  };
  const history = (Array.isArray(body.conversation_history) ? body.conversation_history : []).slice(-6)
    .map(m => `${m.role === "assistant" ? "المساعد" : "المستخدم"}: ${asText(m.content).slice(0, 2000)}`).join("\n");
  const prompt = `أنت مساعد ذكي متخصص في إدارة المشاريع الهندسية لمنصة Bytly. أجب بالعربية المهنية وباختصار من 3 إلى 6 أسطر. استخدم بيانات المشروع الفعلية فقط، وصرّح إذا كانت معلومة غير متاحة. نبّه إلى التأخيرات والمخاطر واقترح خطوات عملية. لا تدّع تنفيذ أي إجراء.\n\nبيانات المشروع الموثقة:\n${JSON.stringify(context)}\n\nسجل المحادثة:\n${history}\n\nسؤال المستخدم:\n${userMessage}`;
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey, "Api-Revision": "2026-05-20" },
      body: JSON.stringify({ model: "gemini-3.6-flash", input: prompt, generation_config: { thinking_level: "medium", max_output_tokens: 900 } }),
    });
    const raw = await response.text();
    let result: any = null;
    try { result = JSON.parse(raw); } catch { /* invalid provider response */ }
    if (!response.ok) return reply({ success: false, error: result?.error?.message || "تعذر تشغيل مساعد المشروع حاليًا." }, 502);
    const chunks: string[] = [];
    if (typeof result?.output_text === "string") chunks.push(result.output_text.trim());
    for (const step of Array.isArray(result?.steps) ? result.steps : []) {
      if (step?.type !== "model_output") continue;
      for (const part of Array.isArray(step.content) ? step.content : []) if (part?.type === "text" && typeof part.text === "string") chunks.push(part.text.trim());
    }
    const answer = chunks.filter(Boolean).join("\n\n") || "";
    if (!answer) return reply({ success: false, error: "وصل رد فارغ من خدمة الذكاء الاصطناعي." }, 502);
    return reply({
      success: true, response: answer, delay_alerts: delayAlerts,
      project_summary: { total_milestones: stages.length, completed_milestones: context.completed_milestones, progress: stages.length ? Math.round(context.completed_milestones / stages.length * 100) : 0, has_delays: delayAlerts.some(d => d.daysOverdue > 0) },
    });
  } catch (error) {
    console.error("project-ai-chatbot error:", error instanceof Error ? error.message : error);
    return reply({ success: false, error: "تعذر الاتصال بمساعد المشروع. حاول مرة أخرى." }, 502);
  }
});