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
      // Contractor plans monthly (SAR)
      'price_1TtaI3B6BI8uC0AupOhXOnac', // Contractor Basic 99 SAR/mo
      'price_1TtaI4B6BI8uC0AuEky91mYl', // Contractor Pro 249 SAR/mo
      'price_1TtaI4B6BI8uC0Au3YdkJTlY', // Contractor Enterprise 599 SAR/mo
      // Contractor plans yearly (SAR)
      'price_1TtaOgB6BI8uC0AuoLaGDBhe', // Contractor Basic 690 SAR/yr
      'price_1TtaOgB6BI8uC0AuPYrWJL0T', // Contractor Pro 1790 SAR/yr
      'price_1TtaOgB6BI8uC0AuwtKVNleN', // Contractor Enterprise 4290 SAR/yr
      // Supplier plans monthly (SAR)
      'price_1TtaI4B6BI8uC0Au133PiiYo', // Supplier Basic 99 SAR/mo
      'price_1TtaI4B6BI8uC0AuyidDyMj9', // Supplier Pro 249 SAR/mo
      'price_1TtaI4B6BI8uC0Auf8LmiGct', // Supplier Enterprise 599 SAR/mo
      // Supplier plans yearly (SAR)
      'price_1TtaOgB6BI8uC0AuDavX2zNB', // Supplier Basic 690 SAR/yr
      'price_1TtaOgB6BI8uC0AuGLUcpcFS', // Supplier Pro 1790 SAR/yr
      'price_1TtaOgB6BI8uC0AuWLVMkAve', // Supplier Enterprise 4290 SAR/yr
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