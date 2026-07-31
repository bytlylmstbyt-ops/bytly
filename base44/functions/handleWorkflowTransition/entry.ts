import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_id, from_stage_id, to_stage_id, project_id, approval_notes } = await req.json();

    // Get workflow and project data
    const [workflowData] = await base44.asServiceRole.entities.ProjectWorkflow.filter({ id: workflow_id });
    const [projectData] = await base44.asServiceRole.entities.Project.filter({ id: project_id });

    if (!workflowData || !projectData) {
      return Response.json({ error: 'Workflow or project not found' }, { status: 404 });
    }

    // Authorization: only the project owner, assigned engineer, or an admin may transition stages.
    let assignedEngineerEmail = null;
    if (projectData.assigned_engineer_id) {
      const [assignedEngineer] = await base44.asServiceRole.entities.Engineer.filter({ id: projectData.assigned_engineer_id });
      assignedEngineerEmail = assignedEngineer?.email || null;
    }
    const isAuthorized = user.email === projectData.created_by ||
      (assignedEngineerEmail && user.email === assignedEngineerEmail) ||
      user.role === 'admin';
    if (!isAuthorized) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const toStage = workflowData.stages.find(s => s.stage_id === to_stage_id);

    // Check if approval is required
    if (toStage?.requires_approval) {
      // Create approval request
      const approvalData = {
        workflow_id,
        project_id,
        stage_id: to_stage_id,
        requested_from: toStage.approval_from === 'client' ? projectData.created_by : projectData.assigned_engineer_id,
        requested_by: user.email,
        approval_type: toStage.approval_from === 'client' ? 'client' : 'engineer',
        status: 'pending',
        completion_checklist: toStage.completion_tasks?.map(task => ({
          task_id: `task_${Date.now()}_${Math.random()}`,
          title: task.title,
          completed: false
        })) || [],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const approval = await base44.asServiceRole.entities.WorkflowApproval.create(approvalData);

      // Send notification
      const approverName = toStage.approval_from === 'client' ? 'العميل' : 'المهندس';
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: approvalData.requested_from,
        title: 'طلب موافقة على مرحلة المشروع',
        message: `طلب موافقتك على الانتقال إلى مرحلة "${toStage.name}" في مشروع "${projectData.title}".`,
        type: 'approval',
        related_project_id: project_id,
        priority: 'high'
      });

      return Response.json({
        success: true,
        approval_required: true,
        approval_id: approval.id,
        message: `تم إنشاء طلب موافقة وسيتم إرسالها إلى ${approverName}`
      });
    }

    // No approval needed, transition directly
    const updatedStageHistory = [
      ...(workflowData.stage_history || []),
      {
        stage_id: from_stage_id,
        entered_at: workflowData.stage_history?.find(s => s.stage_id === from_stage_id)?.entered_at || new Date().toISOString(),
        exited_at: new Date().toISOString()
      }
    ];

    await base44.asServiceRole.entities.ProjectWorkflow.update(workflow_id, {
      current_stage_id: to_stage_id,
      stage_history: [
        ...updatedStageHistory,
        {
          stage_id: to_stage_id,
          entered_at: new Date().toISOString()
        }
      ]
    });

    // Send notification to all parties
    const participants = [projectData.created_by, projectData.assigned_engineer_id];
    for (const email of participants) {
      if (email) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: email,
          title: 'تحديث مرحلة المشروع',
          message: `تم الانتقال إلى مرحلة "${toStage.name}" في مشروع "${projectData.title}".`,
          type: 'project_update',
          related_project_id: project_id,
          priority: 'medium'
        });
      }
    }

    return Response.json({
      success: true,
      approval_required: false,
      message: `تم الانتقال إلى مرحلة "${toStage.name}" بنجاح`
    });
  } catch (error) {
    console.error('Workflow transition error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});