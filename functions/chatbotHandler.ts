import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_message, visitor_id, conversation_id, user_type } = await req.json();

    if (!user_message || !visitor_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get relevant FAQs
    const faqs = await base44.asServiceRole.entities.ChatbotFAQ.filter({ 
      is_active: true 
    });

    // Find matching FAQ based on keywords
    let matchedFAQ = null;
    const messageLower = user_message.toLowerCase();

    for (const faq of faqs) {
      if (faq.keywords?.some(keyword => messageLower.includes(keyword.toLowerCase()))) {
        if (!matchedFAQ || faq.priority > matchedFAQ.priority) {
          matchedFAQ = faq;
        }
      }
    }

    let botResponse = '';
    let shouldEscalate = false;

    if (matchedFAQ) {
      botResponse = matchedFAQ.answer;
      if (matchedFAQ.reference_link) {
        botResponse += `\n\n📌 للمزيد: ${matchedFAQ.reference_link}`;
      }
    } else {
      // Use LLM for intelligent response
      const systemPrompt = `أنت مساعد بيتلي (Bytly Assistant)، مساعد ذكي متخصص في منصة تصميم معماري وداخلي.
استجب بمهنية وودية للعربية. 
نوع المستخدم: ${user_type || 'زائر'}
إذا لم تكن متأكداً من الإجابة، اطلب من المستخدم التواصل مع فريق الدعم الفني.
كن موجزاً وعملياً في الردود.`;

      try {
        const llmResponse = await base44.integrations.Core.InvokeLLM({
          prompt: user_message,
          add_context_from_internet: false
        });
        
        botResponse = llmResponse || 'أعتذر، لم أتمكن من فهم سؤالك. يرجى التواصل مع فريق الدعم.';
      } catch (llmError) {
        console.error('LLM error:', llmError);
        botResponse = 'أعتذر، أواجه مشكلة تقنية. يرجى التواصل مع فريق الدعم الفني.';
        shouldEscalate = true;
      }
    }

    // Update conversation if exists
    if (conversation_id) {
      const [conversation] = await base44.asServiceRole.entities.ChatbotConversation.filter({ 
        id: conversation_id 
      });

      if (conversation) {
        const updatedMessages = [
          ...(conversation.messages || []),
          {
            role: 'user',
            content: user_message,
            timestamp: new Date().toISOString()
          },
          {
            role: 'assistant',
            content: botResponse,
            timestamp: new Date().toISOString()
          }
        ];

        await base44.asServiceRole.entities.ChatbotConversation.update(conversation_id, {
          messages: updatedMessages,
          status: shouldEscalate ? 'escalated' : 'active'
        });
      }
    }

    // Get suggested engineers if relevant
    let suggestedEngineers = [];
    if (user_type === 'client' && messageLower.includes('مهندس') || messageLower.includes('تصميم')) {
      const engineers = await base44.asServiceRole.entities.Engineer.filter({ 
        status: 'approved',
        is_verified: true
      });
      suggestedEngineers = engineers.slice(0, 3).map(e => ({
        id: e.id,
        name: e.full_name,
        specialization: e.specialization,
        rating: e.rating
      }));
    }

    return Response.json({
      success: true,
      response: botResponse,
      shouldEscalate,
      suggestedEngineers
    });
  } catch (error) {
    console.error('Chatbot handler error:', error);
    return Response.json({ 
      error: error.message,
      response: 'أعتذر عن المشكلة التقنية. يرجى محاولة لاحقاً.'
    }, { status: 500 });
  }
});