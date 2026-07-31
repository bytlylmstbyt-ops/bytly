import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    // Find pending approvals
    const pendingApprovals = await base44.asServiceRole.entities.WorkflowApproval.filter({
      status: 'pending'
    });

    let sentCount = 0;
    const messages = [];

    for (const approval of pendingApprovals) {
      const [project] = await base44.asServiceRole.entities.Project.filter({ 
        id: approval.project_id 
      });
      
      if (!project) continue;

      // Check if this is the first reminder (created 2+ days ago)
      const createdDate = new Date(approval.created_date);
      const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceCreated >= 2) {
        const message = `تذكير: طلب الموافقة على المرحلة "${approval.stage_id}" في مشروع "${project.title}" ينتظر موافقتك منذ ${daysSinceCreated} أيام. يرجى المراجعة والموافقة أو الرفض.`;

        // Send notification
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: approval.requested_from,
          title: 'تذكير: طلب موافقة معلق',
          message,
          type: 'approval',
          related_project_id: approval.project_id,
          priority: 'high'
        });

        // Send email
        try {
          await base44.integrations.Core.SendEmail({
            to: approval.requested_from,
            subject: `تذكير: طلب موافقة على مشروع ${project.title}`,
            body: message
          });
        } catch (emailError) {
          console.error('Email send error:', emailError);
        }

        messages.push({
          to: approval.requested_from,
          project: project.title,
          status: 'sent'
        });
        sentCount++;
      }
    }

    return Response.json({
      success: true,
      sent_count: sentCount,
      messages
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});