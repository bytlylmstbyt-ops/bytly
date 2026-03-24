import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Handle automation payload
    const contractId = payload.contractId || payload.event?.entity_id;
    
    if (!contractId) {
      return Response.json({ error: 'Contract ID is required' }, { status: 400 });
    }

    // Get contract
    const [contract] = await base44.asServiceRole.entities.Contract.filter({ 
      id: contractId 
    });

    if (!contract) {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if contract is active and not yet invoiced
    if (contract.status !== 'active') {
      return Response.json({ message: 'Contract not active, skipping invoice generation' });
    }

    // Get project for milestones
    const [project] = await base44.asServiceRole.entities.Project.filter({ 
      id: contract.project_id 
    });

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const invoices = [];
    const now = new Date();
    const invoiceDate = now.toISOString().split('T')[0];
    
    // Get milestones for this project
    const milestones = await base44.asServiceRole.entities.ProjectMilestone.filter({ 
      project_id: project.id 
    });

    for (const milestone of milestones) {
      // Check if invoice already exists for this milestone
      const existing = await base44.asServiceRole.entities.Invoice.filter({
        milestone_id: milestone.id,
        contract_id: contractId
      });

      if (existing.length > 0) {
        continue; // Skip if invoice already exists
      }

      // Calculate due date (30 days from invoice date)
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 30);

      const invoiceData = {
        contract_id: contractId,
        project_id: project.id,
        client_id: contract.client_id,
        engineer_id: contract.engineer_id,
        invoice_number: `INV-${Date.now()}-${milestone.id.substring(0, 6)}`,
        invoice_date: invoiceDate,
        due_date: dueDate.toISOString().split('T')[0],
        invoice_type: 'milestone',
        milestone_id: milestone.id,
        amount: milestone.amount,
        percentage: milestone.percentage,
        total_amount: milestone.amount,
        description: `فاتورة المرحلة: ${milestone.title}`,
        payment_terms: contract.payment_terms || "صافي 30 يوم",
        status: 'issued'
      };

      const invoice = await base44.asServiceRole.entities.Invoice.create(invoiceData);
      invoices.push(invoice);

      // Create notification for client
      const [client] = await base44.asServiceRole.entities.Client.filter({ 
        id: contract.client_id 
      });

      await base44.asServiceRole.entities.Notification.create({
        recipient_email: client.email,
        title: 'فاتورة جديدة',
        message: `تم إصدار فاتورة جديدة للمرحلة "${milestone.title}" بمبلغ ${milestone.amount} ريال.`,
        type: 'payment',
        related_project_id: project.id,
        priority: 'high'
      });

      // Send email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: client.email,
        subject: `فاتورة جديدة - ${project.title}`,
        body: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>فاتورة جديدة</h2>
            <p>تم إصدار فاتورة جديدة للمرحلة: <strong>${milestone.title}</strong></p>
            <p><strong>رقم الفاتورة:</strong> ${invoiceData.invoice_number}</p>
            <p><strong>المبلغ:</strong> ${milestone.amount} ريال</p>
            <p><strong>تاريخ الاستحقاق:</strong> ${dueDate.toLocaleDateString('ar-SA')}</p>
            <p>يرجى الدفع في الموعد المحدد.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">منصة بيتلي - لمسة بيت</p>
          </div>
        `
      });
    }

    return Response.json({
      success: true,
      invoices_created: invoices.length
    });

  } catch (error) {
    console.error("Error generating invoices:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});