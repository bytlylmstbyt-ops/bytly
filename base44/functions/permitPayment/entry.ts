/**
 * permitPayment — إنشاء جلسة دفع Stripe للرخصة + توزيع الأموال آلياً
 * Actions:
 *   create_checkout  → ينشئ Stripe Checkout Session
 *   distribute       → يوزع الأموال بعد نجاح الدفع (webhook أو manual)
 *   status           → يجلب حالة الدفع
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, permit_id } = body;

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const appUrl = Deno.env.get('APP_URL') || 'https://app.base44.com';

    // The 'distribute' action handles fund distribution — restrict to admin only
    if (action === 'distribute') {
      if (user.role !== 'admin') {
        return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
      }
    }

    // ── Fetch Permit ──────────────────────────────────────────────────────────
    const permit = await base44.asServiceRole.entities.PermitApplication.get(permit_id);
    if (!permit) return Response.json({ error: 'Permit not found' }, { status: 404 });

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: create_checkout
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'create_checkout') {
      const totalAmountHalala = Math.round((permit.total_amount || 0) * 100); // Stripe uses smallest unit

      if (totalAmountHalala < 100) {
        return Response.json({ error: 'المبلغ غير صالح' }, { status: 400 });
      }

      // Build line items breakdown
      const lineItems = [
        {
          price_data: {
            currency: 'sar',
            product_data: {
              name: '🏛️ رسوم أمانة المنطقة (بلدي)',
              description: 'رسوم إصدار رخصة البناء الحكومية',
            },
            unit_amount: Math.round((permit.balady_fee || 0) * 100),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'sar',
            product_data: {
              name: '👷 أتعاب المهندس المعتمد',
              description: `مقابل إعداد ومراجعة المخططات`,
            },
            unit_amount: Math.round((permit.engineer_fee || 0) * 100),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'sar',
            product_data: {
              name: '⚡ خدمات منصة بيتلي',
              description: 'تقديم الطلب + الربط بالبلدية + متابعة الرخصة',
            },
            unit_amount: Math.round((permit.bytly_commission || 0) * 100),
          },
          quantity: 1,
        },
      ].filter(item => item.price_data.unit_amount > 0);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${appUrl}/PermitPaymentSuccess?permit_id=${permit_id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/PermitApplication`,
        customer_email: permit.client_email,
        metadata: {
          permit_id,
          client_email: permit.client_email,
          balady_fee: permit.balady_fee,
          engineer_fee: permit.engineer_fee,
          bytly_commission: permit.bytly_commission,
          engineer_id: permit.engineer_id || '',
        },
        payment_intent_data: {
          metadata: {
            permit_id,
            type: 'permit_payment',
          },
        },
      });

      // Save session info on permit
      await base44.asServiceRole.entities.PermitApplication.update(permit_id, {
        stripe_session_id: session.id,
        payment_status: 'pending',
      });

      return Response.json({ checkout_url: session.url, session_id: session.id });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: distribute — توزيع الأموال بعد تأكيد الدفع
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'distribute') {
      const { session_id } = body;

      // Verify payment with Stripe
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status !== 'paid') {
        return Response.json({ error: 'الدفع لم يكتمل بعد', payment_status: session.payment_status }, { status: 400 });
      }

      // Prevent double-distribution
      if (permit.payment_status === 'paid') {
        return Response.json({ message: 'تم التوزيع مسبقاً', already_distributed: true });
      }

      const baladyFee = permit.balady_fee || 0;
      const engineerFee = permit.engineer_fee || 0;
      const bytlyCommission = permit.bytly_commission || 0;
      const totalPaid = permit.total_amount || 0;
      const now = new Date().toISOString();

      // 1️⃣ سجّل إيراد المنصة
      await base44.asServiceRole.entities.PlatformRevenue.create({
        transaction_id: session.payment_intent,
        source_type: 'permit_payment',
        total_amount: totalPaid,
        commission_rate: Math.round((bytlyCommission / totalPaid) * 100),
        commission_amount: bytlyCommission,
        seller_earnings: engineerFee,
        status: 'collected',
        payment_date: now,
        stripe_payment_intent: session.payment_intent,
        description: `رسوم رخصة بناء — ${permit.city} — ${permit.land_area}م²`,
      });

      // 2️⃣ أضف رصيد رسوم البلدية كـ "محجوز للتحويل الحكومي"
      await base44.asServiceRole.entities.Transaction.create({
        type: 'balady_fee_collected',
        amount: baladyFee,
        description: `رسوم بلدي — رخصة ${permit.permit_type} — ${permit.city}`,
        reference_id: permit_id,
        reference_type: 'permit',
        status: 'pending_transfer', // في انتظار التحويل عبر Sadad
        created_at: now,
        metadata: JSON.stringify({
          permit_id,
          land_number: permit.land_number,
          city: permit.city,
          transfer_to: 'balady_government'
        }),
      });

      // 3️⃣ إضافة أتعاب المهندس لمحفظته (Escrow)
      if (permit.engineer_id) {
        const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: permit.engineer_id });
        if (engineers.length > 0) {
          const eng = engineers[0];
          await base44.asServiceRole.entities.Engineer.update(eng.id, {
            wallet_balance: (eng.wallet_balance || 0) + engineerFee,
          });
          await base44.asServiceRole.entities.Transaction.create({
            type: 'escrow_hold',
            amount: engineerFee,
            description: `أتعاب رخصة بناء — ${permit.city}`,
            reference_id: permit_id,
            reference_type: 'permit',
            recipient_email: eng.email,
            status: 'held', // محجوز حتى إصدار الرخصة
            created_at: now,
          });
        }
      }

      // 4️⃣ حدّث حالة الطلب
      await base44.asServiceRole.entities.PermitApplication.update(permit_id, {
        payment_status: 'paid',
        status: 'under_review',
        payment_date: now,
        stripe_payment_intent: session.payment_intent,
      });

      // 5️⃣ إرسال إشعار للعميل
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: permit.client_email,
        subject: '✅ تم استلام دفعتك — جارٍ مراجعة طلب الرخصة',
        body: `
          <div dir="rtl" style="font-family: Arial; max-width: 600px; margin: auto;">
            <h2 style="color: #6B5D4F;">تأكيد استلام الدفعة</h2>
            <p>عزيزي ${permit.client_name}،</p>
            <p>تم استلام دفعتك بنجاح لطلب رخصة البناء في <strong>${permit.city}</strong>.</p>
            <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
              <tr style="background:#f8f4ef;">
                <td style="padding:8px; border:1px solid #e0d5c5;">رسوم البلدية</td>
                <td style="padding:8px; border:1px solid #e0d5c5; text-align:left;">${baladyFee.toLocaleString('ar-SA')} ر.س</td>
              </tr>
              <tr>
                <td style="padding:8px; border:1px solid #e0d5c5;">أتعاب المهندس</td>
                <td style="padding:8px; border:1px solid #e0d5c5; text-align:left;">${engineerFee.toLocaleString('ar-SA')} ر.س</td>
              </tr>
              <tr style="background:#f8f4ef;">
                <td style="padding:8px; border:1px solid #e0d5c5;">خدمات بيتلي</td>
                <td style="padding:8px; border:1px solid #e0d5c5; text-align:left;">${bytlyCommission.toLocaleString('ar-SA')} ر.س</td>
              </tr>
              <tr style="font-weight:bold; background:#C9A66B; color:white;">
                <td style="padding:8px;">الإجمالي</td>
                <td style="padding:8px; text-align:left;">${totalPaid.toLocaleString('ar-SA')} ر.س</td>
              </tr>
            </table>
            <p>سنرسل طلبك الآن إلى نظام بلدي وسنُعلمك بأي تحديث فور صدوره.</p>
            <p style="color:#888; font-size:12px;">رقم المرجع: ${session.payment_intent}</p>
          </div>
        `,
      });

      return Response.json({
        success: true,
        distributed: { balady_fee: baladyFee, engineer_fee: engineerFee, bytly_commission: bytlyCommission },
        permit_status: 'under_review',
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: status
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'status') {
      let stripeStatus = null;
      if (permit.stripe_session_id) {
        const session = await stripe.checkout.sessions.retrieve(permit.stripe_session_id);
        stripeStatus = session.payment_status;
      }
      return Response.json({
        permit_id,
        payment_status: permit.payment_status,
        stripe_status: stripeStatus,
        total_amount: permit.total_amount,
        balady_fee: permit.balady_fee,
        engineer_fee: permit.engineer_fee,
        bytly_commission: permit.bytly_commission,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});