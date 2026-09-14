import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

function escapeHtml(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get milestone data from request
    const { milestoneId } = await req.json();
    if (!milestoneId) {
      return Response.json({ error: 'Milestone ID required' }, { status: 400 });
    }

    // Fetch milestone details
    const milestone = await base44.asServiceRole.entities.ProjectMilestone.get(milestoneId);
    if (!milestone) {
      return Response.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Fetch project details
    const project = await base44.asServiceRole.entities.Project.get(milestone.project_id);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch engineer details
    const engineer = await base44.asServiceRole.entities.Engineer.get(project.assigned_engineer_id);
    if (!engineer) {
      return Response.json({ error: 'Engineer not found' }, { status: 404 });
    }

    // Create notification for engineer
    const notification = await base44.asServiceRole.entities.Notification.create({
      recipient_email: engineer.email,
      title: 'تم اعتماد المرحلة',
      message: `تم اعتماد المرحلة "${milestone.title}" لمشروع "${project.title}" من قبل العميل`,
      type: 'milestone',
      related_project_id: project.id,
      related_entity_id: milestone.id,
      action_url: `/EngineerProjects`,
      priority: 'high',
      description: `المرحلة: ${milestone.title} - القيمة: ${milestone.amount} ريال`
    });

    // Send email notification
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: engineer.email,
        subject: 'تم اعتماد المرحلة - بتلي',
        body: `
          <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
            <h2 style="color: #6B5D4F;">تم اعتماد المرحلة</h2>
            <p>مرحباً ${escapeHtml(engineer.full_name)}،</p>
            <p>نود إعلامك بأن العميل قد اعتمد المرحلة التالية من مشروعك:</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>تفاصيل المرحلة:</strong></p>
              <ul>
                <li>اسم المرحلة: <strong>${escapeHtml(milestone.title)}</strong></li>
                <li>المشروع: ${escapeHtml(project.title)}</li>
                <li>القيمة: ${milestone.amount} ريال</li>
                <li>الحالة: <span style="color: green;">✓ معتمد</span></li>
              </ul>
            </div>
            <p style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>ملاحظة:</strong> سيتم معالجة الدفعة الخاصة بهذه المرحلة وفقاً لشروط الدفع المتفق عليها.
            </p>
            <p style="margin-top: 30px;">
              <a href="https://mybytly.com/EngineerProjects" 
                 style="background: #6B5D4F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                عرض المشاريع
              </a>
            </p>
            <p style="color: #888; font-size: 14px; margin-top: 30px;">
              شكراً لاستخدامك منصة بتلي<br/>
              <a href="https://mybytly.com" style="color: #6B5D4F;">mybytly.com</a>
            </p>
          </div>
        `
      });

      // Mark notification as email sent
      await base44.asServiceRole.entities.Notification.update(notification.id, { email_sent: true });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }

    return Response.json({
      success: true,
      notification_id: notification.id,
      message: 'Milestone approval notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending milestone notification:', error);
    return Response.json({ 
      error: error.message,
      details: 'Failed to send milestone notification'
    }, { status: 500 });
  }
});