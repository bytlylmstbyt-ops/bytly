import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

      const paidAmount = invoice.total_amount || invoice.amount || 0;

      // Update payment status
      await base44.asServiceRole.entities.Payment.update(payment.id, {
        status: 'completed',
        payment_date: new Date().toISOString(),
        transaction_id: session.payment_intent
      });

      // Update invoice
      await base44.asServiceRole.entities.Invoice.update(invoice.id, {
        status: 'paid',
        payment_status: 'paid',
        paid_amount: paidAmount,
        payment_date: new Date().toISOString(),
        payment_method: 'stripe'
      });

      // Get client, engineer, and project
      const [client] = await base44.asServiceRole.entities.Client.filter({
        id: invoice.client_id
      });

      const [project] = await base44.asServiceRole.entities.Project.filter({
        id: invoice.project_id
      });

      // ── Update engineer's wallet balance ──────────────────────────────
      let engineer = null;
      let commissionRate = 15;
      let commissionAmount = 0;
      let engineerNetAmount = 0;

      if (project?.assigned_engineer_id) {
        const [eng] = await base44.asServiceRole.entities.Engineer.filter({
          id: project.assigned_engineer_id
        });
        engineer = eng;

        if (engineer) {
          commissionRate = project.platform_commission || 15;
          commissionAmount = Math.round(paidAmount * commissionRate / 100 * 100) / 100;
          engineerNetAmount = paidAmount - commissionAmount;

          // Credit to pending balance (held until milestone approved/released)
          const newPendingBalance = (engineer.pending_balance || 0) + engineerNetAmount;
          await base44.asServiceRole.entities.Engineer.update(engineer.id, {
            pending_balance: newPendingBalance
          });

          // Create Transaction record for engineer (escrow hold)
          await base44.asServiceRole.entities.Transaction.create({
            user_email: engineer.email,
            user_type: 'engineer',
            type: 'escrow_hold',
            amount: paidAmount,
            commission_amount: commissionAmount,
            net_amount: engineerNetAmount,
            status: 'held_in_escrow',
            project_id: project.id,
            milestone_id: invoice.milestone_id || undefined,
            reference_id: session.payment_intent,
            payment_method: 'stripe',
            balance_before: engineer.pending_balance || 0,
            balance_after: newPendingBalance,
            from_wallet: 'client_stripe',
            to_wallet: 'engineer_pending',
            description: `ضمان دفعة للفاتورة ${invoice.invoice_number} — المشروع "${project.title}". المبلغ محجوز لحين اعتماد المرحلة.`
          });

          // Create Transaction record for platform commission
          await base44.asServiceRole.entities.Transaction.create({
            user_email: 'platform@bytly.app',
            user_type: 'platform',
            type: 'commission',
            amount: commissionAmount,
            net_amount: commissionAmount,
            status: 'completed',
            project_id: project.id,
            milestone_id: invoice.milestone_id || undefined,
            reference_id: session.payment_intent,
            payment_method: 'stripe',
            from_wallet: 'client_stripe',
            to_wallet: 'platform',
            description: `عمولة منصة (${commissionRate}%) من الفاتورة ${invoice.invoice_number} — المشروع "${project.title}".`
          });
        }
      }

      // Create Transaction record for client (payment)
      if (client) {
        await base44.asServiceRole.entities.Transaction.create({
          user_email: client.email,
          user_type: 'client',
          type: 'payment',
          amount: paidAmount,
          commission_amount: commissionAmount,
          net_amount: paidAmount,
          status: 'completed',
          project_id: project?.id,
          milestone_id: invoice.milestone_id || undefined,
          reference_id: session.payment_intent,
          payment_method: 'stripe',
          balance_before: client.wallet_balance || 0,
          balance_after: client.wallet_balance || 0,
          from_wallet: 'client_card',
          to_wallet: 'escrow',
          description: `سداد الفاتورة ${invoice.invoice_number}${project ? ` — المشروع "${project.title}"` : ''}.`
        });
      }

      // ── Notifications to both parties ─────────────────────────────────
      const clientEmail = invoice.client_email || client?.email;
      const engineerEmail = engineer?.email;

      if (clientEmail) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: clientEmail,
          title: '✅ تم استلام الدفعة بنجاح',
          message: `تم استلام دفعتك للفاتورة ${invoice.invoice_number} بمبلغ ${paidAmount.toLocaleString()} ريال سعودي.${engineer ? ` تم إيداع المبلغ في محفظة المهندس ${engineer.full_name} (محجوز كضمان).` : ''} شكراً لك.`,
          type: 'payment',
          related_project_id: project?.id,
          priority: 'high'
        });

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: clientEmail,
          subject: '✅ تم استلام الدفعة - منصة بيتلي',
          body: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
              <div style="background:linear-gradient(135deg,#6B5D4F,#C9A66B); padding:24px; border-radius:12px 12px 0 0; text-align:center;">
                <h1 style="color:white; margin:0; font-size:22px;">Bytly بيتلي</h1>
                <p style="color:rgba(255,255,255,0.8); margin:8px 0 0;">تم استلام الدفعة</p>
              </div>
              <div style="background:#f8f9fa; padding:24px; border-radius:0 0 12px 12px;">
                <h2 style="color:#2e7d32;">شكراً لك على السداد</h2>
                <div style="background:white; border-right:4px solid #2e7d32; padding:16px; border-radius:8px; margin:16px 0;">
                  <p><strong>رقم الفاتورة:</strong> ${invoice.invoice_number}</p>
                  ${project ? `<p><strong>المشروع:</strong> ${project.title}</p>` : ''}
                  <p><strong>المبلغ:</strong> ${paidAmount.toLocaleString()} ريال سعودي</p>
                  <p><strong>تاريخ الدفع:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
                  ${engineer ? `<p><strong>المهندس:</strong> ${engineer.full_name}</p>` : ''}
                </div>
                ${engineer ? `<p style="color:#4a5568;">تم إيداع المبلغ في محفظة المهندس كضمان (${engineerNetAmount.toLocaleString()} ريال بعد خصم عمولة المنصة ${commissionRate}%). سيتم تحرير المبلغ للمهندس عند اعتمادك لتسليم المرحلة.</p>` : ''}
                <p style="color:#718096; font-size:14px;">يمكنك الاطلاع على تفاصيل المعاملة من خلال تطبيق بيتلي.</p>
              </div>
              <p style="color:#999; font-size:12px; text-align:center; margin-top:16px;">منصة بيتلي - لمسة بيت</p>
            </div>
          `
        });
      }

      if (engineerEmail && engineer) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: engineerEmail,
          title: '💰 دفعة جديدة في محفظتك',
          message: `تم استلام دفعة بقيمة ${paidAmount.toLocaleString()} ريال للمشروع "${project?.title || ''}". تم إيداع ${engineerNetAmount.toLocaleString()} ريال في رصيدك المعلق (محجوز كضمان بعد خصم عمولة المنصة ${commissionRate}%). سيتم تحرير المبلغ عند اعتماد العميل لتسليم المرحلة.`,
          type: 'payment',
          related_project_id: project?.id,
          priority: 'high'
        });

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: engineerEmail,
          subject: '💰 دفعة جديدة في محفظتك - منصة بيتلي',
          body: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
              <div style="background:linear-gradient(135deg,#6B5D4F,#C9A66B); padding:24px; border-radius:12px 12px 0 0; text-align:center;">
                <h1 style="color:white; margin:0; font-size:22px;">Bytly بيتلي</h1>
                <p style="color:rgba(255,255,255,0.8); margin:8px 0 0;">دفعة جديدة</p>
              </div>
              <div style="background:#f8f9fa; padding:24px; border-radius:0 0 12px 12px;">
                <h2 style="color:#4A3F35;">مرحباً ${engineer.full_name}،</h2>
                <p style="color:#4a5568;">تم استلام دفعة جديدة للمشروع "${project?.title || ''}".</p>
                <div style="background:white; border-right:4px solid #C9A66B; padding:16px; border-radius:8px; margin:16px 0;">
                  <p><strong>المبلغ الإجمالي:</strong> ${paidAmount.toLocaleString()} ريال سعودي</p>
                  <p><strong>عمولة المنصة (${commissionRate}%):</strong> ${commissionAmount.toLocaleString()} ريال سعودي</p>
                  <p><strong>صافي المبلغ:</strong> ${engineerNetAmount.toLocaleString()} ريال سعودي</p>
                  <p><strong>رصيدك المعلق:</strong> ${((engineer.pending_balance || 0) + engineerNetAmount).toLocaleString()} ريال سعودي</p>
                </div>
                <p style="color:#718096; font-size:14px;">المبلغ محجوز كضمان لحين اعتماد العميل لتسليم المرحلة، ثم سيتم تحويله إلى رصيدك المتاح للسحب.</p>
              </div>
              <p style="color:#999; font-size:12px; text-align:center; margin-top:16px;">منصة بيتلي - لمسة بيت</p>
            </div>
          `
        });
      }

      console.log(`Payment completed for invoice ${invoice.invoice_number}: ${paidAmount} SAR. Engineer ${engineer?.email || 'N/A'} credited ${engineerNetAmount} to pending balance.`);
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

        if (invoice) {
          const [client] = await base44.asServiceRole.entities.Client.filter({
            id: invoice.client_id
          });

          if (client?.email) {
            await base44.asServiceRole.entities.Notification.create({
              recipient_email: client.email,
              title: '❌ فشل عملية الدفع',
              message: `فشلت عملية الدفع للفاتورة ${invoice.invoice_number}. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.`,
              type: 'payment',
              priority: 'urgent'
            });

            await base44.asServiceRole.integrations.Core.SendEmail({
              to: client.email,
              subject: '❌ فشل عملية الدفع - منصة بيتلي',
              body: `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
                  <h2>حدث خطأ في الدفع</h2>
                  <p>فشلت عملية الدفع للفاتورة ${invoice.invoice_number}.</p>
                  <p>يرجى المحاولة مرة أخرى أو التواصل مع الدعم.</p>
                  <hr>
                  <p style="color: #666; font-size: 12px;">منصة بيتلي - لمسة بيت</p>
                </div>
              `
            });
          }
        }
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Error handling payment webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});