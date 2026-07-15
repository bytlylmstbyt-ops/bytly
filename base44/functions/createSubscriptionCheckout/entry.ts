import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const VALID_PRICE_IDS = [
      // Engineer plans
      'price_1TbQh4B6BI8uC0Au89E4VzRL', // Basic 99
      'price_1TbQh4B6BI8uC0AupdL39tcG', // Pro 249
      'price_1TbQh4B6BI8uC0Au7VTp4rPf', // Enterprise 599
      // Contractor plans
      'price_1TtaFNB6BI8uC0AuD9yKVwfh', // Contractor Basic 99
      'price_1TtaFNB6BI8uC0AuHlGTlvid', // Contractor Pro 249
      'price_1TtaFNB6BI8uC0AuW1e0uVSd', // Contractor Enterprise 599
      // Supplier plans
      'price_1TtaFNB6BI8uC0AuWLlqYmrM', // Supplier Basic 99
      'price_1TtaFNB6BI8uC0AuUeUgEkLw', // Supplier Pro 249
      'price_1TtaFNB6BI8uC0AuGqIWvrER', // Supplier Enterprise 599
    ];

    const { price_id, plan_name, provider_type } = await req.json();

    if (!price_id || !VALID_PRICE_IDS.includes(price_id)) {
      return Response.json({ error: 'Invalid price_id' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const origin = req.headers.get('origin') || 'https://app.base44.com';

    const redirectBase = provider_type === 'contractor' || provider_type === 'supplier'
      ? `/ProviderSubscription?type=${provider_type}`
      : '/Subscription';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      customer_email: user.email,
      success_url: `${origin}${redirectBase}&success=true&plan=${encodeURIComponent(plan_name || '')}`,
      cancel_url: `${origin}${redirectBase}&canceled=true`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: user.email,
        plan_name: plan_name || '',
        provider_type: provider_type || 'engineer',
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Subscription checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});