import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { project_id, project_title, attendee_emails = [], scheduled_time, topic } = await req.json();
    const isAdmin = user.role === 'admin';

    // ── Authorization: project_id is required for non-admin users (no ad-hoc relay) ──
    if (!project_id && !isAdmin) {
      return Response.json({ error: 'project_id is required to create a meeting' }, { status: 400 });
    }

    let project = null;
    const authorizedEmails = new Set<string>();

    if (project_id) {
      const [proj] = await base44.asServiceRole.entities.Project.filter({ id: project_id });
      if (!proj) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }
      project = proj;

      // Verify the caller is a participant of this project
      const isOwner = project.created_by === user.email;
      let isAssignedEngineer = false;
      if (project.assigned_engineer_id) {
        const [eng] = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
        isAssignedEngineer = eng?.email === user.email;
        if (eng?.email) authorizedEmails.add(eng.email.toLowerCase());
      }
      if (!isOwner && !isAdmin && !isAssignedEngineer) {
        return Response.json({ error: 'Forbidden: you are not a participant of this project' }, { status: 403 });
      }

      // Build the authorized participant email set from verified DB records
      if (project.created_by) authorizedEmails.add(project.created_by.toLowerCase());
      if (project.technical_consultant_id) {
        const [tc] = await base44.asServiceRole.entities.Consultant.filter({ id: project.technical_consultant_id });
        if (tc?.email) authorizedEmails.add(tc.email.toLowerCase());
      }
      if (project.legal_consultant_id) {
        const [lc] = await base44.asServiceRole.entities.LegalConsultant.filter({ id: project.legal_consultant_id });
        if (lc?.email) authorizedEmails.add(lc.email.toLowerCase());
      }
    }

    // ── Validate attendees: every invitee must be an authorized project participant ──
    const normalizedAttendees = (attendee_emails || [])
      .map((e: string) => String(e || '').trim().toLowerCase())
      .filter(Boolean);

    if (project_id) {
      const unauthorized = normalizedAttendees.filter((e) => !authorizedEmails.has(e));
      if (unauthorized.length > 0) {
        return Response.json(
          { error: 'Forbidden: attendee emails must belong to authorized project members', unauthorized },
          { status: 403 }
        );
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
      attendees: normalizedAttendees.map(email => ({ email })),
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