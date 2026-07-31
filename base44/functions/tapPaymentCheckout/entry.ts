import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount, currency, projectId, invoiceId, description, customerEmail, customerName } = await req.json();

        const tapSecretKey = Deno.env.get("TAP_SECRET_KEY");
        if (!tapSecretKey) {
            return Response.json({ 
                error: 'TAP_SECRET_KEY not configured. Please add your Tap Payments API key in Dashboard > Settings > Environment Variables' 
            }, { status: 500 });
        }

        // Create Tap Payments charge
        const tapResponse = await fetch('https://api.tap.company/v2/charges', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tapSecretKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                currency: currency || 'SAR',
                threeDSecure: true,
                save_card: false,
                description: description || `Payment for project ${projectId}`,
                statement_descriptor: 'Bytly Platform',
                metadata: {
                    udf1: projectId,
                    udf2: invoiceId,
                    udf3: user.email,
                    base44_app_id: Deno.env.get("BASE44_APP_ID")
                },
                reference: {
                    transaction: invoiceId || `INV-${Date.now()}`,
                    order: projectId
                },
                receipt: {
                    email: true,
                    sms: false
                },
                customer: {
                    first_name: customerName?.split(' ')[0] || user.full_name?.split(' ')[0] || 'عميل',
                    last_name: customerName?.split(' ').slice(1).join(' ') || user.full_name?.split(' ').slice(1).join(' ') || 'بيتلي',
                    email: customerEmail || user.email
                },
                source: {
                    id: 'src_all'
                },
                post: {
                    url: `${req.headers.get('origin')}/api/functions/tapWebhook`
                },
                redirect: {
                    url: `${req.headers.get('origin')}${createPageUrl('PaymentSuccess')}?gateway=tap&project=${projectId}`
                }
            })
        });

        const charge = await tapResponse.json();

        if (!tapResponse.ok) {
            console.error('Tap API Error:', charge);
            return Response.json({ 
                error: charge.errors?.[0]?.description || 'Failed to create payment session' 
            }, { status: 400 });
        }

        return Response.json({
            checkoutUrl: charge.transaction?.url,
            chargeId: charge.id,
            status: charge.status
        });

    } catch (error) {
        console.error('Tap Payment Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});