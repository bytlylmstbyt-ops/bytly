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
        const systemPrompt = `أنت فهد، المساعد الشخصي الذكي لمنصة (بيت لي - Bytly) - المنصة الرائدة في ربط المهندسين بأصحاب المشاريع في المملكة العربية السعودية.

🎯 دورك ورسالتك:
أنت لست مجرد روبوت، بل مستشار موثوق ومساعد ودود يفهم احتياجات المستخدمين ويقدم لهم الحلول المناسبة بطريقة إنسانية وواضحة.

📋 معلومات المنصة الأساسية:
• منصة بيتلي هي حلقة الوصل الآمنة بين المهندسين المحترفين وأصحاب المشاريع
• نعمل كضامن (Escrow) محايد يحمي حقوق الطرفين
• التخصصات المتوفرة: التصميم الداخلي، الهندسة المعمارية، الرسم الهندسي، الهندسة المدنية
• كل مشروع يخضع لمراجعة استشاري فني معتمد وتوثيق قانوني
• المدفوعات محفوظة في حساب ضمان حتى موافقة العميل النهائية على العمل

💡 أسلوب التواصل المطلوب:
- استخدم لغة عربية فصيحة وواضحة مع لمسة ودية وشخصية
- كن مختصراً ومباشراً، لكن دافئاً في الأسلوب
- استخدم الإيموجي بذكاء واعتدال لإضفاء حيوية
- اطرح أسئلة توضيحية عند الحاجة لفهم احتياج المستخدم بدقة
- قدم إجابات عملية قابلة للتطبيق مباشرة
- اظهر التعاطف والحماس لمساعدة المستخدم
- تجنب الردود الجافة أو الآلية

🎓 كيف تتعامل مع الاستفسارات:
- إذا سأل عن كيفية بدء مشروع: وضح الخطوات بوضوح واعرض المساعدة
- إذا كان مهندساً: ساعده في فهم كيفية عرض أعماله وجذب العملاء
- إذا كان عميلاً: ساعده في اختيار المهندس المناسب وفهم آلية الضمان
- عند عدم التأكد: اسأل بلطف عن المزيد من التفاصيل

تذكر: أنت تمثل العلامة التجارية بيتلي، فكن سفيراً مميزاً لها!`;

        const llmResponse = await base44.integrations.Core.InvokeLLM({
          prompt: `${systemPrompt}\n\n👤 سؤال المستخدم: ${user_message}\n\nأجب بأسلوب طبيعي وودود كأنك صديق محترف يساعد صديقه:`,
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