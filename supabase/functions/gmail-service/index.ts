import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminClient = createClient(supabaseUrl, serviceKey);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function requireAdmin(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("UNAUTHORIZED");

  const { data: userData, error } = await adminClient.auth.getUser(token);
  if (error || !userData?.user) throw new Error("UNAUTHORIZED");

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  const role = profile?.role || userData.user.app_metadata?.role;
  if (role !== "admin") throw new Error("FORBIDDEN");

  return userData.user;
}

async function getConnection(userId: string) {
  const { data, error } = await adminClient
    .from("integration_connections")
    .select("id,user_id,provider,provider_email,refresh_token,access_token,expires_at,status,scopes,last_checked_at,last_error")
    .eq("user_id", userId)
    .eq("provider", "gmail")
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function saveConnection(userId: string, patch: Record<string, unknown>) {
  const existing = await getConnection(userId);
  if (existing?.id) {
    const { error } = await adminClient
      .from("integration_connections")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await adminClient
    .from("integration_connections")
    .insert({
      user_id: userId,
      provider: "gmail",
      status: "connected",
      ...patch,
    });
  if (error) throw error;
}

async function refreshGoogleToken(refreshToken: string) {
  const clientId = Deno.env.get("GMAIL_GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GMAIL_GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("Gmail OAuth credentials are not configured in Supabase Edge Function Secrets.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.error || "Google token refresh failed.");
  }

  return payload;
}

async function getValidAccessToken(userId: string, forceRefresh = false) {
  const connection = await getConnection(userId);
  if (!connection?.refresh_token && !connection?.access_token) {
    throw new Error("Gmail is not connected. Please re-authorize Gmail.");
  }

  const expiresAt = connection.expires_at ? new Date(connection.expires_at).getTime() : 0;
  const stillValid = connection.access_token && expiresAt > Date.now() + 60_000;

  if (!forceRefresh && stillValid) {
    return connection.access_token;
  }

  if (!connection.refresh_token) {
    throw new Error("Gmail refresh token is missing. Please re-authorize Gmail.");
  }

  const refreshed = await refreshGoogleToken(connection.refresh_token);
  await saveConnection(userId, {
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token || connection.refresh_token,
    expires_at: new Date(Date.now() + Number(refreshed.expires_in || 3600) * 1000).toISOString(),
    status: "connected",
    last_checked_at: new Date().toISOString(),
    last_error: null,
  });
  return refreshed.access_token;
}

async function gmailRequest(userId: string, endpoint: string, method = "GET", body: unknown = null) {
  let accessToken = await getValidAccessToken(userId);
  let response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    accessToken = await getValidAccessToken(userId, true);
    response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    await saveConnection(userId, {
      status: response.status === 401 ? "needs_reauth" : "error",
      last_checked_at: new Date().toISOString(),
      last_error: payload?.error?.message || `Gmail API error: ${response.status}`,
    }).catch(() => {});
    const err = new Error(payload?.error?.message || `Gmail API error: ${response.status}`);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }

  return payload;
}

function base64UrlEncode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Utf8(b64: string) {
  const binary = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder("utf-8").decode(bytes);
}

function buildRawMessage(to: string, subject: string, text: string, html?: string, from?: string) {
  const headers = [
    `To: ${to}`,
    ...(from ? [`From: ${from}`] : []),
    "MIME-Version: 1.0",
    "Content-Type: multipart/alternative; boundary=\"bytly-boundary\"",
    `Subject: ${subject}`,
  ];
  const safeHtml = html || text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  const mime = [
    ...headers, "",
    "--bytly-boundary",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit", "", text,
    "--bytly-boundary",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit", "", safeHtml,
    "--bytly-boundary--",
  ].join("\r\n");
  return base64UrlEncode(mime);
}

