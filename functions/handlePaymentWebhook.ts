import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = await import('npm:stripe');
const Stripe = stripe.default;
const stripeClient = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    // Verify webhook signature
    let event;
    try {
      event = await stripeClient.webhooks.constructEventAsync(
        body,
        signature,
        secret
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const invoiceId = session.metadata.invoice_id;

      // Get payment record
      const [payment] = await base44.asServiceRole.entities.Payment.filter({ 
        stripe_session_id: session.id 
      });

      if (!payment) {
        console.log('Payment not found for session:', session.id);
        return Response.json({ message: 'Payment record not found' });
      }

      // Get invoice
      const [invoice] = await base44.asServiceRole.entities.Invoice.filter({ 
        id: invoiceId 
      });

      if (!invoice) {
        return Response.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // Update payment status
      await base44.asServiceRole.entities.Payment.update(payment.id, {
        status: 'completed',
        payment_date: new Date().toISOString(),
        transaction_id: session.payment_intent,
        receipt_url: session.after_expiration?.recovery?.url
      });

      // Update invoice
      await base44.asServiceRole.entities.Invoice.update(invoice.id, {
        payment_status: 'paid',
        status: 'paid',
        paid_amount: invoice.total_amount,
        payment_date: new Date().toISOString()
      });

      // Get client and engineer
      const [client] = await base44.asServiceRole.entities.Client.filter({ 
        id: invoice.client_id 
      });

      const [engineer] = await base44.asServiceRole.entities.Engineer.filter({ 
        id: invoice.engineer_id 
      });

      const [project] = await base44.asServiceRole.entities.Project.filter({ 
        id: invoice.project_id 
      });

      // Create notifications
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: client.email,
        title: 'تم استقبال الدفعة',
        message: `تم استقبال الدفعة بنجاح للفاتورة ${invoice.invoice_number}. شكراً لك.`,
        type: 'payment',
        related_project_id: project.id,
        priority: 'high'
      });

      await base44.asServiceRole.entities.Notification.create({
        recipient_email: engineer.email,
        title: 'تم استقبال دفعة جديدة',
        message: `تم استقبال دفعة بقيمة ${invoice.total_amount} ريال للمشروع "${project.title}".`,
        type: 'payment',
        related_project_id: project.id,
        priority: 'high'
      });

      // Send confirmation emails
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: client.email,
        subject: 'تم استقبال الدفعة - منصة بيتلي',
        body: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>شكراً لك على الدفع</h2>
            <p>تم استقبال الدفعة بنجاح.</p>
            <p><strong>رقم الفاتورة:</strong> ${invoice.invoice_number}</p>
            <p><strong>المبلغ:</strong> ${invoice.total_amount} ريال</p>
            <p><strong>تاريخ الدفع:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
            <p>سيتم إرسال إيصال الدفع إلى بريدك الإلكتروني قريباً.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">منصة بيتلي - لمسة بيت</p>
          </div>
        `
      });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: engineer.email,
        subject: 'تم استقبال دفعة جديدة - منصة بيتلي',
        body: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>تم استقبال دفعة جديدة</h2>
            <p>تم استقبال دفعة جديدة للمشروع "${project.title}".</p>
            <p><strong>المبلغ:</strong> ${invoice.total_amount} ريال</p>
            <p><strong>تاريخ الدفع:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
            <p>سيتم تحويل المبلغ إلى محفظتك قريباً.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">منصة بيتلي - لمسة بيت</p>
          </div>
        `
      });
    }

    // Handle payment_intent.payment_failed
    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      
      const [payment] = await base44.asServiceRole.entities.Payment.filter({ 
        transaction_id: intent.id 
      });

      if (payment) {
        await base44.asServiceRole.entities.Payment.update(payment.id, {
          status: 'failed'
        });

        const [invoice] = await base44.asServiceRole.entities.Invoice.filter({ 
          id: payment.invoice_id 
        });

        const [client] = await base44.asServiceRole.entities.Client.filter({ 
          id: invoice.client_id 
        });

        // Send failure notification
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: client.email,
          subject: 'فشل الدفع - حاول مجدداً',
          body: `
            <div dir="rtl" style="font-family: Arial, sans-serif;">
              <h2>حدث خطأ في الدفع</h2>
              <p>فشلت عملية الدفع للفاتورة ${invoice.invoice_number}.</p>
              <p>يرجى المحاولة مجدداً أو التواصل مع الدعم.</p>
              <hr>
              <p style="color: #666; font-size: 12px;">منصة بيتلي - لمسة بيت</p>
            </div>
          `
        });
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error("Error handling payment webhook:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});