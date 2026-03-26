import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { approval_id, approved, approval_notes } = await req.json();

    // Get approval and related data
    const [approvalData] = await base44.asServiceRole.entities.WorkflowApproval.filter({ id: approval_id });
    if (!approvalData) {
      return Response.json({ error: 'Approval not found' }, { status: 404 });
    }

    const [workflowData] = await base44.asServiceRole.entities.ProjectWorkflow.filter({ id: approvalData.workflow_id });
    const [projectData] = await base44.asServiceRole.entities.Project.filter({ id: approvalData.project_id });

    const toStage = workflowData.stages.find(s => s.stage_id === approvalData.stage_id);
    const requesterName = approvalData.approval_type === 'client' ? 'العميل' : 'المهندس';

    // Update approval status
    await base44.asServiceRole.entities.WorkflowApproval.update(approval_id, {
      status: approved ? 'approved' : 'rejected',
      approved_at: new Date().toISOString(),
      approval_notes
    });

    if (approved) {
      // Approve and transition workflow
      const updatedStageHistory = [
        ...(workflowData.stage_history || []),
        {
          stage_id: workflowData.current_stage_id,
          entered_at: workflowData.stage_history?.find(s => s.stage_id === workflowData.current_stage_id)?.entered_at || new Date().toISOString(),
          exited_at: new Date().toISOString(),
          approved_by: user.email,
          approval_notes
        }
      ];

      await base44.asServiceRole.entities.ProjectWorkflow.update(approvalData.workflow_id, {
        current_stage_id: approvalData.stage_id,
        stage_history: [
          ...updatedStageHistory,
          {
            stage_id: approvalData.stage_id,
            entered_at: new Date().toISOString()
          }
        ]
      });

      // Send success notification
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: approvalData.requested_by,
        title: 'تمت الموافقة على مرحلة المشروع',
        message: `وافق ${requesterName} على الانتقال إلى مرحلة "${toStage.name}" في مشروع "${projectData.title}".`,
        type: 'approval',
        related_project_id: approvalData.project_id,
        priority: 'high'
      });

      // Notify other parties
      const otherParty = approvalData.approval_type === 'client' ? projectData.assigned_engineer_id : projectData.created_by;
      if (otherParty) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: otherParty,
          title: 'تحديث حالة مرحلة المشروع',
          message: `تمت الموافقة على الانتقال إلى مرحلة "${toStage.name}".`,
          type: 'project_update',
          related_project_id: approvalData.project_id,
          priority: 'medium'
        });
      }

      return Response.json({
        success: true,
        message: `تمت الموافقة بنجاح والمشروع انتقل إلى مرحلة "${toStage.name}"`
      });
    } else {
      // Rejection
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: approvalData.requested_by,
        title: 'تم رفض مرحلة المشروع',
        message: `رفض ${requesterName} الانتقال إلى مرحلة "${toStage.name}" في مشروع "${projectData.title}". السبب: ${approval_notes || 'لم يتم تحديد سبب'}`,
        type: 'system',
        related_project_id: approvalData.project_id,
        priority: 'high'
      });

      return Response.json({
        success: true,
        message: `تم رفض الانتقال إلى مرحلة "${toStage.name}"`
      });
    }
  } catch (error) {
    console.error('Approval response error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});