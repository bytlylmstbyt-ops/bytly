import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

/**
 * bookReviewMeeting — حجز اجتماع مراجعة المخططات ومزامنته مع Google Calendar
 * ينشئ حدثاً في تقويم جوجل مع العميل والمهندس كمدعوين،
 * ويرسل رابط تقويم جوجل ورابط Google Meet (للاجتماعات المرئية).
 *
 * Actions:
 *  book      — إنشاء اجتماع + مزامنة مع Google Calendar
 *  list      — جلب اجتماعات المستخدم
 *  cancel    — إلغاء اجتماع + حذف من Google Calendar
 *  available — جلب الأوقات المتاحة لمهندس في تاريخ معين
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'الرجاء تسجيل الدخول' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ══════════════════════════════════════════════════════════
    // BOOK — حجز اجتماع مراجعة مخططات جديد
    // ══════════════════════════════════════════════════════════
    if (action === 'book') {
      const {
        target_type, target_id, target_name, target_email,
        appointment_date, appointment_time, duration_minutes,
        consultation_type, topic, notes, location, project_id
      } = body;

      if (!appointment_date || !appointment_time || !target_id || !topic) {
        return Response.json({ error: 'التاريخ والوقت والمهندس والموضوع مطلوبون' }, { status: 400 });
      }

      // Create appointment in database
      const appointment = await base44.entities.ConsultationAppointment.create({
        client_id: user.id,
        client_name: user.full_name,
        client_email: user.email,
        client_phone: body.client_phone || '',
        target_type: target_type || 'engineer',
        target_id,
        target_name: target_name || '',
        target_email: target_email || '',
        appointment_date,
        appointment_time,
        duration_minutes: duration_minutes || 60,
        consultation_type: consultation_type || 'video_call',
        topic,
        notes: notes || '',
        location: location || '',
        status: 'confirmed'
      });

      // Create Google Calendar event
      let googleEventId = null;
      let googleLink = null;
      let meetLink = null;
      let calendarError = null;

      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

        const startDateTime = `${appointment_date}T${appointment_time}:00+03:00`;
        const endDate = new Date(`${appointment_date}T${appointment_time}:00+03:00`);
        endDate.setMinutes(endDate.getMinutes() + (duration_minutes || 60));
        const endDateTimeStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00+03:00`;

        const typeLabels = {
          video_call: 'مكالمة فيديو',
          phone_call: 'مكالمة هاتفية',
          in_person: 'لقاء شخصي',
          site_visit: 'معاينة موقع'
        };

        const eventTitle = `📐 مراجعة مخططات — ${topic}`;
        const eventDescription = [
          `📋 اجتماع مراجعة المخططات`,
          `━━━━━━━━━━━━━━━━━━`,
          `👤 العميل: ${user.full_name}`,
          `📧 بريد العميل: ${user.email}`,
          `👨‍💼 المهندس: ${target_name || ''}`,
          `🎯 نوع الاجتماع: ${typeLabels[consultation_type] || 'مكالمة فيديو'}`,
          `📝 الموضوع: ${topic}`,
          notes ? `🗒️ ملاحظات: ${notes}` : '',
          location ? `📍 الموقع: ${location}` : '',
          body.client_phone ? `📞 هاتف العميل: ${body.client_phone}` : '',
          `━━━━━━━━━━━━━━━━━━`,
          `تم الإنشاء تلقائياً بواسطة منصة بيتلي`
        ].filter(Boolean).join('\n');

        const eventPayload = {
          summary: eventTitle,
          description: eventDescription,
          start: { dateTime: startDateTime, timeZone: 'Asia/Riyadh' },
          end: { dateTime: endDateTimeStr, timeZone: 'Asia/Riyadh' },
          location: location || undefined,
          attendees: [
            { email: user.email, displayName: user.full_name, responseStatus: 'accepted' },
            ...(target_email ? [{ email: target_email, displayName: target_name || '', responseStatus: 'needsAction' }] : [])
          ],
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 60 },
              { method: 'popup', minutes: 15 }
            ]
          },
          conferenceData: consultation_type === 'video_call' ? {
            createRequest: {
              requestId: `bytly-review-${appointment.id}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
          } : undefined
        };

        const calRes = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all&conferenceDataVersion=1',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventPayload)
          }
        );

        if (calRes.ok) {
          const calData = await calRes.json();
          googleEventId = calData.id;
          googleLink = calData.htmlLink;
          meetLink = calData.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || null;

          await base44.asServiceRole.entities.ConsultationAppointment.update(appointment.id, {
            google_event_id: googleEventId,
            google_calendar_link: googleLink
          });
        } else {
          const errText = await calRes.text();
          console.error('Calendar API error:', errText);
          calendarError = 'تعذر مزامنة التقويم';
        }
      } catch (calErr) {
        console.error('Google Calendar sync error:', calErr.message);
        calendarError = calErr.message;
      }

      // Notify both parties
      try {
        await Promise.all([
          base44.asServiceRole.entities.Notification.create({
            recipient_email: user.email,
            title: '✅ تم حجز اجتماع مراجعة المخططات',
            message: `تم تأكيد موعدك مع ${target_name || 'المهندس'} يوم ${appointment_date} الساعة ${appointment_time}.${googleLink ? ' تمت إضافته تلقائياً إلى تقويم جوجل — تحقق من بريدك.' : ''}`,
            type: 'approval',
            priority: 'high'
          }),
          target_email ? base44.asServiceRole.entities.Notification.create({
            recipient_email: target_email,
            title: '📐 اجتماع مراجعة مخططات جديد',
            message: `حجز ${user.full_name} اجتماع مراجعة مخططات معك يوم ${appointment_date} الساعة ${appointment_time}. الموضوع: ${topic}.${googleLink ? ' تمت إضافة الموعد إلى تقويمك — تحقق من بريدك.' : ''}`,
            type: 'approval',
            priority: 'high'
          }) : Promise.resolve()
        ]);
      } catch (e) { console.error('Notification error:', e.message); }

      return Response.json({
        success: true,
        appointment_id: appointment.id,
        google_event_id: googleEventId,
        google_calendar_link: googleLink,
        meet_link: meetLink,
        calendar_error: calendarError
      });
    }

    // ══════════════════════════════════════════════════════════
    // LIST — جلب اجتماعات المستخدم
    // ══════════════════════════════════════════════════════════
    if (action === 'list') {
      const { role } = body;

      let filter;
      if (role === 'engineer') {
        filter = { target_email: user.email };
      } else {
        filter = { client_email: user.email };
      }

      const appointments = await base44.entities.ConsultationAppointment.filter(filter, '-appointment_date', 50);

      // Enrich with calendar data
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
    // CANCEL — إلغاء اجتماع
    // ══════════════════════════════════════════════════════════
    if (action === 'cancel') {
      const { appointment_id } = body;

      const [appointment] = await base44.entities.ConsultationAppointment.filter({ id: appointment_id });
      if (!appointment) return Response.json({ error: 'الاجتماع غير موجود' }, { status: 404 });

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

      // Notify the other party
      try {
        const otherEmail = appointment.client_email === user.email ? appointment.target_email : appointment.client_email;
        if (otherEmail) {
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: otherEmail,
            title: '❌ تم إلغاء اجتماع مراجعة المخططات',
            message: `تم إلغاء اجتماع ${appointment.appointment_date} الساعة ${appointment.appointment_time} من قبل ${user.full_name}. تمت إزالته من تقويمك.`,
            type: 'system',
            priority: 'medium'
          });
        }
      } catch (e) { console.error(e.message); }

      return Response.json({ success: true });
    }

    // ══════════════════════════════════════════════════════════
    // AVAILABLE — الأوقات المتاحة لمهندس في تاريخ معين
    // ══════════════════════════════════════════════════════════
    if (action === 'available') {
      const { engineer_email, date } = body;

      if (!engineer_email || !date) {
        return Response.json({ error: 'بريد المهندس والتاريخ مطلوبان' }, { status: 400 });
      }

      const existing = await base44.entities.ConsultationAppointment.filter({
        target_email: engineer_email,
        appointment_date: date,
        status: { $in: ['confirmed', 'pending'] }
      });

      const bookedTimes = existing.map(a => a.appointment_time);

      const allSlots = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
        "16:00", "16:30", "17:00"
      ];

      const available = allSlots.filter(t => !bookedTimes.includes(t));

      return Response.json({ date, available_slots: available, booked_slots: bookedTimes });
    }

    return Response.json({ error: 'إجراء غير صالح' }, { status: 400 });

  } catch (error) {
    console.error('bookReviewMeeting error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});