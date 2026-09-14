import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-11-20.acacia'
    });
    const body = await req.text();
    
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`Webhook received: ${event.type}`);

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const metadata = session.metadata;

      if (metadata.type === 'milestone_payment') {
        const { milestone_id, project_id, client_id, client_email } = metadata;

        // Get milestone and project
        const [milestone] = await base44.asServiceRole.entities.ProjectMilestone.filter({ id: milestone_id });
        const [project] = await base44.asServiceRole.entities.Project.filter({ id: project_id });
        const [client] = await base44.asServiceRole.entities.Client.filter({ id: client_id });
        const [engineer] = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });

        if (!milestone || !project || !client || !engineer) {
          console.error('Missing entities for payment processing');
          return Response.json({ error: 'Missing data' }, { status: 400 });
        }

        // Hold funds in escrow
        const now = new Date().toISOString();

        // Update milestone status to pending (payment received, held in escrow)
        await base44.asServiceRole.entities.ProjectMilestone.update(milestone_id, {
          status: 'in_progress',
          start_date: now
        });

        // Update client wallet - deduct from balance
        await base44.asServiceRole.entities.Client.update(client_id, {
          wallet_balance: (client.wallet_balance || 0) + milestone.amount
        });

        // Update project escrow amount
        await base44.asServiceRole.entities.Project.update(project_id, {
          escrow_amount: (project.escrow_amount || 0) + milestone.amount,
          escrow_status: 'held'
        });

        // Update engineer pending balance (in escrow)
        await base44.asServiceRole.entities.Engineer.update(engineer.id, {
          pending_balance: (engineer.pending_balance || 0) + milestone.amount
        });

        // Create escrow hold transaction for client
        await base44.asServiceRole.entities.Transaction.create({
          user_email: client_email,
          user_type: 'client',
          type: 'escrow_hold',
          amount: milestone.amount,
          status: 'held_in_escrow',
          description: `حجز دفعة مرحلة: ${milestone.title}`,
          project_id: project_id,
          milestone_id: milestone_id,
          reference_id: session.payment_intent,
          payment_method: 'card',
          from_wallet: client_email,
          to_wallet: 'escrow'
        });

        // Create pending transaction for engineer
        await base44.asServiceRole.entities.Transaction.create({
          user_email: engineer.email,
          user_type: 'engineer',
          type: 'escrow_hold',
          amount: milestone.amount,
          status: 'held_in_escrow',
          description: `دفعة معلقة: ${milestone.title}`,
          project_id: project_id,
          milestone_id: milestone_id,
          reference_id: session.payment_intent,
          from_wallet: 'escrow',
          to_wallet: engineer.email
        });

        console.log(`Payment processed for milestone ${milestone_id}: ${milestone.amount} SAR held in escrow`);
      }

      // Handle design purchase payment
      if (metadata.type === 'design_purchase') {
        const { purchase_id, design_id, buyer_email } = metadata;

        const [purchase] = await base44.asServiceRole.entities.DesignPurchase.filter({ id: purchase_id });
        const [design] = await base44.asServiceRole.entities.ReadyMadeDesign.filter({ id: design_id });

        if (!purchase || !design) {
          console.error('Missing design or purchase data');
          return Response.json({ error: 'Missing data' }, { status: 400 });
        }

        // Calculate commission (25-30% for design marketplace)
        const commissionRate = 0.25; // 25%
        const commissionAmount = design.price * commissionRate;
        const sellerEarnings = design.price - commissionAmount;

        // Update purchase record
        await base44.asServiceRole.entities.DesignPurchase.update(purchase_id, {
          payment_status: "completed",
          stripe_payment_intent: session.payment_intent,
          download_url: design.design_files?.[0] || null,
          platform_commission: commissionAmount,
          seller_earnings: sellerEarnings
        });

        // Update design stats
        await base44.asServiceRole.entities.ReadyMadeDesign.update(design_id, {
          total_purchases: (design.total_purchases || 0) + 1
        });

        // Add to seller's available balance
        const sellers = design.seller_type === "engineer" 
          ? await base44.asServiceRole.entities.Engineer.filter({ id: design.seller_id })
          : await base44.asServiceRole.entities.EngineeringFirm.filter({ id: design.seller_id });
        
        const seller = sellers[0];
        if (seller) {
          const entityName = design.seller_type === "engineer" ? "Engineer" : "EngineeringFirm";
          await base44.asServiceRole.entities[entityName].update(seller.id, {
            available_balance: (seller.available_balance || 0) + sellerEarnings
          });

          // Create transaction for seller
          await base44.asServiceRole.entities.Transaction.create({
            user_email: design.created_by,
            user_type: design.seller_type,
            type: 'payment',
            amount: sellerEarnings,
            commission_amount: commissionAmount,
            net_amount: sellerEarnings,
            status: 'completed',
            description: `مبيعات تصميم: ${design.title}`,
            reference_id: session.payment_intent,
            payment_method: 'card'
          });
        }

        // Create platform revenue record
        await base44.asServiceRole.entities.PlatformRevenue.create({
          source_type: "design_purchase",
          design_id: design_id,
          total_amount: design.price,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          seller_email: design.created_by,
          seller_earnings: sellerEarnings,
          status: "collected",
          payment_date: new Date().toISOString(),
          stripe_payment_intent: session.payment_intent
        });

        // Notify seller
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: design.created_by,
          title: "تم بيع تصميمك!",
          message: `تهانينا! تم بيع تصميم "${design.title}" بمبلغ ${design.price.toLocaleString()} ر.س. صافي أرباحك: ${sellerEarnings.toLocaleString()} ر.س`,
          type: "payment",
          priority: "high"
        });

        console.log(`Design purchase completed: ${design.title} - Commission: ${commissionAmount} SAR`);
      }
    }
  

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      error: 'Webhook processing failed',
      details: error.message 
    }, { status: 500 });
  }
});