import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This function should be called by a scheduled automation
    // Check if user is admin (for manual calls)
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all active projects
    const projects = await base44.asServiceRole.entities.Project.list();
    const activeProjects = projects.filter(p => 
      ['in_progress', 'awaiting_technical_review', 'technical_approved', 'pending_client_approval'].includes(p.status)
    );

    const overdueProjects = [];
    const notifications = [];

    for (const project of activeProjects) {
      if (project.deadline) {
        const deadline = new Date(project.deadline);
        deadline.setHours(0, 0, 0, 0);

        if (deadline < today) {
          overdueProjects.push(project);

          // Get engineer
          const engineers = await base44.asServiceRole.entities.Engineer.filter({ 
            id: project.assigned_engineer_id 
          });
          
          if (engineers.length > 0) {
            const engineer = engineers[0];

            // Send notification to engineer
            await base44.asServiceRole.entities.Notification.create({
              recipient_email: engineer.email,
              title: "تنبيه: مشروع متأخر",
              message: `مشروع "${project.title}" تجاوز موعد التسليم المحدد. الرجاء إتمام العمل في أقرب وقت.`,
              type: "project_update",
              related_project_id: project.id,
              priority: "urgent"
            });

            notifications.push({
              project: project.title,
              engineer: engineer.full_name,
              deadline: project.deadline
            });
          }

          // Get client
          const clients = await base44.asServiceRole.entities.Client.filter({ 
            id: project.client_id 
          });
          
          if (clients.length > 0) {
            const client = clients[0];

            // Send notification to client
            await base44.asServiceRole.entities.Notification.create({
              recipient_email: client.email,
              title: "تنبيه: مشروع متأخر",
              message: `مشروعك "${project.title}" تجاوز موعد التسليم. سنتواصل مع المهندس لتسريع العمل.`,
              type: "project_update",
              related_project_id: project.id,
              priority: "high"
            });
          }

          // Notify admin
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: "info@mybytly.com",
            title: "مشروع متأخر - يحتاج متابعة",
            message: `المشروع "${project.title}" متأخر عن الموعد المحدد ${project.deadline}`,
            type: "system",
            related_project_id: project.id,
            priority: "urgent"
          });
        }
      }
    }

    return Response.json({
      success: true,
      totalProjects: activeProjects.length,
      overdueProjects: overdueProjects.length,
      notifications: notifications
    });

  } catch (error) {
    console.error('Error checking overdue projects:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});