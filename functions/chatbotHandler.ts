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
      // Use Gemini AI for intelligent response
      // Check for onboarding keywords
const onboardingKeywords = ['مشروع جديد', 'بدء مشروع', 'أريد تصميم', 'احتاج مهندس', 'onboarding'];
const isOnboarding = onboardingKeywords.some(kw => messageLower.includes(kw));

if (isOnboarding && user_type === 'visitor') {
  const onboardingResponse = {
    response: `مرحباً! 👋 أرى أنك مهتم ببدء مشروع جديد. لدينا معالج ذكي يساعدك في:
✓ تحديد احتياجات مشروعك
✓ اختيار الفئة المناسبة
✓ الحصول على اقتراحات مهندسين متخصصين

هل تريد البدء الآن؟`,
    shouldRedirect: true,
    redirectPage: 'ClientOnboarding'
  };
  return Response.json(onboardingResponse);
}

      try {
        const systemInstructions = `أنت الآن المساعد الذكي الرسمي لمنصة (بيت لي - Bytly). مهمتك هي دعم المهندسين والمستثمرين في قطاع التصميم والاستشارات الهندسية في السعودية.

قواعد العمل الخاصة بك:
1. تقديم نصائح هندسية أولية بناءً على (الكود السعودي للمباني - SBC).
2. مساعدة المستخدمين في صياغة متطلبات مشاريعهم (Scope of Work) بشكل احترافي ومنظم.
3. الرد بلهجة مهنية، ودودة، ومحفزة تدعم رؤية المملكة 2030 في التطوير والابتكار.
4. توضيح أهمية نظام (الضامن المالي - Escrow) في المنصة لضمان حقوق جميع الأطراف - حيث يتم حجز الأموال بشكل آمن حتى إتمام المشروع بنجاح.
5. إذا سُئلت عن تفاصيل تقنية معقدة أو استشارات هندسية متخصصة، وجه المستخدم للتحدث مع أحد المهندسين المختصين المعتمدين عبر المنصة.
6. كن داعماً وإيجابياً، ووضح كيف تساعد منصة بيتلي في تسهيل رحلة المشاريع الهندسية.

ملاحظة مهمة: تواصل باللغتين العربية والإنجليزية حسب لغة المستخدم، مع الحفاظ على نفس المستوى من الاحترافية والوضوح في كلا اللغتين.`;

        const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
        if (!geminiApiKey) {
          throw new Error('Gemini API key not configured');
        }

        // Call Gemini API
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemInstructions }]
              },
              contents: [{
                parts: [{ text: user_message }]
              }],
              generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                maxOutputTokens: 2048
              }
            })
          }
        );

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.error('Gemini API error:', errorText);
          throw new Error(`Gemini API failed: ${geminiResponse.status}`);
        }

        const geminiData = await geminiResponse.json();
        botResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'أعتذر، لم أتمكن من فهم سؤالك. يرجى التواصل مع فريق الدعم.';
        
      } catch (llmError) {
        console.error('Gemini API error:', llmError);
        botResponse = 'أعتذر، أواجه مشكلة تقنية. يرجى التواصل مع فريق الدعم الفني على info@mybytly.com';
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
      suggestedEngineers,
      shouldRedirect: false
    });
  } catch (error) {
    console.error('Chatbot handler error:', error);
    return Response.json({ 
      error: error.message,
      response: 'أعتذر عن المشكلة التقنية. يرجى محاولة لاحقاً.'
    }, { status: 500 });
  }
});