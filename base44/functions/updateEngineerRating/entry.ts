import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Handle automation payload or direct call
    const engineer_id = payload.engineer_id || payload.data?.engineer_id;

    if (!engineer_id) {
      return Response.json({ error: 'engineer_id is required' }, { status: 400 });
    }

    // Get all reviews for this engineer
    const reviews = await base44.asServiceRole.entities.Review.filter({
      engineer_id: engineer_id
    });

    if (!reviews || reviews.length === 0) {
      // No reviews yet, set rating to 0
      await base44.asServiceRole.entities.Engineer.update(engineer_id, {
        rating: 0,
        total_reviews: 0
      });
      return Response.json({ 
        success: true,
        rating: 0,
        total_reviews: 0
      });
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = (totalRating / reviews.length).toFixed(2);

    // Update engineer with new rating
    await base44.asServiceRole.entities.Engineer.update(engineer_id, {
      rating: parseFloat(averageRating),
      total_reviews: reviews.length
    });

    return Response.json({
      success: true,
      rating: parseFloat(averageRating),
      total_reviews: reviews.length
    });

  } catch (error) {
    console.error('Error updating engineer rating:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});