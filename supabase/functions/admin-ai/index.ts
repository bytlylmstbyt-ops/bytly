import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OWNER_EMAIL = "bytlylmstbyt@gmail.com";
const TABLES: Record<string, string> = {
  profiles: "profiles",
  users: "profiles",
  العملاء: "clients",
  العملاء: "clients",
  customers: "clients",
  clients: "clients",
  engineers: "engineers",
  المهندسين: "engineers",
  المشاريع: "projects",
  projects: "projects",
  notifications: "notifications",
  الإشعارات: "notifications",
  automations: "automation_rules",
  الأتمتة: "automation_rules",
  payments: "payment_transactions",
  المدفوعات: "payment_transactions",
  invoices: "invoices",
  الفواتير: "invoices",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanError(error: unknown) {
  return error instanceof Error ? error.message : String(error || "حدث خطأ غير متوقع");
}

async function getAdmin(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) throw new Error("جلسة الدخول غير موجودة.");
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const client = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("انتهت جلسة الدخول. سجّلي الدخول مرة أخرى.");
  const email = (data.user.email || "").trim().toLowerCase();
  const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: profile } = await service.from("profiles").select("role,email,full_name").eq("user_id", data.user.id).maybeSingle();
  const admin = email === OWNER_EMAIL || profile?.role === "admin";
  if (!admin) throw new Error("غير مصرح لك باستخدام مساعد الإدارة.");
  return { user: data.user, profile, service };
}

async function collectContext(service: ReturnType<typeof createClient>, message: string) {
  const lower = message.toLowerCase();
  const wants = (keys: string[]) => keys.some(k => lower.includes(k));
  const context: Record<string, unknown> = {};
  const jobs: Promise<void>[] = [];

  const add = (name: string, table: string, select = "*") => {
    jobs.push((async () => {
      const { data, error } = await service.from(table).select(select).limit(20);
      context[name] = error ? { error: error.message } : { count: data?.length || 0, rows: data || [] };
    })());
  };

  if (wants(["مشروع","المشاريع","project","projects"])) add("projects", "projects");
  if (wants(["مهندس","المهندسين","engineer","engineers"])) add("engineers", "engineers");
  if (wants(["عميل","العملاء","customer","client","clients"])) add("clients", "clients");
  if (wants(["مستخدم","المستخدمين","users","profiles"])) add("profiles", "profiles", "id,full_name,email,role,last_login_at,last_seen_at");
  if (wants(["إشعار","الإشعارات","notification"])) add("notifications", "notifications");
  if (wants(["أتمتة","automation","workflow"])) add("automation_rules", "automation_rules");
  if (wants(["دفع","مدفوع","payment","payments","revenue","دخل","إيراد"])) {
    add("payment_transactions", "payment_transactions");
    add("revenue_ledger", "revenue_ledger");
  }
  if (wants(["فاتورة","الفواتير","invoice","invoices"])) add("invoices", "invoices");
  await Promise.all(jobs);
  if (!Object.keys(context).length) {
    const counts: Record<string, unknown> = {};
    for (const [key, table] of Object.entries({ profiles: "profiles", projects: "projects", engineers: "engineers", clients: "clients" })) {
      const { count, error } = await service.from(table).select("*", { count: "exact", head: true });
      counts[key] = error ? null : count;
    }
    context.counts = counts;
  }
  return context;
}

function looksLikeChange(message: string) {
  return /(أضف|اضيف|إضافة|أنشئ|انشئ|غيّر|غير|عدّل|عدل|احذف|حذف|إصلح|اصلح|أصلح|تحسين|حسّن|حسن|زر|فلتر|صفحة جديدة|change|add |create |fix |update |delete )/i.test(message);
}

async function callGemini(prompt: string, context: unknown, format: "text" | "json" = "text") {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("لم يتم إعداد GEMINI_API_KEY في Supabase.");
  const instruction = `أنت مساعد الإدارة المركزي لمنصة Bytly (بيتلي)، المنظومة الهندسية المتكاملة في السعودية.
أجب بالعربية الواضحة والمباشرة. لا تخترع أرقامًا. إذا كانت البيانات المتاحة محدودة فاذكر ذلك.
السياق الحي من قاعدة بيانات بيتلي:
${JSON.stringify(context).slice(0, 28000)}

طلب المشرف:
${prompt}`;
  const generationConfig: Record<string, unknown> = { temperature: 0.2, maxOutputTokens: 1800 };
  if (format === "json") generationConfig.responseMimeType = "application/json";
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" + encodeURIComponent(key), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: instruction }] }],
      generationConfig,
    }),
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.error?.message || "فشل الاتصال بخدمة الذكاء الاصطناعي.");
  const raw = payload?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("").trim() || "";
  if (!raw) throw new Error("وصل رد فارغ من خدمة الذكاء الاصطناعي.");
  if (format === "json") {
    try { return JSON.parse(raw); } catch { return { raw }; }
  }
  return raw;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { service } = await getAdmin(req);
    const body = await req.json();
    const action = String(body?.action || "message");

    if (action === "approve" || action === "reject" || action === "execute") {
      const id = String(body?.id || "");
      if (!id) return json({ error: "معرف الخطة غير موجود." }, 400);
      return json({
        kind: "decision",
        status: action === "execute" || action === "approve" ? "approved" : "rejected",
        id,
        note: action === "execute"
          ? "تمت الموافقة على التنفيذ. لم يتم تعديل ملفات الإنتاج تلقائيًا؛ التنفيذ البرمجي الفعلي يحتاج جلسة التطوير المرتبطة بالمستودع."
          : action === "approve"
            ? "تم اعتماد الخطة. التطبيق الفعلي على ملفات الكود يحتاج جلسة تطوير/محرر؛ لم يتم تنفيذ أي تغيير تلقائي على الإنتاج."
            : "تم إلغاء الخطة.",
      });
    }

    if (action === "refresh_index_status") {
      return json({ kind: "index_status", live_total_indexed: 0, meta: null, note: "تم توصيل المساعد بـSupabase. فهرس المشروع البرمجي التفصيلي يحتاج تكامل GitHub مستقلًا ولم يتم حذفه من الواجهة." });
    }

    const message = String(body?.message || "").trim();
    if (!message) return json({ error: "اكتبي الطلب أولاً." }, 400);

    const context = await collectContext(service, message);

    if (looksLikeChange(message)) {
      const plan = {
        status: "awaiting_approval",
        risk_level: "medium",
        title: "خطة تغيير",
        plain_explanation_ar: `فهمت الطلب: ${message}`,
        target_page: "سيتم تحديدها بعد مراجعة الطلب",
        affected_files: [],
        requires_db_change: false,
        requires_backend_change: false,
        requires_permission_change: false,
        tests_required: ["فحص البناء", "اختبار الصفحة المتأثرة"],
        security_notes: "لن يتم تعديل ملفات الإنتاج تلقائيًا من داخل المساعد.",
        execution_ready: false,
        execution_note: "الخطة تحتاج موافقة ثم تطبيقًا من جلسة التطوير.",
        blocked: false,
      };
      return json({ kind: "plan", id: crypto.randomUUID(), plan });
    }

    const answer = await callGemini(message, context, "text");
    return json({
      kind: "data",
      coverage: Object.keys(context).length ? "supported" : "partial",
      answer,
      table: null,
      admin_page: null,
    });
  } catch (error) {
    console.error("admin-ai error:", error);
    return json({ error: cleanError(error) }, 500);
  }
});
