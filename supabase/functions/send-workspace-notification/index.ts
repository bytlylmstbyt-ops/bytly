import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[ch]!));
const cleanHeader = (value: unknown) => String(value ?? "").replace(/[\r\n]/g, " ").trim();

async function sendSystemEmail(to: string, subject: string, html: string) {
  const clientId = Deno.env.get("BYTLY_GMAIL_CLIENT_ID");
  const clientSecret = Deno.env.get("BYTLY_GMAIL_CLIENT_SECRET");
  const refreshToken = Deno.env.get("BYTLY_GMAIL_REFRESH_TOKEN");
  if (!clientId || !clientSecret || !refreshToken) return { sent: false, reason: "email_not_configured" };

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const token = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !token.access_token) return { sent: false, reason: "email_token_unavailable" };

  const rawMessage = [
    "From: Bytly <info@mybytly.com>",
    "Reply-To: info@mybytly.com",
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
  ].join("\r\n");
  const bytes = new TextEncoder().encode(rawMessage);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const raw = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  const sent = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (!sent.ok) return { sent: false, reason: "email_send_failed" };
  return { sent: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = req.headers.get("Authorization") || "";
  if (!url || !serviceKey) return json({ ok: false, error: "SERVER_CONFIGURATION_MISSING" }, 500);
  if (!authorization.startsWith("Bearer ")) return json({ ok: false, error: "UNAUTHORIZED" }, 401);

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authData, error: authError } = await admin.auth.getUser(authorization.slice(7));
  if (authError || !authData.user) return json({ ok: false, error: "INVALID_SESSION" }, 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ ok: false, error: "INVALID_JSON" }, 400); }
  const projectId = String(body.projectId || "").trim();
  const activityType = String(body.activityType || "").trim().slice(0, 100);
  const title = String(body.title || body.summary || "").trim().slice(0, 300);
  const message = String(body.message || body.summary || "").trim().slice(0, 3000);
  if (!projectId || !activityType || !title || !message) return json({ ok: false, error: "MISSING_REQUIRED_FIELDS" }, 400);

  const { data: project, error: projectError } = await admin.from("projects")
    .select("id,title,client_user_id,assigned_engineer_id")
    .eq("id", projectId).maybeSingle();
  if (projectError) return json({ ok: false, error: "PROJECT_LOOKUP_FAILED" }, 500);
  if (!project) return json({ ok: false, error: "PROJECT_NOT_FOUND" }, 404);

  const actorId = authData.user.id;
  const [member, offer, contract] = await Promise.all([
    admin.from("project_members").select("user_id").eq("project_id", projectId).eq("user_id", actorId).maybeSingle(),
    admin.from("project_offers").select("engineer_user_id").eq("project_id", projectId).eq("engineer_user_id", actorId).maybeSingle(),
    admin.from("project_contracts").select("id").eq("project_id", projectId)
      .or(`client_user_id.eq.${actorId},provider_user_id.eq.${actorId}`).limit(1),
  ]);
  const isAdminProfile = await admin.from("profiles").select("role").eq("user_id", actorId).maybeSingle();
  const isAdmin = isAdminProfile.data?.role === "admin" || isAdminProfile.data?.role === "super_admin";
  const isParticipant = project.client_user_id === actorId || Boolean(member.data) || Boolean(offer.data) || Boolean(contract.data?.length);
  if (!isParticipant && !isAdmin) return json({ ok: false, error: "NOT_A_PROJECT_PARTICIPANT" }, 403);

  const recipientIds = new Set<string>();
  if (project.client_user_id && project.client_user_id !== actorId) recipientIds.add(project.client_user_id);
  if (project.assigned_engineer_id) {
    const { data: engineer } = await admin.from("engineers").select("user_id").eq("id", project.assigned_engineer_id).maybeSingle();
    if (engineer?.user_id && engineer.user_id !== actorId) recipientIds.add(engineer.user_id);
  }
  const { data: members } = await admin.from("project_members").select("user_id").eq("project_id", projectId);
  for (const memberRow of members || []) if (memberRow.user_id && memberRow.user_id !== actorId) recipientIds.add(memberRow.user_id);
  if (!recipientIds.size) return json({ ok: true, notified: 0, emailed: 0 });

  const typeMap: Record<string, string> = {
    project_status_changed: "project_status", file_uploaded: "project_update", file_deleted: "project_update",
    milestone_submitted: "milestone", milestone_approved: "milestone", milestone_status_changed: "milestone",
    task_created: "project_update", task_status_changed: "project_update", contract_created: "contract",
    contract_signed: "contract", contract_updated: "contract", proposal_submitted: "proposal",
    proposal_accepted: "approval", meeting_scheduled: "project_update", payment_made: "payment",
    escrow_held: "payment", escrow_released: "payment",
  };
  const rows = [...recipientIds].map((user_id) => ({
    user_id, type: typeMap[activityType] || "project_update", title, body: message,
    entity_type: String(body.entityType || "project").slice(0, 100),
    entity_id: projectId,
  }));
  const { error: insertError } = await admin.from("notifications").insert(rows);
  if (insertError) return json({ ok: false, error: "NOTIFICATION_INSERT_FAILED" }, 500);

  let emailed = 0;
  let emailUnavailable = false;
  if (body.sendEmail === true) {
    const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:600px;margin:auto;background:#F5F0E8;padding:28px;color:#30251B"><h2 style="color:#6B5D4F">${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p><p>المشروع: <strong>${escapeHtml(project.title || "")}</strong></p><a href="https://mybytly.com/ProjectDetails?id=${encodeURIComponent(projectId)}" style="display:inline-block;background:#6B5D4F;color:#fff;padding:12px 22px;text-decoration:none;border-radius:8px">عرض التحديث في بيتلي</a><p style="font-size:12px;color:#777">بيتلي — المنظومة الهندسية المتكاملة</p></div>`;
    const results = await Promise.all([...recipientIds].map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      const to = data?.user?.email;
      if (!to) return { sent: false, reason: "recipient_email_missing" };
      return sendSystemEmail(to, title, html);
    }));
    emailed = results.filter((result) => result.sent).length;
    emailUnavailable = results.some((result) => !result.sent);
  }
  return json({ ok: true, notified: rows.length, emailed, emailUnavailable });
});
