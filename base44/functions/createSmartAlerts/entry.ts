import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const now = new Date();
    const alerts = [];

    // Check contracts nearing deadline
    const activeContracts = await base44.asServiceRole.entities.Contract.filter({
      status: 'active'
    });

    for (const contract of activeContracts) {
      const deliveryDate = new Date(contract.delivery_date);
      const daysUntil = Math.floor((deliveryDate - now) / (1000 * 60 * 60 * 24));

      // Alert 3 days before deadline
      if (daysUntil === 3) {
        const [project] = await base44.asServiceRole.entities.Project.filter({
          id: contract.project_id
        });
        const [engineer] = await base44.asServiceRole.entities.Engineer.filter({
          id: contract.engineer_id
        });
        const [client] = await base44.asServiceRole.entities.Client.filter({
          id: contract.client_id
        });

        // Alert engineer
        alerts.push({
          user_email: engineer.email,
          alert_type: 'deadline_reminder',
          title: 'تذكير: موعد تسليم قريب',
          message: `يتبقى 3 أيام على موعد تسليم المشروع "${project.title}". يرجى التأكد من إنجاز العمل في الوقت المحدد.`,
          scheduled_date: now.toISOString(),
          related_entity_type: 'project',
          related_entity_id: project.id,
          priority: 'high'
        });

        // Alert client
        alerts.push({
          user_email: client.email,
          alert_type: 'deadline_reminder',
          title: 'تذكير: موعد تسليم قريب',
          message: `يتبقى 3 أيام على موعد تسليم المشروع "${project.title}".`,
          scheduled_date: now.toISOString(),
          related_entity_type: 'project',
          related_entity_id: project.id,
          priority: 'medium'
        });
      }

      // Alert on deadline day
      if (daysUntil === 0) {
        const [project] = await base44.asServiceRole.entities.Project.filter({
          id: contract.project_id
        });
        const [engineer] = await base44.asServiceRole.entities.Engineer.filter({
          id: contract.engineer_id
        });

        alerts.push({
          user_email: engineer.email,
          alert_type: 'deadline_reminder',
          title: 'تنبيه: اليوم آخر موعد للتسليم',
          message: `اليوم هو الموعد النهائي لتسليم المشروع "${project.title}".`,
          scheduled_date: now.toISOString(),
          related_entity_type: 'project',
          related_entity_id: project.id,
          priority: 'urgent'
        });
      }
    }

    // Check pending milestones
    const pendingMilestones = await base44.asServiceRole.entities.ProjectMilestone.filter({
      status: 'in_progress'
    });

    for (const milestone of pendingMilestones) {
      if (!milestone.due_date) continue;

      const dueDate = new Date(milestone.due_date);
      const daysUntil = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));

      if (daysUntil === 2) {
        const [project] = await base44.asServiceRole.entities.Project.filter({
          id: milestone.project_id
        });
        const [engineer] = await base44.asServiceRole.entities.Engineer.filter({
          id: project.assigned_engineer_id
        });

        alerts.push({
          user_email: engineer.email,
          alert_type: 'milestone_due',
          title: 'تذكير: مرحلة مشروع قريبة',
          message: `يتبقى يومان على موعد تسليم المرحلة "${milestone.title}" من المشروع "${project.title}".`,
          scheduled_date: now.toISOString(),
          related_entity_type: 'milestone',
          related_entity_id: milestone.id,
          priority: 'high'
        });
      }
    }

    // Check pending withdrawal requests needing consultant approval
    const pendingWithdrawals = await base44.asServiceRole.entities.WithdrawalRequest.filter({
      status: 'pending',
      consultant_approval: false
    });

    for (const withdrawal of pendingWithdrawals) {
      const createdDate = new Date(withdrawal.created_date);
      const daysPending = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

      if (daysPending >= 2) {
        const [engineer] = await base44.asServiceRole.entities.Engineer.filter({
          id: withdrawal.engineer_id
        });

        alerts.push({
          user_email: engineer.email,
          alert_type: 'review_pending',
          title: 'طلب السحب قيد المراجعة',
          message: `طلب السحب الخاص بك بقيمة ${withdrawal.amount} ريال قيد المراجعة من قبل المستشار الفني.`,
          scheduled_date: now.toISOString(),
          related_entity_type: 'withdrawal',
          related_entity_id: withdrawal.id,
          priority: 'medium'
        });
      }
    }

    // Create all alerts
    for (const alertData of alerts) {
      try {
        // Check if similar alert already exists (avoid duplicates)
        const existing = await base44.asServiceRole.entities.ScheduledAlert.filter({
          user_email: alertData.user_email,
          alert_type: alertData.alert_type,
          related_entity_id: alertData.related_entity_id,
          is_sent: false
        });

        if (existing.length === 0) {
          await base44.asServiceRole.entities.ScheduledAlert.create(alertData);
        }
      } catch (error) {
        console.error('Error creating alert:', error);
      }
    }

    return Response.json({
      success: true,
      alerts_created: alerts.length
    });

  } catch (error) {
    console.error("Error in createSmartAlerts:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});