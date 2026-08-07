import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { project_id, project_title, attendee_emails = [], scheduled_time, topic } = await req.json();

    let project = null;

    // ── Authorization: if a project_id is provided, verify the caller is a participant ──
    if (project_id) {
      const [proj] = await base44.asServiceRole.entities.Project.filter({ id: project_id });
      if (!proj) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }
      project = proj;

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
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    // Schedule 30 min from now if no time provided
    const startTime = scheduled_time ? new Date(scheduled_time) : new Date(Date.now() + 30 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    const meetingRef = project_id || `adhoc-${Date.now()}`;
    const summary = topic || (project ? `تحديث مشروع: ${project.title || project_title || 'مشروع بيتلي'}` : 'مناقشة عميل — بيتلي');
    const description = project
      ? `اجتماع تحديث دوري لمشروع Bytly رقم: ${project_id}\n\nينشأ تلقائياً عبر منصة بيتلي`
      : `مناقشة مع العميل عبر منصة بيتلي\n\nأُنشئ بواسطة: ${user.email}`;

    const eventBody = {
      summary,
      description,
      start: { dateTime: startTime.toISOString(), timeZone: 'Asia/Riyadh' },
      end:   { dateTime: endTime.toISOString(),   timeZone: 'Asia/Riyadh' },
      attendees: attendee_emails.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `bytly-${meetingRef}-${Date.now()}`,
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