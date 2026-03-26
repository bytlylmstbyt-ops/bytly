import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;
    const milestone = data;

    // Only trigger when client_approved becomes true
    if (!milestone?.client_approved) {
      return Response.json({ skipped: true, reason: 'not approved yet' });
    }

    console.log(`Milestone approved: ${milestone.id}, project: ${milestone.project_id}`);

    // Check if invoice already exists
    const existing = await base44.asServiceRole.entities.Invoice.filter({
      milestone_id: milestone.id,
      invoice_type: 'project_milestone'
    });
    if (existing.length > 0) {
      console.log(`Invoice already exists for milestone ${milestone.id}`);
      return Response.json({ skipped: true, reason: 'invoice already exists' });
    }

    const projects = await base44.asServiceRole.entities.Project.filter({ id: milestone.project_id });
    const project = projects[0];
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

    const clients = await base44.asServiceRole.entities.Client.filter({ id: project.client_id });
    const client = clients[0];

    const taxRate = 0.15;
    const amount = milestone.amount || 0;
    const taxAmount = parseFloat((amount * taxRate).toFixed(2));
    const totalAmount = parseFloat((amount + taxAmount).toFixed(2));

    const issueDate = new Date().toISOString().split('T')[0];
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 7);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const invoiceNumber = `INV-${Date.now()}`;

    const invoice = await base44.asServiceRole.entities.Invoice.create({
      invoice_number: invoiceNumber,
      client_id: project.client_id,
      client_email: client?.email || project.created_by,
      project_id: project.id,
      milestone_id: milestone.id,
      invoice_type: 'project_milestone',
      amount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: 'sent',
      issue_date: issueDate,
      due_date: dueDate,
      notes: `فاتورة المرحلة: ${milestone.title} - مشروع: ${project.title}`,
      payment_terms: 7
    });

    // Notify client
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: client?.email || project.created_by,
      title: '🧾 فاتورة جديدة بانتظار السداد',
      message: `تم إصدار فاتورة رقم ${invoiceNumber} بقيمة ${totalAmount} ريال (شامل VAT) للمرحلة "${milestone.title}". يرجى السداد خلال 7 أيام.`,
      type: 'project_update',
      priority: 'high',
      url: `/ProjectDetails?id=${project.id}`
    });

    console.log(`Auto-invoice ${invoiceNumber} created for milestone ${milestone.id}`);
    return Response.json({ success: true, invoice });

  } catch (error) {
    console.error('autoInvoiceOnMilestoneApproval error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});