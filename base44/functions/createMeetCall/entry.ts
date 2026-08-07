import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { project_id, project_title, attendee_emails = [], scheduled_time } = await req.json();

    if (!project_id) {
      return Response.json({ error: 'project_id required' }, { status: 400 });
    }

    // ── Authorization: verify the caller is a participant of the project ──
    const [project] = await base44.asServiceRole.entities.Project.filter({ id: project_id });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const isOwner = project.created_by === user.email;
    const isAdmin = user.role === 'admin';
    let isAssignedEngineer = false;
    if (project.assigned_engineer_id) {
      const [eng] = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
      isAssignedEngineer = eng?.email === user.email;
    }
    if (!isOwner && !isAdmin && !isAssignedEngineer) {
      return Response.json({ error: 'Forbidden: you are not a participant of this project' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    // Schedule 30 min from now if no time provided
    const startTime = scheduled_time ? new Date(scheduled_time) : new Date(Date.now() + 30 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    const eventBody = {
      summary: `تحديث مشروع: ${project_title || 'مشروع بيتلي'}`,
      description: `اجتماع تحديث دوري لمشروع Bytly رقم: ${project_id}\n\nينشئ تلقائياً عبر منصة بيتلي`,
      start: { dateTime: startTime.toISOString(), timeZone: 'Asia/Riyadh' },
      end:   { dateTime: endTime.toISOString(),   timeZone: 'Asia/Riyadh' },
      attendees: attendee_emails.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `bytly-${project_id}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    const res = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(eventBody)
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return Response.json({ error: err.error?.message || 'Calendar API error' }, { status: 500 });
    }

    const event = await res.json();
    const meetLink = event.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri
                  || event.hangoutLink;

    return Response.json({
      meet_link: meetLink,
      event_id: event.id,
      event_link: event.htmlLink,
      start_time: event.start.dateTime,
      end_time: event.end.dateTime
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});