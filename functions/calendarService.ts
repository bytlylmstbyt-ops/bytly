import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

async function calendarRequest(accessToken, endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${CALENDAR_API}${endpoint}`, options);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar API error: ${res.status} - ${err}`);
  }
  if (res.status === 204) return {};
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, data } = await req.json();
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    switch (action) {

      // List upcoming events
      case 'listEvents': {
        const { calendarId = 'primary', maxResults = 20, timeMin, timeMax } = data || {};
        let endpoint = `/calendars/${encodeURIComponent(calendarId)}/events?maxResults=${maxResults}&orderBy=startTime&singleEvents=true`;
        const min = timeMin || new Date().toISOString();
        endpoint += `&timeMin=${encodeURIComponent(min)}`;
        if (timeMax) endpoint += `&timeMax=${encodeURIComponent(timeMax)}`;
        const result = await calendarRequest(accessToken, endpoint);
        return Response.json({ success: true, events: result.items || [] });
      }

      // Get single event
      case 'getEvent': {
        const { calendarId = 'primary', eventId } = data;
        const event = await calendarRequest(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`);
        return Response.json({ success: true, event });
      }

      // Create event
      case 'createEvent': {
        const { calendarId = 'primary', title, description, location, startDateTime, endDateTime, attendees = [], allDay = false } = data;
        const eventBody = {
          summary: title,
          description,
          location,
          start: allDay ? { date: startDateTime } : { dateTime: startDateTime, timeZone: 'Asia/Riyadh' },
          end: allDay ? { date: endDateTime } : { dateTime: endDateTime, timeZone: 'Asia/Riyadh' },
          attendees: attendees.map(email => ({ email })),
        };
        const event = await calendarRequest(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events`, 'POST', eventBody);
        return Response.json({ success: true, event, message: 'تم إنشاء الحدث بنجاح' });
      }

      // Update event
      case 'updateEvent': {
        const { calendarId = 'primary', eventId, title, description, location, startDateTime, endDateTime, attendees } = data;
        const updates = {};
        if (title) updates.summary = title;
        if (description !== undefined) updates.description = description;
        if (location !== undefined) updates.location = location;
        if (startDateTime) updates.start = { dateTime: startDateTime, timeZone: 'Asia/Riyadh' };
        if (endDateTime) updates.end = { dateTime: endDateTime, timeZone: 'Asia/Riyadh' };
        if (attendees) updates.attendees = attendees.map(email => ({ email }));
        const event = await calendarRequest(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, 'PATCH', updates);
        return Response.json({ success: true, event, message: 'تم تحديث الحدث' });
      }

      // Delete event
      case 'deleteEvent': {
        const { calendarId = 'primary', eventId } = data;
        await calendarRequest(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, 'DELETE');
        return Response.json({ success: true, message: 'تم حذف الحدث' });
      }

      // List calendars
      case 'listCalendars': {
        const result = await calendarRequest(accessToken, '/users/me/calendarList');
        return Response.json({ success: true, calendars: result.items || [] });
      }

      default:
        return Response.json({ error: 'Action غير معروف' }, { status: 400 });
    }

  } catch (error) {
    console.error('Calendar service error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});