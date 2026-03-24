import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = await import('npm:stripe');
const Stripe = stripe.default;
const stripeClient = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return Response.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Get invoice
    const [invoice] = await base44.asServiceRole.entities.Invoice.filter({ 
      id: invoiceId 
    });

    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.payment_status === 'paid') {
      return Response.json({ error: 'Invoice already paid' }, { status: 400 });
    }

    // Get project details
    const [project] = await base44.asServiceRole.entities.Project.filter({ 
      id: invoice.project_id 
    });

    const [client] = await base44.asServiceRole.entities.Client.filter({ 
      id: invoice.client_id 
    });

    // Create Stripe checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'sar',
            product_data: {
              name: `فاتورة المشروع: ${project.title}`,
              description: invoice.description,
            },
            unit_amount: Math.round(invoice.total_amount * 100), // Convert to cents
          },
          quantity: 1,
        }
      ],
      customer_email: client.email,
      metadata: {
        invoice_id: invoiceId,
        project_id: project.id,
        base44_app_id: Deno.env.get('BASE44_APP_ID')
      },
      success_url: `https://bytly.app/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://bytly.app/invoice?id=${invoiceId}`,
    });

    // Create payment record
    const payment = await base44.asServiceRole.entities.Payment.create({
      invoice_id: invoiceId,
      contract_id: invoice.contract_id,
      project_id: invoice.project_id,
      payer_email: client.email,
      payee_email: invoice.engineer_id,
      amount: invoice.total_amount,
      payment_method: 'stripe',
      stripe_session_id: session.id,
      status: 'pending'
    });

    // Send checkout URL to client
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: client.email,
      title: 'رابط الدفع جاهز',
      message: `رابط الدفع للفاتورة ${invoice.invoice_number} جاهز. اضغط على الرابط لإكمال الدفع.`,
      type: 'payment',
      related_project_id: project.id,
      priority: 'high'
    });

    return Response.json({
      success: true,
      checkout_url: session.url,
      payment_id: payment.id,
      session_id: session.id
    });

  } catch (error) {
    console.error("Error creating payment checkout:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});