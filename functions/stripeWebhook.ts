import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2024-12-18.acacia'
});

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  try {
    const body = await req.text();
    
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { project_id, proposal_id, user_email } = session.metadata;

      // Update transaction to completed
      const transactions = await base44.asServiceRole.entities.Transaction.filter({
        project_id: project_id,
        type: "escrow_hold",
        status: "pending"
      });

      if (transactions.length > 0) {
        await base44.asServiceRole.entities.Transaction.update(transactions[0].id, {
          status: "completed",
          reference_id: session.payment_intent
        });
      }

      console.log(`Payment completed for project ${project_id}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});