import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
      apiVersion: '2024-12-18.acacia'
    });

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, proposalId } = await req.json();

    if (!projectId) {
      return Response.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Fetch the project from the database (trusted source) for the title
    const [project] = await base44.asServiceRole.entities.Project.filter({ id: projectId });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Derive the trusted amount from the database — never accept amount from the client
    let trustedAmount = 0;

    if (proposalId) {
      const [proposal] = await base44.asServiceRole.entities.Proposal.filter({ id: proposalId });
      if (!proposal) {
        return Response.json({ error: 'Proposal not found' }, { status: 404 });
      }
      // Verify the proposal belongs to the specified project (prevent mismatch attacks)
      if (proposal.project_id !== projectId) {
        return Response.json({ error: 'Proposal does not match project' }, { status: 400 });
      }
      trustedAmount = Number(proposal.price);
    } else {
      // Fallback: use the project's escrow amount when no proposal is provided
      trustedAmount = Number(project.escrow_amount);
    }

    if (!trustedAmount || isNaN(trustedAmount) || trustedAmount <= 0 || trustedAmount > 100000000) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const safeTitle = String(project.title || 'مشروع').slice(0, 200).replace(/[<>]/g, '');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'sar',
            product_data: {
              name: `مشروع: ${safeTitle}`,
              description: 'دفع مبلغ المشروع بنظام الضمان'
            },
            unit_amount: Math.round(trustedAmount * 100)
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}&project=${projectId}&proposal=${proposalId || ''}`,
      cancel_url: `${req.headers.get('origin')}/Payment?project=${projectId}&proposal=${proposalId || ''}`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        project_id: projectId,
        proposal_id: proposalId || '',
        user_email: user.email
      }
    });

    return Response.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});