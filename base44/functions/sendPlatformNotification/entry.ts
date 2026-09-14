import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

function escapeHtml(s: string): string {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      recipientEmail,
      title,
      message,
      type = 'system',
      projectId = null,
      entityId = null,
      actionUrl = null,
      priority = 'medium',
      sendEmail = true,
      fromName = 'منصة بيتلي',
      emailBody = null, // optional pre-built HTML; if omitted a template is generated
    } = await req.json();

    if (!recipientEmail || !title || !message) {
      return Response.json({ error: 'recipientEmail, title, and message are required' }, { status: 400 });
    }

    // 1) Create the in-app notification record
    try {
      await base44.entities.Notification.create({
        recipient_email: recipientEmail,
        title,
        message,
        type,
        related_project_id: projectId,
        related_entity_id: entityId,
        action_url: actionUrl,
        priority,
      });
    } catch (notifErr) {
      console.error('Notification create failed (non-blocking):', notifErr);
    }

    // 2) Send the email via the platform Core integration (service-role)
    if (sendEmail) {
      try {
        const html = emailBody || buildDefaultEmailHtml(title, message, projectId, actionUrl);
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: recipientEmail,
          subject: title,
          body: html,
          from_name: fromName,
        });
      } catch (emailErr) {
        console.error('Email send failed (non-blocking):', emailErr);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendPlatformNotification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildDefaultEmailHtml(title: string, message: string, projectId: string | null, actionUrl: string | null): string {
  const appUrl = actionUrl ? `https://mybytly.base44.app${actionUrl}` : 'https://mybytly.base44.app';
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);

  return `
    <div dir="rtl" style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#4A3F35 0%,#C9A66B 100%);padding:28px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">بيتلي</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">منصة الهندسة والتصميم المتكاملة</p>
      </div>
      <div style="padding:28px;background:#F5F0E8;">
        <h2 style="color:#4A3F35;margin-top:0;font-size:18px;border-right:4px solid #C9A66B;padding-right:14px;">${safeTitle}</h2>
        <p style="color:#333;line-height:1.8;font-size:15px;">${safeMessage}</p>
        ${projectId ? `<div style="margin:16px 0;padding:12px;background:#fff;border-radius:8px;border:1px solid #E5D4B8;">
          <p style="color:#6B5D4F;margin:0;font-size:13px;">رقم المشروع: <strong style="color:#4A3F35;">${escapeHtml(projectId.slice(0, 8))}</strong></p>
        </div>` : ''}
        <div style="text-align:center;margin-top:24px;">
          <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#6B5D4F 0%,#C9A66B 100%);color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
            الانتقال للمنصة
          </a>
        </div>
      </div>
      <div style="padding:16px;background:#4A3F35;text-align:center;">
        <p style="color:rgba(255,255,255,0.6);margin:0;font-size:11px;">© ${new Date().getFullYear()} بيتلي — جميع الحقوق محفوظة</p>
      </div>
    </div>
  `;
}