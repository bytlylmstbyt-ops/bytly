import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { design_id, buyer_email } = await req.json();

    // Get design details
    const designs = await base44.entities.ReadyMadeDesign.filter({ id: design_id });
    if (designs.length === 0) {
      return Response.json({ error: 'Design not found' }, { status: 404 });
    }

    const design = designs[0];

    // Check if already purchased
    const existingPurchases = await base44.entities.DesignPurchase.filter({
      design_id: design_id,
      buyer_email: buyer_email,
      payment_status: "completed"
    });

    if (existingPurchases.length > 0) {
      return Response.json({ error: 'Design already purchased' }, { status: 400 });
    }

    // Calculate amounts (25% commission for design marketplace)
    const platformCommissionRate = 0.25; // 25%
    const platformCommission = design.price * platformCommissionRate;
    const sellerEarnings = design.price - platformCommission;

    // Create pending purchase record
    const purchase = await base44.asServiceRole.entities.DesignPurchase.create({
      design_id: design_id,
      buyer_email: buyer_email,
      buyer_name: user.full_name,
      seller_id: design.seller_id,
      seller_email: design.created_by,
      amount_paid: design.price,
      platform_commission: platformCommission,
      seller_earnings: sellerEarnings,
      payment_status: "pending"
    });

    // Create Stripe checkout session with Apple Pay and Google Pay
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic'
        }
      },
      line_items: [
        {
          price_data: {
            currency: 'sar',
            product_data: {
              name: design.title,
              description: `تصميم جاهز - ${design.category}`,
              images: design.preview_images?.slice(0, 1) || []
            },
            unit_amount: Math.round(design.price * 100)
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}${createPageUrl('DesignPurchaseSuccess')}?session_id={CHECKOUT_SESSION_ID}&purchase_id=${purchase.id}`,
      cancel_url: `${req.headers.get('origin')}${createPageUrl('DesignDetails')}?id=${design_id}`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        purchase_id: purchase.id,
        design_id: design_id,
        buyer_email: buyer_email,
        type: 'design_purchase'
      }
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});