import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      interaction_id,
      client_email,
      project_id,
      sentiment_score,
      concerns,
      interaction_type
    } = await req.json();

    if (!interaction_id || !client_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine meeting type and urgency based on sentiment and concerns
    let meetingType = 'status_update';
    let daysUntilMeeting = 7;
    let urgent = false;

    if (sentiment_score < -0.3) {
      // Negative sentiment - urgent review
      meetingType = 'problem_solving';
      daysUntilMeeting = 1;
      urgent = true;
    } else if (concerns && concerns.length > 0) {
      // Has concerns
      meetingType = 'feedback';
      daysUntilMeeting = 3;
    } else if (interaction_type === 'call' || interaction_type === 'meeting') {
      // Regular status update
      meetingType = 'status_update';
      daysUntilMeeting = 7;
    }

    // Calculate scheduled date
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + daysUntilMeeting);

    // Get project details
    const projects = await base44.asServiceRole.entities.Project.filter({ id: project_id });
    const project = projects[0];

    const meetingDescription = `متابعة تلقائية - ${meetingType === 'problem_solving' ? 'حل مشاكل عاجل' : 'تحديث الحالة والمتطلبات'}`;

    // Create follow-up meeting
    const meeting = await base44.asServiceRole.entities.FollowUpMeeting.create({
      client_email,
      project_id,
      interaction_id,
      meeting_type: meetingType,
      title: `${meetingType === 'problem_solving' ? 'اجتماع حل المشاكل' : 'اجتماع المتابعة'} - ${project?.title || 'مشروع'}`,
      description: meetingDescription,
      scheduled_date: scheduledDate.toISOString(),
      scheduled_reason: concerns ? `القضايا: ${concerns.join(', ')}` : 'متابعة دورية',
      auto_scheduled: true,
      status: 'scheduled'
    });

    return Response.json({
      success: true,
      meeting,
      urgent,
      scheduled_date: scheduledDate.toISOString()
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});