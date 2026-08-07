import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { invoice_id, redirect_url } = await req.json();

    if (!invoice_id) {
      return Response.json({ error: 'invoice_id is required' }, { status: 400 });
    }

    // ── Fetch the invoice ──
    const [invoice] = await base44.asServiceRole.entities.Invoice.filter({ id: invoice_id });
    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // ── Authorization: admin or invoice creator ──
    const isAdmin = user.role === 'admin';
    const isCreator = invoice.created_by === user.email;
    if (!isAdmin && !isCreator) {
      return Response.json({ error: 'Forbidden: not authorized to process this invoice' }, { status: 403 });
    }

    if (invoice.status === 'paid') {
      return Response.json({ error: 'Invoice is already paid' }, { status: 400 });
    }

    const payAmount = invoice.total_amount || invoice.amount;
    if (!payAmount || payAmount <= 0) {
      return Response.json({ error: 'Invalid invoice amount' }, { status: 400 });
    }

    // ── Get Square OAuth connection ──
    const { accessToken, connectionConfig } = await base44.asServiceRole.connectors.getConnection('square');
    const SQUARE_VERSION = '2024-12-18';
    const amountCents = Math.round(payAmount * 100);

    // ── Step 1: Fetch merchant locations, pick first active ──
    const locRes = await fetch('https://connect.squareup.com/v2/locations', {
      headers: { Authorization: `Bearer ${accessToken}`, 'Square-Version': SQUARE_VERSION },
    });
    if (!locRes.ok) {
      const e = await locRes.json();
      console.error('Square locations error:', JSON.stringify(e));
      return Response.json({ error: e.errors?.[0]?.detail || 'Failed to fetch Square locations' }, { status: 500 });
    }
    const locData = await locRes.json();
    const location = locData.locations?.find((l) => l.status === 'ACTIVE') || locData.locations?.[0];
    if (!location) {
      return Response.json({ error: 'No active Square location found. Set up a location in Square Dashboard first.' }, { status: 500 });
    }

    // ── Step 2: Create a Square payment link (quick_pay) ──
    const idempotencyKey = `bytly-inv-${invoice.id}-${Date.now()}`;
    const invoiceLabel = invoice.invoice_number || invoice.id;

    const linkBody = {
      idempotency_key: idempotencyKey,
      description: `فاتورة بيتلي ${invoiceLabel}`,
      quick_pay: {
        name: `دفع فاتورة مشروع — ${invoiceLabel}`,
        price_money: { amount: amountCents, currency: 'SAR' },
        location_id: location.id,
      },
      checkout_options: {
        redirect_url: redirect_url || undefined,
        ask_for_shipping_address: false,
      },
    };

    const linkRes = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Square-Version': SQUARE_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(linkBody),
    });

    if (!linkRes.ok) {
      const e = await linkRes.json();
      console.error('Square payment link error:', JSON.stringify(e));
      return Response.json({ error: e.errors?.[0]?.detail || 'Failed to create Square payment link' }, { status: 500 });
    }

    const linkData = await linkRes.json();
    const checkoutUrl = linkData.payment_link?.url;
    const paymentLinkId = linkData.payment_link?.id;
    const orderId = linkData.payment_link?.order_id;

    if (!checkoutUrl) {
      return Response.json({ error: 'Square did not return a checkout URL' }, { status: 500 });
    }

    // ── Update invoice with Square reference ──
    await base44.asServiceRole.entities.Invoice.update(invoice.id, {
      payment_reference: paymentLinkId,
      payment_method: 'square',
      square_checkout_url: checkoutUrl,
      status: invoice.status === 'draft' ? 'sent' : invoice.status,
    });

    // ── Create a pending transaction record ──
    await base44.entities.Transaction.create({
      user_email: invoice.client_email || user.email,
      user_type: 'client',
      type: 'payment',
      amount: payAmount,
      status: 'pending',
      description: `Square payment link for invoice ${invoiceLabel}`,
      project_id: invoice.project_id,
      reference_id: paymentLinkId,
    });

    return Response.json({
      checkout_url: checkoutUrl,
      payment_link_id: paymentLinkId,
      order_id: orderId,
      amount: payAmount,
      currency: 'SAR',
      invoice_id: invoice.id,
    });
  } catch (error) {
    console.error('processSquarePayment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});