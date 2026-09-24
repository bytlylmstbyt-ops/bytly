import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://wbqtgdkubrocnqnykhlt.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_8dsKwVbalFlUNA65FJaWlA_1ch0TKfw";

const tools = [
  { name: "get_current_user", description: "Get the authenticated Bytly user's profile and role.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "list_projects", description: "List projects visible to the authenticated Bytly user.", inputSchema: { type: "object", properties: { limit: { type: "integer", minimum: 1, maximum: 50 } }, additionalProperties: false } },
  { name: "list_notifications", description: "List notifications for the authenticated Bytly user.", inputSchema: { type: "object", properties: { limit: { type: "integer", minimum: 1, maximum: 50 } }, additionalProperties: false } }
];

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, MCP-Protocol-Version");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return res.end(JSON.stringify(body));
}

function result(id, value) {
  return { jsonrpc: "2.0", id, result: value };
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method === "GET") return json(res, 200, { name: "Bytly MCP", version: "1.0.0", protocol: "2025-06-18", status: "ok", tools: tools.length });
  if (req.method !== "POST") return json(res, 405, { error: "Method Not Allowed" });

  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; } catch { return json(res, 400, { jsonrpc: "2.0", error: { code: -32700, message: "Invalid JSON" } }); }

  const id = body?.id ?? null;
  const method = body?.method;
  if (!method) return json(res, 400, { jsonrpc: "2.0", error: { code: -32600, message: "Invalid Request" } });

  if (method === "initialize") {
    return json(res, 200, result(id, {
      protocolVersion: body.params?.protocolVersion || "2025-06-18",
      capabilities: { tools: {} },
      serverInfo: { name: "Bytly MCP", version: "1.0.0" }
    }));
  }
  if (method === "notifications/initialized") return res.status(202).end();
  if (method === "ping") return json(res, 200, result(id, {}));
  if (method === "tools/list") return json(res, 200, result(id, { tools }));

  if (method !== "tools/call") return json(res, 200, { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });

  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json(res, 401, { jsonrpc: "2.0", id, error: { code: -32001, message: "Authentication required" } });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: "Bearer " + token } }
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json(res, 401, { jsonrpc: "2.0", id, error: { code: -32001, message: "Invalid or expired authentication" } });

  const name = body.params?.name;
  const args = body.params?.arguments || {};

  if (name === "get_current_user") {
    const { data: profile, error } = await supabase.from("profiles").select("id,user_id,email,full_name,phone,role").eq("user_id", user.id).maybeSingle();
    if (error) return json(res, 200, { jsonrpc: "2.0", id, error: { code: -32000, message: error.message } });
    return json(res, 200, result(id, { content: [{ type: "text", text: JSON.stringify({ user: { id: user.id, email: user.email }, profile }) }] }));
  }

  if (name === "list_notifications") {
    const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50);
    const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(limit);
    if (error) return json(res, 200, { jsonrpc: "2.0", id, error: { code: -32000, message: error.message } });
    return json(res, 200, result(id, { content: [{ type: "text", text: JSON.stringify(data || []) }] }));
  }

  if (name === "list_projects") {
    const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50);
    const { data, error } = await supabase.from("projects").select("*").limit(limit);
    if (error) return json(res, 200, { jsonrpc: "2.0", id, error: { code: -32000, message: error.message } });
    return json(res, 200, result(id, { content: [{ type: "text", text: JSON.stringify(data || []) }] }));
  }

  return json(res, 200, { jsonrpc: "2.0", id, error: { code: -32602, message: "Unknown tool" } });
}
