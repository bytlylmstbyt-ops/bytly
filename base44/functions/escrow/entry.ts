/**
 * escrow — نظام الضمان المالي المتكامل
 * Actions:
 *  deposit          — إيداع مبلغ المشروع كاملاً في الضمان
 *  deposit_milestone — إيداع دفعة مرحلة محددة في الضمان
 *  release          — تحرير المبلغ الكامل للمهندس (موافقة نهائية)
 *  release_milestone — تحرير دفعة مرحلة محددة
 *  refund           — استرجاع مبلغ الضمان (للأدمن أو النزاع)
 *  status           — جلب حالة الضمان الكاملة
 *  milestone_status  — حالة ضمان مرحلة محددة
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const COMMISSION_RATE = 0.15; // 15% default

function calcCommission(amount, rate = COMMISSION_RATE) {
  return {
    gross: amount,
    commission: Math.round(amount * rate),
    net: Math.round(amount * (1 - rate))
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, project_id, proposal_id, milestone_id, amount } = body;

    // ══════════════════════════════════════════════════════════
    // DEPOSIT — إيداع مبلغ المشروع كاملاً
    // ══════════════════════════════════════════════════════════
    if (action === 'deposit') {
      const [project] = await base44.entities.Project.filter({ id: project_id });
      if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });
      if (project.created_by !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const [client] = await base44.entities.Client.filter({ email: user.email });
      if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

      const depositAmount = amount || project.escrow_amount || 0;
      if (!depositAmount) return Response.json({ error: 'amount_required' }, { status: 400 });

      if ((client.wallet_balance || 0) < depositAmount) {
        return Response.json({
          error: 'insufficient_balance',
          required: depositAmount,
          available: client.wallet_balance || 0
        }, { status: 400 });
      }

      const { commission, net } = calcCommission(depositAmount, (project.platform_commission || 15) / 100);

      // Deduct from client wallet
      await base44.asServiceRole.entities.Client.update(client.id, {
        wallet_balance: (client.wallet_balance || 0) - depositAmount
      });

      // Update project
      await base44.asServiceRole.entities.Project.update(project_id, {
        escrow_amount: depositAmount,
        escrow_status: 'held',
        status: 'in_progress',
        payment_status: 'escrowed'
      });

      // Accept proposal
      if (proposal_id) {
        await base44.asServiceRole.entities.Proposal.update(proposal_id, { status: 'accepted' });
      }

      // Transaction record
      await base44.asServiceRole.entities.Transaction.create({
        user_email: user.email,
        user_type: 'client',
        type: 'escrow_hold',
        amount: depositAmount,
        status: 'held_in_escrow',
        description: `إيداع ضمان مشروع: ${project.title}`,
        project_id,
        balance_before: client.wallet_balance || 0,
        balance_after: (client.wallet_balance || 0) - depositAmount,
        metadata: { commission_rate: project.platform_commission || 15, commission, net }
      });

      // Notify engineer
      if (project.assigned_engineer_id) {
        const [eng] = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
        if (eng) {
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: eng.email,
            title: '💰 تم إيداع مبلغ الضمان — ابدأ العمل!',
            message: `أودع العميل ${depositAmount.toLocaleString('ar-SA')} ريال ضماناً لمشروع "${project.title}". المبلغ محفوظ ويُصرف لك عند موافقة العميل.`,
            type: 'payment', related_project_id: project_id, priority: 'urgent'
          });
        }
      }

      return Response.json({ success: true, escrow_amount: depositAmount, commission, net_to_engineer: net });
    }

    // ══════════════════════════════════════════════════════════
    // DEPOSIT MILESTONE — إيداع دفعة مرحلة
    // ══════════════════════════════════════════════════════════
    if (action === 'deposit_milestone') {
      const [project] = await base44.entities.Project.filter({ id: project_id });
      if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });
      if (project.created_by !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const [milestone] = await base44.entities.ProjectMilestone.filter({ id: milestone_id });
      if (!milestone) return Response.json({ error: 'Milestone not found' }, { status: 404 });

      const [client] = await base44.entities.Client.filter({ email: user.email });
      if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

      const depositAmount = amount || milestone.amount || 0;
      if (!depositAmount) return Response.json({ error: 'amount_required' }, { status: 400 });

      if ((client.wallet_balance || 0) < depositAmount) {
        return Response.json({
          error: 'insufficient_balance',
          required: depositAmount,
          available: client.wallet_balance || 0
        }, { status: 400 });
      }

      const { commission, net } = calcCommission(depositAmount, (project.platform_commission || 15) / 100);

      // Deduct from client wallet
      await base44.asServiceRole.entities.Client.update(client.id, {
        wallet_balance: (client.wallet_balance || 0) - depositAmount
      });

      // Mark milestone as escrowed
      await base44.asServiceRole.entities.ProjectMilestone.update(milestone_id, {
        status: 'in_progress',
        escrow_status: 'held',
        escrow_amount: depositAmount,
        escrow_deposit_date: new Date().toISOString()
      });

      // Transaction
      await base44.asServiceRole.entities.Transaction.create({
        user_email: user.email,
        user_type: 'client',
        type: 'escrow_hold',
        amount: depositAmount,
        status: 'held_in_escrow',
        description: `إيداع ضمان مرحلة "${milestone.title}" — ${project.title}`,
        project_id, milestone_id,
        balance_before: client.wallet_balance || 0,
        balance_after: (client.wallet_balance || 0) - depositAmount,
        metadata: { milestone_title: milestone.title, commission, net }
      });

      // Notify engineer
      if (project.assigned_engineer_id) {
        const [eng] = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
        if (eng) {
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: eng.email,
            title: `💰 تم إيداع دفعة المرحلة: ${milestone.title}`,
            message: `أودع العميل ${depositAmount.toLocaleString('ar-SA')} ريال لمرحلة "${milestone.title}". المبلغ محجوز وسيُصرف عند موافقته على مخرجاتك.`,
            type: 'payment', related_project_id: project_id, priority: 'high'
          });
        }
      }

      return Response.json({ success: true, escrow_amount: depositAmount, commission, net_to_engineer: net });
    }

    // ══════════════════════════════════════════════════════════
    // RELEASE — تحرير المبلغ الكامل
    // ══════════════════════════════════════════════════════════
    if (action === 'release') {
      const [project] = await base44.entities.Project.filter({ id: project_id });
      if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });
      if (project.created_by !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });
      if (project.escrow_status !== 'held') return Response.json({ error: 'No escrow to release' }, { status: 400 });

      const escrowAmount = project.escrow_amount || 0;
      const { commission, net: engineerPayment } = calcCommission(escrowAmount, (project.platform_commission || 15) / 100);

      const [engineer] = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
      if (!engineer) return Response.json({ error: 'Engineer not found' }, { status: 404 });

      const prevBalance = engineer.available_balance || 0;

      // Credit engineer
      await base44.asServiceRole.entities.Engineer.update(engineer.id, {
        available_balance: prevBalance + engineerPayment,
        pending_balance: Math.max(0, (engineer.pending_balance || 0) - engineerPayment),
        completed_projects: (engineer.completed_projects || 0) + 1
      });

      // Update project
      await base44.asServiceRole.entities.Project.update(project_id, {
        escrow_status: 'released',
        status: 'completed',
        client_final_approval: true,
        client_approval_date: new Date().toISOString(),
        engineer_payment: engineerPayment,
        payment_status: 'completed'
      });

      // Engineer transaction
      await base44.asServiceRole.entities.Transaction.create({
        user_email: engineer.email, user_type: 'engineer',
        type: 'escrow_release', amount: escrowAmount,
        commission_amount: commission, net_amount: engineerPayment,
        status: 'completed',
        description: `استلام مدفوعات مشروع: ${project.title}`,
        project_id, balance_before: prevBalance, balance_after: prevBalance + engineerPayment
      });

      // Commission transaction
      await base44.asServiceRole.entities.Transaction.create({
        user_email: 'platform', user_type: 'platform',
        type: 'commission', amount: commission, status: 'completed',
        description: `عمولة منصة — ${project.title}`, project_id
      });

      // Notifications
      await Promise.all([
        base44.asServiceRole.entities.Notification.create({
          recipient_email: engineer.email,
          title: '🎉 تم تحرير مدفوعاتك!',
          message: `وافق العميل على مشروع "${project.title}". تم إضافة ${engineerPayment.toLocaleString('ar-SA')} ريال لرصيدك.`,
          type: 'payment', related_project_id: project_id, priority: 'urgent'
        }),
        base44.asServiceRole.entities.Notification.create({
          recipient_email: user.email,
          title: '✅ تم إتمام المشروع وتحرير المبلغ',
          message: `تم تحرير ${engineerPayment.toLocaleString('ar-SA')} ريال للمهندس. مشروع "${project.title}" مكتمل.`,
          type: 'payment', related_project_id: project_id, priority: 'high'
        })
      ]);

      return Response.json({ success: true, engineer_payment: engineerPayment, commission });
    }

    // ══════════════════════════════════════════════════════════
    // RELEASE MILESTONE — تحرير دفعة مرحلة
    // ══════════════════════════════════════════════════════════
    if (action === 'release_milestone') {
      const [project] = await base44.entities.Project.filter({ id: project_id });
      if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });
      if (project.created_by !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const [milestone] = await base44.entities.ProjectMilestone.filter({ id: milestone_id });
      if (!milestone) return Response.json({ error: 'Milestone not found' }, { status: 404 });
      if (milestone.escrow_status !== 'held') return Response.json({ error: 'No escrow for this milestone' }, { status: 400 });

      const escrowAmount = milestone.escrow_amount || milestone.amount || 0;
      const { commission, net: engineerPayment } = calcCommission(escrowAmount, (project.platform_commission || 15) / 100);

      const [engineer] = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
      if (!engineer) return Response.json({ error: 'Engineer not found' }, { status: 404 });

      const prevBalance = engineer.available_balance || 0;

      // Credit engineer
      await base44.asServiceRole.entities.Engineer.update(engineer.id, {
        available_balance: prevBalance + engineerPayment,
        pending_balance: Math.max(0, (engineer.pending_balance || 0) - engineerPayment)
      });

      // Mark milestone paid
      await base44.asServiceRole.entities.ProjectMilestone.update(milestone_id, {
        escrow_status: 'released',
        client_approved: true,
        client_approval_date: new Date().toISOString(),
        payment_released: true,
        payment_release_date: new Date().toISOString(),
        status: 'approved'
      });

      // Transactions
      await Promise.all([
        base44.asServiceRole.entities.Transaction.create({
          user_email: engineer.email, user_type: 'engineer',
          type: 'escrow_release', amount: escrowAmount,
          commission_amount: commission, net_amount: engineerPayment,
          status: 'completed',
          description: `دفعة مرحلة "${milestone.title}" — ${project.title}`,
          project_id, milestone_id,
          balance_before: prevBalance, balance_after: prevBalance + engineerPayment
        }),
        base44.asServiceRole.entities.Transaction.create({
          user_email: 'platform', user_type: 'platform',
          type: 'commission', amount: commission, status: 'completed',
          description: `عمولة مرحلة "${milestone.title}" — ${project.title}`,
          project_id, milestone_id
        })
      ]);

      // Notifications
      await Promise.all([
        base44.asServiceRole.entities.Notification.create({
          recipient_email: engineer.email,
          title: `💰 تم صرف دفعة: ${milestone.title}`,
          message: `وافق العميل على مرحلة "${milestone.title}". تم إضافة ${engineerPayment.toLocaleString('ar-SA')} ريال لرصيدك.`,
          type: 'payment', related_project_id: project_id, priority: 'urgent'
        }),
        base44.asServiceRole.entities.Notification.create({
          recipient_email: user.email,
          title: `✅ تم تحرير دفعة المرحلة`,
          message: `تم تحرير ${engineerPayment.toLocaleString('ar-SA')} ريال للمهندس للمرحلة "${milestone.title}".`,
          type: 'payment', related_project_id: project_id, priority: 'medium'
        })
      ]);

      return Response.json({ success: true, engineer_payment: engineerPayment, commission, milestone_id });
    }

    // ══════════════════════════════════════════════════════════
    // REFUND — استرجاع الضمان (أدمن أو نزاع)
    // ══════════════════════════════════════════════════════════
    if (action === 'refund') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

      const [project] = await base44.asServiceRole.entities.Project.filter({ id: project_id });
      if (!project || project.escrow_status !== 'held') {
        return Response.json({ error: 'No held escrow to refund' }, { status: 400 });
      }

      const escrowAmount = project.escrow_amount || 0;
      const [client] = await base44.asServiceRole.entities.Client.filter({ email: project.created_by });

      if (client) {
        await base44.asServiceRole.entities.Client.update(client.id, {
          wallet_balance: (client.wallet_balance || 0) + escrowAmount
        });
      }

      await base44.asServiceRole.entities.Project.update(project_id, {
        escrow_status: 'refunded',
        payment_status: 'unpaid'
      });

      await base44.asServiceRole.entities.Transaction.create({
        user_email: project.created_by, user_type: 'client',
        type: 'refund', amount: escrowAmount, status: 'completed',
        description: `استرجاع ضمان مشروع: ${project.title}`, project_id
      });

      return Response.json({ success: true, refunded_amount: escrowAmount });
    }

    // ══════════════════════════════════════════════════════════
    // STATUS — جلب حالة الضمان الكاملة مع المراحل
    // ══════════════════════════════════════════════════════════
    if (action === 'status') {
      const [project] = await base44.entities.Project.filter({ id: project_id });
      if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

      const commRate = (project.platform_commission || 15) / 100;
      const escrowAmount = project.escrow_amount || 0;
      const { commission, net } = calcCommission(escrowAmount, commRate);

      // Get milestones with their escrow status
      const milestones = await base44.entities.ProjectMilestone.filter({ project_id }, 'order', 50);

      // Get transactions for this project
      const transactions = await base44.asServiceRole.entities.Transaction.filter(
        { project_id }, '-created_date', 20
      );

      const milestonesSummary = milestones.map(m => ({
        id: m.id,
        title: m.title,
        amount: m.amount,
        order: m.order,
        status: m.status,
        escrow_status: m.escrow_status || 'none',
        escrow_amount: m.escrow_amount || m.amount || 0,
        client_approved: m.client_approved || false,
        payment_released: m.payment_released || false,
        due_date: m.due_date,
        submission_notes: m.submission_notes,
        ...(calcCommission(m.escrow_amount || m.amount || 0, commRate))
      }));

      const heldMilestones = milestonesSummary.filter(m => m.escrow_status === 'held');
      const releasedMilestones = milestonesSummary.filter(m => m.escrow_status === 'released');
      const totalHeld = heldMilestones.reduce((s, m) => s + m.escrow_amount, 0)
        + (project.escrow_status === 'held' ? escrowAmount : 0);
      const totalReleased = releasedMilestones.reduce((s, m) => s + m.escrow_amount, 0)
        + (project.escrow_status === 'released' ? escrowAmount : 0);

      return Response.json({
        escrow_status: project.escrow_status || 'none',
        escrow_amount: escrowAmount,
        commission_rate: project.platform_commission || 15,
        commission_amount: commission,
        engineer_will_receive: net,
        client_final_approval: project.client_final_approval || false,
        milestones: milestonesSummary,
        total_held: totalHeld,
        total_released: totalReleased,
        recent_transactions: transactions.slice(0, 5)
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Escrow error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});