function parseEmailBody(payload: any): string {
  if (!payload) return "";
  if (payload.body?.data) {
    try { return decodeBase64Utf8(payload.body.data); } catch { return ""; }
  }
  if (payload.parts) {
    for (const mimeType of ["text/html", "text/plain"]) {
      for (const part of payload.parts) {
        if (part.mimeType === mimeType && part.body?.data) {
          try { return decodeBase64Utf8(part.body.data); } catch { return ""; }
        }
      }
    }
    for (const part of payload.parts) {
      const nested = parseEmailBody(part);
      if (nested) return nested;
    }
  }
  return "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);

  try {
    const user = await requireAdmin(req);
    const body = await req.json();
    const action = String(body?.action || "").trim();
    const data = body?.data && typeof body.data === "object" ? body.data : body;

    if (action === "storeProviderTokens") {
      const providerToken = String(body?.providerToken || "").trim();
      const providerRefreshToken = String(body?.providerRefreshToken || "").trim();
      if (!providerRefreshToken) {
        return jsonResponse({
          ok: false,
          needs_reauth: true,
          error: "Google did not return a refresh token. Re-authorize Gmail with offline access.",
        }, 400);
      }

      const profile = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
        headers: { Authorization: `Bearer ${providerToken}` },
      });
      const profileJson = await profile.json().catch(() => ({}));
      if (!profile.ok) {
        return jsonResponse({ ok: false, error: profileJson?.error?.message || "Invalid Gmail token." }, 401);
      }

      await saveConnection(user.id, {
        provider_email: profileJson?.emailAddress || null,
        refresh_token: providerRefreshToken,
        access_token: providerToken || null,
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
        status: "connected",
        scopes: [
          "openid",
          "email",
          "profile",
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/gmail.settings.basic",
        ],
        last_checked_at: new Date().toISOString(),
        last_error: null,
      });

      return jsonResponse({ ok: true, email: profileJson?.emailAddress || null });
    }

    if (action === "status") {
      try {
        const profile = await gmailRequest(user.id, "/profile");
        await saveConnection(user.id, {
          provider_email: profile?.emailAddress || null,
          status: "connected",
          last_checked_at: new Date().toISOString(),
          last_error: null,
        });
        return jsonResponse({ ok: true, email: profile?.emailAddress || null, http_status: 200 });
      } catch (error) {
        const status = Number((error as any)?.status || 502);
        return jsonResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Gmail authentication failed.",
          code: status,
          reauthorize: status === 401,
        }, status === 401 ? 401 : 502);
      }
    }

    if (action === "listEmails") {
      const maxResults = Number(data?.maxResults || 20);
      const labelIds = Array.isArray(data?.labelIds) ? data.labelIds : ["INBOX"];
      const q = String(data?.q || "");
      let endpoint = `/messages?maxResults=${encodeURIComponent(String(maxResults))}`;
      if (labelIds.length) endpoint += labelIds.map((id: string) => `&labelIds=${encodeURIComponent(id)}`).join("");
      if (q) endpoint += `&q=${encodeURIComponent(q)}`;

      const list = await gmailRequest(user.id, endpoint);
      const messages = list.messages || [];
      const emails = await Promise.all(messages.map(async (msg: any) => {
        try {
          const detail = await gmailRequest(user.id, `/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`);
          const headers = detail.payload?.headers || [];
          const get = (name: string) => headers.find((h: any) => h.name === name)?.value || "";
          return {
            id: detail.id, threadId: detail.threadId, snippet: detail.snippet,
            from: get("From"), to: get("To"), subject: get("Subject"), date: get("Date"),
            labelIds: detail.labelIds || [], isUnread: (detail.labelIds || []).includes("UNREAD"),
          };
        } catch { return null; }
      }));
      return jsonResponse({ success: true, emails: emails.filter(Boolean) });
    }

    if (action === "getEmail") {
      const detail = await gmailRequest(user.id, `/messages/${data?.messageId}?format=full`);
      const headers = detail.payload?.headers || [];
      const get = (name: string) => headers.find((h: any) => h.name === name)?.value || "";
      return jsonResponse({
        success: true,
        email: {
          id: detail.id, threadId: detail.threadId, from: get("From"), to: get("To"),
          subject: get("Subject"), date: get("Date"), body: parseEmailBody(detail.payload),
          labelIds: detail.labelIds || [], isUnread: (detail.labelIds || []).includes("UNREAD"),
        },
      });
    }

    if (action === "sendEmail") {
      if (!data?.to || !data?.subject || !data?.body) {
        return jsonResponse({ success: false, error: "to, subject and body are required." }, 400);
      }
      const raw = buildRawMessage(String(data.to), String(data.subject), String(data.body), data.html, data.from);
      const result = await gmailRequest(user.id, "/messages/send", "POST", { raw });
      return jsonResponse({ success: true, messageId: result?.id || null, threadId: result?.threadId || null });
    }

    if (action === "replyEmail") {
      const raw = buildRawMessage(String(data.to || ""), `Re: ${String(data.subject || "")}`, String(data.body || ""), data.html, data.from);
      const result = await gmailRequest(user.id, "/messages/send", "POST", { raw, threadId: data.threadId });
      return jsonResponse({ success: true, messageId: result?.id || null, threadId: result?.threadId || null });
    }

    if (action === "markAsRead") {
      await gmailRequest(user.id, `/messages/${data.messageId}/modify`, "POST", { removeLabelIds: ["UNREAD"] });
      return jsonResponse({ success: true });
    }

    if (action === "trashEmail") {
      await gmailRequest(user.id, `/messages/${data.messageId}/trash`, "POST");
      return jsonResponse({ success: true });
    }

    if (action === "getLabels") {
      const result = await gmailRequest(user.id, "/labels");
      return jsonResponse({ success: true, labels: result.labels || [] });
    }

    return jsonResponse({ success: false, error: "Action غير معروف" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    if (message === "UNAUTHORIZED") return jsonResponse({ success: false, error: "انتهت جلسة الدخول." }, 401);
    if (message === "FORBIDDEN") return jsonResponse({ success: false, error: "هذه الخدمة متاحة للمشرف فقط." }, 403);
    console.error("gmail-service error", error);
    return jsonResponse({ success: false, error: message }, 500);
  }
});
