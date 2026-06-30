import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

/**
 * handleAppointmentResponse — معالجة رد المهندس على الموعد
 * Actions:
 *  approve   — موافقة على الموعد
 *  reschedule — تأجيل الموعد مع تحديد سبب وتاريخ جديد
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'الرجاء تسجيل الدخول' }, { status: 401 });

    const body = await req.json();
    const { action, appointment_id, reschedule_reason, reschedule_date, reschedule_time } = body;

    // ══════════════════════════════════════════════════════════
    // APPROVE — موافقة على الموعد
    // ══════════════════════════════════════════════════════════
    if (action === 'approve') {
      if (!appointment_id) {
        return Response.json({ error: 'معرف الموعد مطلوب' }, { status: 400 });
      }

      const [appointment] = await base44.entities.ConsultationAppointment.filter({ id: appointment_id });
      if (!appointment) return Response.json({ error: 'الموعد غير موجود' }, { status: 404 });

      // Verify user is the target (engineer/firm/surveyor)
      if (appointment.target_email !== user.email) {
        return Response.json({ error: 'غير مصرح' }, { status: 403 });
      }

      // Update appointment status
      await base44.asServiceRole.entities.ConsultationAppointment.update(appointment_id, {
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        status: 'confirmed'
      });

      // Update Google Calendar event if exists
      if (appointment.google_event_id) {
        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
          await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.google_event_id}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                description: (appointment.topic || '') + '\n\n✅ تم تأكيد الموعد من قبل ' + user.full_name
              })
            }
          );
        } catch (e) {
          console.error('Calendar update error:', e.message);
        }
      }

      // Notify client
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: appointment.client_email,
          title: '✅ تم تأكيد الموعد',
          message: `وافق ${user.full_name} على موعدك يوم ${appointment.appointment_date} الساعة ${appointment.appointment_time}.`,
          type: 'approval',
          priority: 'high',
          related_entity_id: appointment_id
        });
      } catch (e) {
        console.error('Notification error:', e.message);
      }

      return Response.json({ success: true, message: 'تم تأكيد الموعد بنجاح' });
    }

    // ══════════════════════════════════════════════════════════
    // RESCHEDULE — تأجيل الموعد
    // ══════════════════════════════════════════════════════════
    if (action === 'reschedule') {
      if (!appointment_id) {
        return Response.json({ error: 'معرف الموعد مطلوب' }, { status: 400 });
      }

      if (!reschedule_reason) {
        return Response.json({ error: 'يرجى تحديد سبب التأجيل' }, { status: 400 });
      }

      if (!reschedule_date || !reschedule_time) {
        return Response.json({ error: 'يرجى تحديد التاريخ والوقت الجديدين' }, { status: 400 });
      }

      const [appointment] = await base44.entities.ConsultationAppointment.filter({ id: appointment_id });
      if (!appointment) return Response.json({ error: 'الموعد غير موجود' }, { status: 404 });

      // Verify user is the target (engineer/firm/surveyor)
      if (appointment.target_email !== user.email) {
        return Response.json({ error: 'غير مصرح' }, { status: 403 });
      }

      // Check max reschedule attempts (max 3)
      if (appointment.reschedule_count >= 3) {
        return Response.json({ error: 'عذراً، تم تأجيل هذا الموعد 3 مرات كحد أقصى' }, { status: 400 });
      }

      // Update appointment with reschedule request
      await base44.asServiceRole.entities.ConsultationAppointment.update(appointment_id, {
        approval_status: 'rescheduled',
        reschedule_reason,
        reschedule_requested_date: reschedule_date,
        reschedule_requested_time: reschedule_time,
        reschedule_count: (appointment.reschedule_count || 0) + 1,
        status: 'pending'
      });

      // Delete old Google Calendar event if exists
      if (appointment.google_event_id) {
        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
          await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.google_event_id}?sendUpdates=all`,
            { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } }
          );
        } catch (e) {
          console.error('Calendar delete error:', e.message);
        }
      }

      // Notify client about reschedule request
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: appointment.client_email,
          title: '📅 طلب تأجيل موعد',
          message: `طلب ${user.full_name} تأجيل موعدك من ${appointment.appointment_date} ${appointment.appointment_time} إلى ${reschedule_date} ${reschedule_time}.\n\nالسبب: ${reschedule_reason}`,
          type: 'approval',
          priority: 'high',
          related_entity_id: appointment_id
        });
      } catch (e) {
        console.error('Notification error:', e.message);
      }

      return Response.json({ 
        success: true, 
        message: 'تم إرسال طلب التأجيل للعميل',
        new_date: reschedule_date,
        new_time: reschedule_time
      });
    }

    return Response.json({ error: 'إجراء غير صالح' }, { status: 400 });

  } catch (error) {
    console.error('handleAppointmentResponse error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});