import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { milestone_id, project_id, refund_type, refund_amount, reason } = await req.json();

    // Get all necessary data
    const [milestone] = await base44.asServiceRole.entities.ProjectMilestone.filter({ id: milestone_id });
    const [project] = await base44.asServiceRole.entities.Project.filter({ id: project_id });
    const [client] = await base44.asServiceRole.entities.Client.filter({ id: project.client_id });
    const [engineer] = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });

    if (!milestone || !project || !client || !engineer) {
      return Response.json({ error: 'Missing required data' }, { status: 404 });
    }

    // Calculate refund amount
    const amountToRefund = refund_type === 'full' ? milestone.amount : refund_amount;

    if (amountToRefund <= 0 || amountToRefund > milestone.amount) {
      return Response.json({ error: 'Invalid refund amount' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Return funds to client wallet
    await base44.asServiceRole.entities.Client.update(client.id, {
      wallet_balance: (client.wallet_balance || 0) + amountToRefund
    });

    // Deduct from engineer pending balance
    await base44.asServiceRole.entities.Engineer.update(engineer.id, {
      pending_balance: (engineer.pending_balance || 0) - amountToRefund
    });

    // Update project escrow
    await base44.asServiceRole.entities.Project.update(project_id, {
      escrow_amount: (project.escrow_amount || 0) - amountToRefund
    });

    // Update milestone status if full refund
    if (refund_type === 'full') {
      await base44.asServiceRole.entities.ProjectMilestone.update(milestone_id, {
        status: 'cancelled',
        payment_released: false
      });
    }

    // Create refund transaction for client
    await base44.asServiceRole.entities.Transaction.create({
      user_email: client.email,
      user_type: 'client',
      type: 'refund',
      amount: amountToRefund,
      status: 'completed',
      description: `استرجاع ${refund_type === 'full' ? 'كامل' : 'جزئي'}: ${milestone.title} - ${reason}`,
      project_id: project_id,
      milestone_id: milestone_id,
      from_wallet: 'escrow',
      to_wallet: client.email,
      metadata: {
        refund_type,
        reason,
        processed_by: user.email,
        processed_at: now
      }
    });

    // Create refund transaction for engineer (deduction)
    await base44.asServiceRole.entities.Transaction.create({
      user_email: engineer.email,
      user_type: 'engineer',
      type: 'refund',
      amount: -amountToRefund,
      status: 'completed',
      description: `استرجاع من رصيد معلق: ${milestone.title}`,
      project_id: project_id,
      milestone_id: milestone_id,
      from_wallet: engineer.email,
      to_wallet: 'escrow',
      metadata: {
        refund_type,
        reason
      }
    });

    console.log(`Refund processed: ${amountToRefund} SAR from milestone ${milestone_id} to client ${client.email}`);

    return Response.json({
      success: true,
      refund_amount: amountToRefund,
      message: 'تم استرجاع المبلغ بنجاح'
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    return Response.json({ 
      error: 'Failed to process refund',
      details: error.message 
    }, { status: 500 });
  }
});