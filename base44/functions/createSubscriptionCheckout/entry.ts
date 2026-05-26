import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const VALID_PRICE_IDS = [
  'price_1TbQh4B6BI8uC0Au89E4VzRL', // Basic 99 SAR/mo
  'price_1TbQh4B6BI8uC0AupdL39tcG', // Pro 249 SAR/mo
  'price_1TbQh4B6BI8uC0Au7VTp4rPf', // Enterprise 599 SAR/mo
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { price_id, plan_name } = await req.json();

    if (!price_id || !VALID_PRICE_IDS.includes(price_id)) {
      return Response.json({ error: 'Invalid price_id' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const origin = req.headers.get('origin') || 'https://app.base44.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      customer_email: user.email,
      success_url: `${origin}/Subscription?success=true&plan=${encodeURIComponent(plan_name || '')}`,
      cancel_url: `${origin}/Subscription?canceled=true`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: user.email,
        plan_name: plan_name || '',
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Subscription checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});