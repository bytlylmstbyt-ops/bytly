import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { milestone_id, project_id } = body;

    // Fetch milestone and project
    const milestones = await base44.asServiceRole.entities.ProjectMilestone.filter({ id: milestone_id });
    const milestone = milestones[0];
    if (!milestone) return Response.json({ error: 'Milestone not found' }, { status: 404 });

    const projects = await base44.asServiceRole.entities.Project.filter({ id: project_id || milestone.project_id });
    const project = projects[0];
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

    // Check if invoice already exists
    const existing = await base44.asServiceRole.entities.Invoice.filter({
      milestone_id: milestone.id,
      invoice_type: 'project_milestone'
    });
    if (existing.length > 0) {
      return Response.json({ invoice: existing[0], already_exists: true });
    }

    // Get client info
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
      amount: amount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: 'sent',
      issue_date: issueDate,
      due_date: dueDate,
      notes: `فاتورة المرحلة: ${milestone.title} - مشروع: ${project.title}`,
      payment_terms: 7
    });

    // Send notification to client
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: client?.email || project.created_by,
      title: 'فاتورة جديدة بانتظار السداد',
      message: `تم إصدار فاتورة بقيمة ${totalAmount} ريال للمرحلة "${milestone.title}" من مشروع "${project.title}". يرجى السداد خلال 7 أيام.`,
      type: 'project_update',
      priority: 'high',
      url: `/ProjectDetails?id=${project.id}`
    });

    console.log(`Invoice ${invoiceNumber} created for milestone ${milestone.id}`);
    return Response.json({ invoice, success: true });

  } catch (error) {
    console.error('generateMilestoneInvoice error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});