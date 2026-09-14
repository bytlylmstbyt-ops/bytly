import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      targetType,
      targetId,
      rating,
      qualityRating,
      communicationRating,
      deliveryRating,
      comment,
      highlights,
      targetName,
      projectId,
      milestoneId,
      milestoneTitle
    } = body;

    if (!targetType || !targetId || !rating) {
      return Response.json({ error: 'البيانات ناقصة: نوع مقدم الخدمة، المعرف، والتقييم مطلوبة' }, { status: 400 });
    }

    const validTypes = ['engineer', 'contractor', 'supplier'];
    if (!validTypes.includes(targetType)) {
      return Response.json({ error: 'نوع غير صالح' }, { status: 400 });
    }

    // ── Authorization: caller must have a real, completed engagement with the target provider ──
    // Prevents arbitrary users / competing providers from inflating or sabotaging ratings.
    let authorized = false;

    if (targetType === 'engineer') {
      const projects = await base44.asServiceRole.entities.Project.filter({
        client_id: user.id,
        assigned_engineer_id: targetId
      });
      authorized = projects.some(p =>
        p.status === 'completed' || p.client_final_approval === true || p.status === 'technical_approved'
      );
    } else if (targetType === 'contractor') {
      const contracts = await base44.asServiceRole.entities.Contract.filter({
        client_id: user.id,
        contractor_id: targetId
      });
      authorized = contracts.some(c =>
        ['signed', 'active', 'completed'].includes(c.status)
      );
    } else if (targetType === 'supplier') {
      // Suppliers are engaged via market orders; require the caller to be a registered client.
      const clients = await base44.asServiceRole.entities.Client.filter({ email: user.email });
      authorized = clients.length > 0;
    }

    if (!authorized) {
      return Response.json(
        { error: 'غير مصرّح: يجب أن يكون لديك مشروع/عقد مكتمل مع مقدم الخدمة قبل تقييمه' },
        { status: 403 }
      );
    }

    // If a projectId was supplied, it must belong to the caller
    if (projectId) {
      const proj = await base44.asServiceRole.entities.Project.get(projectId).catch(() => null);
      if (!proj || proj.client_id !== user.id) {
        return Response.json({ error: 'مشروع غير صالح' }, { status: 403 });
      }
    }

    // Build review data
    const reviewData: any = {
      target_type: targetType,
      client_id: user.id,
      rating,
      quality_rating: qualityRating || rating,
      communication_rating: communicationRating || rating,
      delivery_rating: deliveryRating || rating,
      comment: comment || '',
      highlights: highlights || [],
      target_name: targetName || '',
      status: 'completed',
    };

    if (targetType === 'engineer') reviewData.engineer_id = targetId;
    if (targetType === 'contractor') reviewData.contractor_id = targetId;
    if (targetType === 'supplier') reviewData.supplier_id = targetId;
    if (projectId) reviewData.project_id = projectId;
    if (milestoneId) reviewData.milestone_id = milestoneId;
    if (milestoneTitle) reviewData.milestone_title = milestoneTitle;

    // Create the review (service role bypasses RLS)
    const review = await base44.asServiceRole.entities.Review.create(reviewData);

    // Update the provider's average rating
    const entityMap: Record<string, string> = {
      engineer: 'Engineer',
      contractor: 'Contractor',
      supplier: 'Supplier'
    };
    const filterField = targetType + '_id';
    const entityName = entityMap[targetType];

    const allReviews = await base44.asServiceRole.entities.Review.filter({ [filterField]: targetId });
    const validRatings = allReviews.filter(r => r.rating > 0);
    const avg = validRatings.length > 0
      ? validRatings.reduce((s, r) => s + r.rating, 0) / validRatings.length
      : 0;

    await base44.asServiceRole.entities[entityName].update(targetId, {
      rating: parseFloat(avg.toFixed(2)),
      total_reviews: validRatings.length,
    });

    return Response.json({ success: true, reviewId: review.id, newRating: parseFloat(avg.toFixed(2)) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});