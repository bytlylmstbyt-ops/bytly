import { base44 } from "@/api/base44Client";

/**
 * يسجل نشاطاً جديداً في مساحة عمل المشروع.
 * @param {Object} params
 * @param {string} params.projectId - معرف المشروع
 * @param {Object} params.user - المستخدم الحالي (من base44.auth.me)
 * @param {string} params.activityType - نوع النشاط (من enum في الكيان)
 * @param {string} params.summary - وصف مختصر
 * @param {string} [params.entityType] - نوع الكيان
 * @param {string} [params.entityId] - معرف الكيان
 * @param {string} [params.entityTitle] - عنوان الكيان
 * @param {string} [params.oldValue] - القيمة القديمة
 * @param {string} [params.newValue] - القيمة الجديدة
 * @param {Object} [params.metadata] - بيانات إضافية
 * @param {string} [params.actorRole] - دور المستخدم
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
    await base44.entities.WorkspaceActivity.create({
      project_id: projectId,
      actor_email: user?.email || "system",
      actor_name: user?.full_name || user?.email?.split("@")[0] || "النظام",
      actor_role: actorRole || "system",
      activity_type: activityType,
      entity_type: entityType,
      entity_id: entityId,
      entity_title: entityTitle,
      summary,
      old_value: oldValue ? String(oldValue) : undefined,
      new_value: newValue ? String(newValue) : undefined,
      metadata,
    });
  } catch (err) {
    console.error("WorkspaceActivity log failed (non-blocking):", err);
  }
}