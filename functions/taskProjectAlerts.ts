import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const alerts = [];

    // Load all data in parallel
    const [projects, tasks, milestones] = await Promise.all([
      base44.asServiceRole.entities.TaskProject.list('-created_date', 200),
      base44.asServiceRole.entities.Task.list('-created_date', 500),
      base44.asServiceRole.entities.ProjectMilestone2.list('-created_date', 200),
    ]);

    // Build lookup maps
    const taskMap = Object.fromEntries(tasks.map(t => [t.id, t]));
    const milestonesByProject = {};
    for (const ms of milestones) {
      if (!milestonesByProject[ms.project_id]) milestonesByProject[ms.project_id] = [];
      milestonesByProject[ms.project_id].push(ms);
    }

    for (const project of projects) {
      if (project.status === 'archived' || project.status === 'completed') continue;
      const projectTasks = tasks.filter(t => t.project_id === project.id);
      const projectMilestones = milestonesByProject[project.id] || [];
      const ownerEmail = project.owner_email || project.created_by;
      if (!ownerEmail) continue;

      // ── 1. Upcoming milestone deadline ─────────────────────────────────────
      for (const ms of projectMilestones) {
        if (ms.status === 'completed') continue;
        if (!ms.due_date) continue;
        const dueDate = new Date(ms.due_date);
        const daysUntil = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));

        if (daysUntil >= 0 && daysUntil <= 3) {
          const urgency = daysUntil === 0 ? 'urgent' : daysUntil <= 1 ? 'high' : 'medium';
          const dayLabel = daysUntil === 0 ? 'اليوم' : daysUntil === 1 ? 'غداً' : `خلال ${daysUntil} أيام`;
          alerts.push({
            ownerEmail,
            type: 'milestone_due',
            projectId: project.id,
            entityId: ms.id,
            priority: urgency,
            title: `⏰ معلم رئيسي يستحق ${dayLabel}`,
            message: `المعلم "${ms.title}" في مشروع "${project.name}" يستحق ${dayLabel}. تأكد من اكتمال المهام المرتبطة.`,
          });
        }

        // Overdue milestone
        if (daysUntil < 0 && ms.status !== 'completed') {
          alerts.push({
            ownerEmail,
            type: 'milestone_overdue',
            projectId: project.id,
            entityId: ms.id,
            priority: 'urgent',
            title: `🚨 معلم رئيسي متأخر`,
            message: `المعلم "${ms.title}" في مشروع "${project.name}" تأخر ${Math.abs(daysUntil)} يوم. يرجى مراجعة المهام المرتبطة فوراً.`,
          });
        }
      }

      // ── 2. Overdue tasks affecting milestones or critical path ──────────────
      const overdueTasks = projectTasks.filter(t =>
        t.status !== 'completed' &&
        t.due_date &&
        new Date(t.due_date) < now
      );

      for (const task of overdueTasks) {
        // Check if task is linked to a milestone
        if (task.milestone_id) {
          const relatedMs = milestones.find(m => m.id === task.milestone_id);
          if (relatedMs && relatedMs.status !== 'completed') {
            alerts.push({
              ownerEmail,
              type: 'task_blocking_milestone',
              projectId: project.id,
              entityId: task.id,
              priority: 'high',
              title: `⚠️ مهمة متأخرة تؤثر على معلم رئيسي`,
              message: `المهمة "${task.title}" متأخرة وترتبط بالمعلم "${relatedMs.title}" في مشروع "${project.name}". هذا قد يؤخر الجدول الزمني.`,
            });
          }
        }

        // Check if other tasks depend on this overdue task (critical path impact)
        const blockedTasks = projectTasks.filter(t =>
          t.status !== 'completed' &&
          Array.isArray(t.dependencies) &&
          t.dependencies.includes(task.id)
        );
        if (blockedTasks.length > 0) {
          alerts.push({
            ownerEmail,
            type: 'critical_path_blocked',
            projectId: project.id,
            entityId: task.id,
            priority: 'urgent',
            title: `🔴 انقطاع في المسار الحرج`,
            message: `المهمة "${task.title}" متأخرة وتحجب ${blockedTasks.length} مهمة أخرى في مشروع "${project.name}": ${blockedTasks.map(t => `"${t.title}"`).join('، ')}.`,
          });
        }
      }

      // ── 3. Budget overrun ──────────────────────────────────────────────────
      if (project.budget_total && project.budget_total > 0) {
        const spent = project.budget_spent || 0;
        const pct = Math.round((spent / project.budget_total) * 100);

        // Also sum task costs
        const taskCostTotal = projectTasks.reduce((sum, t) => sum + (t.cost || 0), 0);
        const effectiveSpent = Math.max(spent, taskCostTotal);
        const effectivePct = Math.round((effectiveSpent / project.budget_total) * 100);

        if (effectivePct >= 100) {
          alerts.push({
            ownerEmail,
            type: 'budget_exceeded',
            projectId: project.id,
            entityId: project.id,
            priority: 'urgent',
            title: `🚨 تجاوز الميزانية بالكامل`,
            message: `مشروع "${project.name}" تجاوز ميزانيته بنسبة ${effectivePct - 100}%. المصروف: ${effectiveSpent.toLocaleString()} من أصل ${project.budget_total.toLocaleString()} ر.س.`,
          });
        } else if (effectivePct >= 90) {
          alerts.push({
            ownerEmail,
            type: 'budget_critical',
            projectId: project.id,
            entityId: project.id,
            priority: 'high',
            title: `⚠️ الميزانية على وشك النفاد`,
            message: `مشروع "${project.name}" استنفد ${effectivePct}% من الميزانية. المتبقي فقط ${(project.budget_total - effectiveSpent).toLocaleString()} ر.س.`,
          });
        } else if (effectivePct >= 75) {
          alerts.push({
            ownerEmail,
            type: 'budget_warning',
            projectId: project.id,
            entityId: project.id,
            priority: 'medium',
            title: `💰 تحذير: استهلاك الميزانية ${effectivePct}%`,
            message: `مشروع "${project.name}" استهلك ${effectivePct}% من الميزانية. يُنصح بمراجعة التكاليف المتبقية.`,
          });
        }
      }

      // ── 4. Incomplete dependencies for upcoming tasks ──────────────────────
      const upcomingTasks = projectTasks.filter(t => {
        if (t.status === 'completed') return false;
        if (!t.due_date) return false;
        const daysUntil = Math.floor((new Date(t.due_date) - now) / (1000 * 60 * 60 * 24));
        return daysUntil >= 0 && daysUntil <= 5; // due within 5 days
      });

      for (const task of upcomingTasks) {
        if (!Array.isArray(task.dependencies) || task.dependencies.length === 0) continue;
        const incompleteDeps = task.dependencies
          .map(depId => taskMap[depId])
          .filter(dep => dep && dep.status !== 'completed');

        if (incompleteDeps.length > 0) {
          const daysUntil = Math.floor((new Date(task.due_date) - now) / (1000 * 60 * 60 * 24));
          alerts.push({
            ownerEmail,
            type: 'incomplete_dependencies',
            projectId: project.id,
            entityId: task.id,
            priority: daysUntil <= 1 ? 'urgent' : 'high',
            title: `🔗 تبعيات غير مكتملة لمهمة قادمة`,
            message: `المهمة "${task.title}" في مشروع "${project.name}" تستحق خلال ${daysUntil === 0 ? 'اليوم' : `${daysUntil} أيام`} ولكن ${incompleteDeps.length} تبعية غير مكتملة: ${incompleteDeps.map(d => `"${d.title}"`).join('، ')}.`,
          });
        }
      }
    }

    // Deduplicate & persist alerts
    let created = 0;
    const dedupeWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24h window

    for (const alert of alerts) {
      try {
        // Check if same alert was already sent in last 24h
        const existing = await base44.asServiceRole.entities.Notification.filter({
          recipient_email: alert.ownerEmail,
          related_project_id: alert.projectId,
          type: 'project_update',
        });

        const recentDuplicate = existing.find(n =>
          n.title === alert.title &&
          new Date(n.created_date) > dedupeWindow
        );

        if (!recentDuplicate) {
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: alert.ownerEmail,
            title: alert.title,
            message: alert.message,
            type: 'project_update',
            related_project_id: alert.projectId,
            priority: alert.priority,
            is_read: false,
            email_sent: true,
          });

          // Send rich email notification if there's a task entity involved
          if (alert.entityId && (alert.type === 'task_blocking_milestone' || alert.type === 'critical_path_blocked' || alert.type === 'incomplete_dependencies')) {
            try {
              await base44.asServiceRole.functions.invoke('sendTaskNotificationEmail', {
                taskId: alert.entityId,
                recipientEmail: alert.ownerEmail,
                alertType: alert.type === 'critical_path_blocked' ? 'overdue' : 'soon',
                appUrl: 'https://app.base44.com',
              });
            } catch (emailErr) {
              console.error(`Failed to send task email for ${alert.ownerEmail}:`, emailErr.message);
            }
          }

          created++;
        }
      } catch (err) {
        console.error(`Failed to create alert for ${alert.ownerEmail}:`, err.message);
      }
    }

    console.log(`Task project alerts: ${alerts.length} generated, ${created} created (deduped)`);
    return Response.json({ success: true, alerts_generated: alerts.length, alerts_created: created });

  } catch (error) {
    console.error("taskProjectAlerts error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});