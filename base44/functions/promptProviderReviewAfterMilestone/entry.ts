import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data, old_data } = body;
    const milestone = data;

    if (!milestone) return Response.json({ skipped: true, reason: 'no data' });

    // Only trigger when milestone is completed or client-approved
    const isCompleted = milestone.status === 'completed' || milestone.status === 'approved';
    const wasCompleted = old_data?.status === 'completed' || old_data?.status === 'approved';
    const justApproved = milestone.client_approved && !old_data?.client_approved;

    if (!isCompleted || (wasCompleted && !justApproved)) {
      return Response.json({ skipped: true, reason: 'milestone not newly completed' });
    }

    // Fetch project
    const projects = await base44.asServiceRole.entities.Project.filter({ id: milestone.project_id });
    const project = projects[0];
    if (!project) return Response.json({ skipped: true, reason: 'project not found' });

    // Get client email
    let clientEmail = null;
    if (project.client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: project.client_id });
      if (clients[0]?.email) clientEmail = clients[0].email;
    }
    if (!clientEmail) clientEmail = project.created_by;
    if (!clientEmail) return Response.json({ skipped: true, reason: 'no client email' });

    // Find contractors associated with this project via contracts
    const contracts = await base44.asServiceRole.entities.Contract.filter({ project_id: milestone.project_id });
    const contractorContracts = contracts.filter(c => c.provider_type === 'contractor' && c.contractor_id && c.status !== 'terminated' && c.status !== 'archived');

    const providersToReview = [];

    for (const c of contractorContracts) {
      // Check if a pending review already exists for this milestone + contractor
      const existing = await base44.asServiceRole.entities.Review.filter({
        milestone_id: milestone.id,
        contractor_id: c.contractor_id
      });
      if (existing.length > 0) continue;

      const contractors = await base44.asServiceRole.entities.Contractor.filter({ id: c.contractor_id });
      if (!contractors[0]) continue;
      const contractor = contractors[0];

      providersToReview.push({
        targetType: 'contractor',
        targetId: contractor.id,
        targetName: contractor.company_name
      });
    }

    // Also check for engineers assigned to the project
    if (project.assigned_engineer_id) {
      const existingEng = await base44.asServiceRole.entities.Review.filter({
        milestone_id: milestone.id,
        engineer_id: project.assigned_engineer_id
      });
      if (existingEng.length === 0) {
        const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
        if (engineers[0]) {
          providersToReview.push({
            targetType: 'engineer',
            targetId: engineers[0].id,
            targetName: engineers[0].full_name
          });
        }
      }
    }

    if (providersToReview.length === 0) {
      return Response.json({ skipped: true, reason: 'no providers to review (or already reviewed)' });
    }

    console.log(`Prompting review for milestone ${milestone.id}, providers: ${providersToReview.length}`);

    // Create pending Review records and send notifications
    for (const p of providersToReview) {
      const reviewData = {
        target_type: p.targetType,
        client_id: project.client_id,
        rating: 0,
        project_id: project.id,
        milestone_id: milestone.id,
        milestone_title: milestone.title,
        target_name: p.targetName,
        status: 'pending_response',
        comment: ''
      };
      if (p.targetType === 'contractor') reviewData.contractor_id = p.targetId;
      if (p.targetType === 'engineer') reviewData.engineer_id = p.targetId;
      if (p.targetType === 'supplier') reviewData.supplier_id = p.targetId;

      const review = await base44.asServiceRole.entities.Review.create(reviewData);

      // Send notification to client
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: clientEmail,
        title: '⭐ تقييم بعد اكتمال مرحلة',
        message: `تم اكتمال مرحلة "${milestone.title}" في مشروع "${project.title}". شاركنا رأيك في أداء ${p.targetName} — قيّم جودة العمل وسرعة الإنجاز.`,
        type: 'review',
        priority: 'medium',
        related_project_id: project.id,
        related_entity_id: review.id,
        action_url: '/ServiceReviews'
      });
    }

    return Response.json({ success: true, prompted: providersToReview.length });
  } catch (error) {
    console.error('promptProviderReviewAfterMilestone error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});