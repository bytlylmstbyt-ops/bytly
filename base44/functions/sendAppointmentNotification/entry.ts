import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

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

      // Notify engineer/target
      if (appointment.target_email) {
        notifications.push(
          base44.asServiceRole.entities.Notification.create({
            recipient_email: appointment.target_email,
            title: '📅 موعد جديد مطلوب',
            message: `طلب ${appointment.client_name} حجز موعد معك يوم ${appointment.appointment_date} الساعة ${appointment.appointment_time}.\n\nالموضوع: ${appointment.topic || 'استشارة'}\nالنوع: ${appointment.consultation_type === 'video_call' ? 'مكالمة فيديو' : appointment.consultation_type === 'phone_call' ? 'مكالمة هاتفية' : appointment.consultation_type === 'in_person' ? 'لقاء شخصي' : 'معاينة موقع'}`,
            type: 'approval',
            priority: 'high',
            related_entity_id: appointment.id,
            description: `طلب حجز موعد جديد من ${appointment.client_name}`
          }).catch(e => console.error('Error creating engineer notification:', e.message))
        );

        // Send WhatsApp notification to engineer
        try {
          await base44.functions.invoke('sendWhatsappNotification', {
            to: appointment.target_phone || '',
            message: `📅 موعد جديد مطلوب\n\nالعميل: ${appointment.client_name}\nالتاريخ: ${appointment.appointment_date}\nالوقت: ${appointment.appointment_time}\nالنوع: ${appointment.consultation_type}\n\nيرجى الموافقة أو التأجيل من لوحة التحكم.`
          });
        } catch (e) {
          console.error('WhatsApp notification error:', e.message);
        }
      }

      // Notify client (confirmation)
      if (appointment.client_email) {
        notifications.push(
          base44.asServiceRole.entities.Notification.create({
            recipient_email: appointment.client_email,
            title: '✅ تم إرسال طلب الموعد',
            message: `تم إرسال طلب حجز الموعد إلى ${appointment.target_name || 'المهندس'} وسيتواصل معك قريباً للتأكيد.\n\nالتاريخ: ${appointment.appointment_date}\nالوقت: ${appointment.appointment_time}`,
            type: 'approval',
            priority: 'medium',
            related_entity_id: appointment.id,
            description: 'تم إرسال طلب الموعد بنجاح'
          }).catch(e => console.error('Error creating client notification:', e.message))
        );
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