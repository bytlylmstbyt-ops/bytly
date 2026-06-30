import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const now = new Date();
    let remindersCount = 0;
    let overdueCount = 0;

    // Get all unpaid invoices (sent or overdue)
    const unpaidInvoices = await base44.asServiceRole.entities.Invoice.filter({
      status: { $in: ['sent', 'overdue'] }
    });

    for (const invoice of unpaidInvoices) {
      if (!invoice.due_date) continue;

      const dueDate = new Date(invoice.due_date);
      const daysUntilDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
      const remindersSent = invoice.reminders_sent || [];

      // Determine reminder stage
      let stage = null;
      let priority = 'medium';
      let messageType = '';
      let messageText = '';

      if (daysUntilDue < 0 && !remindersSent.includes('overdue')) {
        stage = 'overdue';
        priority = 'urgent';
        messageType = 'تنبيه عاجل: دفعة متأخرة';
        messageText = `الدفعة رقم ${invoice.invoice_number} متأخرة عن موعد السداد. المبلغ المستحق: ${invoice.total_amount?.toLocaleString() || invoice.amount?.toLocaleString()} ريال سعودي. يرجى السداد فوراً لتجنب تعليق العمل على المشروع.`;
        overdueCount++;
      } else if (daysUntilDue <= 1 && daysUntilDue >= 0 && !remindersSent.includes('1d')) {
        stage = '1d';
        priority = 'urgent';
        messageType = 'تذكير عاجل: الدفعة تستحق غداً';
        messageText = `تذكير: الدفعة رقم ${invoice.invoice_number} تستحق السداد غداً ${new Date(invoice.due_date).toLocaleDateString('ar-SA')}. المبلغ: ${invoice.total_amount?.toLocaleString() || invoice.amount?.toLocaleString()} ريال سعودي.`;
      } else if (daysUntilDue <= 3 && daysUntilDue > 1 && !remindersSent.includes('3d')) {
        stage = '3d';
        priority = 'high';
        messageType = 'تذكير: دفعة تستحق خلال 3 أيام';
        messageText = `تذكير: الدفعة رقم ${invoice.invoice_number} تستحق السداد خلال 3 أيام (${new Date(invoice.due_date).toLocaleDateString('ar-SA')}). المبلغ: ${invoice.total_amount?.toLocaleString() || invoice.amount?.toLocaleString()} ريال سعودي.`;
      } else if (daysUntilDue <= 7 && daysUntilDue > 3 && !remindersSent.includes('7d')) {
        stage = '7d';
        priority = 'medium';
        messageType = 'إشعار: موعد دفعة جديدة يقترب';
        messageText = `إشعار مسبق: لديك دفعة رقم ${invoice.invoice_number} تستحق السداد بتاريخ ${new Date(invoice.due_date).toLocaleDateString('ar-SA')}. المبلغ: ${invoice.total_amount?.toLocaleString() || invoice.amount?.toLocaleString()} ريال سعودي. يمكنك السداد مبكراً من خلال المنصة.`;
      }

      if (!stage) continue;

      // Mark overdue if past due date
      if (stage === 'overdue' && invoice.status !== 'overdue') {
        await base44.asServiceRole.entities.Invoice.update(invoice.id, {
          status: 'overdue'
        });
      }

      // Fetch client and project
      const [client] = await base44.asServiceRole.entities.Client.filter({
        id: invoice.client_id
      });
      const [project] = await base44.asServiceRole.entities.Project.filter({
        id: invoice.project_id
      });

      const clientEmail = invoice.client_email || client?.email;
      if (!clientEmail) continue;

      // Create in-app notification
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: clientEmail,
        title: messageType,
        message: messageText,
        type: 'payment',
        related_project_id: project?.id,
        priority
      });

      // Create ScheduledAlert for audit trail
      await base44.asServiceRole.entities.ScheduledAlert.create({
        user_email: clientEmail,
        alert_type: 'payment_due',
        title: messageType,
        message: messageText,
        scheduled_date: now.toISOString(),
        related_entity_type: 'invoice',
        related_entity_id: invoice.id,
        is_sent: true,
        sent_date: now.toISOString(),
        priority
      });

      // Send email
      const stageColor = stage === 'overdue' ? '#d32f2f' : stage === '1d' ? '#d32f2f' : stage === '3d' ? '#f57c00' : '#1976d2';
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: clientEmail,
        subject: `${messageType} - منصة بيتلي`,
        body: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
            <div style="background:linear-gradient(135deg,#6B5D4F,#C9A66B); padding:24px; border-radius:12px 12px 0 0; text-align:center;">
              <h1 style="color:white; margin:0; font-size:22px;">Bytly بيتلي</h1>
              <p style="color:rgba(255,255,255,0.8); margin:8px 0 0;">تنبيه دفعة مستحقة</p>
            </div>
            <div style="background:#f8f9fa; padding:24px; border-radius:0 0 12px 12px;">
              <h2 style="color: ${stageColor};">${messageType}</h2>
              <div style="background:white; border-right:4px solid ${stageColor}; padding:16px; border-radius:8px; margin:16px 0;">
                <p><strong>رقم الفاتورة:</strong> ${invoice.invoice_number}</p>
                ${project ? `<p><strong>المشروع:</strong> ${project.title}</p>` : ''}
                <p><strong>المبلغ المستحق:</strong> ${invoice.total_amount?.toLocaleString() || invoice.amount?.toLocaleString()} ريال سعودي</p>
                <p><strong>تاريخ الاستحقاق:</strong> ${new Date(invoice.due_date).toLocaleDateString('ar-SA')}</p>
              </div>
              <p style="color:#4a5568;">${messageText}</p>
              <p style="margin-top:20px;">
                <a href="https://bytly.app" style="background:#C9A66B; color:white; padding:10px 24px; text-decoration:none; border-radius:8px; display:inline-block; font-weight:bold;">
                  سداد الدفعة الآن
                </a>
              </p>
            </div>
            <p style="color:#999; font-size:12px; text-align:center; margin-top:16px;">منصة بيتلي - لمسة بيت</p>
          </div>
        `
      });

      // Send WhatsApp notification if client has phone
      if (client?.phone) {
        try {
          await base44.asServiceRole.functions.invoke('sendWhatsappNotification', {
            type: 'payment_reminder',
            to_phone: client.phone,
            to_name: client.full_name || '',
            invoice_number: invoice.invoice_number,
            amount: invoice.total_amount?.toLocaleString() || invoice.amount?.toLocaleString(),
            due_date: new Date(invoice.due_date).toLocaleDateString('ar-SA'),
            stage
          });
        } catch (waErr) {
          console.error('WhatsApp payment reminder failed:', waErr.message);
        }
      }

      // Mark reminder as sent
      await base44.asServiceRole.entities.Invoice.update(invoice.id, {
        reminders_sent: [...remindersSent, stage],
        last_reminder_date: now.toISOString()
      });
      remindersCount++;
    }

    return Response.json({
      success: true,
      reminders_sent: remindersCount,
      marked_overdue: overdueCount
    });

  } catch (error) {
    console.error('Error processing payment reminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});