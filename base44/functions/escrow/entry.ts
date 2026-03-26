import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { action, project_id, proposal_id, amount } = body;

        // ─── DEPOSIT TO ESCROW ─────────────────────────────────────
        // Called when client accepts a proposal and pays
        if (action === 'deposit') {
            const projects = await base44.entities.Project.filter({ id: project_id });
            const project = projects[0];
            if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

            // Only project owner (client) can deposit
            if (project.created_by !== user.email) {
                return Response.json({ error: 'Forbidden' }, { status: 403 });
            }

            // Get client record
            const clients = await base44.entities.Client.filter({ email: user.email });
            const client = clients[0];
            if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

            const escrowAmount = amount || project.escrow_amount;

            // Check client wallet balance
            if ((client.wallet_balance || 0) < escrowAmount) {
                return Response.json({ 
                    error: 'insufficient_balance', 
                    required: escrowAmount, 
                    available: client.wallet_balance || 0 
                }, { status: 400 });
            }

            // Deduct from client wallet
            await base44.asServiceRole.entities.Client.update(client.id, {
                wallet_balance: (client.wallet_balance || 0) - escrowAmount
            });

            // Update project escrow status
            await base44.asServiceRole.entities.Project.update(project_id, {
                escrow_amount: escrowAmount,
                escrow_status: 'held',
                status: 'in_progress'
            });

            // Accept the proposal
            if (proposal_id) {
                await base44.asServiceRole.entities.Proposal.update(proposal_id, { status: 'accepted' });
            }

            // Create transaction record
            await base44.asServiceRole.entities.Transaction.create({
                user_email: user.email,
                user_type: 'client',
                type: 'escrow_hold',
                amount: escrowAmount,
                status: 'completed',
                description: `إيداع ضمان للمشروع: ${project.title}`,
                project_id: project_id,
                balance_before: client.wallet_balance || 0,
                balance_after: (client.wallet_balance || 0) - escrowAmount
            });

            // Notify engineer
            if (project.assigned_engineer_id) {
                const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
                const engineer = engineers[0];
                if (engineer) {
                    await base44.asServiceRole.entities.Notification.create({
                        recipient_email: engineer.email,
                        title: '💰 تم إيداع مبلغ الضمان',
                        message: `قام العميل بإيداع مبلغ ${escrowAmount.toLocaleString('ar-SA')} ريال ضماناً للمشروع "${project.title}". يمكنك البدء في العمل الآن!`,
                        type: 'payment',
                        related_project_id: project_id,
                        priority: 'high'
                    });
                }
            }

            console.log(`Escrow deposited: ${escrowAmount} SAR for project ${project_id}`);
            return Response.json({ success: true, escrow_amount: escrowAmount });
        }

        // ─── RELEASE ESCROW (Client approves delivery) ────────────
        if (action === 'release') {
            const projects = await base44.entities.Project.filter({ id: project_id });
            const project = projects[0];
            if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

            // Only client can release
            if (project.created_by !== user.email) {
                return Response.json({ error: 'Forbidden' }, { status: 403 });
            }

            if (project.escrow_status !== 'held') {
                return Response.json({ error: 'No escrow funds to release' }, { status: 400 });
            }

            const escrowAmount = project.escrow_amount || 0;
            const commissionRate = (project.platform_commission || 15) / 100;
            const commissionAmount = Math.round(escrowAmount * commissionRate);
            const engineerPayment = escrowAmount - commissionAmount;

            // Get engineer
            const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
            const engineer = engineers[0];
            if (!engineer) return Response.json({ error: 'Engineer not found' }, { status: 404 });

            // Credit engineer's pending balance → available
            await base44.asServiceRole.entities.Engineer.update(engineer.id, {
                available_balance: (engineer.available_balance || 0) + engineerPayment,
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

            // Create transaction for engineer
            await base44.asServiceRole.entities.Transaction.create({
                user_email: engineer.email,
                user_type: 'engineer',
                type: 'escrow_release',
                amount: engineerPayment,
                commission_amount: commissionAmount,
                net_amount: engineerPayment,
                status: 'completed',
                description: `استلام مدفوعات المشروع: ${project.title}`,
                project_id: project_id,
                balance_before: engineer.available_balance || 0,
                balance_after: (engineer.available_balance || 0) + engineerPayment
            });

            // Create commission transaction for platform
            await base44.asServiceRole.entities.Transaction.create({
                user_email: 'platform',
                user_type: 'platform',
                type: 'commission',
                amount: commissionAmount,
                status: 'completed',
                description: `عمولة المنصة - مشروع: ${project.title}`,
                project_id: project_id
            });

            // Notify engineer
            await base44.asServiceRole.entities.Notification.create({
                recipient_email: engineer.email,
                title: '🎉 تم تحرير مدفوعاتك!',
                message: `وافق العميل على استلام المشروع "${project.title}". تم إضافة ${engineerPayment.toLocaleString('ar-SA')} ريال لرصيدك المتاح.`,
                type: 'payment',
                related_project_id: project_id,
                priority: 'high'
            });

            console.log(`Escrow released: ${engineerPayment} SAR to engineer ${engineer.email}`);
            return Response.json({ success: true, engineer_payment: engineerPayment, commission: commissionAmount });
        }

        // ─── GET ESCROW STATUS ─────────────────────────────────────
        if (action === 'status') {
            const projects = await base44.entities.Project.filter({ id: project_id });
            const project = projects[0];
            if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

            const commissionRate = (project.platform_commission || 15) / 100;
            const escrowAmount = project.escrow_amount || 0;
            const engineerWillReceive = Math.round(escrowAmount * (1 - commissionRate));

            return Response.json({
                escrow_status: project.escrow_status || 'none',
                escrow_amount: escrowAmount,
                engineer_will_receive: engineerWillReceive,
                commission_amount: escrowAmount - engineerWillReceive,
                commission_rate: project.platform_commission || 15,
                client_final_approval: project.client_final_approval || false
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Escrow function error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});