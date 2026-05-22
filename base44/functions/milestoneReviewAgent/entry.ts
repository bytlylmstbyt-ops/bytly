import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// يُستدعى من automation عند اكتمال مرحلة (milestone approved)
// يطلق محادثة Bytly AI مع العميل ويطلب تقييمه

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // يمكن استدعاؤه مباشرة من automation أو من الـ frontend
    const { milestone_id, project_id, engineer_id, client_email, milestone_title } = body;

    if (!milestone_id || !project_id || !engineer_id || !client_email) {
      return Response.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    // جلب بيانات المشروع والمهندس
    const [projects, engineers, clients] = await Promise.all([
      base44.asServiceRole.entities.Project.filter({ id: project_id }),
      base44.asServiceRole.entities.Engineer.filter({ id: engineer_id }),
      base44.asServiceRole.entities.Client.filter({ email: client_email }),
    ]);

    const project = projects[0];
    const engineer = engineers[0];
    const client = clients[0];

    if (!project || !engineer) {
      return Response.json({ error: 'المشروع أو المهندس غير موجود' }, { status: 404 });
    }

    const engineerName = engineer.full_name || 'المهندس';
    const projectTitle = project.title || 'المشروع';
    const milestoneName = milestone_title || 'المرحلة';
    const clientName = client?.name || client?.full_name || 'العميل';

    // إنشاء محادثة Bytly AI مع العميل لطلب التقييم
    const conversation = await base44.asServiceRole.agents.createConversation({
      agent_name: 'bytly_advisor',
      metadata: {
        type: 'milestone_review_request',
        milestone_id,
        project_id,
        engineer_id,
        client_email,
        engineer_name: engineerName,
        project_title: projectTitle,
        milestone_title: milestoneName,
      }
    });

    // إرسال رسالة افتتاحية من الوكيل للعميل
    const openingMessage = `مرحباً ${clientName} 👋

تهانينا! تم إنجاز مرحلة **"${milestoneName}"** بنجاح في مشروع **"${projectTitle}"** ✅

أودّ أن أسألك بعض الأسئلة السريعة عن تجربتك مع **${engineerName}** في هذه المرحلة، حتى نضمن أفضل جودة لك ونساعد المهندسين على التحسين المستمر.

**سؤال 1️⃣:** كيف تقيّم جودة العمل المُنجز في هذه المرحلة؟ (1-5)
- 5 ⭐⭐⭐⭐⭐ ممتاز جداً
- 4 ⭐⭐⭐⭐ جيد جداً  
- 3 ⭐⭐⭐ جيد
- 2 ⭐⭐ مقبول
- 1 ⭐ ضعيف`;

    await base44.asServiceRole.agents.addMessage(conversation, {
      role: 'assistant',
      content: openingMessage,
    });

    // حفظ سجل طلب التقييم
    await base44.asServiceRole.entities.Review.create({
      engineer_id,
      client_id: client?.id || client_email,
      project_id,
      milestone_id,
      rating: 0,
      status: 'pending_response',
      conversation_id: conversation.id,
      milestone_title: milestoneName,
      description: `تقييم مرحلة: ${milestoneName} - بانتظار رد العميل`,
    });

    return Response.json({
      success: true,
      conversation_id: conversation.id,
      message: 'تم إطلاق طلب التقييم بنجاح',
    });

  } catch (error) {
    console.error('milestoneReviewAgent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});