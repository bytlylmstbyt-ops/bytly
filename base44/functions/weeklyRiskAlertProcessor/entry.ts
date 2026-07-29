import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all active (in-progress) projects
    const activeProjects = await base44.asServiceRole.entities.Project.filter({
      status: 'in_progress',
    });

    const alertsSent = [];

    for (const project of activeProjects) {
      if (!project.assigned_engineer_id) continue;

      try {
        // Run risk analysis for this project
        const result = await base44.asServiceRole.functions.invoke('analyzeProjectRisks', {
          project_id: project.id,
        });

        if (!result?.success || !result?.analysis) continue;

        const analysis = result.analysis;
        const highRisks = (analysis.risks || []).filter((r) => r.severity === 'high');
        const hasHighRisk = highRisks.length > 0 || (analysis.overall_risk_score || 0) >= 70;

        if (!hasHighRisk) continue;

        // Get the responsible engineer's email
        const [engineerUser] = await base44.asServiceRole.entities.User.filter({
          id: project.assigned_engineer_id,
        });
        if (!engineerUser?.email) continue;

        const riskSummary = highRisks
          .map((r) => `• ${r.title}: ${r.description}`)
          .join('\n');
        const mitigationStrategies = highRisks
          .flatMap((r) => r.mitigation_strategies || [])
          .map((s) => `• ${s}`)
          .join('\n');
        const criticalAlerts = (analysis.critical_alerts || []).join('، ');

        // Generate consultative note via bytly_advisor persona
        const consultativeResp = await base44.integrations.Core.InvokeLLM({
          prompt: `أنت Bytly AI — المستشار الهندسي الذكي من منصة بيتلي للوساطة الهندسية.
تم رصد مخاطر عالية في مشروع هندسي تحت إشراف مهندس. اكتب ملاحظة استشارية احترافية وموجزة للمهندس المسؤول تتضمن:
1. ملخص المخاطر العالية المكتشفة
2. توصيات استشارية محددة وقابلة للتنفيذ للتعامل مع كل مخاطرة
3. إجراءات وقائية فورية ينبغي اتخاذها هذا الأسبوع

بيانات المشروع:
- العنوان: ${project.title}
- درجة المخاطر الإجمالية: ${analysis.overall_risk_score}/100
- المخاطر العالية:
${riskSummary || '—'}

الإجراءات الموصى بها من التحليل:
${mitigationStrategies || '—'}

التنبيهات الحرجة: ${criticalAlerts || 'لا يوجد'}

اكتب الملاحظة بأسلوب استشاري احترافي ومباشر، لا تتجاوز 350 كلمة. استخدم لغة واضحة ومحددة.`,
        });

        const noteContent =
          typeof consultativeResp === 'string'
            ? consultativeResp
            : JSON.stringify(consultativeResp);

        // 1. Send urgent notification to the engineer
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: engineerUser.email,
          title: `🚨 تنبيه مخاطر عالية — ${project.title}`,
          message: `تم رصد ${highRisks.length} مخاطر عالية في مشروعك. درجة المخاطر الإجمالية: ${analysis.overall_risk_score}/100. تم إنشاء ملاحظة استشارية من Bytly AI تحتوي على توصيات وإجراءات وقائية فورية.`,
          type: 'project_update',
          related_project_id: project.id,
          priority: 'urgent',
          action_url: '/RiskDashboard',
          description: `تنبيه مخاطر أسبوعي — ${project.title} — ${highRisks.length} مخاطر عالية، الدرجة ${analysis.overall_risk_score}/100`,
        });

        // 2. Store the consultative note as a bytly_advisor conversation
        await base44.asServiceRole.entities.ChatbotConversation.create({
          visitor_id: `risk-alert-${project.id}-${Date.now()}`,
          user_email: engineerUser.email,
          project_id: project.id,
          user_type: 'engineer',
          status: 'active',
          messages: [
            {
              role: 'user',
              content: `تحليل المخاطر الأسبوعي للمشروع "${project.title}" — درجة المخاطر: ${analysis.overall_risk_score}/100، ${highRisks.length} مخاطر عالية مكتشفة.`,
              timestamp: new Date().toISOString(),
            },
            {
              role: 'assistant',
              content: noteContent,
              timestamp: new Date().toISOString(),
            },
          ],
          description: `ملاحظة استشارية تلقائية من Bytly AI — مخاطر عالية في ${project.title} (الدرجة ${analysis.overall_risk_score}/100)`,
        });

        alertsSent.push({
          project_id: project.id,
          title: project.title,
          engineer_email: engineerUser.email,
          high_risks: highRisks.length,
          overall_score: analysis.overall_risk_score,
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