import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoice_type, milestone_id, design_id, company_name, payment_terms } = await req.json();

    const [client] = await base44.entities.Client.filter({ email: user.email });
    if (!client || client.client_type !== "investor") {
      return Response.json({ error: 'Only corporate clients can request invoices' }, { status: 403 });
    }

    let amount = 0;
    let projectId = null;
    let designIdValue = null;

    // Calculate amount based on type
    if (invoice_type === 'milestone' && milestone_id) {
      const [milestone] = await base44.entities.ProjectMilestone.filter({ id: milestone_id });
      const [project] = await base44.entities.Project.filter({ id: milestone.project_id });
      
      if (!milestone || !project) {
        return Response.json({ error: 'Milestone not found' }, { status: 404 });
      }
      
      amount = milestone.amount;
      projectId = project.id;
    } else if (invoice_type === 'design' && design_id) {
      const [design] = await base44.entities.ReadyMadeDesign.filter({ id: design_id });
      
      if (!design) {
        return Response.json({ error: 'Design not found' }, { status: 404 });
      }
      
      amount = design.price;
      designIdValue = design_id;
    }

    // Calculate VAT (15%)
    const taxAmount = amount * 0.15;
    const totalAmount = amount + taxAmount;

    // Generate invoice number
    const invoiceCount = await base44.asServiceRole.entities.Invoice.filter({});
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount.length + 1).padStart(5, '0')}`;

    // Calculate due date
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + (payment_terms || 30));

    // Create invoice
    const invoice = await base44.asServiceRole.entities.Invoice.create({
      invoice_number: invoiceNumber,
      client_id: client.id,
      client_email: client.email,
      client_company: company_name || client.company_name,
      project_id: projectId,
      milestone_id: milestone_id,
      design_id: designIdValue,
      invoice_type: invoice_type === 'milestone' ? 'project_milestone' : 'design_purchase',
      amount: amount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: "sent",
      issue_date: issueDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      payment_terms: payment_terms || 30
    });

    // Notify admin
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: "admin@bytly.com",
      title: "فاتورة جديدة تم إصدارها",
      message: `فاتورة ${invoiceNumber} للشركة ${company_name} بمبلغ ${totalAmount.toLocaleString('ar-SA')} ريال`,
      type: "invoice",
      priority: "high"
    });

    return Response.json({ 
      success: true, 
      invoice_id: invoice.id,
      invoice_number: invoiceNumber 
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});