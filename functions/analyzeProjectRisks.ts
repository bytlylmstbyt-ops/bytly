import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { project_id } = await req.json();

    if (!project_id) {
      return Response.json({ error: 'Missing project_id' }, { status: 400 });
    }

    // Fetch comprehensive project data
    const [project] = await base44.asServiceRole.entities.Project.filter({ id: project_id });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const tasks = await base44.asServiceRole.entities.ProjectTask.filter({ project_id });
    const messages = await base44.asServiceRole.entities.Message.filter({ project_id });
    const milestones = await base44.asServiceRole.entities.ProjectMilestone.filter({ project_id });
    const invoices = await base44.asServiceRole.entities.Invoice.filter({ project_id });
    const [satisfaction] = await base44.asServiceRole.entities.ChatbotConversation.filter({ project_id });

    // Calculate metrics
    const overdueTasks = tasks.filter(t => {
      const dueDate = new Date(t.due_date);
      return dueDate < new Date() && t.status !== 'done';
    });

    const completionRate = tasks.length > 0 ? (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0;
    const milestonesOnTime = milestones.filter(m => {
      const dueDate = new Date(m.due_date);
      return m.completion_date ? new Date(m.completion_date) <= dueDate : dueDate > new Date();
    }).length;

    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const budgetUtilization = project.budget ? (totalInvoiced / project.budget) * 100 : 0;
    const daysElapsed = Math.floor((Date.now() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24));
    const scheduledDays = Math.floor((new Date(project.deadline).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24));
    const scheduleHealth = ((scheduledDays - daysElapsed) / scheduledDays) * 100;

    const prompt = `أنت محلل متخصص في إدارة المشاريع. حلل بيانات المشروع التالي وحدد المخاطر المحتملة:

معلومات المشروع:
- العنوان: ${project.title}
- الميزانية: ${project.budget} ريال
- الموعد النهائي: ${project.deadline}
- حالة المشروع: ${project.status}
- نسبة الإنجاز: ${completionRate.toFixed(1)}%

البيانات الحالية:
- عدد المهام المتأخرة: ${overdueTasks.length}
- إجمالي المهام: ${tasks.length}
- المراحل في الموعد: ${milestonesOnTime}/${milestones.length}
- استخدام الميزانية: ${budgetUtilization.toFixed(1)}%
- صحة الجدول الزمني: ${scheduleHealth.toFixed(1)}%
- عدد الرسائل: ${messages.length}
- أيام مضت: ${daysElapsed}/${scheduledDays}

قدم التحليل كـ JSON مع الحقول التالية:
{
  "risks": [
    {
      "category": "delays|budget|scope|satisfaction",
      "severity": "high|medium|low",
      "title": "عنوان المخاطرة",
      "description": "وصف تفصيلي",
      "probability": <0-100>,
      "impact": "number",
      "mitigation_strategies": ["strategy1", "strategy2"]
    }
  ],
  "overall_risk_score": <0-100>,
  "critical_alerts": ["alert1", "alert2"],
  "summary": "ملخص عام"
}

اعتمد على:
1. المهام المتأخرة -> خطر تأخير
2. استخدام الميزانية > 80% -> خطر تجاوز الميزانية
3. الفرق بين المهام المخطط لها والمكتملة -> خطر زحف النطاق
4. قلة الرسائل أو رسائل سلبية -> خطر عدم رضا العميل`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          risks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                severity: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                probability: { type: "number" },
                impact: { type: "number" },
                mitigation_strategies: { type: "array", items: { type: "string" } }
              }
            }
          },
          overall_risk_score: { type: "number" },
          critical_alerts: { type: "array", items: { type: "string" } },
          summary: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      analysis,
      metrics: {
        completion_rate: completionRate,
        overdue_tasks: overdueTasks.length,
        budget_utilization: budgetUtilization,
        schedule_health: scheduleHealth,
        milestones_on_time: milestonesOnTime,
        days_elapsed: daysElapsed,
        days_scheduled: scheduledDays
      }
    });
  } catch (error) {
    console.error('Risk analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});