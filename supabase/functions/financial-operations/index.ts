import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "AUTH_REQUIRED" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const token = authHeader.slice(7);
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "INVALID_SESSION" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const action = body?.action;
    const milestoneId = body?.milestone_id;
    if (!milestoneId || !["release", "resolve"].includes(action)) {
      return new Response(JSON.stringify({ error: "INVALID_REQUEST" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    let result;
    if (action === "release") {
      const { data, error } = await admin.rpc("release_project_milestone", {
        p_milestone_id: milestoneId,
        p_notes: body?.notes ?? null,
      });
      result = { data, error };
    } else {
      const requestedResolution = body?.resolution;
      const normalizedResolution = requestedResolution === "refund_full"
        ? "full_refund"
        : requestedResolution === "refund_partial"
          ? "partial_refund"
          : requestedResolution;
      const { data, error } = await admin.rpc("resolve_project_milestone_authenticated", {
        p_milestone_id: milestoneId,
        p_resolution: normalizedResolution,
        p_refund_amount: body?.refund_amount ?? 0,
        p_notes: body?.notes ?? null,
        p_actor_user_id: userData.user.id,
      });
      result = { data, error };
    }

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error.message, code: result.error.code }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(result.data), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "INTERNAL_ERROR" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});