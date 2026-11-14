import { supabase } from "@/lib/supabaseClient";

/**
 * Appends an activity entry for the authenticated project participant.
 * RLS verifies both actor_user_id and the actor's relationship to the project.
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
  if (!projectId || !activityType || !summary) return;

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const actor = authData?.user;
    if (authError || !actor) return;

    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const activityMetadata = {
      ...(metadata && typeof metadata === "object" ? metadata : {}),
      summary: String(summary),
      actor_email: user?.email || actor.email || null,
      actor_name: user?.full_name || user?.name || actor.user_metadata?.full_name || actor.email?.split("@")[0] || "مستخدم",
      actor_role: actorRole || user?.role || "participant",
      entity_title: entityTitle || null,
      old_value: oldValue == null ? null : String(oldValue),
      new_value: newValue == null ? null : String(newValue),
    };

    const { error } = await supabase.from("project_activity").insert({
      project_id: projectId,
      actor_user_id: actor.id,
      action: String(activityType),
      entity_type: entityType || null,
      entity_id: entityId && uuidPattern.test(String(entityId)) ? String(entityId) : null,
      metadata: activityMetadata,
    });

    if (error) throw error;
  } catch (err) {
    // Activity logging is deliberately non-blocking for the primary project action.
    console.error("Workspace activity log failed:", err);
  }
}
