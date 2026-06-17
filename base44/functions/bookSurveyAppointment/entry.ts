import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

/**
 * bookSurveyAppointment — حجز مواعيد الرفع المساحي ومزامنتها مع Google Calendar
 * Actions:
 *  book      — إنشاء موعد + مزامنة مع Google Calendar
 *  list      — جلب مواعيد المستخدم
 *  cancel    — إلغاء موعد + حذف من Google Calendar
 *  available — جلب الأوقات المتاحة لمساح معين
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'الرجاء تسجيل الدخول' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ══════════════════════════════════════════════════════════
    // BOOK — حجز موعد جديد
    // ══════════════════════════════════════════════════════════
    if (action === 'book') {
      const {
        request_id, target_type, target_id, target_name, target_email,
        appointment_date, appointment_time, duration_minutes,
        consultation_type, topic, notes, location
      } = body;

      if (!appointment_date || !appointment_time || !target_id) {
        return Response.json({ error: 'التاريخ والوقت والهدف مطلوبان' }, { status: 400 });
      }

      // Create appointment in database
      const appointment = await base44.entities.ConsultationAppointment.create({
        client_id: user.id,
        client_name: user.full_name,
        client_email: user.email,
        target_type: target_type || 'surveyor',
        target_id,
        target_name: target_name || '',
        target_email: target_email || '',
        appointment_date,
        appointment_time,
        duration_minutes: duration_minutes || 60,
        consultation_type: consultation_type || 'site_visit',
        topic: topic || 'موعد رفع مساحي',
        notes: notes || '',
        location: location || '',
        request_id: request_id || '',
        status: 'confirmed'
      });

      // Create Google Calendar event
      let googleEventId = null;
      let googleLink = null;

      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

        const startDateTime = `${appointment_date}T${appointment_time}:00+03:00`;
        const endDate = new Date(`${appointment_date}T${appointment_time}:00+03:00`);
        endDate.setMinutes(endDate.getMinutes() + (duration_minutes || 60));
        const endDateTime = endDate.toISOString().replace('.000Z', '+03:00');

        const eventTitle = `📍 ${topic || 'موعد رفع مساحي'} — ${target_name || 'المساح'}`;
        const eventDescription = [
          `🎯 نوع الموعد: ${consultation_type === 'site_visit' ? 'معاينة موقع' : consultation_type === 'video_call' ? 'مكالمة فيديو' : consultation_type === 'phone_call' ? 'مكالمة هاتفية' : 'شخصي'}`,
          `👤 العميل: ${user.full_name}`,
          `📧 بريد العميل: ${user.email}`,
          `👷‍♂️ المساح: ${target_name || ''}`,
          notes ? `📝 ملاحظات: ${notes}` : '',
          location ? `📍 الموقع: ${location}` : '',
          `🔗 طلب المسح: ${request_id || 'غير مرتبط'}`
        ].filter(Boolean).join('\n');

        const eventPayload = {
          summary: eventTitle,
          description: eventDescription,
          start: { dateTime: startDateTime, timeZone: 'Asia/Riyadh' },
          end: { dateTime: endDateTime, timeZone: 'Asia/Riyadh' },
          location: location || undefined,
          attendees: [
            { email: user.email, displayName: user.full_name, responseStatus: 'accepted' },
            ...(target_email ? [{ email: target_email, displayName: target_name || '' }] : [])
          ],
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 60 }
            ]
          },
          conferenceData: consultation_type === 'video_call' ? {
            createRequest: {
              requestId: `bytly-${appointment.id}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
          } : undefined
        };

        const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all&conferenceDataVersion=1', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventPayload)
        });

        if (calRes.ok) {
          const calData = await calRes.json();
          googleEventId = calData.id;
          googleLink = calData.htmlLink;

          // Update appointment with Google Calendar IDs
          await base44.asServiceRole.entities.ConsultationAppointment.update(appointment.id, {
            google_event_id: googleEventId,
            google_calendar_link: googleLink
          });
        }
      } catch (calErr) {
        console.error('Google Calendar sync error:', calErr.message);
        // Appointment still created even if calendar sync fails
      }

      // Notify both parties
      try {
        await Promise.all([
          base44.asServiceRole.entities.Notification.create({
            recipient_email: user.email,
            title: '✅ تم حجز موعد الرفع المساحي',
            message: `تم تأكيد موعدك مع ${target_name || 'المساح'} يوم ${appointment_date} الساعة ${appointment_time}. تمت إضافته لتقويمك.`,
            type: 'approval',
            priority: 'high'
          }),
          target_email ? base44.asServiceRole.entities.Notification.create({
            recipient_email: target_email,
            title: '📅 موعد رفع مساحي جديد',
            message: `حجز ${user.full_name} موعداً معك يوم ${appointment_date} الساعة ${appointment_time}. تحقق من بريدك وتقويمك.`,
            type: 'approval',
            priority: 'high'
          }) : Promise.resolve()
        ]);
      } catch (e) { console.error('Notification error:', e.message); }

      return Response.json({
        success: true,
        appointment_id: appointment.id,
        google_event_id: googleEventId,
        google_calendar_link: googleLink
      });
    }

    // ══════════════════════════════════════════════════════════
    // LIST — جلب مواعيد المستخدم
    // ══════════════════════════════════════════════════════════
    if (action === 'list') {
      const { role } = body; // 'client' or 'surveyor'

      let filter;
      if (role === 'client') {
        filter = { client_email: user.email };
      } else {
        filter = { target_email: user.email };
      }

      const appointments = await base44.entities.ConsultationAppointment.filter(filter, '-appointment_date', 50);

      // Try to enrich with calendar links from Google
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

        const enriched = await Promise.all(appointments.map(async (apt) => {
          if (apt.google_event_id) {
            try {
              const eventRes = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events/${apt.google_event_id}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
              );
              if (eventRes.ok) {
                const eventData = await eventRes.json();
                return {
                  ...apt,
                  google_status: eventData.status,
                  google_calendar_link: eventData.htmlLink || apt.google_calendar_link,
                  meet_link: eventData.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || null
                };
              }
            } catch (e) { /* continue with original data */ }
          }
          return apt;
        }));

        return Response.json({ appointments: enriched });
      } catch (e) {
        return Response.json({ appointments });
      }
    }

    // ══════════════════════════════════════════════════════════
    // CANCEL — إلغاء موعد
    // ══════════════════════════════════════════════════════════
    if (action === 'cancel') {
      const { appointment_id } = body;

      const [appointment] = await base44.entities.ConsultationAppointment.filter({ id: appointment_id });
      if (!appointment) return Response.json({ error: 'الموعد غير موجود' }, { status: 404 });

      const isOwner = appointment.client_email === user.email || appointment.target_email === user.email;
      if (!isOwner) return Response.json({ error: 'غير مصرح' }, { status: 403 });

      // Delete from Google Calendar
      if (appointment.google_event_id) {
        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
          await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.google_event_id}?sendUpdates=all`,
            { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } }
          );
        } catch (e) { console.error('Calendar delete error:', e.message); }
      }

      await base44.asServiceRole.entities.ConsultationAppointment.update(appointment_id, {
        status: 'cancelled'
      });

      // Notify both parties
      try {
        const otherEmail = appointment.client_email === user.email ? appointment.target_email : appointment.client_email;
        await Promise.all([
          base44.asServiceRole.entities.Notification.create({
            recipient_email: otherEmail,
            title: '❌ تم إلغاء الموعد',
            message: `تم إلغاء موعد ${appointment.appointment_date} الساعة ${appointment.appointment_time} من قبل ${user.full_name}.`,
            type: 'system',
            priority: 'medium'
          })
        ]);
      } catch (e) { console.error(e.message); }

      return Response.json({ success: true });
    }

    // ══════════════════════════════════════════════════════════
    // AVAILABLE — الأوقات المتاحة لمساح
    // ══════════════════════════════════════════════════════════
    if (action === 'available') {
      const { surveyor_email, date } = body;

      if (!surveyor_email || !date) {
        return Response.json({ error: 'بريد المساح والتاريخ مطلوبان' }, { status: 400 });
      }

      // Get existing appointments for this surveyor on this date
      const existing = await base44.entities.ConsultationAppointment.filter({
        target_email: surveyor_email,
        appointment_date: date,
        status: { $in: ['confirmed', 'pending'] }
      });

      const bookedTimes = existing.map(a => a.appointment_time);

      // Generate available slots (8 AM to 6 PM, 1-hour slots)
      const allSlots = [];
      for (let h = 8; h <= 17; h++) {
        const time = `${String(h).padStart(2, '0')}:00`;
        allSlots.push(time);
      }

      const available = allSlots.filter(t => !bookedTimes.includes(t));

      return Response.json({ date, available_slots: available, booked_slots: bookedTimes });
    }

    return Response.json({ error: 'إجراء غير صالح' }, { status: 400 });

  } catch (error) {
    console.error('bookSurveyAppointment error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});