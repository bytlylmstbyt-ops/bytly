import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { project_id } = await req.json();

    if (!project_id) {
      return Response.json({ error: 'project_id is required' }, { status: 400 });
    }

    // Get project details
    const projects = await base44.asServiceRole.entities.Project.filter({ id: project_id });
    if (!projects || projects.length === 0) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projects[0];

    // Check if project is completed
    if (project.status !== 'completed') {
      return Response.json({ error: 'Project is not completed yet' }, { status: 400 });
    }

    // Check if review already exists
    const existingReviews = await base44.asServiceRole.entities.Review.filter({
      project_id: project_id
    });

    if (existingReviews && existingReviews.length > 0) {
      return Response.json({ 
        message: 'Review already exists for this project',
        hasReview: true 
      });
    }

    // Get client info
    const clients = await base44.asServiceRole.entities.Client.filter({
      id: project.client_id
    });
    const client = clients?.[0];

    // Get engineer info
    const engineers = await base44.asServiceRole.entities.Engineer.filter({
      id: project.assigned_engineer_id
    });
    const engineer = engineers?.[0];

    if (!client || !engineer) {
      return Response.json({ error: 'Client or engineer not found' }, { status: 404 });
    }

    // Create notification for the client
    await base44.asServiceRole.entities.Notification.create({
      user_email: client.email,
      type: 'review_request',
      title: 'طلب تقييم مشروعك المكتمل',
      message: `تم إكمال مشروع "${project.title}" بنجاح! نرجو منك تقييم تجربتك مع المهندس ${engineer.full_name} لمساعدة الآخرين في اتخاذ قراراتهم.`,
      related_entity_type: 'Project',
      related_entity_id: project_id,
      action_url: `/project-details?id=${project_id}`,
      is_read: false
    });

    // Send email to the client
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: client.email,
      subject: '⭐ قيّم تجربتك مع مهندسك',
      body: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6B5D4F;">مرحباً ${client.full_name || client.client_name}</h2>
          <p>تم إكمال مشروعك <strong>"${project.title}"</strong> بنجاح! 🎉</p>
          <p>نرجو منك تقييم تجربتك مع المهندس <strong>${engineer.full_name}</strong> لمساعدة الآخرين في اتخاذ قراراتهم.</p>
          <p>رأيك يهمنا ويساعدنا في تحسين خدماتنا.</p>
          <p style="margin-top: 20px;">
            <a href="${Deno.env.get('BASE44_APP_URL')}/project-details?id=${project_id}" 
               style="background: #6B5D4F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              قيّم المشروع الآن
            </a>
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">بيتلي - لمسة بيت</p>
        </div>
      `
    });

    return Response.json({
      success: true,
      message: 'Review request sent successfully',
      client_email: client.email
    });

  } catch (error) {
    console.error('Error requesting review:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});