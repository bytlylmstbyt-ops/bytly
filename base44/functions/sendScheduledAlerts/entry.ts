import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get current date
    const now = new Date();
    const nowISO = now.toISOString();

    // Get all pending scheduled alerts that are due
    const pendingAlerts = await base44.asServiceRole.entities.ScheduledAlert.filter({
      is_sent: false
    });

    const dueAlerts = pendingAlerts.filter(alert => {
      const scheduledDate = new Date(alert.scheduled_date);
      return scheduledDate <= now;
    });

    console.log(`Found ${dueAlerts.length} due alerts to send`);

    let sentCount = 0;
    let errorCount = 0;

    for (const alert of dueAlerts) {
      try {
        // Get user notification settings
        const [settings] = await base44.asServiceRole.entities.NotificationSettings.filter({
          user_email: alert.user_email
        });

        // Check if user wants this type of notification
        const shouldSend = settings?.notification_preferences?.[
          alert.alert_type === 'deadline_reminder' ? 'deadline_reminders' :
          alert.alert_type === 'payment_due' ? 'payment_reminders' :
          alert.alert_type === 'milestone_due' ? 'milestone_reminders' :
          'system_notifications'
        ] ?? true;

        if (!shouldSend) {
          console.log(`Skipping alert for ${alert.user_email} - disabled in settings`);
          await base44.asServiceRole.entities.ScheduledAlert.update(alert.id, {
            is_sent: true,
            sent_date: nowISO
          });
          continue;
        }

        // Create in-app notification
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: alert.user_email,
          title: alert.title,
          message: alert.message,
          type: alert.alert_type.includes('payment') ? 'payment' : 'project_update',
          related_project_id: alert.related_entity_type === 'project' ? alert.related_entity_id : null,
          priority: alert.priority
        });

        // Send email if enabled
        if (settings?.email_notifications !== false) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: alert.user_email,
            subject: `${alert.title} - منصة بيتلي`,
            body: `
              <div dir="rtl" style="font-family: Arial, sans-serif;">
                <h2>${alert.title}</h2>
                <p>${alert.message}</p>
                <p style="margin-top: 20px;">قم بتسجيل الدخول للمنصة لمزيد من التفاصيل.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">منصة بيتلي - لمسة بيت</p>
              </div>
            `
          });
        }

        // Mark as sent
        await base44.asServiceRole.entities.ScheduledAlert.update(alert.id, {
          is_sent: true,
          sent_date: nowISO
        });

        sentCount++;
      } catch (error) {
        console.error(`Error sending alert ${alert.id}:`, error);
        errorCount++;
      }
    }

    return Response.json({
      success: true,
      total_due: dueAlerts.length,
      sent: sentCount,
      errors: errorCount
    });

  } catch (error) {
    console.error("Error in sendScheduledAlerts:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});