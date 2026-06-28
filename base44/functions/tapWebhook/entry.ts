import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        // Set the service role token before any operations
        const base44 = createClientFromRequest(req);

        // ── Verify Tap Payments signature (HMAC-SHA256) ──────────────────────
        const rawBody = await req.text();
        const hashstring = req.headers.get('hashstring');

        if (!hashstring) {
            console.error('Tap webhook: missing hashstring header');
            return Response.json({ error: 'Missing signature' }, { status: 401 });
        }

        const tapSecret = Deno.env.get('TAP_SECRET_KEY');
        if (!tapSecret) {
            console.error('Tap webhook: TAP_SECRET_KEY not configured');
            return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
        }

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(tapSecret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
        const expectedHash = btoa(String.fromCharCode(...new Uint8Array(signature)));

        if (hashstring !== expectedHash) {
            console.error('Tap webhook: signature verification failed');
            return Response.json({ error: 'Invalid signature' }, { status: 401 });
        }
        // ─────────────────────────────────────────────────────────────────────

        const payload = JSON.parse(rawBody);

        console.log('Tap Webhook received:', payload);

        const chargeId = payload.id;
        const status = payload.status;
        const amount = payload.amount;
        const currency = payload.currency;
        const projectId = payload.metadata?.udf1;
        const invoiceId = payload.metadata?.udf2;
        const userEmail = payload.metadata?.udf3;

        // Handle successful payment
        if (status === 'CAPTURED') {
            console.log(`Payment successful for project ${projectId}, invoice ${invoiceId}`);

            // Update invoice status
            if (invoiceId) {
                const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoiceId });
                if (invoices.length > 0) {
                    await base44.asServiceRole.entities.Invoice.update(invoiceId, {
                        payment_status: 'paid',
                        status: 'paid',
                        paid_amount: amount
                    });
                }
            }

            // Create payment record
            if (projectId && invoiceId) {
                const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoiceId });
                const invoice = invoices[0];

                await base44.asServiceRole.entities.Payment.create({
                    invoice_id: invoiceId,
                    contract_id: invoice?.contract_id,
                    project_id: projectId,
                    payer_email: userEmail || payload.customer?.email,
                    payee_email: invoice?.engineer_id,
                    amount: amount,
                    payment_method: 'tap',
                    transaction_id: chargeId,
                    status: 'completed',
                    payment_date: new Date().toISOString()
                });
            }

            // Send notifications
            if (userEmail) {
                await base44.asServiceRole.entities.Notification.create({
                    recipient_email: userEmail,
                    title: 'تم استلام الدفعة بنجاح',
                    message: `تم استلام دفعتك بمبلغ ${amount} ${currency} للمشروع`,
                    type: 'payment',
                    related_project_id: projectId
                });
            }

            // Update project escrow if needed
            if (projectId) {
                const projects = await base44.asServiceRole.entities.Project.filter({ id: projectId });
                if (projects.length > 0) {
                    const project = projects[0];
                    const currentEscrow = project.escrow_amount || 0;
                    await base44.asServiceRole.entities.Project.update(projectId, {
                        escrow_amount: currentEscrow + amount,
                        status: 'in_progress'
                    });
                }
            }
        }

        // Handle failed payment
        if (status === 'DECLINED' || status === 'FAILED') {
            console.log(`Payment failed for project ${projectId}`);
            
            if (userEmail) {
                await base44.asServiceRole.entities.Notification.create({
                    recipient_email: userEmail,
                    title: 'فشلت عملية الدفع',
                    message: 'لم تتم عملية الدفع بنجاح. يرجى المحاولة مرة أخرى أو استخدام طريقة دفع أخرى',
                    type: 'payment'
                });
            }
        }

        return Response.json({ received: true });

    } catch (error) {
        console.error('Tap Webhook Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});