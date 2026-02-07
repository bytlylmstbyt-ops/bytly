import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_message, visitor_id, conversation_id, user_type } = await req.json();

    if (!user_message || !visitor_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let botResponse = '';
    let shouldEscalate = false;
    const messageLower = user_message.toLowerCase();

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
        // Build user context for personalized responses
        let userContext = '';
        if (user_type === 'client') {
          userContext = '\nالمستخدم الحالي: عميل يبحث عن مهندس أو يدير مشروع.';
        } else if (user_type === 'consultant') {
          userContext = '\nالمستخدم الحالي: مهندس أو شركة استشارية تبحث عن مشاريع أو عملاء.';
        } else {
          userContext = '\nالمستخدم الحالي: زائر يستكشف المنصة للمرة الأولى.';
        }

        const systemInstructions = `أنت الآن المساعد الذكي الرسمي لمنصة (بيت لي - Bytly) - منصة رائدة في الاستشارات الهندسية والتصميم المعماري في السعودية.

مهمتك الرئيسية:
━━━━━━━━━━━━━━━
تقديم استشارات هندسية ذكية واحترافية تساعد العملاء والمهندسين على تحقيق أهدافهم بكفاءة عالية، مع الالتزام بالمعايير السعودية (SBC) ورؤية المملكة 2030.

قواعد الرد الاحترافية:
━━━━━━━━━━━━━━━
1. **نبرة احترافية استشارية**: تحدث كمستشار هندسي خبير، وليس كروبوت.
2. **تخصيص الردود حسب هوية المستخدم**: ${userContext}
   - للعملاء: ركز على كيفية إيجاد المهندس المناسب، شرح المراحل، وضمان الجودة.
   - للمهندسين: قدم نصائح لتحسين الملف الشخصي، جذب العملاء، وإدارة المشاريع.
   - للزوار: قدم نظرة شاملة عن المنصة ومزاياها.

3. **دعم فني وهندسي متقدم**:
   - شرح الكود السعودي للمباني (SBC) والمتطلبات القانونية
   - مساعدة في صياغة نطاق العمل (Scope of Work)
   - توضيح المراحل الهندسية ومتطلبات كل مرحلة
   - نصائح حول اختيار المهندس المناسب

4. **التركيز على قيمة المنصة**:
   - نظام الضامن المالي (Escrow) لحماية جميع الأطراف
   - توثيق المهندسين والشركات الاستشارية
   - إدارة المراحل والمدفوعات بشكل آمن
   - دعم فني متواصل

5. **الإحالة للدعم المتخصص**:
   - للأسئلة التقنية المعقدة: وجه للتواصل مع مهندسين معتمدين عبر المنصة
   - للمشاكل القانونية: وجه للدعم القانوني في بيتلي
   - للشكاوى: وجه لفريق الدعم الفني

6. **الأسلوب والتنسيق**:
   - استخدم تنسيق واضح ومنظم (نقاط، فواصل، إيموجي بحكمة)
   - ردود متوسطة الطول (ليست قصيرة جداً ولا طويلة مملة)
   - اذكر روابط مفيدة عند الضرورة
   - قدم أمثلة عملية عندما يناسب السياق

7. **اللغة**: رد بنفس لغة المستخدم (عربي/إنجليزي) مع الحفاظ على الاحترافية.

ملاحظة هامة: أنت هنا لتقديم قيمة حقيقية وليس مجرد ردود آلية. كن مفيداً، واضحاً، ومحفزاً.`;

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
        
        // Format response for better readability
        botResponse = botResponse
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
          .trim();
        
      } catch (llmError) {
        console.error('Gemini API error:', llmError);
        botResponse = 'أعتذر، أواجه مشكلة تقنية. يرجى التواصل مع فريق الدعم الفني على info@mybytly.com';
        shouldEscalate = true;
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