import { supabase } from "@/lib/supabaseClient";
import { logWorkspaceActivity } from "./logWorkspaceActivity";

const ACTIVITY_TO_NOTIFY_TYPE = {
  project_status_changed: "project_status",
  file_uploaded: "project_update",
  file_deleted: "project_update",
  milestone_submitted: "milestone",
  milestone_approved: "milestone",
  milestone_status_changed: "milestone",
  task_created: "project_update",
  task_status_changed: "project_update",
  contract_created: "contract",
  contract_signed: "contract",
  contract_updated: "contract",
  proposal_submitted: "proposal",
  proposal_accepted: "approval",
  meeting_scheduled: "project_update",
  payment_made: "payment",
  escrow_held: "payment",
  escrow_released: "payment",
};

const isUuid = (value) => typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

/**
 * Records project activity and sends in-app notifications through the Supabase
 * send-notification Edge Function. Email delivery is intentionally not routed
 * through the unauthenticated system-email endpoint.
 */
export async function notifyWorkspaceUpdate({
  project,
  assignedEngineer,
  user,
  activityType,
  summary,
  notifyTitle,
  notifyMessage,
  entityType,
  entityId,
  entityTitle,
  oldValue,
  newValue,
  metadata,
  actorRole,
  priority = "medium",
  sendEmail = true,
}) {
  if (!project?.id || !activityType || !summary || !supabase) return;

  await logWorkspaceActivity({
    projectId: project.id,
    user,
    activityType,
    summary,
    entityType,
    entityId,
    entityTitle,
    oldValue,
    newValue,
    metadata: { ...(metadata || {}), priority, sendEmailRequested: Boolean(sendEmail) },
    actorRole,
  });

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const actorId = authData?.user?.id;
  if (authError || !actorId) {
    console.warn("In-app project notification skipped: authenticated Supabase session is required.");
    return;
  }

  const actorEmail = String(authData.user.email || user?.email || "").trim().toLowerCase();
  const recipients = new Set([
    project.created_by,
    assignedEngineer?.email,
  ].filter((email) => email && String(email).trim().toLowerCase() !== actorEmail)
    .map((email) => String(email).trim().toLowerCase()));

  if (!recipients.size) return;

  const title = String(notifyTitle || summary).slice(0, 300);
  const message = String(notifyMessage || summary).slice(0, 5000);
  const notifyType = ACTIVITY_TO_NOTIFY_TYPE[activityType] || "project_update";

  await Promise.all(Array.from(recipients).map(async (recipientEmail) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("email", recipientEmail)
        .maybeSingle();
      if (profileError) throw profileError;
      const recipientUserId = profile?.user_id;
      if (!recipientUserId) {
        console.warn("In-app notification skipped: no linked Supabase profile for recipient.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("send-notification", {
        body: {
          user_id: recipientUserId,
          title,
          body: message,
          type: notifyType,
          entity_type: entityType || "project",
          entity_id: isUuid(entityId) ? entityId : project.id,
        },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Notification service rejected the request");
    } catch (err) {
      console.error("In-app project notification failed (non-blocking):", err?.message || err);
    }
  }));
}
