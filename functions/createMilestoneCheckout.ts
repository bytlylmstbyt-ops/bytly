import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-11-20.acacia'
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { milestone_id, project_id, success_url, cancel_url } = await req.json();

    // Get milestone and project details
    const [milestone] = await base44.entities.ProjectMilestone.filter({ id: milestone_id });
    const [project] = await base44.entities.Project.filter({ id: project_id });
    const [client] = await base44.entities.Client.filter({ id: project.client_id });

    if (!milestone || !project) {
      return Response.json({ error: 'Milestone or project not found' }, { status: 404 });
    }

    // Verify user is the client
    if (client.email !== user.email) {
      return Response.json({ error: 'Unauthorized: Not project owner' }, { status: 403 });
    }

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
              name: `دفع مرحلة: ${milestone.title}`,
              description: `مشروع: ${project.title}`,
            },
            unit_amount: Math.round(milestone.amount * 100), // Convert to halalas
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url || `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/project-milestones?id=${project_id}`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        milestone_id: milestone_id,
        project_id: project_id,
        client_id: client.id,
        client_email: client.email,
        type: 'milestone_payment'
      },
      customer_email: client.email,
    });

    console.log(`Checkout session created: ${session.id} for milestone ${milestone_id}`);

    return Response.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Error creating checkout:', error);
    return Response.json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    }, { status: 500 });
  }
});