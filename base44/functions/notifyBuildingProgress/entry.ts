import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

function escapeHtml(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

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

    // جلب السجل الموثوق من قاعدة البيانات بدلاً من الثقة بالحقول المرسلة في الطلب
    const progressId = data?.id;
    if (!progressId) return Response.json({ ok: true });

    let progress;
    try {
      progress = await base44.asServiceRole.entities.BuildingProgress.get(progressId);
    } catch {
      return Response.json({ error: 'Building progress not found' }, { status: 404 });
    }
    if (!progress) return Response.json({ ok: true });
    if (!progress.client_email || !progress.current_stage) return Response.json({ ok: true });

    // التحقق من الملكية: عند الاستدعاء المباشر من مستخدم حقيقي، يجب أن يكون
    // المهندس أو المالك المعيّن لهذا المشروع (أو أدمن). الاستدعاءات عبر سير العمل
    // (سياق service-role) تتجاوز هذا الفحص لأن البيانات موثوقة من قاعدة البيانات.
    let actor = null;
    try { actor = await base44.auth.me(); } catch {}
    if (actor && actor.email) {
      const isAssigned = progress.engineer_email === actor.email || progress.client_email === actor.email;
      if (!isAssigned && actor.role !== 'admin') {
        return Response.json({ error: 'Forbidden: not assigned to this project' }, { status: 403 });
      }
    }

    const stageLabels = {
      design: 'التصميم المعماري',
      permits: 'استخراج الرخص',
      foundation: 'أعمال الأساسات',
      structure: 'الهيكل الإنشائي',
      finishing: 'التشطيبات',
      handover: 'التسليم النهائي'
    };

    const stageLabel = stageLabels[progress.current_stage] || progress.current_stage;

    // إرسال الإشعار للعميل (البريد المستلم موثوق من السجل)
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: progress.client_email,
      title: `تحديث مشروعك: ${progress.project_title || 'مشروعك'}`,
      message: `تم تحديث مرحلة البناء إلى: ${stageLabel} (${progress.overall_progress || 0}% إنجاز)${progress.last_update_note ? '\n' + progress.last_update_note : ''}`,
      type: 'project_update',
      priority: 'high',
      is_read: false,
      related_project_id: progress.project_id || undefined,
      action_url: `/ConstructionTracker?id=${progressId}`,
    });

    // إرسال بريد الإشعار
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: progress.client_email,
      subject: `تحديث مشروعك - ${stageLabel}`,
      body: `
        <div dir="rtl" style="font-family: Arial; padding: 20px; background: #f9f9f9;">
          <h2 style="color: #4A3F35;">تحديث تقدم البناء</h2>
          <p>مرحباً،</p>
          <p>تم تحديث حالة مشروعك <strong>${escapeHtml(progress.project_title || '')}</strong></p>
          <div style="background: #fff; border-right: 4px solid #C9A66B; padding: 15px; margin: 15px 0; border-radius: 8px;">
            <p><strong>المرحلة الحالية:</strong> ${escapeHtml(stageLabel)}</p>
            <p><strong>نسبة الإنجاز:</strong> ${progress.overall_progress || 0}%</p>
            ${progress.last_update_note ? `<p><strong>ملاحظات المهندس:</strong> ${escapeHtml(progress.last_update_note)}</p>` : ''}
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