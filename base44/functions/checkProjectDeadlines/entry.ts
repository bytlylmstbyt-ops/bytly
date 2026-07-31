import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

function escapeHtml(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

const ACTIVE_STATUSES = ['open', 'in_progress', 'awaiting_technical_review', 'technical_approved', 'pending_client_approval', 'disputed'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Fetch projects that haven't had their 24h reminder sent yet
    const projects = await base44.asServiceRole.entities.Project.filter({
      deadline_reminder_24h_sent: { $ne: true }
    });

    // Filter: has deadline, deadline within next 24h, active status, has assigned engineer
    const dueSoon = projects.filter(p => {
      if (!p.deadline || !p.assigned_engineer_id) return false;
      if (!ACTIVE_STATUSES.includes(p.status)) return false;
      const deadline = new Date(p.deadline);
      return deadline > now && deadline <= in24h;
    });

    let notified = 0;

    for (const project of dueSoon) {
      // Look up the assigned engineer's email
      const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
      if (!engineers.length || !engineers[0].email) continue;

      const engineer = engineers[0];
      const deadlineFormatted = new Date(project.deadline).toLocaleDateString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      const notifTitle = '⏰ تذكير: موعد تسليم المشروع خلال 24 ساعة';
      const notifBody = `اقترب موعد تسليم مشروع "${project.title}" — الموعد النهائي ${deadlineFormatted}. يرجى الالتزام بالموعد وإكمال التسليم في الوقت المحدد.`;

      // Create in-app notification
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: engineer.email,
        title: notifTitle,
        message: notifBody,
        type: 'project_update',
        related_project_id: project.id,
        action_url: `/ProjectDetails?id=${project.id}`,
        is_read: false,
        priority: 'high'
      });

      // Send email (best-effort)
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: engineer.email,
          subject: `${notifTitle} - بايتلي`,
          body: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #6B5D4F;">⏰ تذكير: موعد التسليم خلال 24 ساعة</h2>
              <p>مرحباً ${escapeHtml(engineer.full_name)}،</p>
              <p>نذكّرك بأن موعد تسليم مشروع <strong>"${escapeHtml(project.title)}"</strong> يقترب.</p>
              <div style="background:#fff3cd; border-radius:8px; padding:16px; margin:16px 0;">
                <p style="margin:0; color:#856404;">الموعد النهائي: <strong>${deadlineFormatted}</strong></p>
                <p style="margin:8px 0 0; color:#856404;">باقي أقل من 24 ساعة على الموعد النهائي</p>
              </div>
              <a href="https://app.mybytly.com/ProjectDetails?id=${project.id}"
                 style="display:inline-block; background: linear-gradient(135deg,#6B5D4F,#C9A66B); color:white; padding:12px 24px; border-radius:8px; text-decoration:none; margin-top:16px;">
                عرض المشروع
              </a>
              <hr style="margin-top:24px; border:none; border-top:1px solid #eee;">
              <p style="color:#aaa; font-size:12px;">بايتلي - منصة الهندسة والاستشارات</p>
            </div>
          `
        });
      } catch (emailErr) {
        console.error('Email send failed for', engineer.email, ':', emailErr.message);
      }

      // Mark reminder as sent
      await base44.asServiceRole.entities.Project.update(project.id, {
        deadline_reminder_24h_sent: true
      });

      notified++;
    }

    return Response.json({
      success: true,
      checked: projects.length,
      due_soon: dueSoon.length,
      notified
    });
  } catch (error) {
    console.error('checkProjectDeadlines error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});