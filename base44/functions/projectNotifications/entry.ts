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

    // Helper: create in-app notification with correct schema fields
    const createNotification = async (recipientEmail, title, message, type, relatedProjectId, relatedEntityId, actionUrl, priority) => {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: recipientEmail,
        title,
        message,
        type,
        related_project_id: relatedProjectId || null,
        related_entity_id: relatedEntityId || null,
        action_url: actionUrl || null,
        is_read: false,
        priority: priority || "medium"
      });
    };

    // Helper: send email (best-effort, don't fail the whole function if email fails)
    const sendEmail = async (to, subject, htmlBody) => {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to,
          subject,
          body: htmlBody
        });
      } catch (emailErr) {
        console.error("Email send failed:", emailErr.message);
      }
    };

    // ─── NEW PROPOSAL ────────────────────────────────────────────────────────
    if (entityName === "Proposal" && eventType === "create") {
      const proposal = data;
      const projects = await base44.asServiceRole.entities.Project.filter({ id: proposal.project_id });
      if (!projects.length) return Response.json({ ok: true });

      const proj = projects[0];
      const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: proposal.engineer_id });
      const engineerName = engineers.length ? engineers[0].full_name : "مهندس";

      // Get client email
      let clientEmail = null;
      const clients = await base44.asServiceRole.entities.Client.filter({ id: proj.client_id });
      if (clients.length) clientEmail = clients[0].email;

      const notifTitle = "عرض سعر جديد على مشروعك";
      const notifBody = `قدّم ${engineerName} عرض سعر بقيمة ${proposal.price?.toLocaleString()} ريال على مشروع "${proj.title}"`;

      const actionUrl = `/ProjectDetails?id=${proj.id}`;
      const emailHtml = `
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
      `;

      if (clientEmail) {
        await createNotification(clientEmail, notifTitle, notifBody, "proposal", proj.id, proposal.id, actionUrl, "high");
        await sendEmail(clientEmail, `💼 ${notifTitle} - بايتلي`, emailHtml);
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

      const actionUrl = `/ProjectDetails?id=${project.id}`;
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
        await createNotification(clients[0].email, notifTitle, notifBody, "project_status", project.id, null, actionUrl, "high");
        await sendEmail(clients[0].email, `🔔 ${notifTitle} - بايتلي`, emailHtml);
      }

      // Notify assigned engineer
      if (project.assigned_engineer_id) {
        const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
        if (engineers.length) {
          await createNotification(engineers[0].email, notifTitle, notifBody, "project_status", project.id, null, actionUrl, "high");
          await sendEmail(engineers[0].email, `🔔 ${notifTitle} - بايتلي`, emailHtml);
        }
      }

      // Notify technical consultant if assigned
      if (project.technical_consultant_id) {
        const consultants = await base44.asServiceRole.entities.Consultant.filter({ id: project.technical_consultant_id });
        if (consultants.length) {
          await createNotification(consultants[0].email, notifTitle, notifBody, "project_status", project.id, null, actionUrl, "medium");
          await sendEmail(consultants[0].email, `🔔 ${notifTitle} - بايتلي`, emailHtml);
        }
      }
    }

    // ─── NEW USER REGISTRATION ───────────────────────────────────────────────
    if (entityName === "Engineer" && eventType === "create") {
      const engineer = data;
      const notifTitle = "تسجيل مهندس جديد";
      const notifBody = `تم تسجيل المهندس ${engineer.full_name} (${engineer.email}) بنجاح`;
      
      // Send welcome email to engineer
      await sendEmail(
        engineer.email,
        "مرحباً بك في منصة بتلي - مهندس",
        `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6B5D4F;">أهلاً بك في منصة بتلي</h2>
          <p>أهلاً بك ${engineer.full_name}،</p>
          <p>تم تسجيل حسابك بنجاح في منصة بتلي للهندسة والاستشارات.</p>
          <p><strong>تخصصك:</strong> ${engineer.specialization || engineer.user_type}</p>
          <p>فريق بتلي يتمنى لك التوفيق والنجاح!</p>
          <hr style="margin-top:24px; border:none; border-top:1px solid #eee;">
          <p style="color:#aaa; font-size:12px;">بايتلي - منصة الهندسة والاستشارات</p>
        </div>`
      );
      
      // Notify admins
      const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
      for (const admin of admins) {
        await createNotification(
          admin.email,
          notifTitle,
          notifBody,
          "system",
          null,
          engineer.id,
          "/AdminEngineers",
          "medium"
        );
      }
    }

    if (entityName === "Client" && eventType === "create") {
      const client = data;
      const notifTitle = "تسجيل عميل جديد";
      const notifBody = `تم تسجيل العميل ${client.full_name} (${client.email}) بنجاح`;
      
      // Send welcome email to client
      await sendEmail(
        client.email,
        "مرحباً بك في منصة بتلي - عميل",
        `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6B5D4F;">أهلاً بك في منصة بتلي</h2>
          <p>أهلاً بك ${client.full_name}،</p>
          <p>تم تسجيل حسابك بنجاح في منصة بتلي للهندسة والاستشارات.</p>
          <p>نحن هنا لمساعدتك في جميع احتياجاتك الهندسية.</p>
          <p>فريق بتلي يتمنى لك تجربة مميزة!</p>
          <hr style="margin-top:24px; border:none; border-top:1px solid #eee;">
          <p style="color:#aaa; font-size:12px;">بايتلي - منصة الهندسة والاستشارات</p>
        </div>`
      );
      
      // Notify admins
      const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
      for (const admin of admins) {
        await createNotification(
          admin.email,
          notifTitle,
          notifBody,
          "system",
          null,
          client.id,
          "/AdminClients",
          "medium"
        );
      }
    }

    if (entityName === "EngineeringFirm" && eventType === "create") {
      const firm = data;
      const notifTitle = "تسجيل شركة جديدة";
      const notifBody = `تم تسجيل شركة ${firm.company_name} (${firm.email}) بنجاح`;
      
      // Send welcome email to firm
      await sendEmail(
        firm.email,
        "مرحباً بك في منصة بتلي - شركة",
        `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6B5D4F;">أهلاً بك في منصة بتلي</h2>
          <p>أهلاً بك في منصة بتلي للهندسة والاستشارات،</p>
          <p>تم تسجيل شركة <strong>${firm.company_name}</strong> بنجاح.</p>
          <p><strong>السجل التجاري:</strong> ${firm.commercial_registration}</p>
          <p>نتطلع إلى شراكة ناجحة ومثمرة!</p>
          <hr style="margin-top:24px; border:none; border-top:1px solid #eee;">
          <p style="color:#aaa; font-size:12px;">بايتلي - منصة الهندسة والاستشارات</p>
        </div>`
      );
      
      // Notify admins
      const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
      for (const admin of admins) {
        await createNotification(
          admin.email,
          notifTitle,
          notifBody,
          "system",
          null,
          firm.id,
          "/AdminClients",
          "high"
        );
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

      const actionUrl = `/Contract?id=${contract.id}`;
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
        if (clients.length) recipients.push({ email: clients[0].email });
      }
      if (contract.engineer_id) {
        const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: contract.engineer_id });
        if (engineers.length) recipients.push({ email: engineers[0].email });
      }

      for (const recipient of recipients) {
        await createNotification(recipient.email, notifTitle, notifBody, "contract", contract.project_id, contract.id, actionUrl, "high");
        await sendEmail(recipient.email, `📄 ${notifTitle} - بايتلي`, emailHtml);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("projectNotifications error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});