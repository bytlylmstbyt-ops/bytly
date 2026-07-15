import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const STATUS_LABELS = {
  todo: 'للقيام به',
  in_progress: 'قيد التنفيذ',
  review: 'قيد المراجعة',
  done: 'مكتمل'
};

const PRIORITY_LABELS = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة'
};

const FIELD_LABELS = {
  status: 'الحالة',
  title: 'العنوان',
  description: 'الوصف',
  priority: 'الأولوية',
  due_date: 'تاريخ الاستحقاق',
  assigned_to: 'المسؤول',
  progress_percentage: 'نسبة الإنجاز',
  start_date: 'تاريخ البدء',
  completion_date: 'تاريخ الإنجاز'
};

function formatValue(field, value) {
  if (value === null || value === undefined || value === '') return '—';
  if (field === 'status') return STATUS_LABELS[value] || value;
  if (field === 'priority') return PRIORITY_LABELS[value] || value;
  if (field === 'due_date' || field === 'start_date' || field === 'completion_date') {
    try { return new Date(value).toLocaleDateString('ar-SA'); } catch { return String(value); }
  }
  return String(value);
}

function buildSummary(actionType, changedFields, data, oldData) {
  if (actionType === 'created') {
    return `تم إنشاء المهمة "${data.title}"`;
  }
  if (actionType === 'deleted') {
    return `تم حذف المهمة "${oldData?.title || data?.title || ''}"`;
  }
  const summaries = [];
  for (const field of changedFields) {
    const label = FIELD_LABELS[field] || field;
    const oldVal = formatValue(field, oldData?.[field]);
    const newVal = formatValue(field, data?.[field]);
    summaries.push(`${label}: ${oldVal} ← ${newVal}`);
  }
  return summaries.join('، ');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { event, data, old_data, changed_fields } = body;

    if (!event || event.entity_name !== 'ProjectTask') {
      return Response.json({ skipped: true, reason: 'not_a_project_task' });
    }

    const taskId = event.entity_id;
    if (!taskId) return Response.json({ skipped: true, reason: 'no_task_id' });

    const projectId = (data?.project_id) || (old_data?.project_id);
    if (!projectId) return Response.json({ skipped: true, reason: 'no_project_id' });

    let actorEmail = data?.created_by || old_data?.created_by || 'system';

    // Try to resolve actor name from User entity
    let actorName = '';
    try {
      const users = await base44.asServiceRole.entities.User.filter({ email: actorEmail });
      actorName = users[0]?.full_name || actorEmail;
    } catch {
      actorName = actorEmail;
    }

    if (event.type === 'create') {
      const summary = buildSummary('created', ['title'], data, null);
      await base44.asServiceRole.entities.TaskActivityLog.create({
        project_id: projectId,
        task_id: taskId,
        task_title: data.title || '',
        actor_email: actorEmail,
        actor_name: actorName,
        action_type: 'created',
        summary,
        description: `أنشأ ${actorName} المهمة "${data.title}" في المشروع.`
      });
      return Response.json({ success: true, logged: 'created' });
    }

    if (event.type === 'update' && old_data) {
      const fields = changed_fields || [];
      // Filter to meaningful fields only
      const meaningfulFields = fields.filter(f =>
        FIELD_LABELS[f] || ['status', 'title', 'description', 'priority', 'due_date', 'assigned_to', 'progress_percentage'].includes(f)
      );

      if (meaningfulFields.length === 0) {
        return Response.json({ skipped: true, reason: 'no_meaningful_changes' });
      }

      // If status changed, create a dedicated status_changed entry
      if (meaningfulFields.includes('status')) {
        const oldStatus = formatValue('status', old_data.status);
        const newStatus = formatValue('status', data.status);
        await base44.asServiceRole.entities.TaskActivityLog.create({
          project_id: projectId,
          task_id: taskId,
          task_title: data.title || old_data.title || '',
          actor_email: actorEmail,
          actor_name: actorName,
          action_type: 'status_changed',
          field_name: 'status',
          old_value: oldStatus,
          new_value: newStatus,
          summary: `تغيير الحالة: ${oldStatus} ← ${newStatus}`,
          description: `غيّر ${actorName} حالة المهمة "${data.title || old_data.title}" من "${oldStatus}" إلى "${newStatus}".`
        });
      }

      // Log other field changes as a single 'updated' entry
      const otherFields = meaningfulFields.filter(f => f !== 'status');
      if (otherFields.length > 0) {
        const summary = buildSummary('updated', otherFields, data, old_data);
        await base44.asServiceRole.entities.TaskActivityLog.create({
          project_id: projectId,
          task_id: taskId,
          task_title: data.title || old_data.title || '',
          actor_email: actorEmail,
          actor_name: actorName,
          action_type: 'updated',
          summary,
          description: `عدّل ${actorName} المهمة "${data.title || old_data.title}": ${summary}.`
        });
      }

      return Response.json({ success: true, logged: 'updated', fields: meaningfulFields });
    }

    if (event.type === 'delete') {
      const summary = buildSummary('deleted', [], null, old_data);
      await base44.asServiceRole.entities.TaskActivityLog.create({
        project_id: projectId,
        task_id: taskId,
        task_title: old_data?.title || '',
        actor_email: actorEmail,
        actor_name: actorName,
        action_type: 'deleted',
        summary,
        description: `حذف ${actorName} المهمة "${old_data?.title || ''}".`
      });
      return Response.json({ success: true, logged: 'deleted' });
    }

    return Response.json({ skipped: true, reason: 'unhandled_event_type' });
  } catch (error) {
    console.error('logTaskActivity error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});