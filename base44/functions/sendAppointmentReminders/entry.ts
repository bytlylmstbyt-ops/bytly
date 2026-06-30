import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

/**
 * sendAppointmentReminders — إرسال تذكيرات تلقائية قبل المواعيد
 * يُستدعى يومياً عبر automation لإرسال تذكيرات قبل 24 ساعة و قبل 1 ساعة
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get current date in Asia/Riyadh timezone
    const now = new Date();
    const riyadhTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
    const currentDateTime = riyadhTime.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    
    // Calculate tomorrow's date for 24-hour reminders
    const tomorrow = new Date(riyadhTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    console.log('Running appointment reminders at:', currentDateTime);

    // Get upcoming appointments (confirmed, not cancelled)
    const appointments = await base44.asServiceRole.entities.ConsultationAppointment.filter({
      status: { $in: ['confirmed', 'pending'] },
      appointment_date: { $gte: riyadhTime.toISOString().slice(0, 10) }
    });

    let reminderCount = 0;

    for (const apt of appointments) {
      const aptDateTime = `${apt.appointment_date}T${apt.appointment_time}:00`;
      const aptDate = new Date(aptDateTime + '+03:00');
      const hoursUntil = (aptDate.getTime() - riyadhTime.getTime()) / (1000 * 60 * 60);

      // Skip if already sent reminder for this threshold
      const reminderThreshold = hoursUntil <= 24 ? '24h' : hoursUntil <= 1 ? '1h' : null;
      if (!reminderThreshold) continue;

      const reminderKey = `reminder_${reminderThreshold}`;
      if (apt[reminderKey]) {
        console.log(`Already sent ${reminderThreshold} reminder for appointment ${apt.id}`);
        continue;
      }

      const typeLabels = {
        video_call: 'مكالمة فيديو',
        phone_call: 'مكالمة هاتفية',
        in_person: 'لقاء شخصي',
        site_visit: 'معاينة موقع'
      };

      // Send reminder to client
      if (apt.client_email) {
        const clientSubject = `⏰ تذكير بموعد الاستشارة - ${apt.appointment_date}`;
        const clientBody = `
          <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
            <h2 style="color: #6B5D4F;">⏰ تذكير بموعد الاستشارة</h2>
            <hr style="border: 1px solid #C9A66B;">
            <p><strong>المهندس:</strong> ${apt.target_name || 'المهندس'}</p>
            <p><strong>التاريخ:</strong> ${apt.appointment_date}</p>
            <p><strong>الوقت:</strong> ${apt.appointment_time}</p>
            <p><strong>النوع:</strong> ${typeLabels[apt.consultation_type] || 'استشارة'}</p>
            ${apt.topic ? `<p><strong>الموضوع:</strong> ${apt.topic}</p>` : ''}
            ${apt.google_calendar_link ? `<p><a href="${apt.google_calendar_link}" style="color: #6B5D4F;">📅 فتح في Google Calendar</a></p>` : ''}
            ${apt.meet_link ? `<p><a href="${apt.meet_link}" style="color: #6B5D4F;">📹 رابط لقاء الفيديو</a></p>` : ''}
            <hr style="border: 1px solid #C9A66B;">
            <p style="color: #888; font-size: 14px;">منصة بيتلي - نتمنى لك يوماً موفقاً</p>
          </div>
        `;

        try {
          await base44.functions.invoke('emailService', {
            to: apt.client_email,
            subject: clientSubject,
            body: clientBody
          });

          await base44.asServiceRole.entities.Notification.create({
            recipient_email: apt.client_email,
            title: `⏰ تذكير: موعدك ${reminderThreshold === '24h' ? 'غداً' : 'خلال ساعة'}`,
            message: `تذكير بموعدك مع ${apt.target_name || 'المهندس'}\n\nالتاريخ: ${apt.appointment_date}\nالوقت: ${apt.appointment_time}\n\n${apt.google_calendar_link ? `رابط التقويم: ${apt.google_calendar_link}` : ''}`,
            type: 'system',
            priority: reminderThreshold === '1h' ? 'urgent' : 'medium',
            related_entity_id: apt.id,
            description: `تذكير قبل ${reminderThreshold === '24h' ? '24 ساعة' : 'ساعة واحدة'}`
          });

          reminderCount++;
        } catch (e) {
          console.error('Client reminder error:', e.message);
        }
      }

      // Send reminder to engineer/target
      if (apt.target_email) {
        try {
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: apt.target_email,
            title: `⏰ تذكير: استشارة ${reminderThreshold === '24h' ? 'غداً' : 'قريباً'}`,
            message: `تذكير باستشارتك مع ${apt.client_name}\n\nالتاريخ: ${apt.appointment_date}\nالوقت: ${apt.appointment_time}\n\nالموضوع: ${apt.topic || 'استشارة'}`,
            type: 'system',
            priority: reminderThreshold === '1h' ? 'urgent' : 'medium',
            related_entity_id: apt.id,
            description: `تذكير قبل ${reminderThreshold === '24h' ? '24 ساعة' : 'ساعة واحدة'}`,
            action_url: '/EngineerCalendar'
          });

          reminderCount++;
        } catch (e) {
          console.error('Engineer reminder error:', e.message);
        }
      }

      // Mark reminder as sent
      await base44.asServiceRole.entities.ConsultationAppointment.update(apt.id, {
        [reminderKey]: true
      });
    }

    console.log(`Sent ${reminderCount} reminders`);
    return Response.json({ 
      success: true, 
      reminders_sent: reminderCount,
      processed_at: currentDateTime
    });

  } catch (error) {
    console.error('sendAppointmentReminders error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});