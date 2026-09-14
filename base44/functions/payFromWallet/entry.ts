import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payment_type, milestone_id, design_id } = await req.json();

    // Process milestone payment from wallet
    if (payment_type === 'milestone' && milestone_id) {
      const [milestone] = await base44.entities.ProjectMilestone.filter({ id: milestone_id });
      const [project] = await base44.entities.Project.filter({ id: milestone.project_id });
      const [client] = await base44.entities.Client.filter({ id: project.client_id });
      const [engineer] = await base44.entities.Engineer.filter({ id: project.assigned_engineer_id });

      if (client.email !== user.email) {
        return Response.json({ error: 'Unauthorized' }, { status: 403 });
      }

      if (client.wallet_balance < milestone.amount) {
        return Response.json({ error: 'Insufficient balance' }, { status: 400 });
      }

      const now = new Date().toISOString();

      // Deduct from client wallet
      await base44.asServiceRole.entities.Client.update(client.id, {
        wallet_balance: client.wallet_balance - milestone.amount
      });

      // Update milestone
      await base44.asServiceRole.entities.ProjectMilestone.update(milestone_id, {
        status: 'in_progress',
        start_date: now
      });

      // Update project escrow
      await base44.asServiceRole.entities.Project.update(project.id, {
        escrow_amount: (project.escrow_amount || 0) + milestone.amount,
        escrow_status: 'held'
      });

      // Add to engineer pending balance
      await base44.asServiceRole.entities.Engineer.update(engineer.id, {
        pending_balance: (engineer.pending_balance || 0) + milestone.amount
      });

      // Create transactions
      await base44.asServiceRole.entities.Transaction.create({
        user_email: client.email,
        user_type: 'client',
        type: 'escrow_hold',
        amount: milestone.amount,
        status: 'held_in_escrow',
        description: `دفع من المحفظة - ${milestone.title}`,
        project_id: project.id,
        milestone_id: milestone_id,
        payment_method: 'wallet',
        from_wallet: client.email,
        to_wallet: 'escrow'
      });

      await base44.asServiceRole.entities.Transaction.create({
        user_email: engineer.email,
        user_type: 'engineer',
        type: 'escrow_hold',
        amount: milestone.amount,
        status: 'held_in_escrow',
        description: `دفعة معلقة - ${milestone.title}`,
        project_id: project.id,
        milestone_id: milestone_id,
        payment_method: 'wallet',
        from_wallet: 'escrow',
        to_wallet: engineer.email
      });

      return Response.json({ success: true, message: 'Payment processed from wallet' });
    }

    // Process design purchase from wallet
    if (payment_type === 'design' && design_id) {
      const [design] = await base44.entities.ReadyMadeDesign.filter({ id: design_id });
      
      // Get client or engineer wallet
      const clients = await base44.asServiceRole.entities.Client.filter({ email: user.email });
      const engineers = await base44.asServiceRole.entities.Engineer.filter({ email: user.email });
      
      const buyer = clients[0] || engineers[0];
      if (!buyer) {
        return Response.json({ error: 'Buyer profile not found' }, { status: 404 });
      }

      if (buyer.wallet_balance < design.price) {
        return Response.json({ error: 'Insufficient balance' }, { status: 400 });
      }

      // Calculate commission
      const commissionRate = 0.25;
      const commissionAmount = design.price * commissionRate;
      const sellerEarnings = design.price - commissionAmount;

      // Deduct from buyer wallet
      const entityType = clients[0] ? 'Client' : 'Engineer';
      await base44.asServiceRole.entities[entityType].update(buyer.id, {
        wallet_balance: buyer.wallet_balance - design.price
      });

      // Create purchase record
      const purchase = await base44.asServiceRole.entities.DesignPurchase.create({
        design_id: design_id,
        buyer_email: user.email,
        buyer_name: user.full_name,
        seller_id: design.seller_id,
        seller_email: design.created_by,
        amount_paid: design.price,
        platform_commission: commissionAmount,
        seller_earnings: sellerEarnings,
        payment_status: "completed",
        payment_method: "wallet",
        download_url: design.design_files?.[0] || null
      });

      // Add to seller balance
      const sellers = design.seller_type === "engineer"
        ? await base44.asServiceRole.entities.Engineer.filter({ id: design.seller_id })
        : await base44.asServiceRole.entities.EngineeringFirm.filter({ id: design.seller_id });
      
      const seller = sellers[0];
      if (seller) {
        const sellerEntityType = design.seller_type === "engineer" ? "Engineer" : "EngineeringFirm";
        await base44.asServiceRole.entities[sellerEntityType].update(seller.id, {
          available_balance: (seller.available_balance || 0) + sellerEarnings
        });
      }

      // Update design stats
      await base44.asServiceRole.entities.ReadyMadeDesign.update(design_id, {
        total_purchases: (design.total_purchases || 0) + 1
      });

      // Create revenue record
      await base44.asServiceRole.entities.PlatformRevenue.create({
        source_type: "design_purchase",
        design_id: design_id,
        total_amount: design.price,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        seller_email: design.created_by,
        seller_earnings: sellerEarnings,
        status: "collected",
        payment_date: new Date().toISOString()
      });

      // Notify seller
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: design.created_by,
        title: "تم بيع تصميمك!",
        message: `تم بيع "${design.title}" - صافي أرباحك: ${sellerEarnings.toLocaleString('ar-SA')} ر.س`,
        type: "payment",
        priority: "high"
      });

      return Response.json({ 
        success: true, 
        purchase_id: purchase.id,
        download_url: purchase.download_url 
      });
    }

    return Response.json({ error: 'Invalid payment type' }, { status: 400 });
  } catch (error) {
    console.error('Error processing wallet payment:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});