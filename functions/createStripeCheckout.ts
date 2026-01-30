import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2024-12-18.acacia'
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, projectId, proposalId, projectTitle } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'sar',
            product_data: {
              name: `مشروع: ${projectTitle}`,
              description: 'دفع مبلغ المشروع بنظام الضمان'
            },
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}&project=${projectId}&proposal=${proposalId}`,
      cancel_url: `${req.headers.get('origin')}/Payment?project=${projectId}&proposal=${proposalId}`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        project_id: projectId,
        proposal_id: proposalId,
        user_email: user.email
      }
    });

    return Response.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});