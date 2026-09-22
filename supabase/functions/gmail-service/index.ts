import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

function buildRawMessage(to: string, subject: string, text: string, html?: string) {
  const headers = [
    `To: ${to}`,
    "MIME-Version: 1.0",
    "Content-Type: multipart/alternative; boundary=\"bytly-boundary\"",
    `Subject: ${subject}`,
  ];
  const safeHtml = html || text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  const mime = [
    ...headers,
    "",
    "--bytly-boundary",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "--bytly-boundary",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    safeHtml,
    "--bytly-boundary--",
  ].join("\r\n");
  return base64UrlEncode(mime);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const providerToken = String(body?.providerToken || "").trim();
    const to = String(body?.to || "").trim();
    const subject = String(body?.subject || "").trim();
    const text = String(body?.text || "").trim();
    const html = typeof body?.html === "string" ? body.html : undefined;

    if (!providerToken) return jsonResponse({ success: false, error: "Gmail provider token is missing." }, 400);
    if (!to || !subject || !text) return jsonResponse({ success: false, error: "to, subject and text are required." }, 400);

    const raw = buildRawMessage(to, subject, text, html);
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${providerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });

    const payload = await response.json();
    if (!response.ok) {
      console.error("Gmail API error", payload);
      return jsonResponse({
        success: false,
        error: payload?.error?.message || "Gmail API request failed",
        code: payload?.error?.code || response.status,
        reauthorize: response.status === 401,
      }, response.status === 401 ? 401 : 502);
    }

    return jsonResponse({ success: true, messageId: payload?.id || null, threadId: payload?.threadId || null });
  } catch (error) {
    console.error("gmail-service error", error);
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
