import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const cleanHeader = (value: unknown) => String(value || "").replace(/[\r\n]/g, " ").trim();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ ok: false, error: "SERVER_CONFIGURATION_MISSING" }, 500);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ ok: false, error: "UNAUTHORIZED" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authData, error: authError } = await admin.auth.getUser(authHeader.slice("Bearer ".length));
  if (authError || !authData.user) return json({ ok: false, error: "INVALID_SESSION" }, 401);

  const { data: profile, error: profileError } = await admin.from("profiles")
    .select("role,email").eq("user_id", authData.user.id).maybeSingle();
  if (profileError) return json({ ok: false, error: "AUTHORIZATION_CHECK_FAILED" }, 500);
  const email = String(profile?.email || authData.user.email || "").toLowerCase();
  const isAdmin = profile?.role === "admin" || email === "bytlylmstbyt@gmail.com";
  if (!isAdmin) return json({ ok: false, error: "ADMIN_ONLY" }, 403);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ ok: false, error: "INVALID_JSON" }, 400); }
  const action = body.action || "status";
  if (action === "status") {
    const configured = Boolean(Deno.env.get("BYTLY_GMAIL_CLIENT_ID") && Deno.env.get("BYTLY_GMAIL_CLIENT_SECRET") && Deno.env.get("BYTLY_GMAIL_REFRESH_TOKEN"));
    return json({ ok: true, configured, from: "info@mybytly.com", replyTo: "info@mybytly.com" });
  }
  if (action !== "sendEmail") return json({ ok: false, error: "UNSUPPORTED_ACTION" }, 400);

  const to = cleanHeader(body.to);
  const subject = cleanHeader(body.subject);
  const html = String(body.html || "");
  if (!to || !subject || !html) return json({ ok: false, error: "MISSING_FIELDS" }, 400);
  if (to.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return json({ ok: false, error: "INVALID_RECIPIENT" }, 400);
  if (subject.length > 300 || html.length > 100000) return json({ ok: false, error: "PAYLOAD_TOO_LARGE" }, 413);

  const clientId = Deno.env.get("BYTLY_GMAIL_CLIENT_ID");
  const clientSecret = Deno.env.get("BYTLY_GMAIL_CLIENT_SECRET");
  const refreshToken = Deno.env.get("BYTLY_GMAIL_REFRESH_TOKEN");
  if (!clientId || !clientSecret || !refreshToken) return json({ ok: false, error: "GMAIL_SYSTEM_SECRETS_NOT_CONFIGURED" }, 503);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenData.access_token) return json({ ok: false, error: "GMAIL_TOKEN_EXCHANGE_FAILED" }, 503);

  const rawEmail = [
    "From: Bytly <info@mybytly.com>", "Reply-To: info@mybytly.com", `To: ${to}`, `Subject: ${subject}`,
    "MIME-Version: 1.0", "Content-Type: text/html; charset=UTF-8", "", html,
  ].join("\r\n");
  const bytes = new TextEncoder().encode(rawEmail);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const raw = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

  const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  const sendData = await sendRes.json().catch(() => ({}));
  if (!sendRes.ok) return json({ ok: false, error: "GMAIL_SEND_FAILED" }, 502);
  return json({ ok: true, messageId: sendData.id || null });
});
