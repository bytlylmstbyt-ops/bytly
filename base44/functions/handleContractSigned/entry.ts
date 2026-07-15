import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await req.json();
    const event = payload.event;

    if (event.type !== 'update') {
      return Response.json({ message: 'Skipped: not an update event' });
    }

    // Get contract
    const [contract] = await base44.asServiceRole.entities.Contract.filter({ 
      id: event.entity_id 
    });

    if (!contract) {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }

    // ── Intermediate signing notifications (before both parties sign) ──
    // Notify the other party when one party signs, so they know acceptance happened instantly.
    const changedFields = event.data?.changed_fields || [];
    const oldData = event.old_data || {};

    // Engineer just signed (client hasn't yet) → notify project owner
    if (contract.engineer_signature && !oldData.engineer_signature && !contract.client_signature) {
      const [project] = await base44.asServiceRole.entities.Project.filter({ id: contract.project_id });
      const [engineer] = await base44.asServiceRole.entities.Engineer.filter({ id: contract.engineer_id });
      if (project && engineer) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: project.created_by,
          title: '✅ وافق المهندس على عرضك — بانتظار توقيعك',
          message: `وافق المهندس ${engineer.full_name} على عرضك لمشروع "${project.title}" ووقّع العقد. بانتظار توقيعك لإتمام العقد وبدء العمل.`,
          type: 'approval',
          related_project_id: project.id,
          related_entity_id: contract.id,
          action_url: '/MyContracts',
          priority: 'high'
        });

        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: project.created_by,
            subject: '✅ وافق المهندس على عرضك - منصة بيتلي',
            body: `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
                <div style="background:linear-gradient(135deg,#6B5D4F,#C9A66B); padding:24px; border-radius:12px 12px 0 0; text-align:center;">
                  <h1 style="color:white; margin:0; font-size:22px;">Bytly بيتلي</h1>
                  <p style="color:rgba(255,255,255,0.8); margin:8px 0 0;">وافق المهندس على عرضك</p>
                </div>
                <div style="background:#f8f9fa; padding:24px; border-radius:0 0 12px 12px;">
                  <h2 style="color:#4A3F35;">مرحباً،</h2>
                  <p style="color:#4a5568;">وافق المهندس <strong>${engineer.full_name}</strong> على عرضك لمشروع "<strong>${project.title}</strong>" ووقّع العقد.</p>
                  <div style="background:white; border-right:4px solid #C9A66B; padding:16px; border-radius:8px; margin:16px 0;">
                    <p><strong>رقم العقد:</strong> ${contract.contract_number}</p>
                    <p><strong>القيمة:</strong> ${contract.total_amount?.toLocaleString() || '-'} ريال</p>
                    <p><strong>المهندس:</strong> ${engineer.full_name}</p>
                  </div>
                  <p style="color:#718096;">بانتظار توقيعك على العقد لإتمام العملية وبدء التنفيذ.</p>
                  <p style="margin-top: 30px;">
                    <a href="https://mybytly.com/MyContracts"
                       style="background: #6B5D4F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      توقيع العقد
                    </a>
                  </p>
                </div>
              </div>
            `
          });
        } catch (emailErr) {
          console.error('Failed to send engineer-signed email:', emailErr);
        }
      }
    }

    // Client just signed (engineer hasn't yet) → notify engineer
    if (contract.client_signature && !oldData.client_signature && !contract.engineer_signature) {
      const [project] = await base44.asServiceRole.entities.Project.filter({ id: contract.project_id });
      const [engineer] = await base44.asServiceRole.entities.Engineer.filter({ id: contract.engineer_id });
      if (project && engineer) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: engineer.email,
          title: '✅ وافق العميل على العرض — بانتظار توقيعك',
          message: `وافق العميل على عرضك لمشروع "${project.title}" ووقّع العقد. بانتظار توقيعك لإتمام العقد وبدء العمل.`,
          type: 'approval',
          related_project_id: project.id,
          related_entity_id: contract.id,
          action_url: '/MyContracts',
          priority: 'high'
        });
      }
    }

    // Check if both parties signed
    if (contract.client_signature && contract.engineer_signature && contract.status === 'active') {
      // Get project
      const [project] = await base44.asServiceRole.entities.Project.filter({ 
        id: contract.project_id 
      });

      if (!project) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }

      // Update project status to in_progress only if it's not already
      if (project.status === 'open' || project.status === 'pending_signature') {
        await base44.asServiceRole.entities.Project.update(project.id, {
          status: 'in_progress'
        });
      }

      // Get client and engineer
      const [client] = await base44.asServiceRole.entities.Client.filter({ 
        id: contract.client_id 
      });
      const [engineer] = await base44.asServiceRole.entities.Engineer.filter({ 
        id: contract.engineer_id 
      });

      // Send notifications
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: client.email,
        title: "تم توقيع العقد - بدء العمل",
        message: `تم توقيع عقد المشروع "${project.title}" من الطرفين. المشروع الآن قيد التنفيذ.`,
        type: "project_update",
        related_project_id: project.id,
        priority: "high"
      });

      await base44.asServiceRole.entities.Notification.create({
        recipient_email: engineer.email,
        title: "تم توقيع العقد - بدء العمل",
        message: `تم توقيع عقد المشروع "${project.title}" من الطرفين. يمكنك البدء في العمل الآن.`,
        type: "project_update",
        related_project_id: project.id,
        priority: "high"
      });

      // Send emails
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: client.email,
        subject: "تم توقيع العقد وبدء المشروع - منصة بيتلي",
        body: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>مرحباً ${client.full_name}</h2>
            <p>تم توقيع عقد المشروع بنجاح من قبل الطرفين.</p>
            <p><strong>المشروع:</strong> ${project.title}</p>
            <p><strong>رقم العقد:</strong> ${contract.contract_number}</p>
            <p><strong>الحالة:</strong> قيد التنفيذ</p>
            <p>يمكنك متابعة تقدم المشروع من لوحة التحكم.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">منصة بيتلي - لمسة بيت</p>
          </div>
        `
      });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: engineer.email,
        subject: "تم توقيع العقد - ابدأ العمل - منصة بيتلي",
        body: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>مرحباً ${engineer.full_name}</h2>
            <p>تم توقيع عقد المشروع من قبل الطرفين. يمكنك البدء في العمل الآن.</p>
            <p><strong>المشروع:</strong> ${project.title}</p>
            <p><strong>رقم العقد:</strong> ${contract.contract_number}</p>
            <p><strong>تاريخ التسليم:</strong> ${new Date(contract.delivery_date).toLocaleDateString('ar-SA')}</p>
            <p>تذكر الالتزام بالمدة المحددة وبنود العقد.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">منصة بيتلي - لمسة بيت</p>
          </div>
        `
      });

      // ── حفظ نسخة احتياطية من العقد الموقع في Google Drive (مجلد المشروع) ──
      try {
        await base44.asServiceRole.functions.invoke('backupContractToDrive', {
          contractId: contract.id,
          contractNumber: contract.contract_number,
          projectTitle: project.title,
          projectId: project.id,
          contractType: contract.contract_type,
          status: contract.status,
          signedDate: contract.client_signature_date || contract.engineer_signature_date || new Date().toISOString(),
          fileUrl: contract.contract_pdf_url,
        });
        console.log('Contract backed up to Drive for project:', project.title);
      } catch (backupErr) {
        console.error('Drive backup failed (non-blocking):', backupErr.message);
      }

      return Response.json({ 
        success: true,
        message: 'Contract fully signed, project updated to in_progress, backed up to Drive'
      });
    }

    return Response.json({ message: 'Contract not fully signed yet' });

  } catch (error) {
    console.error("Error handling contract signing:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});