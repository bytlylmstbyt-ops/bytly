import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { data } = body;
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
    const clientEmail = client?.email || project.created_by;
    const clientName = client?.name || 'العميل الكريم';

    const taxRate = 0.15;
    const amount = milestone.amount || 0;
    const taxAmount = parseFloat((amount * taxRate).toFixed(2));
    const totalAmount = parseFloat((amount + taxAmount).toFixed(2));

    const issueDate = new Date().toISOString().split('T')[0];
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 7);
    const dueDate = dueDateObj.toISOString().split('T')[0];
    const invoiceNumber = `INV-${Date.now()}`;

    // Create invoice
    const invoice = await base44.asServiceRole.entities.Invoice.create({
      invoice_number: invoiceNumber,
      client_id: project.client_id,
      client_email: clientEmail,
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

    console.log(`Invoice created: ${invoiceNumber}`);

    // Create Stripe checkout session for direct payment link
    let paymentUrl = null;
    try {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
      const appOrigin = 'https://app.base44.com';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'sar',
            product_data: {
              name: `فاتورة ${invoiceNumber}`,
              description: `المرحلة: ${milestone.title} — المشروع: ${project.title}`
            },
            unit_amount: Math.round(totalAmount * 100)
          },
          quantity: 1
        }],
        mode: 'payment',
        customer_email: clientEmail,
        success_url: `${appOrigin}/PaymentSuccess?invoice=${invoice.id}`,
        cancel_url: `${appOrigin}/InvoiceManager`,
        metadata: {
          base44_app_id: Deno.env.get('BASE44_APP_ID'),
          invoice_id: invoice.id,
          invoice_number: invoiceNumber,
          project_id: project.id,
          milestone_id: milestone.id
        }
      });

      paymentUrl = session.url;

      // Save stripe session reference
      await base44.asServiceRole.entities.Invoice.update(invoice.id, {
        payment_reference: session.id,
        payment_method: 'stripe'
      });

      console.log(`Stripe checkout session created: ${session.id}`);
    } catch (stripeErr) {
      console.error('Stripe session creation failed:', stripeErr.message);
      // Continue — invoice already created, just no direct payment link
    }

    // Send email notification with payment link
    const paymentSection = paymentUrl
      ? `<div style="text-align:center;margin:28px 0;">
           <a href="${paymentUrl}" style="background:#C9A66B;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block;">
             💳 ادفع الآن
           </a>
           <p style="color:#888;font-size:12px;margin-top:10px;">أو انسخ الرابط: <a href="${paymentUrl}" style="color:#C9A66B;">${paymentUrl}</a></p>
         </div>`
      : `<p style="color:#555;text-align:center;">يمكنك الدفع من خلال تسجيل الدخول إلى المنصة وفتح صفحة الفواتير.</p>`;

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: clientEmail,
        subject: `🧾 فاتورة جديدة #${invoiceNumber} — ${project.title}`,
        body: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f7f7f7;margin:0;padding:0;">
  <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4a3c31,#C9A66B);padding:32px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">🧾 فاتورة جديدة</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">منصة بيتلي</p>
    </div>
    <!-- Body -->
    <div style="padding:28px 24px;">
      <p style="color:#333;font-size:16px;">عزيزي/ة ${clientName}،</p>
      <p style="color:#555;">تم إصدار فاتورة جديدة بعد الموافقة على مرحلة المشروع. يُرجى مراجعة التفاصيل أدناه والسداد خلال <strong>7 أيام</strong>.</p>

      <!-- Invoice details -->
      <div style="background:#f9f6f2;border-radius:8px;padding:20px;margin:20px 0;border-right:4px solid #C9A66B;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#888;font-size:14px;">رقم الفاتورة</td><td style="font-weight:bold;color:#333;">${invoiceNumber}</td></tr>
          <tr><td style="padding:6px 0;color:#888;font-size:14px;">المشروع</td><td style="color:#333;">${project.title}</td></tr>
          <tr><td style="padding:6px 0;color:#888;font-size:14px;">المرحلة</td><td style="color:#333;">${milestone.title}</td></tr>
          <tr><td style="padding:6px 0;color:#888;font-size:14px;">تاريخ الإصدار</td><td style="color:#333;">${issueDate}</td></tr>
          <tr><td style="padding:6px 0;color:#888;font-size:14px;">تاريخ الاستحقاق</td><td style="color:#c0392b;font-weight:bold;">${dueDate}</td></tr>
          <tr style="border-top:1px solid #e0d8ce;"><td style="padding:10px 0 6px;color:#888;font-size:14px;">المبلغ قبل الضريبة</td><td style="color:#333;">${amount.toLocaleString('ar-SA')} ر.س</td></tr>
          <tr><td style="padding:6px 0;color:#888;font-size:14px;">ضريبة القيمة المضافة (15%)</td><td style="color:#333;">${taxAmount.toLocaleString('ar-SA')} ر.س</td></tr>
          <tr style="border-top:2px solid #C9A66B;"><td style="padding:10px 0 0;font-size:18px;font-weight:bold;color:#333;">الإجمالي</td><td style="font-size:22px;font-weight:bold;color:#C9A66B;">${totalAmount.toLocaleString('ar-SA')} ر.س</td></tr>
        </table>
      </div>

      ${paymentSection}

      <p style="color:#888;font-size:13px;margin-top:24px;border-top:1px solid #eee;padding-top:16px;">
        إذا كان لديك أي استفسار، يمكنك التواصل معنا عبر المنصة أو البريد الإلكتروني.
      </p>
    </div>
    <div style="background:#f2ede8;padding:16px;text-align:center;">
      <p style="color:#aaa;font-size:12px;margin:0;">© بيتلي — منصة المهندسين والعملاء</p>
    </div>
  </div>
</body>
</html>`
      });
      console.log(`Invoice email sent to ${clientEmail}`);
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr.message);
    }

    // In-app notification
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: clientEmail,
      title: '🧾 فاتورة جديدة بانتظار السداد',
      message: `تم إصدار فاتورة رقم ${invoiceNumber} بقيمة ${totalAmount} ريال (شامل VAT) للمرحلة "${milestone.title}". يرجى السداد خلال 7 أيام.`,
      type: 'payment',
      priority: 'high',
      related_project_id: project.id
    });

    return Response.json({ success: true, invoice, payment_url: paymentUrl });

  } catch (error) {
    console.error('autoInvoiceOnMilestoneApproval error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});