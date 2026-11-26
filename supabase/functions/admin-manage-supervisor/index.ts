import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Server configuration incomplete" }, 500);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

  const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: authData, error: authError } = await callerClient.auth.getUser();
  if (authError || !authData.user) return json({ error: "Invalid session" }, 401);

  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const callerEmail = (authData.user.email || "").trim().toLowerCase();
  const { data: callerProfile, error: profileError } = await adminClient
    .from("profiles").select("role").eq("user_id", authData.user.id).maybeSingle();
  if (profileError) return json({ error: "Unable to verify administrator role" }, 500);
  const allowed = callerProfile?.role === "admin" || callerEmail === "bytlylmstbyt@gmail.com";
  if (!allowed) return json({ error: "Administrator access required" }, 403);

  let body: { target_user_id?: string; action?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const targetId = String(body.target_user_id || "").trim();
  if (!targetId || targetId === authData.user.id) return json({ error: "Invalid target account" }, 400);
  if (!["assign", "revoke"].includes(String(body.action))) return json({ error: "Invalid action" }, 400);

  const { data: target, error: targetError } = await adminClient
    .from("profiles").select("user_id,role,email,full_name").eq("user_id", targetId).maybeSingle();
  if (targetError) return json({ error: "Unable to resolve target profile" }, 500);
  if (!target?.user_id) return json({ error: "Target profile not found" }, 404);

  // Only normal user accounts can be promoted. Never overwrite provider, admin,
  // or other business roles through this supervisor workflow.
  if (body.action === "assign" && target.role !== "user" && target.role !== "supervisor") {
    return json({ error: "Only standard user profiles can be assigned as supervisor" }, 409);
  }
  if (body.action === "revoke" && target.role !== "supervisor") {
    return json({ error: "Target account is not a supervisor" }, 409);
  }

  const nextRole = body.action === "assign" ? "supervisor" : "user";
  const { error: updateError } = await adminClient.from("profiles")
    .update({ role: nextRole }).eq("user_id", targetId);
  if (updateError) return json({ error: "Unable to update supervisor role" }, 500);

  // Best-effort audit; authorization does not depend on this table.
  try {
    await adminClient.from("admin_audit_logs").insert({
      actor_user_id: authData.user.id,
      actor_email: callerEmail,
      action: body.action === "assign" ? "assign_supervisor" : "revoke_supervisor",
      target_type: "profile",
      target_id: targetId,
      target_name: target.full_name || target.email || "",
      details: body.action === "assign" ? "Supervisor role assigned" : "Supervisor role revoked",
    });
  } catch (_) {}

  return json({ success: true, target_user_id: targetId, role: nextRole });
});
