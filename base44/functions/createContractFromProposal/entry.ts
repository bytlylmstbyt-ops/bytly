import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { proposal_id } = await req.json();

    if (!proposal_id) {
      return Response.json({ error: 'Proposal ID required' }, { status: 400 });
    }

    // Fetch proposal details
    const proposal = await base44.asServiceRole.entities.Proposal.get(proposal_id);
    if (!proposal) {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Fetch project details
    const project = await base44.asServiceRole.entities.Project.get(proposal.project_id);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch client and engineer details
    const client = await base44.asServiceRole.entities.Client.filter({ email: project.created_by });
    const engineer = await base44.asServiceRole.entities.Engineer.get(proposal.engineer_id);

    if (!client || !client[0]) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!engineer) {
      return Response.json({ error: 'Engineer not found' }, { status: 404 });
    }

    // Check if contract already exists
    const existingContracts = await base44.asServiceRole.entities.Contract.filter({
      project_id: project.id,
      engineer_id: engineer.id
    });

    if (existingContracts.length > 0) {
      return Response.json({ 
        error: 'Contract already exists for this project',
        contract_id: existingContracts[0].id
      }, { status: 400 });
    }

    // Create contract
    const contract = await base44.asServiceRole.entities.Contract.create({
      project_id: project.id,
      client_id: client[0].id,
      engineer_id: engineer.id,
      contract_type: "project_start",
      contract_number: `BYT-${Date.now().toString().slice(-8)}`,
      service_description: proposal.cover_letter || `عرض سعر لمشروع: ${project.title}`,
      total_amount: proposal.price,
      payment_terms: proposal.custom_milestones?.[0]?.payment_terms || "30% دفعة مقدمة، 40% عند التصاميم الأولية، 30% عند التسليم النهائي",
      delivery_date: proposal.delivery_days ? new Date(Date.now() + (proposal.delivery_days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : project.deadline,
      start_date: new Date().toISOString().split('T')[0],
      additional_terms: proposal.description || "",
      milestones: proposal.custom_milestones || [],
      status: "pending_signature",
      client_signature: false,
      engineer_signature: false,
    });

    // Update proposal status
    await base44.asServiceRole.entities.Proposal.update(proposal_id, {
      status: "accepted"
    });

    // Update project status
    await base44.asServiceRole.entities.Project.update(project.id, {
      status: "in_progress",
      assigned_engineer_id: engineer.id
    });

    // Create notifications
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: client[0].email,
      title: 'تم قبول عرض السعر - يرجى توقيع العقد',
      message: `قبلت عرض المهندس ${engineer.full_name} لمشروع "${project.title}". يرجى مراجعة العقد وتوقيعه.`,
      type: 'contract',
      related_project_id: project.id,
      related_entity_id: contract.id,
      action_url: `/MyContracts`,
      priority: 'high'
    });

    await base44.asServiceRole.entities.Notification.create({
      recipient_email: engineer.email,
      title: 'تم قبول عرضك - بانتظار توقيع العقد',
      message: `قبل العميل عرضك لمشروع "${project.title}". يرجى مراجعة العقد وتوقيعه.`,
      type: 'contract',
      related_project_id: project.id,
      related_entity_id: contract.id,
      action_url: `/MyContracts`,
      priority: 'high'
    });

    // Send email to both parties
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: client[0].email,
        subject: 'عقد جديد جاهز للتوقيع - بتلي',
        body: `
          <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
            <h2 style="color: #6B5D4F;">عقد جاهز للتوقيع</h2>
            <p>مرحباً،</p>
            <p>تم قبول عرض السعر لمشروعك "<strong>${project.title}</strong>" من المهندس <strong>${engineer.full_name}</strong>.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>تفاصيل العقد:</strong></p>
              <ul>
                <li>رقم العقد: ${contract.contract_number}</li>
                <li>القيمة: ${contract.total_amount.toLocaleString()} ريال</li>
                <li>مدة التنفيذ: ${proposal.delivery_days || '-'} يوم</li>
              </ul>
            </div>
            <p style="margin-top: 30px;">
              <a href="https://mybytly.com/MyContracts" 
                 style="background: #6B5D4F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                توقيع العقد
              </a>
            </p>
          </div>
        `
      });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: engineer.email,
        subject: 'عقد جديد جاهز للتوقيع - بتلي',
        body: `
          <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
            <h2 style="color: #6B5D4F;">مبروك! تم قبول عرضك</h2>
            <p>مرحباً ${engineer.full_name}،</p>
            <p>قبل العميل عرضك لمشروع "<strong>${project.title}</strong>".</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>تفاصيل العقد:</strong></p>
              <ul>
                <li>رقم العقد: ${contract.contract_number}</li>
                <li>القيمة: ${contract.total_amount.toLocaleString()} ريال</li>
              </ul>
            </div>
            <p style="margin-top: 30px;">
              <a href="https://mybytly.com/MyContracts" 
                 style="background: #6B5D4F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                توقيع العقد
              </a>
            </p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send emails:', emailError);
    }

    return Response.json({
      success: true,
      contract_id: contract.id,
      message: 'Contract created successfully'
    });

  } catch (error) {
    console.error('Create contract from proposal error:', error);
    return Response.json({ 
      error: error.message,
      details: 'Failed to create contract from proposal'
    }, { status: 500 });
  }
});