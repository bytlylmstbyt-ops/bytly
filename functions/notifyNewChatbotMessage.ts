import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const conversation_id = payload.data?.id || payload.conversation_id;
    
    if (!conversation_id) {
      return Response.json({ error: 'conversation_id is required' }, { status: 400 });
    }

    // Get conversation details
    const conversations = await base44.asServiceRole.entities.ChatbotConversation.filter({ 
      id: conversation_id 
    });
    const conversation = conversations[0];

    if (!conversation) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get the first user message
    const firstMessage = conversation.messages?.find(m => m.role === 'user');
    const messagePreview = firstMessage?.content?.substring(0, 200) || 'لا يوجد محتوى';

    // Send email to admin
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'منصة بيتلي',
      to: 'bytlylmstbyt@gmail.com',
      subject: '💬 استفسار جديد عبر الشات بوت',
      body: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">بيتلي</h1>
            <p style="color: #E5D4B8; margin: 5px 0 0 0; font-size: 14px;">لمسة بيت</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #6B5D4F; margin-top: 0; font-size: 22px;">استفسار جديد عبر الشات بوت</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #C9A66B;">
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">نوع المستخدم:</strong> ${conversation.user_type || 'زائر'}</p>
              ${conversation.user_email ? `<p style="margin: 5px 0;"><strong style="color: #6B5D4F;">البريد:</strong> ${conversation.user_email}</p>` : ''}
              ${conversation.project_id ? `<p style="margin: 5px 0;"><strong style="color: #6B5D4F;">المشروع:</strong> ${conversation.project_id}</p>` : ''}
              <p style="margin: 5px 0;"><strong style="color: #6B5D4F;">الحالة:</strong> <span style="background: ${conversation.status === 'escalated' ? '#ffc107' : '#17a2b8'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${conversation.status === 'active' ? 'نشط' : conversation.status === 'escalated' ? 'يحتاج متابعة' : 'مغلق'}</span></p>
            </div>

            <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #6B5D4F; font-weight: bold;">محتوى الرسالة:</p>
              <p style="margin: 0; color: #555; font-style: italic;">"${messagePreview}${messagePreview.length >= 200 ? '...' : ''}"</p>
            </div>

            ${conversation.suggested_engineers?.length > 0 ? `
            <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0; color: #155724;"><strong>تم اقتراح ${conversation.suggested_engineers.length} مهندس للعميل</strong></p>
            </div>
            ` : ''}

            <p style="color: #666; font-size: 14px; margin: 20px 0;">
              ${conversation.status === 'escalated' ? '<strong style="color: #dc3545;">⚠️ يحتاج هذا الاستفسار إلى متابعة عاجلة من فريق الدعم</strong>' : 'تم الرد على الاستفسار بواسطة الشات بوت الذكي'}
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('BASE44_APP_URL')}/dashboard" 
                 style="background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                عرض التفاصيل
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              منصة بيتلي - لمسة بيت © ${new Date().getFullYear()}
            </p>
          </div>
        </div>
      `
    });

    return Response.json({
      success: true,
      message: 'Chatbot notification sent to admin'
    });

  } catch (error) {
    console.error('Error sending chatbot notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});