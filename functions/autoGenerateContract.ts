import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Handle automation payload
    const proposalId = payload.proposalId || payload.event?.entity_id;

    if (!proposalId) {
      return Response.json({ error: 'Proposal ID is required' }, { status: 400 });
    }

    // Get proposal details
    const [proposal] = await base44.asServiceRole.entities.Proposal.filter({ id: proposalId });
    if (!proposal) {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Only generate contract if proposal was just accepted
    if (proposal.status !== 'accepted') {
      return Response.json({ message: 'Proposal not accepted yet, skipping' });
    }

    // Get project details
    const [project] = await base44.asServiceRole.entities.Project.filter({ id: proposal.project_id });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get client and engineer
    const [client] = await base44.asServiceRole.entities.Client.filter({ id: project.client_id });
    const [engineer] = await base44.asServiceRole.entities.Engineer.filter({ id: proposal.engineer_id });

    // Check if contract already exists
    const existingContracts = await base44.asServiceRole.entities.Contract.filter({ 
      project_id: project.id 
    });

    if (existingContracts.length > 0) {
      return Response.json({ 
        message: 'Contract already exists',
        contract_id: existingContracts[0].id 
      });
    }

    // Get default template
    const templates = await base44.asServiceRole.entities.ContractTemplate.filter({ 
      is_default: true,
      is_active: true 
    });
    const defaultTemplate = templates.length > 0 ? templates[0] : null;

    // Generate contract number
    const contractNumber = `BYT-${Date.now().toString().slice(-8)}`;

    // Calculate delivery date
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (proposal.delivery_days || 30));

    // Create contract
    const contractData = {
      project_id: project.id,
      client_id: project.client_id,
      engineer_id: proposal.engineer_id,
      contract_number: contractNumber,
      contract_type: defaultTemplate?.contract_type || "service_agreement",
      total_amount: proposal.price,
      start_date: new Date().toISOString().split('T')[0],
      delivery_date: deliveryDate.toISOString().split('T')[0],
      payment_terms: defaultTemplate?.default_payment_terms || "30% دفعة مقدمة، 40% عند التصاميم الأولية، 30% عند التسليم النهائي",
      additional_terms: defaultTemplate?.default_terms || "",
      custom_clauses: defaultTemplate?.custom_clauses || [],
      status: "pending_signature",
      contract_version: 1
    };

    const contract = await base44.asServiceRole.entities.Contract.create(contractData);

    // Update template usage count
    if (defaultTemplate) {
      await base44.asServiceRole.entities.ContractTemplate.update(defaultTemplate.id, {
        usage_count: (defaultTemplate.usage_count || 0) + 1
      });
    }

    // Send notifications to both parties
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: client.email,
      title: "عقد جديد جاهز للتوقيع",
      message: `تم إنشاء عقد جديد للمشروع "${project.title}". يرجى مراجعة العقد والتوقيع عليه لبدء العمل.`,
      type: "project_update",
      related_project_id: project.id,
      priority: "high"
    });

    await base44.asServiceRole.entities.Notification.create({
      recipient_email: engineer.email,
      title: "عقد جديد جاهز للتوقيع",
      message: `تم إنشاء عقد جديد للمشروع "${project.title}". يرجى مراجعة العقد والتوقيع عليه.`,
      type: "project_update",
      related_project_id: project.id,
      priority: "high"
    });

    // Send emails
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: client.email,
      subject: "عقد جديد جاهز للتوقيع - منصة بيتلي",
      body: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>مرحباً ${client.full_name}</h2>
          <p>تم إنشاء عقد جديد للمشروع: <strong>${project.title}</strong></p>
          <p>رقم العقد: <strong>${contractNumber}</strong></p>
          <p>يرجى مراجعة العقد والتوقيع عليه لبدء العمل على المشروع.</p>
          <p>قم بتسجيل الدخول للمنصة لعرض العقد.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">منصة بيتلي - لمسة بيت</p>
        </div>
      `
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: engineer.email,
      subject: "عقد جديد جاهز للتوقيع - منصة بيتلي",
      body: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>مرحباً ${engineer.full_name}</h2>
          <p>تم إنشاء عقد جديد للمشروع: <strong>${project.title}</strong></p>
          <p>رقم العقد: <strong>${contractNumber}</strong></p>
          <p>يرجى مراجعة العقد والتوقيع عليه.</p>
          <p>قم بتسجيل الدخول للمنصة لعرض العقد.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">منصة بيتلي - لمسة بيت</p>
        </div>
      `
    });

    return Response.json({ 
      success: true,
      contract_id: contract.id,
      contract_number: contractNumber
    });

  } catch (error) {
    console.error("Error generating contract:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});