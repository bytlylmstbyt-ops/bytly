import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id, user_message, conversation_history } = await req.json();

    if (!project_id || !user_message) {
      return Response.json({ error: 'project_id and user_message are required' }, { status: 400 });
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return Response.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Fetch full project data
    const [projects, milestones, proposals, reviews] = await Promise.all([
      base44.asServiceRole.entities.Project.filter({ id: project_id }),
      base44.asServiceRole.entities.ProjectMilestone.filter({ project_id }),
      base44.asServiceRole.entities.Proposal.filter({ project_id }),
      base44.asServiceRole.entities.Review.filter({ project_id }),
    ]);

    const project = projects[0];
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // ── Authorization: verify the caller is a member of this project ─────
    const isOwner = project.created_by === user.email;
    const isAdmin = user.role === 'admin';
    let isAssignedEngineer = false;
    if (project.assigned_engineer_id) {
      const [eng] = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
      isAssignedEngineer = eng?.email === user.email;
    }
    if (!isOwner && !isAdmin && !isAssignedEngineer) {
      return Response.json({ error: 'Forbidden: no access to this project' }, { status: 403 });
    }

    // Build timeline delay analysis
    const now = new Date();
    const delayAlerts = [];

    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    const totalMilestones = milestones.length;

    milestones.forEach(m => {
      if (m.due_date && m.status !== 'completed' && m.status !== 'cancelled') {
        const due = new Date(m.due_date);
        const daysOverdue = Math.floor((now - due) / (1000 * 60 * 60 * 24));
        if (daysOverdue > 0) {
          delayAlerts.push({
            milestone: m.title || m.name || 'مرحلة',
            daysOverdue,
            status: m.status
          });
        }
      }
    });

    // Build project deadline alert
    if (project.deadline || project.end_date) {
      const deadline = new Date(project.deadline || project.end_date);
      const daysToDeadline = Math.floor((deadline - now) / (1000 * 60 * 60 * 24));
      if (daysToDeadline < 0) {
        delayAlerts.push({
          milestone: 'الموعد النهائي للمشروع',
          daysOverdue: Math.abs(daysToDeadline),
          status: 'overdue'
        });
      } else if (daysToDeadline <= 7) {
        delayAlerts.push({
          milestone: 'الموعد النهائي للمشروع',
          daysOverdue: -daysToDeadline, // negative = upcoming
          status: 'warning'
        });
      }
    }

    // Build project context for Gemini
    const projectContext = `
معلومات المشروع:
- الاسم: ${project.title || project.name || 'غير محدد'}
- الوصف: ${project.description || 'غير محدد'}
- الحالة: ${project.status || 'غير محدد'}
- التصنيف: ${project.category || 'غير محدد'}
- الموقع: ${project.location || 'غير محدد'}
- الميزانية: ${project.budget ? project.budget + ' ريال' : 'غير محددة'}
- تاريخ الإنشاء: ${project.created_date ? new Date(project.created_date).toLocaleDateString('ar-SA') : 'غير محدد'}
- الموعد النهائي: ${(project.deadline || project.end_date) ? new Date(project.deadline || project.end_date).toLocaleDateString('ar-SA') : 'غير محدد'}

المراحل (${totalMilestones} مرحلة، مكتمل منها ${completedMilestones}):
${milestones.length > 0 ? milestones.map(m => `  • ${m.title || m.name}: ${m.status} ${m.due_date ? '(موعد: ' + new Date(m.due_date).toLocaleDateString('ar-SA') + ')' : ''} ${m.amount ? '- ' + m.amount + ' ريال' : ''}`).join('\n') : '  لا توجد مراحل مسجلة'}

العروض المقدمة: ${proposals.length} عرض
التقييمات: ${reviews.length} تقييم ${reviews.length > 0 ? '(متوسط: ' + (reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length).toFixed(1) + '/5)' : ''}

${delayAlerts.length > 0 ? `⚠️ تنبيهات التأخير:
${delayAlerts.map(d => d.daysOverdue > 0 ? `  🔴 ${d.milestone}: متأخر ${d.daysOverdue} يوم` : `  🟡 ${d.milestone}: ينتهي خلال ${Math.abs(d.daysOverdue)} يوم`).join('\n')}` : '✅ لا يوجد تأخير في الجدول الزمني'}

الملفات المرفقة: ${project.attachments?.length > 0 ? project.attachments.join(', ') : 'لا توجد ملفات'}
`;

    const systemPrompt = `أنت مساعد ذكي متخصص في إدارة المشاريع الهندسية لمنصة Bytly.
مهمتك تحليل بيانات المشاريع والإجابة على أسئلة المستخدمين بدقة.

${projectContext}

قواعد الرد:
- كن دقيقاً ومختصراً (3-5 أسطر)
- استخدم البيانات الفعلية للمشروع في إجاباتك
- نبّه بوضوح إذا كان هناك تأخير أو مخاطر
- اقترح حلولاً عملية عند الحاجة
- استخدم الأرقام والتواريخ الفعلية
- اللغة: عربية واضحة ومهنية`;

    // Build conversation history for Gemini
    const historyParts = (conversation_history || []).slice(-6).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [
            ...historyParts,
            { role: 'user', parts: [{ text: user_message }] }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          }
        })
      }
    );

    if (!geminiRes.ok) {
      throw new Error(`Gemini API error: ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json();
    const botResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
      ?.replace(/\*\*(.*?)\*\*/g, '$1')
      ?.replace(/\* /g, '• ')
      ?.trim() || 'عذراً، لم أتمكن من معالجة طلبك.';

    return Response.json({
      success: true,
      response: botResponse,
      delay_alerts: delayAlerts,
      project_summary: {
        total_milestones: totalMilestones,
        completed_milestones: completedMilestones,
        progress: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
        has_delays: delayAlerts.some(d => d.daysOverdue > 0),
      }
    });

  } catch (error) {
    console.error('projectAIChatbot error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});