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

// ── Gmail helpers (send via authorized shared connector) ──────────────────
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function encodeEmailRaw(to, subject, body) {
  const bodyB64 = utf8ToBase64(body);
  const rawEmail = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${utf8ToBase64(subject)}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    bodyB64,
  ].join('\r\n');
  return utf8ToBase64(rawEmail).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendGmail(base44, to, subject, body) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
  const raw = encodeEmailRaw(to, subject, body);
  const res = await fetch(`${GMAIL_API}/messages/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail API error: ${res.status} - ${err}`);
  }
  return res.json();
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

      // ── Auto-generate project completion invoice ──────────────────────
      // Checks for existing invoice to avoid duplicates
      const existingInvoice = await base44.asServiceRole.entities.Invoice.filter({
        project_id: project.id,
        invoice_type: 'project_milestone'
      });

      let invoice = null;
      if (existingInvoice.length === 0) {
        const commissionRate = project.platform_commission || 15;
        const taxRate = 0.15;
        const taxAmount = Math.round(escrowAmount * taxRate * 100) / 100;
        const totalAmount = Math.round((escrowAmount + taxAmount) * 100) / 100;

        const issueDate = new Date().toISOString().split('T')[0];
        const dueDateObj = new Date();
        dueDateObj.setDate(dueDateObj.getDate() + 7);
        const dueDate = dueDateObj.toISOString().split('T')[0];

        const invoiceNumber = `INV-PRJ-${Date.now().toString().slice(-8)}`;

        invoice = await base44.asServiceRole.entities.Invoice.create({
          invoice_number: invoiceNumber,
          client_id: project.client_id,
          client_email: user.email,
          project_id: project.id,
          invoice_type: 'project_milestone',
          amount: escrowAmount,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          paid_amount: totalAmount,
          status: 'paid',
          issue_date: issueDate,
          due_date: dueDate,
          payment_date: new Date().toISOString(),
          payment_method: 'stripe',
          payment_terms: 0,
          notes: `فاتورة إتمام مشروع: "${project.title}". المبلغ الإجمالي: ${escrowAmount.toLocaleString('ar-SA')} ريال. عمولة المنصة (${commissionRate}%): ${commission.toLocaleString('ar-SA')} ريال. صافي المبلغ للمهندس: ${engineerPayment.toLocaleString('ar-SA')} ريال. ضريبة القيمة المضافة (15%): ${taxAmount.toLocaleString('ar-SA')} ريال. الإجمالي شامل الضريبة: ${totalAmount.toLocaleString('ar-SA')} ريال.`
        });

        // PlatformRevenue record for the commission
        await base44.asServiceRole.entities.PlatformRevenue.create({
          transaction_id: invoice.id,
          source_type: 'project_milestone',
          project_id: project.id,
          total_amount: escrowAmount,
          commission_rate: commissionRate,
          commission_amount: commission,
          seller_email: engineer.email,
          seller_earnings: engineerPayment,
          status: 'collected',
          payment_date: new Date().toISOString(),
          stripe_payment_intent: project.escrow_status,
          description: `عمولة منصة (${commissionRate}%) من مشروع مكتمل: "${project.title}". المبلغ الإجمالي: ${escrowAmount} ريال، صافي المهندس: ${engineerPayment} ريال.`
        });
      }

      // Notifications
      await Promise.all([
        base44.asServiceRole.entities.Notification.create({
          recipient_email: engineer.email,
          title: '🎉 تم تحرير مدفوعاتك!',
          message: `وافق العميل على مشروع "${project.title}". تم إضافة ${engineerPayment.toLocaleString('ar-SA')} ريال لرصيدك.${invoice ? ` رقم الفاتورة: ${invoice.invoice_number}` : ''}`,
          type: 'payment', related_project_id: project_id, priority: 'urgent'
        }),
        base44.asServiceRole.entities.Notification.create({
          recipient_email: user.email,
          title: '✅ تم إتمام المشروع وتحرير المبلغ',
          message: `تم تحرير ${engineerPayment.toLocaleString('ar-SA')} ريال للمهندس. مشروع "${project.title}" مكتمل.${invoice ? ` تم إصدار الفاتورة ${invoice.invoice_number} تلقائياً.` : ''}`,
          type: 'payment', related_project_id: project_id, priority: 'high'
        }),
        ...(invoice ? [base44.asServiceRole.entities.Notification.create({
          recipient_email: engineer.email,
          title: '📄 فاتورة إتمام المشروع',
          message: `تم إصدار فاتورة ${invoice.invoice_number} للمشروع "${project.title}". المبلغ الإجمالي: ${escrowAmount.toLocaleString('ar-SA')} ريال، عمولة المنصة: ${commission.toLocaleString('ar-SA')} ريال، صافي أرباحك: ${engineerPayment.toLocaleString('ar-SA')} ريال.`,
          type: 'payment', related_project_id: project_id, related_entity_id: invoice.id,
          action_url: '/MyContracts', priority: 'medium'
        })] : [])
      ]);

      // Send invoice email to both parties
      if (invoice) {
        try {
          const emailBody = `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
              <div style="background:linear-gradient(135deg,#6B5D4F,#C9A66B); padding:24px; border-radius:12px 12px 0 0; text-align:center;">
                <h1 style="color:white; margin:0; font-size:22px;">Bytly بيتلي</h1>
                <p style="color:rgba(255,255,255,0.8); margin:8px 0 0;">فاتورة إتمام مشروع</p>
              </div>
              <div style="background:#f8f9fa; padding:24px; border-radius:0 0 12px 12px;">
                <h2 style="color:#4A3F35;">${invoice.invoice_number}</h2>
                <div style="background:white; border-right:4px solid #C9A66B; padding:16px; border-radius:8px; margin:16px 0;">
                  <p><strong>المشروع:</strong> ${project.title}</p>
                  <p><strong>تاريخ الإصدار:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
                  <hr style="border:none; border-top:1px solid #e2e8f0; margin:12px 0;">
                  <p><strong>المبلغ الإجمالي للمشروع:</strong> ${escrowAmount.toLocaleString('ar-SA')} ريال</p>
                  <p><strong>عمولة المنصة (${project.platform_commission || 15}%):</strong> <span style="color:#ef4444;">- ${commission.toLocaleString('ar-SA')} ريال</span></p>
                  <p><strong>صافي أرباح المهندس:</strong> <span style="color:#22c55e;">${engineerPayment.toLocaleString('ar-SA')} ريال</span></p>
                  <hr style="border:none; border-top:1px solid #e2e8f0; margin:12px 0;">
                  <p><strong>ضريبة القيمة المضافة (15%):</strong> ${Math.round(escrowAmount * 0.15 * 100) / 100} ريال</p>
                  <p style="font-size:16px;"><strong>الإجمالي شامل الضريبة:</strong> ${Math.round((escrowAmount + escrowAmount * 0.15) * 100) / 100} ريال</p>
                </div>
                <p style="color:#718096; font-size:14px;">تم سداد هذه الفاتورة بالكامل وتحرير المبلغ للمهندس.</p>
              </div>
              <p style="color:#999; font-size:12px; text-align:center; margin-top:16px;">منصة بيتلي - لمسة بيت</p>
            </div>
          `;
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: engineer.email,
            subject: `📄 فاتورة إتمام مشروع - ${invoice.invoice_number}`,
            body: emailBody
          });
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: `📄 فاتورة إتمام مشروع - ${invoice.invoice_number}`,
            body: emailBody
          });

          // ── Send invoice copy to admin's personal email via Gmail ──
          try {
            const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
            if (admins.length > 0) {
              await sendGmail(
                base44,
                admins[0].email,
                `📄 نسخة فاتورة ضريبية - ${invoice.invoice_number}`,
                emailBody
              );
            }
          } catch (gmailErr) {
            console.error('Failed to send invoice via Gmail to admin:', gmailErr);
          }
        } catch (emailErr) {
          console.error('Failed to send invoice email:', emailErr);
        }
      }

      return Response.json({ success: true, engineer_payment: engineerPayment, commission, invoice_id: invoice?.id, invoice_number: invoice?.invoice_number });
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