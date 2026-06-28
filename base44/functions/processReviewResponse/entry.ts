import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// يُستدعى من automation عند تحديث محادثة review
// يحلل ردود العميل عاطفياً ويحدث تقييم المهندس

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();

    const { conversation_id, engineer_id, project_id, milestone_id } = body;

    if (!conversation_id || !engineer_id) {
      return Response.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    // جلب المحادثة
    const conversation = await base44.asServiceRole.agents.getConversation(conversation_id);
    if (!conversation || !conversation.messages) {
      return Response.json({ error: 'المحادثة غير موجودة' }, { status: 404 });
    }

    // جمع ردود العميل فقط
    const userMessages = conversation.messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n');

    if (!userMessages.trim()) {
      return Response.json({ success: false, message: 'لا توجد ردود من العميل بعد' });
    }

    // تحليل عاطفي وتقييم ذكي باستخدام LLM
    const analysisResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `أنت نظام تقييم ذكي لمنصة بيتلي الهندسية.

قم بتحليل ردود العميل التالية وإرجاع تقييم دقيق للمهندس:

ردود العميل:
"""
${userMessages}
"""

قم بتحليل:
1. التقييم العام من 5 (رقم عشري دقيق)
2. تقييم الجودة من 5
3. تقييم التواصل من 5
4. تقييم الالتزام بالمواعيد من 5
5. المشاعر العامة: positive / neutral / negative
6. ملخص التعليق باللغة العربية (جملة أو جملتين)
7. هل اكتمل التقييم (رد على الأسئلة الرئيسية): true/false

إذا لم يكن العميل قد أجاب بشكل كافٍ، اجعل completed: false.`,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_rating: { type: 'number' },
          quality_rating: { type: 'number' },
          communication_rating: { type: 'number' },
          delivery_rating: { type: 'number' },
          sentiment: { type: 'string' },
          comment_summary: { type: 'string' },
          completed: { type: 'boolean' },
        }
      }
    });

    if (!analysisResult || !analysisResult.completed) {
      return Response.json({ success: false, message: 'التقييم لم يكتمل بعد - العميل لم يجب على الأسئلة الكافية' });
    }

    const {
      overall_rating,
      quality_rating,
      communication_rating,
      delivery_rating,
      sentiment,
      comment_summary
    } = analysisResult;

    // تحديث Review في قاعدة البيانات
    const existingReviews = await base44.asServiceRole.entities.Review.filter({
      conversation_id,
      status: 'pending_response',
    });

    if (existingReviews.length > 0) {
      await base44.asServiceRole.entities.Review.update(existingReviews[0].id, {
        rating: overall_rating,
        quality_rating,
        communication_rating,
        delivery_rating,
        comment: comment_summary,
        sentiment,
        status: 'completed',
        description: `تقييم مكتمل - تحليل عاطفي: ${sentiment} | المرحلة: ${existingReviews[0].milestone_title}`,
      });
    } else {
      await base44.asServiceRole.entities.Review.create({
        engineer_id,
        project_id,
        milestone_id,
        rating: overall_rating,
        quality_rating,
        communication_rating,
        delivery_rating,
        comment: comment_summary,
        sentiment,
        status: 'completed',
        conversation_id,
        description: `تقييم مكتمل بالتحليل العاطفي - ${sentiment}`,
      });
    }

    // تحديث التقييم الإجمالي للمهندس
    const allReviews = await base44.asServiceRole.entities.Review.filter({
      engineer_id,
      status: 'completed',
    });

    const validReviews = allReviews.filter(r => r.rating > 0);
    if (validReviews.length > 0) {
      const avgRating = validReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / validReviews.length;

      const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: engineer_id });
      if (engineers.length > 0) {
        await base44.asServiceRole.entities.Engineer.update(engineer_id, {
          rating: Math.round(avgRating * 10) / 10,
          total_reviews: validReviews.length,
        });
      }
    }

    return Response.json({
      success: true,
      analysis: analysisResult,
      message: 'تم تحديث تقييم المهندس بنجاح',
      new_rating: overall_rating,
      total_reviews: (await base44.asServiceRole.entities.Review.filter({ engineer_id, status: 'completed' })).length,
    });

  } catch (error) {
    console.error('processReviewResponse error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});