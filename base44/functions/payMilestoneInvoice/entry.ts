import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { invoice_id, success_url, cancel_url } = await req.json();

    const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoice_id });
    const invoice = invoices[0];
    if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 });
    if (invoice.status === 'paid') return Response.json({ error: 'Invoice already paid' }, { status: 400 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'sar',
          product_data: {
            name: `فاتورة ${invoice.invoice_number}`,
            description: invoice.notes || 'دفع فاتورة مشروع'
          },
          unit_amount: Math.round(invoice.total_amount * 100)
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: success_url || `${req.headers.get('origin')}/PaymentSuccess?invoice=${invoice_id}`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/ProjectDetails?id=${invoice.project_id}`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        project_id: invoice.project_id,
        milestone_id: invoice.milestone_id || ''
      },
      customer_email: invoice.client_email
    });

    // Update invoice with payment reference
    await base44.asServiceRole.entities.Invoice.update(invoice.id, {
      payment_reference: session.id,
      payment_method: 'stripe'
    });

    console.log(`Stripe session created for invoice ${invoice.invoice_number}: ${session.id}`);
    return Response.json({ checkout_url: session.url, session_id: session.id });

  } catch (error) {
    console.error('payMilestoneInvoice error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});