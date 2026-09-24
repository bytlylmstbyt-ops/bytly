import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://wbqtgdkubrocnqnykhlt.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_8dsKwVbalFlUNA65FJaWlA_1ch0TKfw";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SERVER = {
  name: "Bytly MCP",
  version: "1.1.0",
  protocolVersion: "2025-06-18",
};

const tools = [
  {
    name: "get_current_user",
    description: "Get the authenticated Bytly user's profile and role.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_projects",
    description: "List projects visible to the authenticated Bytly user.",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "integer", minimum: 1, maximum: 50 } },
      additionalProperties: false,
    },
  },
  {
    name: "list_notifications",
    description: "List notifications for the authenticated Bytly user.",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "integer", minimum: 1, maximum: 50 } },
      additionalProperties: false,
    },
  },
];

function send(res, status, body, contentType = "application/json") {
  res.status(status);
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Expose-Headers", "WWW-Authenticate, MCP-Protocol-Version");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, MCP-Protocol-Version, Accept, Last-Event-ID"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  return res.end(body == null ? "" : JSON.stringify(body));
}

function rpc(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function authToken(req) {
  return String(req.headers.authorization || "")
    .replace(/^Bearer\\s+/i, "")
    .trim();
}

async function requireUser(req) {
  const token = authToken(req);
  if (!token) return { error: "Authentication required" };

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: "Bearer " + token } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (!error && data?.user) return { supabase, user: data.user };

  if (!SERVICE_KEY) return { error: "Invalid or expired authentication" };
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const { data: oauthToken, error: oauthError } = await admin
    .from("mcp_oauth_tokens")
    .select("user_id,scope,expires_at,revoked_at")
    .eq("access_token_hash", hash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (oauthError || !oauthToken?.user_id) return { error: "Invalid or expired authentication" };

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(oauthToken.user_id);
  if (userError || !userData?.user) return { error: "Invalid or expired authentication" };

  return { supabase: admin, user: userData.user };
}

async function callTool(name, args, req) {
  const auth = await requireUser(req);
  if (auth.error) return { status: 401, body: rpcError(null, -32001, auth.error) };

  const { supabase, user } = auth;

  if (name === "get_current_user") {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id,user_id,email,full_name,phone,role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return { status: 200, body: rpcError(null, -32000, error.message) };

    return {
      status: 200,
      value: {
        user: { id: user.id, email: user.email },
        profile,
      },
    };
  }

  if (name === "list_notifications") {
    const limit = Math.min(Math.max(Number(args?.limit) || 20, 1), 50);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { status: 200, body: rpcError(null, -32000, error.message) };
    return { status: 200, value: data || [] };
  }

  if (name === "list_projects") {
    const limit = Math.min(Math.max(Number(args?.limit) || 20, 1), 50);
    // RLS is intentionally relied upon here so MCP cannot bypass the user's Bytly permissions.
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .limit(limit);

    if (error) return { status: 200, body: rpcError(null, -32000, error.message) };
    return { status: 200, value: data || [] };
  }

  return { status: 200, body: rpcError(null, -32602, "Unknown tool") };
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return send(res, 204);

  // Health/diagnostic endpoint. MCP clients use POST /api/mcp for Streamable HTTP.
  if (req.method === "GET") {
    const acceptsSse = String(req.headers.accept || "").includes("text/event-stream");
    if (acceptsSse) {
      res.status(200);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.write(": bytly-mcp\\n\\n");
      return res.end();
    }

    return send(res, 200, {
      status: "ok",
      server: SERVER,
      endpoint: "/api/mcp",
      transport: "streamable-http",
      authentication: "Bearer Supabase access token",
      tools: tools.map((tool) => tool.name),
    });
  }

  if (req.method === "DELETE") return send(res, 405, { error: "MCP sessions are stateless" });

  if (req.method !== "POST") return send(res, 405, { error: "Method Not Allowed" });

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return send(res, 400, rpcError(null, -32700, "Invalid JSON"));
  }

  const id = body?.id ?? null;
  const method = body?.method;
  if (!method) return send(res, 400, rpcError(id, -32600, "Invalid Request"));

  if (method === "initialize") {
    const requested = body?.params?.protocolVersion;
    const protocolVersion =
      requested === SERVER.protocolVersion ? requested : SERVER.protocolVersion;

    return send(
      res,
      200,
      rpc(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: SERVER.name, version: SERVER.version },
        instructions:
          "Bytly MCP exposes user-scoped Bytly data. Tool calls require a valid Supabase access token and remain subject to Supabase RLS.",
      })
    );
  }

  if (method === "notifications/initialized") return send(res, 202);

  if (method === "ping") return send(res, 200, rpc(id, {}));

  if (method === "tools/list") return send(res, 200, rpc(id, { tools }));

  if (method === "tools/call") {
    const name = body?.params?.name;
    const args = body?.params?.arguments || {};
    const result = await callTool(name, args, req);

      if (result.status === 401) {
      res.setHeader("WWW-Authenticate", 'Bearer resource_metadata="https://mybytly.com/.well-known/oauth-protected-resource"');
    }

    if (result.body) {
      if (result.body.id === null) result.body.id = id;
      return send(res, result.status, result.body);
    }

    return send(
      res,
      result.status || 200,
      rpc(id, {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.value ?? null),
          },
        ],
      })
    );
  }

  return send(res, 200, rpcError(id, -32601, "Method not found"));
}
