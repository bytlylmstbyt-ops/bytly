import { base44 } from "@/api/base44Client";
import { logWorkspaceActivity } from "./logWorkspaceActivity";

/**
 * نوع النشاط → نوع الإشعار في كيان Notification
 */
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

/**
 * يرسل إشعارات لحظية (داخل المنصة + بريد إلكتروني) للمهندس والعميل
 * عند حدوث تحديث في مساحة عمل المشروع، مع تسجيل النشاط.
 *
 * @param {Object}  params
 * @param {Object}  params.project             — كيان المشروع
 * @param {Object}  [params.assignedEngineer]  — كيان المهندس المسؤول (اختياري)
 * @param {Object}  params.user               — المستخدم الحالي (الفاعل)
 * @param {string}  params.activityType        — نوع النشاط (من enum WorkspaceActivity)
 * @param {string}  params.summary            — وصف مختصر (يُستخدم في سجل النشاط)
 * @param {string}  [params.notifyTitle]       — عنوان الإشعار (يستخدم summary إن لم يُمرر)
 * @param {string}  [params.notifyMessage]     — نص الإشعار (يستخدم summary إن لم يُمرر)
 * @param {string}  [params.entityType]
 * @param {string}  [params.entityId]
 * @param {string}  [params.entityTitle]
 * @param {string}  [params.oldValue]
 * @param {string}  [params.newValue]
 * @param {Object}  [params.metadata]
 * @param {string}  [params.actorRole]
 * @param {string}  [params.priority]          — low | medium | high | urgent
 * @param {boolean} [params.sendEmail]         — إرسال بريد أيضاً (افتراضي: true)
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
  if (!project || !activityType || !summary) return;

  // 1) تسجيل النشاط في سجل مساحة العمل
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
    metadata,
    actorRole,
  });

  // 2) إرسال الإشعارات للمشاركين (المهندس + العميل) باستثناء الفاعل
  const notifyType = ACTIVITY_TO_NOTIFY_TYPE[activityType] || "project_update";
  const actorEmail = user?.email;

  const recipients = new Set();

  // بريد العميل (created_by في المشروع هو البريد الإلكتروني)
  const clientEmail = project.created_by;
  if (clientEmail && clientEmail !== actorEmail) recipients.add(clientEmail);

  // بريد المهندس المسؤول
  const engineerEmail = assignedEngineer?.email;
  if (engineerEmail && engineerEmail !== actorEmail) recipients.add(engineerEmail);

  if (recipients.size === 0) return;

  const title = notifyTitle || summary;
  const message = notifyMessage || summary;
  const actionUrl = `/ProjectDetails?id=${project.id}`;

  // إنشاء سجلات الإشعارات + إرسال البريد لكل مستلم
  await Promise.all(
    Array.from(recipients).map(async (recipientEmail) => {
      try {
        await base44.entities.Notification.create({
          recipient_email: recipientEmail,
          title,
          message,
          type: notifyType,
          related_project_id: project.id,
          related_entity_id: entityId,
          action_url: actionUrl,
          priority,
        });

        if (sendEmail) {
          try {
            await base44.integrations.Core.SendEmail({
              from_name: "منصة بيتلي",
              to: recipientEmail,
              subject: title,
              body: buildEmailHtml(title, message, project, actionUrl),
            });
          } catch (emailErr) {
            // فشل البريد لا يوقف الإشعار الداخلي
            console.error("Email send failed (non-blocking):", emailErr);
          }
        }
      } catch (err) {
        console.error("Notification create failed (non-blocking):", err);
      }
    })
  );
}

/**
 * قالب بريد إلكتروني بهوية بيتلي البصرية.
 */
function buildEmailHtml(title, message, project, actionUrl) {
  const appUrl = "https://bytly.base44.com" + actionUrl;
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeProjectTitle = escapeHtml(project?.title || "");

  return `
    <div dir="rtl" style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#4A3F35 0%,#C9A66B 100%);padding:28px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">بيتلي</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">منصة الهندسة والتصميم المتكاملة</p>
      </div>
      <div style="padding:28px;background:#F5F0E8;">
        <h2 style="color:#4A3F35;margin-top:0;font-size:18px;border-right:4px solid #C9A66B;padding-right:14px;">${safeTitle}</h2>
        <p style="color:#333;line-height:1.8;font-size:15px;">${safeMessage}</p>
        ${safeProjectTitle ? `<div style="margin:16px 0;padding:12px;background:#fff;border-radius:8px;border:1px solid #E5D4B8;">
          <p style="color:#6B5D4F;margin:0;font-size:13px;">المشروع: <strong style="color:#4A3F35;">${safeProjectTitle}</strong></p>
        </div>` : ""}
        <div style="text-align:center;margin-top:24px;">
          <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#6B5D4F 0%,#C9A66B 100%);color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
            عرض التحديث في مساحة العمل
          </a>
        </div>
      </div>
      <div style="padding:16px;background:#4A3F35;text-align:center;">
        <p style="color:rgba(255,255,255,0.6);margin:0;font-size:11px;">© ${new Date().getFullYear()} بيتلي — جميع الحقوق محفوظة</p>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}