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

    // Get proposal data from request
    const { proposalId } = await req.json();
    if (!proposalId) {
      return Response.json({ error: 'Proposal ID required' }, { status: 400 });
    }

    // Fetch proposal details
    const proposal = await base44.asServiceRole.entities.Proposal.get(proposalId);
    if (!proposal) {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Fetch project details to get client info
    const project = await base44.asServiceRole.entities.Project.get(proposal.project_id);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch engineer details
    const engineer = await base44.asServiceRole.entities.Engineer.get(proposal.engineer_id);
    if (!engineer) {
      return Response.json({ error: 'Engineer not found' }, { status: 404 });
    }

    // Resolve client contact (project.client_id stores the Client record id, not an email)
    let clientEmail = project.created_by;
    let clientPhone = null;
    try {
      if (project.client_id) {
        const client = await base44.asServiceRole.entities.Client.get(project.client_id);
        if (client) {
          clientEmail = client.email || clientEmail;
          clientPhone = client.phone || clientPhone;
        }
      }
    } catch (clientErr) {
      console.error('Failed to resolve client:', clientErr);
    }

    // Create notification for client
    const notification = await base44.asServiceRole.entities.Notification.create({
      recipient_email: clientEmail,
      title: 'عرض جديد على مشروعك',
      message: `قدم المهندس ${engineer.full_name} عرضاً جديداً على مشروع "${project.title}" بسعر ${proposal.price} ريال`,
      type: 'proposal',
      related_project_id: project.id,
      related_entity_id: proposal.id,
      action_url: `/ProjectDetails?id=${project.id}`,
      priority: 'high',
      description: `العرض المقدم: ${proposal.cover_letter?.substring(0, 200) || 'بدون رسالة'}`
    });

    // Send email notification
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: clientEmail,
        subject: 'عرض جديد على مشروعك - بتلي',
        body: `
          <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
            <h2 style="color: #6B5D4F;">عرض جديد على مشروعك</h2>
            <p>مرحباً،</p>
            <p>قدم المهندس <strong>${escapeHtml(engineer.full_name)}</strong> عرضاً جديداً على مشروعك "<strong>${escapeHtml(project.title)}</strong>".</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>تفاصيل العرض:</strong></p>
              <ul>
                <li>السعر المقترح: ${proposal.price} ريال</li>
                <li>مدة التسليم: ${proposal.delivery_days || 'غير محددة'} يوم</li>
                <li>المهندس: ${escapeHtml(engineer.full_name)}</li>
                <li>التخصص: ${escapeHtml(engineer.user_type || 'غير محدد')}</li>
              </ul>
            </div>
            ${proposal.cover_letter ? `<p style="background: #fff8e1; padding: 15px; border-radius: 8px;"><strong>رسالة المهندس:</strong><br/>${escapeHtml(proposal.cover_letter)}</p>` : ''}
            <p style="margin-top: 30px;">
              <a href="https://mybytly.com/ProjectDetails?id=${project.id}" 
                 style="background: #6B5D4F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                مراجعة العرض
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

    // Send WhatsApp notification for instant alert
    try {
      await base44.asServiceRole.functions.invoke('sendWhatsappNotification', {
        recipient_phone: clientPhone,
        message: `🏗️ عرض جديد على مشروعك!\n\nقدم المهندس ${engineer.full_name} عرضاً على مشروع "${project.title}"\n\n💰 السعر: ${proposal.price} ريال\n⏱️ المدة: ${proposal.delivery_days || '-'} يوم\n\nراجع العرض الآن: https://mybytly.com/ProjectDetails?id=${project.id}`
      });
    } catch (whatsappError) {
      console.error('Failed to send WhatsApp:', whatsappError);
    }

    return Response.json({
      success: true,
      notification_id: notification.id,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending proposal notification:', error);
    return Response.json({ 
      error: error.message,
      details: 'Failed to send proposal notification'
    }, { status: 500 });
  }
});