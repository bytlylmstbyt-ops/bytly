import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const dispute_id = payload.data?.id || payload.dispute_id;
    const old_data = payload.old_data;
    const new_data = payload.data;
    
    if (!dispute_id || !new_data) {
      return Response.json({ error: 'dispute_id and data are required' }, { status: 400 });
    }

    // Check if status changed or new message added
    const statusChanged = old_data?.status !== new_data.status;
    const messagesAdded = (new_data.messages?.length || 0) > (old_data?.messages?.length || 0);
    
    if (!statusChanged && !messagesAdded) {
      return Response.json({ 
        message: 'No relevant changes, skipping notification',
        skipped: true 
      });
    }

    // Get full dispute details
    const disputes = await base44.asServiceRole.entities.Dispute.filter({ id: dispute_id });
    const dispute = disputes[0];

    if (!dispute) {
      return Response.json({ error: 'Dispute not found' }, { status: 404 });
    }

    // Determine recipients
    const recipients = [dispute.raised_by, dispute.raised_against];
    
    for (const recipient of recipients) {
      // Check notification preferences
      const settings = await base44.asServiceRole.entities.NotificationSettings.filter({
        user_email: recipient
      });
      
      const prefs = settings[0]?.notification_preferences || {};
      const inAppEnabled = settings[0]?.in_app_notifications !== false;
      const emailEnabled = settings[0]?.email_notifications !== false;
      
      // Skip if user disabled dispute notifications
      if (!prefs.dispute_updates) continue;

      let notificationTitle = "";
      let notificationMessage = "";

      if (statusChanged) {
        const statusLabels = {
          submitted: "مقدم",
          under_review: "قيد المراجعة",
          investigation: "قيد التحقيق",
          mediation: "في الوساطة",
          resolved: "تم الحل",
          closed: "مغلق",
          escalated: "مصعّد"
        };
        
        notificationTitle = "تحديث حالة النزاع";
        notificationMessage = `تم تغيير حالة النزاع "${dispute.title}" إلى: ${statusLabels[new_data.status] || new_data.status}`;
      } else if (messagesAdded) {
        const lastMessage = new_data.messages[new_data.messages.length - 1];
        if (lastMessage.sender_email !== recipient && !lastMessage.is_internal) {
          notificationTitle = "رسالة جديدة في النزاع";
          notificationMessage = `تلقيت رسالة جديدة في النزاع "${dispute.title}"`;
        } else {
          continue; // Skip if user sent the message
        }
      }

      // Create in-app notification
      if (inAppEnabled) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: recipient,
          type: "dispute_update",
          title: notificationTitle,
          message: notificationMessage,
          link: `/dispute-details?id=${dispute.id}`,
          is_read: false,
          priority: dispute.priority === 'urgent' ? 'high' : 'medium'
        });
      }

      // Send email notification
      if (emailEnabled && prefs.dispute_updates) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'منصة بيتلي',
          to: recipient,
          subject: `🔔 ${notificationTitle}`,
          body: `
            <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">بيتلي</h1>
                <p style="color: #E5D4B8; margin: 5px 0 0 0; font-size: 14px;">لمسة بيت</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #6B5D4F; margin-top: 0; font-size: 22px;">${notificationTitle}</h2>
                
                <p style="color: #555; font-size: 16px; line-height: 1.8;">${notificationMessage}</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${Deno.env.get('BASE44_APP_URL')}/dispute-details?id=${dispute.id}" 
                     style="background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                    عرض التفاصيل
                  </a>
                </div>

                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                  منصة بيتلي - لمسة بيت © ${new Date().getFullYear()}
                </p>
              </div>
            </div>
          `
        });
      }
    }

    return Response.json({
      success: true,
      message: 'Dispute notifications sent'
    });

  } catch (error) {
    console.error('Error sending dispute notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});