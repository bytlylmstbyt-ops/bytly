import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { project_id } = await req.json();

    if (!project_id) {
      return Response.json({ error: 'Missing project_id' }, { status: 400 });
    }

    // Fetch project and related data
    const [project] = await base44.asServiceRole.entities.Project.filter({ id: project_id });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const tasks = await base44.asServiceRole.entities.ProjectTask.filter({ project_id });
    const messages = await base44.asServiceRole.entities.Message.filter({ project_id });
    const milestones = await base44.asServiceRole.entities.ProjectMilestone.filter({ project_id });

    // Prepare context for LLM
    const projectContext = {
      title: project.title,
      description: project.description,
      status: project.status,
      budget: project.budget,
      progress: project.progress,
      start_date: project.start_date,
      deadline: project.deadline,
      tasks_count: tasks.length,
      completed_tasks: tasks.filter(t => t.status === 'done').length,
      messages_count: messages.length,
      milestones_completed: milestones.filter(m => m.status === 'completed').length,
      total_milestones: milestones.length
    };

    const prompt = `أنت مساعد متخصص في كتابة تقارير المشاريع بالعربية. اكتب ملخص تحديث شامل وشخصي للمشروع التالي:
    
العنوان: ${projectContext.title}
الوصف: ${projectContext.description}
الحالة: ${projectContext.status}
الميزانية: ${projectContext.budget} ريال
نسبة التقدم: ${projectContext.progress}%
المهام المكتملة: ${projectContext.completed_tasks}/${projectContext.tasks_count}
المراحل المكتملة: ${projectContext.milestones_completed}/${projectContext.total_milestones}

اكتب ملخصاً موجزاً (3-4 فقرات) يتضمن:
1. ملخص التقدم الحالي
2. المهام المكتملة والمعلقة
3. الخطوات التالية
4. أي تنبيهات مهمة

اكتب بأسلوب احترافي وودود مناسب للعميل.`;

    const summary = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false
    });

    return Response.json({
      success: true,
      summary,
      projectContext
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});