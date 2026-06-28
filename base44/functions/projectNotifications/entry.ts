import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const STATUS_LABELS = {
  open: "مفتوح",
  in_progress: "قيد التنفيذ",
  awaiting_technical_review: "في انتظار المراجعة الفنية",
  technical_approved: "تمت الموافقة الفنية",
  pending_client_approval: "في انتظار موافقة العميل",
  completed: "مكتمل",
  cancelled: "ملغى",
  disputed: "متنازع عليه"
};

const CONTRACT_STATUS_LABELS = {
  draft: "مسودة",
  pending_signature: "في انتظار التوقيع",
  signed: "موقّع",
  active: "نشط",
  completed: "مكتمل",
  terminated: "منتهي",
  archived: "مؤرشف"
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await req.json();
    const { event, data } = payload;

    if (!event || !data) {
      return Response.json({ error: "Missing event or data" }, { status: 400 });
    }

    const eventType = event.type;
    const entityName = event.entity_name;

    // ─── NEW PROPOSAL ────────────────────────────────────────────────────────
    if (entityName === "Proposal" && eventType === "create") {
      const proposal = data;
      const project = await base44.asServiceRole.entities.Project.filter({ id: proposal.project_id });
      if (!project.length) return Response.json({ ok: true });

      const proj = project[0];
      const engineer = await base44.asServiceRole.entities.Engineer.filter({ id: proposal.engineer_id });
      const engineerName = engineer.length ? engineer[0].full_name : "مهندس";

      // Get client email from Client entity
      const clients = await base44.asServiceRole.entities.Client.filter({ id: proj.client_id });
      const clientEmail = clients.length ? clients[0].email : null;

      const notifTitle = "عرض سعر جديد على مشروعك";
      const notifBody = `قدّم ${engineerName} عرض سعر بقيمة ${proposal.price?.toLocaleString()} ريال على مشروع "${proj.title}"`;

      // In-app notification for client
      if (clientEmail) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: clientEmail,
          title: notifTitle,
          message: notifBody,
          type: "proposal",
          related_id: proposal.project_id,
          is_read: false
        });

        // Email notification
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: clientEmail,
          subject: `💼 ${notifTitle} - بايتلي`,
          body: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #6B5D4F;">عرض سعر جديد على مشروعك</h2>
              <p>${notifBody}</p>
              <p style="color: #666;">المشروع: <strong>${proj.title}</strong></p>
              <p style="color: #666;">قيمة العرض: <strong>${proposal.price?.toLocaleString()} ريال</strong></p>
              <p style="color: #666;">مدة التسليم: <strong>${proposal.delivery_days} يوم</strong></p>
              <a href="https://app.mybytly.com/ProjectDetails?id=${proj.id}" 
                 style="display:inline-block; background: linear-gradient(135deg,#6B5D4F,#C9A66B); color:white; padding:12px 24px; border-radius:8px; text-decoration:none; margin-top:16px;">
                مراجعة العرض
              </a>
              <hr style="margin-top:24px; border:none; border-top:1px solid #eee;">
              <p style="color:#aaa; font-size:12px;">بايتلي - منصة الهندسة والاستشارات</p>
            </div>
          `
        });
      }
    }

    // ─── PROJECT STATUS CHANGE ────────────────────────────────────────────────
    if (entityName === "Project" && eventType === "update") {
      const project = data;
      const old_data = payload.old_data;
      const changedFields = payload.changed_fields || [];

      if (!changedFields.includes("status") || !old_data || old_data.status === project.status) {
        return Response.json({ ok: true });
      }

      const newStatusLabel = STATUS_LABELS[project.status] || project.status;
      const oldStatusLabel = STATUS_LABELS[old_data.status] || old_data.status;

      const notifTitle = `تغيّرت حالة المشروع إلى: ${newStatusLabel}`;
      const notifBody = `تم تحديث حالة مشروع "${project.title}" من "${oldStatusLabel}" إلى "${newStatusLabel}"`;

      const emailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6B5D4F;">تحديث حالة المشروع</h2>
          <p>${notifBody}</p>
          <p style="color:#666;">المشروع: <strong>${project.title}</strong></p>
          <div style="background:#f9f5f0; border-radius:8px; padding:16px; margin:16px 0;">
            <p style="margin:0; color:#6B5D4F;">الحالة السابقة: <strong>${oldStatusLabel}</strong></p>
            <p style="margin:8px 0 0; color:#C9A66B;">الحالة الجديدة: <strong>${newStatusLabel}</strong></p>
          </div>
          <a href="https://app.mybytly.com/ProjectDetails?id=${project.id}"
             style="display:inline-block; background: linear-gradient(135deg,#6B5D4F,#C9A66B); color:white; padding:12px 24px; border-radius:8px; text-decoration:none; margin-top:16px;">
            عرض المشروع
          </a>
          <hr style="margin-top:24px; border:none; border-top:1px solid #eee;">
          <p style="color:#aaa; font-size:12px;">بايتلي - منصة الهندسة والاستشارات</p>
        </div>
      `;

      // Notify client
      const clients = await base44.asServiceRole.entities.Client.filter({ id: project.client_id });
      if (clients.length) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: clients[0].email,
          title: notifTitle,
          message: notifBody,
          type: "project_status",
          related_id: project.id,
          is_read: false
        });
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: clients[0].email,
          subject: `🔔 ${notifTitle} - بايتلي`,
          body: emailHtml
        });
      }

      // Notify assigned engineer
      if (project.assigned_engineer_id) {
        const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
        if (engineers.length) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: engineers[0].email,
            title: notifTitle,
            message: notifBody,
            type: "project_status",
            related_id: project.id,
            is_read: false
          });
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: engineers[0].email,
            subject: `🔔 ${notifTitle} - بايتلي`,
            body: emailHtml
          });
        }
      }
    }

    // ─── CONTRACT UPDATE ──────────────────────────────────────────────────────
    if (entityName === "Contract" && eventType === "update") {
      const contract = data;
      const old_data = payload.old_data;
      const changedFields = payload.changed_fields || [];

      if (!changedFields.includes("status") || !old_data || old_data.status === contract.status) {
        return Response.json({ ok: true });
      }

      const newStatusLabel = CONTRACT_STATUS_LABELS[contract.status] || contract.status;
      const notifTitle = `تحديث العقد: ${newStatusLabel}`;
      const notifBody = `تم تحديث حالة العقد الخاص بمشروع رقم ${contract.project_id} إلى "${newStatusLabel}"`;

      const emailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6B5D4F;">تحديث العقد</h2>
          <p>${notifBody}</p>
          <div style="background:#f9f5f0; border-radius:8px; padding:16px; margin:16px 0;">
            <p style="margin:0; color:#C9A66B;">الحالة الجديدة: <strong>${newStatusLabel}</strong></p>
            ${contract.status === 'pending_signature' ? '<p style="color:#e67e22; margin:8px 0 0;">يرجى مراجعة العقد وتوقيعه في أقرب وقت.</p>' : ''}
          </div>
          <a href="https://app.mybytly.com/Contract?id=${contract.id}"
             style="display:inline-block; background: linear-gradient(135deg,#6B5D4F,#C9A66B); color:white; padding:12px 24px; border-radius:8px; text-decoration:none; margin-top:16px;">
            عرض العقد
          </a>
          <hr style="margin-top:24px; border:none; border-top:1px solid #eee;">
          <p style="color:#aaa; font-size:12px;">بايتلي - منصة الهندسة والاستشارات</p>
        </div>
      `;

      const recipients = [];

      if (contract.client_id) {
        const clients = await base44.asServiceRole.entities.Client.filter({ id: contract.client_id });
        if (clients.length) recipients.push({ email: clients[0].email, role: "client" });
      }
      if (contract.engineer_id) {
        const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: contract.engineer_id });
        if (engineers.length) recipients.push({ email: engineers[0].email, role: "engineer" });
      }

      for (const recipient of recipients) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: recipient.email,
          title: notifTitle,
          message: notifBody,
          type: "contract",
          related_id: contract.id,
          is_read: false
        });
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: recipient.email,
          subject: `📄 ${notifTitle} - بايتلي`,
          body: emailHtml
        });
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("projectNotifications error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});