import { supabase } from "@/lib/supabaseClient";
import { logWorkspaceActivity } from "./logWorkspaceActivity";

/**
 * يسجل نشاط المشروع ويرسل إشعاراً للمشاركين من خلال Edge Function
 * تتحقق من جلسة المستخدم وعلاقته بالمشروع قبل إنشاء الإشعارات.
 */
export async function notifyWorkspaceUpdate({
  project,
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
  if (!project?.id || !activityType || !summary) return;

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
    metadata: { ...(metadata || {}), priority },
    actorRole,
  });

  try {
    const { data, error } = await supabase.functions.invoke("send-workspace-notification", {
      body: {
        projectId: project.id,
        activityType,
        summary,
        title: notifyTitle || summary,
        message: notifyMessage || summary,
        entityType: entityType || "project",
        sendEmail: Boolean(sendEmail),
      },
    });

    if (error) throw error;
    if (!data?.ok) throw new Error(data?.error || "تعذر إرسال إشعار المشروع");
    if (data.emailUnavailable && sendEmail) {
      console.warn("Workspace in-app notifications were saved, but one or more emails could not be sent.");
    }
    return data;
  } catch (err) {
    // Notifications must never cancel the primary project action.
    console.error("Workspace notification failed (non-blocking):", err);
    return null;
  }
}
