import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Get all unpaid or partial invoices
    const unpaidInvoices = await base44.asServiceRole.entities.Invoice.filter({
      status: { $in: ['issued', 'sent', 'viewed', 'overdue'] }
    });

    let remindersCount = 0;
    let overdueCount = 0;

    for (const invoice of unpaidInvoices) {
      const dueDate = new Date(invoice.due_date);
      const invoiceDate = new Date(invoice.invoice_date);
      
      // Check if overdue
      if (dueDate < now && invoice.status !== 'overdue') {
        await base44.asServiceRole.entities.Invoice.update(invoice.id, {
          status: 'overdue'
        });
        overdueCount++;
      }

      // Send reminder if due in 3 days or overdue
      const daysUntilDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
      
      if ((daysUntilDue <= 3 && !invoice.reminder_sent) || invoice.status === 'overdue') {
        const [client] = await base44.asServiceRole.entities.Client.filter({ 
          id: invoice.client_id 
        });

        const [project] = await base44.asServiceRole.entities.Project.filter({ 
          id: invoice.project_id 
        });

        const messageType = invoice.status === 'overdue' ? 
          'تنبيه عاجل: فاتورة مستحقة الدفع' : 
          'تذكير: فاتورة قريبة الاستحقاق';

        const messageText = invoice.status === 'overdue' ?
          `الفاتورة رقم ${invoice.invoice_number} متأخرة في السداد. المبلغ المستحق: ${invoice.amount} ريال. يرجى السداد فوراً.` :
          `تذكير: الفاتورة رقم ${invoice.invoice_number} تستحق الدفع في ${new Date(invoice.due_date).toLocaleDateString('ar-SA')}. المبلغ: ${invoice.amount} ريال.`;

        // Create in-app notification
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: client.email,
          title: messageType,
          message: messageText,
          type: 'payment',
          related_project_id: project.id,
          priority: invoice.status === 'overdue' ? 'urgent' : 'high'
        });

        // Send email
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: client.email,
          subject: `${messageType} - منصة بيتلي`,
          body: `
            <div dir="rtl" style="font-family: Arial, sans-serif;">
              <h2 style="color: ${invoice.status === 'overdue' ? '#d32f2f' : '#f57c00'};">
                ${messageType}
              </h2>
              <p><strong>رقم الفاتورة:</strong> ${invoice.invoice_number}</p>
              <p><strong>المشروع:</strong> ${project.title}</p>
              <p><strong>المبلغ المستحق:</strong> ${invoice.amount} ريال</p>
              <p><strong>تاريخ الاستحقاق:</strong> ${new Date(invoice.due_date).toLocaleDateString('ar-SA')}</p>
              <p style="margin-top: 20px;">
                <a href="https://bytly.app" style="background: #d4a574; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  الدفع الآن
                </a>
              </p>
              <hr>
              <p style="color: #666; font-size: 12px;">منصة بيتلي - لمسة بيت</p>
            </div>
          `
        });

        // Mark reminder as sent
        if (!invoice.reminder_sent) {
          await base44.asServiceRole.entities.Invoice.update(invoice.id, {
            reminder_sent: true,
            last_reminder_date: now.toISOString()
          });
          remindersCount++;
        }
      }
    }

    return Response.json({
      success: true,
      reminders_sent: remindersCount,
      marked_overdue: overdueCount
    });

  } catch (error) {
    console.error("Error processing payment reminders:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});