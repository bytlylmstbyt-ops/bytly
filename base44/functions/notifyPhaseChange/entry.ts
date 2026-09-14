import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tracker_id, phase_label, progress } = await req.json();
    if (!tracker_id) return Response.json({ error: 'tracker_id is required' }, { status: 400 });

    // Authorization: verify the caller is assigned to / owns the tracker before notifying.
    let tracker;
    try {
      tracker = await base44.asServiceRole.entities.BuildingProgress.get(tracker_id);
    } catch {
      return Response.json({ error: 'Tracker not found' }, { status: 404 });
    }
    if (!tracker) return Response.json({ error: 'Tracker not found' }, { status: 404 });

    const isAssigned = tracker.engineer_email === user.email || tracker.client_email === user.email;
    if (!isAssigned && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: not assigned to this project' }, { status: 403 });
    }

    // Use trusted tracker data (not caller-supplied client_email/project_title) to prevent spoofing.
    const phaseLabel = String(phase_label == null ? '' : phase_label).slice(0, 120);
    const progressVal = Number(progress) || 0;

    await base44.asServiceRole.entities.Notification.create({
      recipient_email: tracker.client_email,
      title: `تحديث مرحلة البناء - ${tracker.project_title || ''}`,
      message: `تم تحديث المشروع إلى مرحلة: ${phaseLabel} (${progressVal}%)`,
      type: 'project_update',
      priority: 'high',
      related_project_id: tracker.project_id || undefined,
      action_url: `/ConstructionTracker?id=${tracker_id}`,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('notifyPhaseChange error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});