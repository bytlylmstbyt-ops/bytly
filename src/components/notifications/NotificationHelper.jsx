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
    // Delegate to the backend function — it creates the notification record
    // AND sends the email via the platform Core integration (service-role).
    await base44.functions.invoke("sendPlatformNotification", {
      recipientEmail,
      title,
      message,
      type,
      projectId,
      priority,
      sendEmail: true,
      fromName: "منصة بيتلي - لمسة بيت",
    });

    // Notify admin for non-low-priority notifications
    if (recipientEmail !== ADMIN_EMAIL && priority !== "low") {
      try {
        await base44.functions.invoke("sendPlatformNotification", {
          recipientEmail: ADMIN_EMAIL,
          title: `[${priority.toUpperCase()}] ${title}`,
          message: `المستلم: ${recipientEmail} — ${message}`,
          type: "system",
          projectId,
          priority,
          sendEmail: true,
          fromName: "نظام الإشعارات - بيتلي",
        });
      } catch (adminErr) {
        console.error("Admin notification failed (non-blocking):", adminErr);
      }
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

export const notifyProposalAccepted = async ({ engineerEmail, projectTitle, amount, projectId }) => {
  await sendNotification({
    recipientEmail: engineerEmail,
    title: "🎉 تم قبول عرضك!",
    message: `تهانينا! تم قبول عرضك على مشروع "${projectTitle}" بقيمة ${amount?.toLocaleString('ar-SA')} ريال. تواصل مع العميل للبدء.`,
    type: "approval",
    projectId,
    priority: "high"
  });
};

export const notifyMilestoneUpdate = async ({ recipientEmail, milestoneTitle, projectTitle, status, projectId }) => {
  const statusMessages = {
    submitted: `قدّم المهندس المرحلة "${milestoneTitle}" في مشروع "${projectTitle}" - بانتظار موافقتك.`,
    approved: `تمت الموافقة على المرحلة "${milestoneTitle}" في مشروع "${projectTitle}".`,
    revision_requested: `طُلب تعديل على المرحلة "${milestoneTitle}" في مشروع "${projectTitle}".`,
    completed: `اكتملت المرحلة "${milestoneTitle}" في مشروع "${projectTitle}" بنجاح!`,
  };
  await sendNotification({
    recipientEmail,
    title: `تحديث مرحلة: ${milestoneTitle}`,
    message: statusMessages[status] || `تحديث على مرحلة "${milestoneTitle}"`,
    type: "milestone",
    projectId,
    priority: status === "submitted" ? "high" : "medium"
  });
};

export const notifyWithdrawalRequest = async ({ engineerEmail, amount, requestId }) => {
  await sendNotification({
    recipientEmail: engineerEmail,
    title: "تم استلام طلب السحب",
    message: `تم استلام طلب سحب بقيمة ${amount?.toLocaleString('ar-SA')} ريال وهو قيد المراجعة من الشركة الاستشارية.`,
    type: "withdrawal",
    priority: "medium"
  });
  // Notify admin
  await sendNotification({
    recipientEmail: ADMIN_EMAIL,
    title: "طلب سحب جديد يحتاج مراجعة",
    message: `طلب سحب جديد بقيمة ${amount?.toLocaleString('ar-SA')} ريال يحتاج اعتماد مستشار فني.`,
    type: "withdrawal",
    priority: "high"
  });
};

export const notifyWithdrawalProcessed = async ({ engineerEmail, amount, status }) => {
  const approved = status !== "rejected";
  await sendNotification({
    recipientEmail: engineerEmail,
    title: approved ? "✅ تم اعتماد طلب السحب" : "❌ تم رفض طلب السحب",
    message: approved
      ? `تم اعتماد طلب سحب ${amount?.toLocaleString('ar-SA')} ريال وسيتم التحويل خلال 3-5 أيام عمل.`
      : `تم رفض طلب سحب ${amount?.toLocaleString('ar-SA')} ريال. راجع ملاحظات المستشار للتصحيح.`,
    type: "withdrawal",
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