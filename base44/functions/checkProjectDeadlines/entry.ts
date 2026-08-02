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
      const deadlineFormatted = new Date(project.deadline).toLocaleDateString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      const actionUrl = `/ProjectDetails?id=${project.id}`;
      const recipients = [];

      // Engineer
      if (project.assigned_engineer_id) {
        const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
        if (engineers.length && engineers[0].email) {
          recipients.push({ email: engineers[0].email, name: engineers[0].full_name, role: 'engineer' });
        }
      }

      // Project owner (client)
      if (project.client_id) {
        const clients = await base44.asServiceRole.entities.Client.filter({ id: project.client_id });
        if (clients.length && clients[0].email) {
          recipients.push({ email: clients[0].email, name: clients[0].full_name, role: 'client' });
        }
      }

      if (!recipients.length) continue;

      for (const recipient of recipients) {
        const isEngineer = recipient.role === 'engineer';
        const notifTitle = '⏰ تذكير: موعد تسليم المشروع خلال 24 ساعة';
        const notifBody = isEngineer
          ? `اقترب موعد تسليم مشروع "${project.title}" — الموعد النهائي ${deadlineFormatted}. يرجى الالتزام بالموعد وإكمال التسليم في الوقت المحدد.`
          : `اقترب موعد تسليم مشروعك "${project.title}" — الموعد النهائي ${deadlineFormatted}. سنعمل مع المهندس المسؤول على إتمام التسليم في الوقت المحدد.`;

        // In-app notification
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: recipient.email,
          title: notifTitle,
          message: notifBody,
          type: 'project_update',
          related_project_id: project.id,
          action_url: actionUrl,
          is_read: false,
          priority: 'high'
        });

        // Email (best-effort)
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: recipient.email,
            subject: `${notifTitle} - بايتلي`,
            body: `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #6B5D4F;">⏰ تذكير: موعد التسليم خلال 24 ساعة</h2>
                <p>مرحباً ${escapeHtml(recipient.name || '')}،</p>
                <p>نذكّرك بأن موعد تسليم مشروع <strong>"${escapeHtml(project.title)}"</strong> يقترب.</p>
                <div style="background:#fff3cd; border-radius:8px; padding:16px; margin:16px 0;">
                  <p style="margin:0; color:#856404;">الموعد النهائي: <strong>${deadlineFormatted}</strong></p>
                  <p style="margin:8px 0 0; color:#856404;">باقي أقل من 24 ساعة على الموعد النهائي</p>
                </div>
                ${isEngineer ? '<p style="color:#856404;">يرجى إكمال التسليم في الوقت المحدد وفقًا للاتفاقية.</p>' : '<p style="color:#856404;">سنعمل مع المهندس المسؤول على إتمام التسليم في الوقت المحدد.</p>'}
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
          console.error('Email send failed for', recipient.email, ':', emailErr.message);
        }
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