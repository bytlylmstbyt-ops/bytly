import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

function escapeHtml(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

/**
 * sendAppointmentNotification — إرسال إشعارات عند حجز موعد أو طلب استشارة
 * Actions:
 *  notify_new_appointment — إشعار المهندس والعميل عند حجز موعد جديد
 *  notify_reschedule — إشعار عند طلب تأجيل موعد
 *  notify_cancel — إشعار عند إلغاء موعد
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, appointment } = body;

    if (!appointment) {
      return Response.json({ error: 'appointment data required' }, { status: 400 });
    }

    // ══════════════════════════════════════════════════════════
    // NOTIFY_NEW_APPOINTMENT — إشعار عند حجز موعد جديد
    // ══════════════════════════════════════════════════════════
    if (action === 'notify_new_appointment') {
      const notifications = [];
      const typeLabels = {
        video_call: 'مكالمة فيديو',
        phone_call: 'مكالمة هاتفية',
        in_person: 'لقاء شخصي',
        site_visit: 'معاينة موقع'
      };

      // Notify engineer/target
      if (appointment.target_email) {
        const engineerMsg = [
          `📅 موعد استشارة جديد`,
          `━━━━━━━━━━━━━━━━━━`,
          `👤 العميل: ${appointment.client_name}`,
          `📧 البريد: ${appointment.client_email}`,
          appointment.client_phone ? `📞 الهاتف: ${appointment.client_phone}` : '',
          `📆 التاريخ: ${appointment.appointment_date}`,
          `⏰ الوقت: ${appointment.appointment_time}`,
          `🎯 النوع: ${typeLabels[appointment.consultation_type] || 'استشارة'}`,
          appointment.topic ? `📝 الموضوع: ${appointment.topic}` : '',
          appointment.notes ? `🗒️ ملاحظات: ${appointment.notes}` : '',
          appointment.location ? `📍 الموقع: ${appointment.location}` : '',
          `━━━━━━━━━━━━━━━━━━`,
          `تمت إضافة الموعد تلقائياً إلى تقويم Google Calendar الخاص بك.`
        ].filter(Boolean).join('\n');

        notifications.push(
          base44.asServiceRole.entities.Notification.create({
            recipient_email: appointment.target_email,
            title: '📅 موعد استشارة جديد',
            message: engineerMsg,
            type: 'approval',
            priority: 'high',
            related_entity_id: appointment.id,
            description: `طلب حجز موعد جديد من ${appointment.client_name}`,
            action_url: '/EngineerCalendar'
          }).catch(e => console.error('Error creating engineer notification:', e.message))
        );

        // Send WhatsApp notification to engineer
        try {
          await base44.functions.invoke('sendWhatsappNotification', {
            to: appointment.target_phone || '',
            message: `📅 موعد جديد مطلوب\n\nالعميل: ${appointment.client_name}\nالتاريخ: ${appointment.appointment_date}\nالوقت: ${appointment.appointment_time}\nالنوع: ${typeLabels[appointment.consultation_type]}\n\nتمت الإضافة إلى تقويمك.`
          });
        } catch (e) {
          console.error('WhatsApp notification error:', e.message);
        }
      }

      // Notify client (confirmation)
      if (appointment.client_email) {
        const clientMsg = [
          `✅ تم تأكيد موعد الاستشارة`,
          `━━━━━━━━━━━━━━━━━━`,
          `👨‍💼 المهندس: ${appointment.target_name || 'المهندس'}`,
          `📆 التاريخ: ${appointment.appointment_date}`,
          `⏰ الوقت: ${appointment.appointment_time}`,
          `🎯 النوع: ${typeLabels[appointment.consultation_type] || 'استشارة'}`,
          appointment.topic ? `📝 الموضوع: ${appointment.topic}` : '',
          `━━━━━━━━━━━━━━━━━━`,
          `تم إرسال دعوة Google Calendar إلى بريدك الإلكتروني.`,
          appointment.google_calendar_link ? `\n📌 رابط التقويم: ${appointment.google_calendar_link}` : '',
          appointment.meet_link ? `\n📹 رابط اللقاء: ${appointment.meet_link}` : ''
        ].filter(Boolean).join('\n');

        notifications.push(
          base44.asServiceRole.entities.Notification.create({
            recipient_email: appointment.client_email,
            title: '✅ تم تأكيد موعد الاستشارة',
            message: clientMsg,
            type: 'approval',
            priority: 'medium',
            related_entity_id: appointment.id,
            description: 'تم تأكيد موعد الاستشارة بنجاح',
            action_url: '/EngineerCalendar'
          }).catch(e => console.error('Error creating client notification:', e.message))
        );

        // Send email confirmation to client
        try {
          await base44.functions.invoke('emailService', {
            to: appointment.client_email,
            subject: `✅ تأكيد موعد استشارة - ${appointment.appointment_date}`,
            body: `
              <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                <h2 style="color: #6B5D4F;">✅ تم تأكيد موعد الاستشارة</h2>
                <hr style="border: 1px solid #C9A66B;">
                <p><strong>المهندس:</strong> ${escapeHtml(appointment.target_name || 'المهندس')}</p>
                <p><strong>التاريخ:</strong> ${appointment.appointment_date}</p>
                <p><strong>الوقت:</strong> ${appointment.appointment_time}</p>
                <p><strong>النوع:</strong> ${typeLabels[appointment.consultation_type] || 'استشارة'}</p>
                ${appointment.topic ? `<p><strong>الموضوع:</strong> ${escapeHtml(appointment.topic)}</p>` : ''}
                ${appointment.google_calendar_link ? `<p><a href="${appointment.google_calendar_link}" style="color: #6B5D4F;">📅 فتح في Google Calendar</a></p>` : ''}
                ${appointment.meet_link ? `<p><a href="${appointment.meet_link}" style="color: #6B5D4F;">📹 رابط لقاء الفيديو</a></p>` : ''}
                <hr style="border: 1px solid #C9A66B;">
                <p style="color: #888; font-size: 14px;">شكراً لاستخدامك منصة بيتلي</p>
              </div>
            `
          });
        } catch (e) {
          console.error('Email notification error:', e.message);
        }
      }

      await Promise.all(notifications);

      return Response.json({ 
        success: true, 
        message: 'تم إرسال الإشعارات بنجاح',
        notifications_count: notifications.length
      });
    }

    // ══════════════════════════════════════════════════════════
    // NOTIFY_RESCHEDULE — إشعار عند طلب تأجيل موعد
    // ══════════════════════════════════════════════════════════
    if (action === 'notify_reschedule') {
      const { reschedule_reason, reschedule_date, reschedule_time } = body;

      // Notify client
      if (appointment.client_email) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: appointment.client_email,
          title: '🔄 طلب تأجيل موعد',
          message: `طلب ${appointment.target_name || 'المهندس'} تأجيل موعدك.\n\nالسبب: ${reschedule_reason || 'غير محدد'}\n\nالتاريخ المقترح: ${reschedule_date || 'غير محدد'}\nالوقت المقترح: ${reschedule_time || 'غير محدد'}\n\nيرجى مراجعة لوحة التحكم للرد.`,
          type: 'approval',
          priority: 'high',
          related_entity_id: appointment.id,
          description: 'طلب تأجيل موعد من المهندس'
        });
      }

      return Response.json({ success: true, message: 'تم إرسال إشعار التأجيل' });
    }

    // ══════════════════════════════════════════════════════════
    // NOTIFY_CANCEL — إشعار عند إلغاء موعد
    // ══════════════════════════════════════════════════════════
    if (action === 'notify_cancel') {
      const { reason } = body;
      const otherEmail = appointment.client_email === user.email ? appointment.target_email : appointment.client_email;
      const otherName = appointment.client_email === user.email ? appointment.target_name : appointment.client_name;

      if (otherEmail) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: otherEmail,
          title: '❌ تم إلغاء الموعد',
          message: `تم إلغاء موعد ${appointment.appointment_date} الساعة ${appointment.appointment_time} من قبل ${user.full_name}.\n\n${reason ? 'السبب: ' + reason : ''}`,
          type: 'system',
          priority: 'medium',
          related_entity_id: appointment.id,
          description: 'تم إلغاء الموعد'
        });
      }

      return Response.json({ success: true, message: 'تم إرسال إشعار الإلغاء' });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('sendAppointmentNotification error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});