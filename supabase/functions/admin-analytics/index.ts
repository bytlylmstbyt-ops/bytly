import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return json({ error: "جلسة الدخول غير موجودة." }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const client = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: authData, error: authError } = await client.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "انتهت جلسة الدخول." }, 401);

    const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const email = (authData.user.email || "").trim().toLowerCase();
    const { data: profile } = await service.from("profiles").select("role,email").eq("user_id", authData.user.id).maybeSingle();
    if (email !== "bytlylmstbyt@gmail.com" && profile?.role !== "admin") return json({ error: "غير مصرح." }, 403);

    const body = await req.json().catch(() => ({}));
    const requestedRange = Number(body?.range);
    const range = [1, 7, 30].includes(requestedRange) ? requestedRange : 7;
    const now = new Date();
    const riyadh = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    const [yy, mm, dd] = riyadh.split("-").map(Number);
    const since = new Date(Date.UTC(yy, mm - 1, dd - (range === 1 ? 0 : range - 1), -3, 0, 0)).toISOString();

    const [sr, er, pr, cr] = await Promise.all([
      service.from("analytics_sessions").select("*").gte("started_at", since).order("started_at", { ascending: false }).limit(1000),
      service.from("analytics_events").select("*").gte("occurred_at", since).order("occurred_at", { ascending: false }).limit(5000),
      service.from("profiles").select("user_id,full_name,email,role"),
      service.from("clients").select("user_id,full_name,email,client_type")
    ]);
    const firstError = [sr, er, pr, cr].find(x => x.error)?.error;
    if (firstError) return json({ error: "تعذر قراءة بيانات التحليلات: " + firstError.message }, 500);
    return json({ kind: "analytics", range, since, sessions: sr.data || [], events: er.data || [], profiles: pr.data || [], clients: cr.data || [] });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
