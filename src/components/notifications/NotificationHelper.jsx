import { base44 } from "@/api/base44Client";

const ADMIN_EMAIL = "bytlylmstbyt@gmail.com";

export const sendNotification = async ({
  recipientEmail,
  title,
  message,
  type,
  projectId = null,
  priority = "medium"
}) => {
  try {
    // Create notification in database
    await base44.entities.Notification.create({
      recipient_email: recipientEmail,
      title,
      message,
      type,
      related_project_id: projectId,
      priority
    });

    // Send email notification
    try {
      await base44.integrations.Core.SendEmail({
        from_name: "منصة بيتلي - لمسة بيت",
        to: recipientEmail,
        subject: title,
        body: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #d4a574 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">بيتلي - لمسة بيت</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">منصة ربط المصممين والعملاء</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #1a1a2e; margin-top: 0; font-size: 20px; border-right: 4px solid #d4a574; padding-right: 15px;">${title}</h2>
              <p style="color: #333; line-height: 1.8; font-size: 16px;">${message}</p>
              
              ${projectId ? `
                <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e0e0e0;">
                  <p style="color: #666; margin: 0; font-size: 14px;">رقم المشروع: <strong style="color: #1a1a2e;">${projectId.slice(0, 8)}</strong></p>
                </div>
              ` : ''}
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://bytly.base44.com" style="display: inline-block; background: linear-gradient(135deg, #1a1a2e 0%, #d4a574 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  الانتقال للمنصة
                </a>
              </div>
            </div>
            
            <div style="padding: 20px; background: #1a1a2e; text-align: center;">
              <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">
                © ${new Date().getFullYear()} بيتلي - لمسة بيت. جميع الحقوق محفوظة.
              </p>
              <p style="color: rgba(255,255,255,0.7); margin: 10px 0 0 0; font-size: 12px;">
                للدعم: ${ADMIN_EMAIL}
              </p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
    }

    // Always notify admin
    if (recipientEmail !== ADMIN_EMAIL && priority !== "low") {
      await base44.integrations.Core.SendEmail({
        from_name: "نظام الإشعارات - بيتلي",
        to: ADMIN_EMAIL,
        subject: `[${priority.toUpperCase()}] ${title}`,
        body: `
          <div dir="rtl">
            <h3>إشعار إداري</h3>
            <p><strong>المستلم:</strong> ${recipientEmail}</p>
            <p><strong>النوع:</strong> ${type}</p>
            <p><strong>الرسالة:</strong> ${message}</p>
            ${projectId ? `<p><strong>المشروع:</strong> ${projectId}</p>` : ''}
          </div>
        `
      });
    }

    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
};

export const notifyProjectUpdate = async (projectId, engineerId, clientId, message) => {
  await sendNotification({
    recipientEmail: clientId,
    title: "تحديث على مشروعك",
    message,
    type: "project_update",
    projectId
  });
};

export const notifyTechnicalReview = async (projectId, engineerId, consultantId) => {
  await sendNotification({
    recipientEmail: consultantId,
    title: "مشروع جديد للمراجعة الفنية",
    message: "تم تسليم مشروع جديد يحتاج لمراجعتك الفنية",
    type: "review",
    projectId,
    priority: "high"
  });
};

export const notifyTechnicalApproval = async (projectId, engineerId, clientId, status) => {
  const message = status === "approved" 
    ? "تم اعتماد المشروع من المستشار الفني. يمكنك الآن المراجعة والموافقة النهائية."
    : "المشروع بحاجة لتعديلات بناءً على مراجعة المستشار الفني.";
  
  await sendNotification({
    recipientEmail: clientId,
    title: "نتيجة المراجعة الفنية",
    message,
    type: "review",
    projectId,
    priority: "high"
  });
};

export const notifyPaymentRelease = async (recipientEmail, amount, type) => {
  await sendNotification({
    recipientEmail,
    title: "تم إضافة مبلغ لمحفظتك",
    message: `تم إضافة ${amount.toLocaleString('ar-SA')} ريال لمحفظتك`,
    type: "payment",
    priority: "high"
  });
};

export const notifyLegalReview = async (complaintId, projectId, legalConsultantId) => {
  await sendNotification({
    recipientEmail: legalConsultantId,
    title: "شكوى قانونية جديدة",
    message: "تم تحويل شكوى قانونية لمراجعتك",
    type: "complaint",
    projectId,
    priority: "urgent"
  });
};

export const notifyAdminIntervention = async (projectId, message) => {
  await sendNotification({
    recipientEmail: ADMIN_EMAIL,
    title: "تنبيه: يتطلب تدخل إداري",
    message,
    type: "system",
    projectId,
    priority: "urgent"
  });
};