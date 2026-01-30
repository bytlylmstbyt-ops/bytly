import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event } = await req.json();

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

      return Response.json({ 
        success: true,
        message: 'Contract fully signed, project updated to in_progress'
      });
    }

    return Response.json({ message: 'Contract not fully signed yet' });

  } catch (error) {
    console.error("Error handling contract signing:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});