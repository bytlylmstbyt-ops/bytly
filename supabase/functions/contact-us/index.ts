import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const cleanHeader = (value: unknown) => String(value ?? "").replace(/[\r\n]/g, " ").trim();
const escapeHtml = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

async function sendGmail(to: string, subject: string, html: string, replyTo?: string) {
  const clientId = Deno.env.get("BYTLY_GMAIL_CLIENT_ID");
  const clientSecret = Deno.env.get("BYTLY_GMAIL_CLIENT_SECRET");
  const refreshToken = Deno.env.get("BYTLY_GMAIL_REFRESH_TOKEN");
  if (!clientId || !clientSecret || !refreshToken) throw new Error("EMAIL_SERVICE_NOT_CONFIGURED");

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const tokenData = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenData.access_token) throw new Error("EMAIL_TOKEN_EXCHANGE_FAILED");

  const headers = [
    "From: Bytly <info@mybytly.com>",
    "Reply-To: " + (replyTo || "info@mybytly.com"),
    "To: " + to,
    "Subject: " + cleanHeader(subject),
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
  ].join("\r\n");
  const bytes = new TextEncoder().encode(headers);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const raw = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (!response.ok) throw new Error("EMAIL_SEND_FAILED");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ success: false, error: "METHOD_NOT_ALLOWED" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ success: false, error: "SERVER_CONFIGURATION_MISSING" }, 500);
  if (!authHeader?.startsWith("Bearer ")) return json({ success: false, error: "UNAUTHORIZED" }, 401);

  const token = authHeader.slice("Bearer ".length);
  const authClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user || !user.email) return json({ success: false, error: "INVALID_SESSION" }, 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ success: false, error: "INVALID_JSON" }, 400); }
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const company = String(body.company ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const projectNeeds = String(body.project_needs ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!name || !email || !message) return json({ success: false, error: "MISSING_REQUIRED_FIELDS" }, 400);
  if (email !== user.email.toLowerCase()) return json({ success: false, error: "EMAIL_MUST_MATCH_ACCOUNT" }, 403);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ success: false, error: "INVALID_EMAIL" }, 400);
  if ([name, phone, company, subject, projectNeeds, message].some(value => value.length > 5000) || message.length < 3) {
    return json({ success: false, error: "INVALID_FIELD_LENGTH" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: rateError } = await admin.from("support_tickets")
    .select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since);
  if (rateError) return json({ success: false, error: "RATE_LIMIT_CHECK_FAILED" }, 500);
  if ((count ?? 0) >= 3) return json({ success: false, error: "RATE_LIMITED" }, 429);

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeCompany = escapeHtml(company);
  const safePhone = escapeHtml(phone);
  const safeSubject = escapeHtml(subject);
  const safeNeeds = escapeHtml(projectNeeds).replace(/\n/g, "<br>");
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
  const adminHtml = `<div style="font-family:Arial,sans-serif;direction:rtl;max-width:600px;margin:auto;padding:24px">
    <h2>استفسار جديد — منصة بيتلي</h2><p><b>الاسم:</b> ${safeName}</p><p><b>البريد:</b> ${safeEmail}</p>
    <p><b>الشركة:</b> ${safeCompany || "—"}</p><p><b>الجوال:</b> ${safePhone || "—"}</p><p><b>الموضوع:</b> ${safeSubject || "—"}</p>
    <h3>احتياجات المشروع</h3><p>${safeNeeds || "—"}</p><h3>الرسالة</h3><p>${safeMessage}</p>
    <p>تاريخ الإرسال: ${new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}</p></div>`;

  try {
    await sendGmail("info@mybytly.com", "استفسار جديد من " + name + (subject ? " - " + subject : ""), adminHtml, email);
  } catch (error) {
    const messageCode = error instanceof Error ? error.message : "EMAIL_SEND_FAILED";
    return json({ success: false, error: messageCode }, 503);
  }

  const { data: ticket, error: ticketError } = await admin.from("support_tickets").insert({
    user_id: user.id,
    subject: subject || "رسالة تواصل من " + name,
    description: [`الاسم: ${name}`, `البريد: ${email}`, company ? `الشركة: ${company}` : "", phone ? `الجوال: ${phone}` : "", projectNeeds ? `احتياجات المشروع: ${projectNeeds}` : "", message].filter(Boolean).join("\n"),
    priority: "normal",
    status: "open",
  }).select("id").single();
  if (ticketError) return json({ success: true, ticketRecorded: false, warning: "EMAIL_SENT_TICKET_SAVE_FAILED" });

  let confirmationSent = true;
  try {
    await sendGmail(email, "تم استلام رسالتك — منصة بيتلي",
      `<div style="font-family:Arial,sans-serif;direction:rtl;max-width:600px;margin:auto;padding:24px"><h2>شكرًا لتواصلك معنا، ${safeName}</h2><p>استلمنا رسالتك وسيراجعها فريق بيتلي خلال أوقات العمل.</p><p><b>رسالتك:</b> ${escapeHtml(message.slice(0, 500))}</p><p>رقم المتابعة: ${escapeHtml(ticket.id)}</p></div>`);
  } catch { confirmationSent = false; }

  return json({ success: true, ticketRecorded: true, ticketId: ticket.id, confirmationSent });
});
