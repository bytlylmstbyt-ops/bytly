import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

// Map project category -> engineer user_type (specialization tier)
const CATEGORY_TO_USER_TYPE = {
  interior: 'engineer',
  architecture: 'architect',
  painting: 'painter',
  landscape: 'architect',
  furniture: 'engineer',
  lighting: 'engineer',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ── Authentication: reject unauthenticated requests ────────────────
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await req.json().catch(() => ({}));
    if (!projectId) {
      return Response.json({ error: 'projectId required' }, { status: 400 });
    }

    let project;
    try {
      project = await base44.asServiceRole.entities.Project.get(projectId);
    } catch {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // ── Authorization: only the project owner or an admin can trigger matching ──
    const isOwner = project.created_by === user.email;
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return Response.json({ error: 'Forbidden: only the project owner can trigger matching' }, { status: 403 });
    }

    // Direct-hire projects only notify the assigned engineer (handled by the caller)
    if (project.is_direct_hire) {
      return Response.json({ success: true, notified: 0, reason: 'direct_hire' });
    }

    const targetType = CATEGORY_TO_USER_TYPE[project.category];
    if (!targetType) {
      return Response.json({ success: true, notified: 0, reason: 'no_matching_type' });
    }

    const engineers = await base44.asServiceRole.entities.Engineer.filter({ status: 'approved' });
    const matched = (engineers || []).filter(eng => eng.user_type === targetType);

    if (matched.length === 0) {
      return Response.json({ success: true, notified: 0 });
    }

    const budgetTxt = (project.budget_min || project.budget_max)
      ? `${project.budget_min || 0} - ${project.budget_max || 0} ريال`
      : 'غير محدد';

    const notifications = matched.map(eng => ({
      recipient_email: eng.email,
      title: 'مشروع جديد مطابق لتخصصك',
      message: `تم نشر مشروع جديد: "${project.title}" في تخصص يطابق مهاراتك. الميزانية: ${budgetTxt}.`,
      type: 'project_update',
      related_project_id: project.id,
      action_url: `/ProjectDetails?id=${project.id}`,
      priority: 'high',
      description: `إشعار مطابقة لمشروع ${project.category} للمهندس ${eng.full_name}`,
    }));

    const created = await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
    return Response.json({ success: true, notified: created.length });
  } catch (error) {
    console.error('notifyMatchingEngineers error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});