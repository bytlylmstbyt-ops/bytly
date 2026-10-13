import { supabase } from "@/lib/supabaseClient";

/**
 * Writes project workspace activity to the canonical Supabase project_activity table.
 * Activity logging is deliberately non-blocking for the user-facing workflow.
 */
export async function logWorkspaceActivity({
  projectId,
  user,
  activityType,
  summary,
  entityType,
  entityId,
  entityTitle,
  oldValue,
  newValue,
  metadata,
  actorRole,
}) {
  if (!projectId || !activityType || !summary || !supabase) return;
  try {
    const { data: authData } = await supabase.auth.getUser();
    let actorUserId = authData?.user?.id || null;
    if (!actorUserId && user?.email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("email", String(user.email).trim())
        .maybeSingle();
      actorUserId = profile?.user_id || null;
    }

    const validUuid = (value) => typeof value === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

    const activityMetadata = {
      summary: String(summary),
      actor_email: user?.email || null,
      actor_name: user?.full_name || user?.email?.split("@")[0] || "النظام",
      actor_role: actorRole || "system",
      entity_title: entityTitle || null,
      old_value: oldValue == null ? null : String(oldValue),
      new_value: newValue == null ? null : String(newValue),
      ...(metadata && typeof metadata === "object" ? metadata : {}),
    };

    const { error } = await supabase.from("project_activity").insert({
      project_id: projectId,
      actor_user_id: actorUserId,
      action: String(activityType).slice(0, 200),
      entity_type: entityType || null,
      entity_id: validUuid(entityId) ? entityId : null,
      metadata: activityMetadata,
    });
    if (error) throw error;
  } catch (err) {
    console.error("Project activity log failed (non-blocking):", err?.message || err);
  }
}
