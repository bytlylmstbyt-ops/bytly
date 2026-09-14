import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-11-20.acacia'
    });

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, user_email } = await req.json();

    if (amount < 50) {
      return Response.json({ error: 'Minimum topup is 50 SAR' }, { status: 400 });
    }

    // Create Stripe checkout session with multiple payment methods
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'sar',
            product_data: {
              name: 'شحن المحفظة',
              description: 'إضافة رصيد لمحفظتك في بيتلي'
            },
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}${'/wallet-topup-success'}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}${'/wallet-topup'}`,
      customer_email: user_email,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        type: 'wallet_topup',
        user_email: user_email,
        amount: amount.toString()
      },
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic'
        }
      }
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Error creating wallet topup:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});