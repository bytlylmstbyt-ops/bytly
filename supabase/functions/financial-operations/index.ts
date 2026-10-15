import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "AUTH_REQUIRED" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anonKey) return json({ error: "SERVER_CONFIGURATION_ERROR" }, 500);

    // Keep the caller JWT attached so Postgres auth.uid() reflects the signed-in user.
    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userError } = await caller.auth.getUser();
    if (userError || !userData.user) return json({ error: "INVALID_SESSION" }, 401);

    const body = await req.json();
    const action = body?.action;
    const milestoneId = body?.milestone_id;
    if (!milestoneId || !["release", "resolve"].includes(action)) return json({ error: "INVALID_REQUEST" }, 400);

    let result;
    if (action === "release") {
      result = await caller.rpc("release_project_milestone_authenticated", {
        p_milestone_id: milestoneId,
        p_notes: body?.notes ?? null,
      });
    } else {
      const requestedResolution = body?.resolution;
      const normalizedResolution = requestedResolution === "refund_full"
        ? "full_refund"
        : requestedResolution === "refund_partial"
          ? "partial_refund"
          : requestedResolution;
      result = await caller.rpc("resolve_project_milestone", {
        p_milestone_id: milestoneId,
        p_resolution: normalizedResolution,
        p_refund_amount: body?.refund_amount ?? 0,
        p_notes: body?.notes ?? null,
        p_actor_user_id: userData.user.id,
      });
    }

    if (result.error) return json({ error: result.error.message, code: result.error.code }, 400);
    return json(result.data);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "INTERNAL_ERROR" }, 500);
  }
});
