import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tracker_id, phase_label, progress, client_email, project_title } = await req.json();

    // Send notification to client
    await base44.asServiceRole.entities.Notification.create({
      user_email: client_email,
      title: `تحديث مرحلة البناء - ${project_title}`,
      message: `تم تحديث المشروع إلى مرحلة: ${phase_label} (${progress}%)`,
      type: 'project_update',
      priority: 'high',
      is_read: false,
      link: `/ConstructionTracker?id=${tracker_id}`
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('notifyPhaseChange error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});