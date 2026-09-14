import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth guard — only authenticated users (typically admin via scheduled automation) may trigger
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    // Fetch all active (in-progress) projects
    const activeProjects = await base44.asServiceRole.entities.Project.filter({
      status: 'in_progress',
    });

    const alertsSent = [];
    const MILESTONE_DONE_STATES = ['completed', 'approved', 'firm_approved'];

    for (const project of activeProjects) {
      try {
        // ── 1. Detect delayed milestones ───────────────────────────────
        const milestones = await base44.asServiceRole.entities.ProjectMilestone.filter({
          project_id: project.id,
        });

        const now = new Date();
        const delayedMilestones = (milestones || []).filter((m) => {
          if (!m.due_date) return false;
          if (MILESTONE_DONE_STATES.includes(m.status)) return false;
          return new Date(m.due_date) < now;
        });

        // ── 2. Run AI risk analysis ────────────────────────────────────
        const riskResult = await base44.asServiceRole.functions.invoke('analyzeProjectRisks', {
          project_id: project.id,
        });

        const analysis = riskResult?.success ? riskResult.analysis : null;
        const highRisks = analysis ? (analysis.risks || []).filter((r) => r.severity === 'high') : [];
        const hasHighRisk = highRisks.length > 0 || (analysis?.overall_risk_score || 0) >= 70;

        // Skip if no delayed milestones AND no high risks
        if (delayedMilestones.length === 0 && !hasHighRisk) continue;

        // ── 3. Resolve engineer + client emails ────────────────────────
        let engineerEmail = null;
        if (project.assigned_engineer_id) {
          const [engineerUser] = await base44.asServiceRole.entities.User.filter({
            id: project.assigned_engineer_id,
          });
          engineerEmail = engineerUser?.email || null;
        }
        const clientEmail = project.created_by || null;

        if (!engineerEmail && !clientEmail) continue;

        // ── 4. Build context for consultative note ─────────────────────
        const delayedMilestonesText = delayedMilestones.length > 0
          ? delayedMilestones.map((m) =>
              `• ${m.title} — تاريخ الاستحقاق: ${new Date(m.due_date).toLocaleDateString('ar-SA')}، الحالة: ${m.status}، المبلغ: ${Number(m.amount || 0).toLocaleString('ar-SA')} ر.س`
            ).join('\n')
          : 'لا توجد مراحل متأخرة';

        const riskSummary = highRisks.length > 0
          ? highRisks.map((r) => `• ${r.title}: ${r.description}`).join('\n')
          : 'لا توجد مخاطر عالية مكتشفة';

        const mitigationStrategies = highRisks.length > 0
          ? highRisks.flatMap((r) => r.mitigation_strategies || []).map((s) => `• ${s}`).join('\n')
          : '—';

        const criticalAlerts = analysis?.critical_alerts?.length > 0
          ? analysis.critical_alerts.join('، ')
          : 'لا يوجد';

        const overallScore = analysis?.overall_risk_score ?? 0;

        // ── 5. Generate consultative note via Bytly AI ────────────────
        const consultativeResp = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `أنت Bytly AI — المستشار الهندسي الذكي من منصة بيتلي للوساطة الهندسية.
تم رصد ${delayedMilestones.length > 0 ? 'مراحل متأخرة' : 'مخاطر عالية'} في مشروع هندسي. اكتب ملاحظة استشارية احترافية وموجزة تتضمن:
1. ملخص المراحل المتأخرة (إن وجدت) مع تأثيرها على الجدول الزمني
2. ملخص المخاطر العالية المكتشفة
3. توصيات استشارية محددة وقابلة للتنفيذ للتعامل مع كل مخاطرة وتأخير
4. إجراءات وقائية فورية ينبغي اتخاذها هذا الأسبوع

بيانات المشروع:
- العنوان: ${project.title}
- درجة المخاطر الإجمالية: ${overallScore}/100

المراحل المتأخرة:
${delayedMilestonesText}

المخاطر العالية:
${riskSummary}

الإجراءات الموصى بها من التحليل:
${mitigationStrategies}

التنبيهات الحرجة: ${criticalAlerts}

اكتب الملاحظة بأسلوب استشاري احترافي ومباشر، لا تتجاوز 400 كلمة. استخدم لغة واضحة ومحددة.`,
        });

        const noteContent =
          typeof consultativeResp === 'string'
            ? consultativeResp
            : JSON.stringify(consultativeResp);

        const hasDelayedMilestones = delayedMilestones.length > 0;
        const alertTitle = hasDelayedMilestones
          ? `🚨 تأخر تسليم مرحلة — ${project.title}`
          : `🚨 تنبيه مخاطر عالية — ${project.title}`;

        const alertMessage = hasDelayedMilestones
          ? `تم رصد ${delayedMilestones.length} مرحلة متأخرة في مشروع "${project.title}". ${hasHighRisk ? `بالإضافة إلى ${highRisks.length} مخاطر عالية (الدرجة ${overallScore}/100).` : ''} تم إنشاء ملاحظة استشارية من Bytly AI تحتوي على توصيات وإجراءات وقائية فورية.`
          : `تم رصد ${highRisks.length} مخاطر عالية في مشروع "${project.title}". درجة المخاطر الإجمالية: ${overallScore}/100. تم إنشاء ملاحظة استشارية من Bytly AI تحتوي على توصيات وإجراءات وقائية فورية.`;

        const alertDesc = `تنبيه أسبوعي — ${project.title} — ${delayedMilestones.length} مراحل متأخرة، ${highRisks.length} مخاطر عالية، الدرجة ${overallScore}/100`;

        // ── 6. Send notification to the ENGINEER ──────────────────────
        if (engineerEmail) {
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: engineerEmail,
            title: alertTitle,
            message: alertMessage,
            type: 'project_update',
            related_project_id: project.id,
            priority: 'urgent',
            action_url: '/RiskDashboard',
            description: alertDesc,
          });
        }

        // ── 7. Send notification to the CLIENT ───────────────────────
        if (clientEmail) {
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: clientEmail,
            title: hasDelayedMilestones
              ? `⏰ تأخر في مشروعك — ${project.title}`
              : `⚠️ تنبيه مخاطر — ${project.title}`,
            message: hasDelayedMilestones
              ? `نود إعلامك بأن هناك ${delayedMilestones.length} مرحلة متأخرة في مشروعك "${project.title}". فريقنا الاستشاري يقوم بمتابعة الأمر وإرسال توصيات للمهندس المسؤول. يمكنك متابعة التفاصيل من لوحة التحكم.`
              : `تم رصد مخاطر عالية في مشروعك "${project.title}" (الدرجة ${overallScore}/100). تم إرسال توصيات استشارية للمهندس المسؤول ونعمل على متابعة الوضع.`,
            type: 'project_update',
            related_project_id: project.id,
            priority: hasDelayedMilestones ? 'urgent' : 'high',
            action_url: '/ProjectDetails?id=' + project.id,
            description: alertDesc,
          });
        }

        // ── 8. Store the consultative note as a bytly_advisor conversation ──
        if (engineerEmail) {
          await base44.asServiceRole.entities.ChatbotConversation.create({
            visitor_id: `risk-alert-${project.id}-${Date.now()}`,
            user_email: engineerEmail,
            project_id: project.id,
            user_type: 'engineer',
            status: 'active',
            messages: [
              {
                role: 'user',
                content: `التحليل الأسبوعي للمشروع "${project.title}" — ${delayedMilestones.length} مراحل متأخرة، درجة المخاطر: ${overallScore}/100، ${highRisks.length} مخاطر عالية.`,
                timestamp: new Date().toISOString(),
              },
              {
                role: 'assistant',
                content: noteContent,
                timestamp: new Date().toISOString(),
              },
            ],
            description: `ملاحظة استشارية تلقائية من Bytly AI — ${delayedMilestones.length} مراحل متأخرة في ${project.title} (الدرجة ${overallScore}/100)`,
          });
        }

        alertsSent.push({
          project_id: project.id,
          title: project.title,
          engineer_email: engineerEmail,
          client_email: clientEmail,
          delayed_milestones: delayedMilestones.length,
          high_risks: highRisks.length,
          overall_score: overallScore,
        });
      } catch (e) {
        console.error(`Error processing project ${project.id}:`, e.message);
      }
    }

    return Response.json({
      success: true,
      analyzed: activeProjects.length,
      alerts_sent: alertsSent.length,
      alerts: alertsSent,
    });
  } catch (error) {
    console.error('Weekly risk alert processor error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});