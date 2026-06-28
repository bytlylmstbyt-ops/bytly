import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { event, data } = body;

    if (event?.type !== 'update') return Response.json({ ok: true });

    const progress = data;
    if (!progress?.client_email || !progress?.current_stage) return Response.json({ ok: true });

    const stageLabels = {
      design: 'التصميم المعماري',
      permits: 'استخراج الرخص',
      foundation: 'أعمال الأساسات',
      structure: 'الهيكل الإنشائي',
      finishing: 'التشطيبات',
      handover: 'التسليم النهائي'
    };

    const stageLabel = stageLabels[progress.current_stage] || progress.current_stage;

    // Send notification to client
    await base44.asServiceRole.entities.Notification.create({
      user_email: progress.client_email,
      title: `تحديث مشروعك: ${progress.project_title || 'مشروعك'}`,
      message: `تم تحديث مرحلة البناء إلى: ${stageLabel} (${progress.overall_progress || 0}% إنجاز)${progress.last_update_note ? '\n' + progress.last_update_note : ''}`,
      type: 'project_update',
      priority: 'high',
      is_read: false,
      related_id: progress.project_id,
      related_type: 'building_progress'
    });

    // Send email notification
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: progress.client_email,
      subject: `تحديث مشروعك - ${stageLabel}`,
      body: `
        <div dir="rtl" style="font-family: Arial; padding: 20px; background: #f9f9f9;">
          <h2 style="color: #4A3F35;">تحديث تقدم البناء</h2>
          <p>مرحباً،</p>
          <p>تم تحديث حالة مشروعك <strong>${progress.project_title || ''}</strong></p>
          <div style="background: #fff; border-right: 4px solid #C9A66B; padding: 15px; margin: 15px 0; border-radius: 8px;">
            <p><strong>المرحلة الحالية:</strong> ${stageLabel}</p>
            <p><strong>نسبة الإنجاز:</strong> ${progress.overall_progress || 0}%</p>
            ${progress.last_update_note ? `<p><strong>ملاحظات المهندس:</strong> ${progress.last_update_note}</p>` : ''}
          </div>
          <p>يمكنك متابعة التفاصيل عبر لوحة التحكم.</p>
        </div>
      `
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('notifyBuildingProgress error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});