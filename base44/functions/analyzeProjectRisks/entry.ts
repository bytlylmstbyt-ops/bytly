import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Always require admin authentication — scheduled automations run with admin context
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    // Support both: scheduled automation (no body) and manual call (with project_id)
    let project_id = null;
    try {
      const body = await req.json();
      project_id = body?.project_id;
    } catch (_) {
      // No body - running as scheduled automation
    }

    // Scheduled mode: analyze ALL active projects
    if (!project_id) {
      const activeProjects = await base44.asServiceRole.entities.Project.filter({ status: 'in_progress' });
      const results = [];

      for (const proj of activeProjects) {
        try {
          const res = await base44.asServiceRole.functions.invoke('analyzeProjectRisks', { project_id: proj.id });
          results.push({ project_id: proj.id, title: proj.title, success: true });
        } catch (e) {
          results.push({ project_id: proj.id, title: proj.title, success: false, error: e.message });
        }
      }

      return Response.json({ success: true, mode: 'scheduled', analyzed: results.length, results });
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

    const remainingDays = scheduledDays - daysElapsed;
    const burnRate = daysElapsed > 0 ? (completionRate / daysElapsed * scheduledDays) : 0;
    const projectedCompletion = burnRate > 0 ? 100 / burnRate * scheduledDays : scheduledDays;
    const budgetBurnRate = daysElapsed > 0 ? (budgetUtilization / daysElapsed) * scheduledDays : 0;

    const prompt = `أنت محلل متخصص في إدارة المشاريع الهندسية. حلل بيانات المشروع التالي وحدد المخاطر الحالية والتوقعات التنبؤية للمخاطر المستقبلية:

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
- الأيام المتبقية: ${remainingDays}
- معدل الإنجاز المتوقع: ${burnRate.toFixed(1)}% يومياً
- التوقع: سيكتمل المشروع بعد ${projectedCompletion.toFixed(0)} يوماً
- معدل استهلاك الميزانية المتوقع: ${budgetBurnRate.toFixed(1)}%

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
  "summary": "ملخص عام",
  "forecast": {
    "next_7_days": {
      "predicted_risks": [
        {
          "title": "عنوان المخاطرة المتوقعة",
          "probability": <0-100>,
          "category": "delays|budget|scope|satisfaction",
          "trigger": "السبب المتوقع لظهور المخاطرة"
        }
      ],
      "recommended_actions": ["إجراء وقائي 1", "إجراء وقائي 2"]
    },
    "next_14_days": {
      "predicted_risks": [
        {
          "title": "عنوان المخاطرة المتوقعة",
          "probability": <0-100>,
          "category": "delays|budget|scope|satisfaction",
          "trigger": "السبب المتوقع"
        }
      ],
      "recommended_actions": ["إجراء وقائي 1"]
    },
    "trend": "improving|stable|deteriorating",
    "confidence_level": <0-100>,
    "estimated_completion_date": "YYYY-MM-DD أو null إذا يتعذر التحديد",
    "estimated_final_budget": <number - التوقع النهائي للتكلفة>
  }
}

اعتمد على:
1. المهام المتأخرة -> خطر تأخير
2. استخدام الميزانية > 80% -> خطر تجاوز الميزانية
3. الفرق بين المهام المخطط لها والمكتملة -> خطر زحف النطاق
4. قلة الرسائل أو رسائل سلبية -> خطر عدم رضا العميل
5. معدل الإنجاز مقابل الأيام المتبقية -> توقع التأخير
6. معدل استهلاك الميزانية -> توقع تجاوز التكلفة
7. الأنماط الزمنية -> التوقعات للمستقبل القريب (7 و 14 يوماً)`;

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
          summary: { type: "string" },
          forecast: {
            type: "object",
            properties: {
              next_7_days: {
                type: "object",
                properties: {
                  predicted_risks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        probability: { type: "number" },
                        category: { type: "string" },
                        trigger: { type: "string" }
                      }
                    }
                  },
                  recommended_actions: { type: "array", items: { type: "string" } }
                }
              },
              next_14_days: {
                type: "object",
                properties: {
                  predicted_risks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        probability: { type: "number" },
                        category: { type: "string" },
                        trigger: { type: "string" }
                      }
                    }
                  },
                  recommended_actions: { type: "array", items: { type: "string" } }
                }
              },
              trend: { type: "string" },
              confidence_level: { type: "number" },
              estimated_completion_date: { type: "string" },
              estimated_final_budget: { type: "number" }
            }
          }
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