import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { data, old_data } = body;
    const milestone = data;

    // Only run when due_date is set or changed
    if (!milestone?.due_date) {
      return Response.json({ skipped: true, reason: 'no due_date' });
    }
    if (old_data?.due_date === milestone.due_date && milestone.google_event_id) {
      return Response.json({ skipped: true, reason: 'due_date unchanged and event exists' });
    }

    console.log(`Adding calendar event for milestone: ${milestone.id}, due: ${milestone.due_date}`);

    // Fetch project
    const projects = await base44.asServiceRole.entities.Project.filter({ id: milestone.project_id });
    const project = projects[0];
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

    // Fetch engineer
    let engineerEmail = null;
    if (project.assigned_engineer_id) {
      const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
      if (engineers[0]?.email) engineerEmail = engineers[0].email;
    }

    // Fetch client
    let clientEmail = null;
    if (project.client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: project.client_id });
      if (clients[0]?.email) clientEmail = clients[0].email;
    }
    if (!clientEmail) clientEmail = project.created_by;

    // ── Authorization: caller must be the project client or assigned engineer ─
    const isCallerAdmin = user.role === 'admin';
    const isClient = clientEmail === user.email;
    const isEngineer = engineerEmail === user.email;
    if (!isCallerAdmin && !isClient && !isEngineer) {
      return Response.json({ error: 'Forbidden: you are not authorized to manage calendar for this project' }, { status: 403 });
    }

    // Get Google Calendar access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Build event date (due_date is YYYY-MM-DD)
    const dueDate = milestone.due_date;
    const nextDay = new Date(dueDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];

    // Attendees
    const attendees = [];
    if (engineerEmail) attendees.push({ email: engineerEmail });
    if (clientEmail && clientEmail !== engineerEmail) attendees.push({ email: clientEmail });

    const eventBody = {
      summary: `📋 ${milestone.title} — ${project.title}`,
      description: `مرحلة المشروع: ${milestone.title}\nالمشروع: ${project.title}\nالقيمة: ${(milestone.amount || 0).toLocaleString('ar-SA')} ر.س\n\nتذكير تلقائي من منصة بيتلي`,
      start: { date: dueDate },
      end:   { date: nextDayStr },
      attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 * 3 }, // 3 days before
          { method: 'email', minutes: 24 * 60 },     // 1 day before
          { method: 'popup', minutes: 60 },           // 1 hour before
        ]
      },
      colorId: '5' // banana yellow
    };

    let eventId = null;
    let calendarRes;

    // Update existing event if it exists
    if (milestone.google_event_id) {
      calendarRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${milestone.google_event_id}`,
        { method: 'PUT', headers: authHeader, body: JSON.stringify(eventBody) }
      );
      if (calendarRes.ok) {
        const updated = await calendarRes.json();
        eventId = updated.id;
        console.log(`Calendar event updated: ${eventId}`);
      } else {
        // If update fails (event deleted), create new
        milestone.google_event_id = null;
      }
    }

    // Create new event
    if (!milestone.google_event_id) {
      calendarRes = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        { method: 'POST', headers: authHeader, body: JSON.stringify(eventBody) }
      );
      const created = await calendarRes.json();
      eventId = created.id;
      console.log(`Calendar event created: ${eventId}`);
    }

    if (!eventId) {
      const errText = await calendarRes?.text?.();
      console.error('Calendar API error:', errText);
      return Response.json({ error: 'Failed to create/update calendar event' }, { status: 500 });
    }

    // Save event ID back to milestone so we can update it later
    await base44.asServiceRole.entities.ProjectMilestone.update(milestone.id, {
      google_event_id: eventId
    });

    // In-app notifications
    const notifMsg = `📅 تم إضافة موعد تسليم المرحلة "${milestone.title}" إلى تقويم جوجل بتاريخ ${dueDate}.`;
    const notifPayloads = [];
    if (clientEmail) notifPayloads.push({ recipient_email: clientEmail, title: '📅 موعد تسليم مرحلة في التقويم', message: notifMsg, type: 'project_update', priority: 'medium', related_project_id: project.id });
    if (engineerEmail) notifPayloads.push({ recipient_email: engineerEmail, title: '📅 موعد تسليم مرحلة في التقويم', message: notifMsg, type: 'project_update', priority: 'medium', related_project_id: project.id });

    await Promise.all(notifPayloads.map(n => base44.asServiceRole.entities.Notification.create(n)));

    return Response.json({ success: true, event_id: eventId });
  } catch (error) {
    console.error('addMilestoneToCalendar error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});