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

    if (!amount || amount < 50) {
      return Response.json({ error: 'Minimum recharge is 50 SAR' }, { status: 400 });
    }

    // Create Stripe checkout session with Apple Pay and Google Pay enabled
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'sar',
            product_data: {
              name: 'شحن محفظة بيتلي',
              description: `إضافة ${amount} ريال لمحفظتك`
            },
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}${'/wallet-recharge-success'}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}${'/wallet-recharge'}`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        type: 'wallet_recharge',
        user_email: user_email,
        amount: amount.toString()
      },
      customer_email: user_email,
      payment_intent_data: {
        metadata: {
          type: 'wallet_recharge',
          user_email: user_email
        }
      }
    });

    console.log(`Wallet recharge checkout created for ${user_email}: ${amount} SAR`);

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Error creating wallet recharge:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});