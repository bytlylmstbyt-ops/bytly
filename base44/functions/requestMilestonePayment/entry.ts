import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { milestone_id, project_id } = body;

    if (!milestone_id || !project_id) {
      return Response.json({ error: 'milestone_id and project_id are required' }, { status: 400 });
    }

    // Fetch milestone using service role (engineer may not have direct read access via RLS)
    const milestones = await base44.asServiceRole.entities.ProjectMilestone.filter({ id: milestone_id });
    const milestone = milestones[0];
    if (!milestone) {
      return Response.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Verify the milestone belongs to the specified project (prevent cross-project bypass)
    if (milestone.project_id !== project_id) {
      return Response.json({ error: 'Milestone does not belong to this project' }, { status: 400 });
    }

    // Fetch project
    const projects = await base44.asServiceRole.entities.Project.filter({ id: project_id });
    const project = projects[0];
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify the caller is the assigned engineer or an admin
    const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
    const engineer = engineers[0];
    const isAssignedEngineer = engineer && engineer.email === user.email;
    const isAdmin = user.role === 'admin';
    if (!isAssignedEngineer && !isAdmin) {
      return Response.json({ error: 'Forbidden: only the assigned engineer can request milestone payment' }, { status: 403 });
    }

    // Verify the milestone is in "submitted" status (engineer marked it complete)
    if (milestone.status !== 'submitted') {
      return Response.json({ error: 'Milestone must be in submitted status to request payment' }, { status: 400 });
    }

    // Get client
    const clients = await base44.asServiceRole.entities.Client.filter({ id: project.client_id });
    const client = clients[0];
    if (!client) {
      return Response.json({ error: 'Project client not found' }, { status: 404 });
    }

    // Check if an invoice already exists for this milestone
    const existingInvoices = await base44.asServiceRole.entities.Invoice.filter({
      milestone_id: milestone.id,
      invoice_type: 'project_milestone'
    });

    let invoice;
    if (existingInvoices.length > 0) {
      invoice = existingInvoices[0];
    } else {
      // Generate a new invoice for the milestone payment
      const taxRate = 0.15;
      const amount = milestone.amount || 0;
      const taxAmount = parseFloat((amount * taxRate).toFixed(2));
      const totalAmount = parseFloat((amount + taxAmount).toFixed(2));

      const issueDate = new Date().toISOString().split('T')[0];
      const dueDateObj = new Date();
      dueDateObj.setDate(dueDateObj.getDate() + 7);
      const dueDate = dueDateObj.toISOString().split('T')[0];

      const invoiceNumber = `INV-${Date.now()}`;

      invoice = await base44.asServiceRole.entities.Invoice.create({
        invoice_number: invoiceNumber,
        client_id: project.client_id,
        client_email: client.email,
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
    }

    // Send a notification to the client requesting payment approval
    const actionUrl = `/ProjectMilestones?id=${project.id}`;
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: client.email,
      title: 'طلب اعتماد دفعة مرحلة',
      message: `أكمل المهندس المرحلة "${milestone.title}" في مشروع "${project.title}". يرجى مراجعة العمل واعتماد الدفعة بقيمة ${milestone.amount?.toLocaleString('ar-SA')} ريال.`,
      type: 'payment',
      related_project_id: project.id,
      related_entity_id: milestone.id,
      action_url: actionUrl,
      priority: 'high'
    });

    // Also send an email to the client
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'منصة بيتلي - لمسة بيت',
        to: client.email,
        subject: `طلب اعتماد دفعة: ${milestone.title}`,
        body: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #C9A66B 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">بيتلي - لمسة بيت</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">طلب اعتماد دفعة مرحلة</p>
            </div>
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #1a1a2e; margin-top: 0; font-size: 20px; border-right: 4px solid #C9A66B; padding-right: 15px;">تم إنجاز المرحلة: ${milestone.title}</h2>
              <p style="color: #333; line-height: 1.8; font-size: 16px;">
                أعلن المهندس عن إكمال المرحلة <strong>${milestone.title}</strong> في مشروع <strong>${project.title}</strong>.
              </p>
              <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e0e0e0;">
                <p style="color: #666; margin: 5px 0; font-size: 14px;">قيمة المرحلة: <strong style="color: #1a1a2e;">${milestone.amount?.toLocaleString('ar-SA')} ريال</strong></p>
                ${milestone.percentage ? `<p style="color: #666; margin: 5px 0; font-size: 14px;">نسبة المرحلة: <strong style="color: #1a1a2e;">${milestone.percentage}%</strong></p>` : ''}
              </div>
              <p style="color: #333; line-height: 1.8; font-size: 16px;">
                يرجى مراجعة العمل المنجز واعتماد الدفعة للمهندس، أو طلب تعديلات إذا لزم الأمر.
              </p>
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://bytly.base44.com/ProjectMilestones?id=${project.id}" style="display: inline-block; background: linear-gradient(135deg, #1a1a2e 0%, #C9A66B 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  مراجعة واعتماد الدفعة
                </a>
              </div>
            </div>
            <div style="padding: 20px; background: #1a1a2e; text-align: center;">
              <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">
                © ${new Date().getFullYear()} بيتلي - لمسة بيت. جميع الحقوق محفوظة.
              </p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending payment request email:', emailError);
    }

    console.log(`Payment request created for milestone ${milestone.id}, invoice ${invoice.invoice_number}`);

    return Response.json({
      success: true,
      invoice,
      message: 'Payment approval request sent to client'
    });

  } catch (error) {
    console.error('requestMilestonePayment error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}