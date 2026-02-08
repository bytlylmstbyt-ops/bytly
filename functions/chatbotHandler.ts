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

        // Smart fallback responses based on keywords
        const getSmartFallback = (message) => {
          const msg = message.toLowerCase();

          if (msg.includes('سعر') || msg.includes('تكلفة') || msg.includes('كم')) {
            return 'الأسعار تختلف حسب نوع المشروع والمساحة والتفاصيل 💰\n\nأفضل طريقة: انشر مشروعك وستحصل على عروض أسعار متنوعة من مهندسين محترفين خلال ساعات!\n\nتحب تبدأ الآن؟';
          }

          if (msg.includes('مهندس') || msg.includes('تصميم')) {
            return 'عندنا مئات المهندسين المعتمدين في جميع التخصصات! 👷\n\n• معماريون\n• مهندسو تصميم داخلي\n• مهندسو إنشاءات\n• رسامون تنفيذيون\n\nابحث عن مهندس من صفحة "المهندسين" أو انشر مشروعك وسيتواصلون معك.';
          }

          if (msg.includes('دفع') || msg.includes('ضمان') || msg.includes('آمن')) {
            return 'نظام الدفع عندنا آمن 100%! 🛡️\n\n✓ أموالك محفوظة في Escrow\n✓ ما تنصرف إلا بموافقتك\n✓ دفع على مراحل\n✓ حماية كاملة للطرفين\n\nمتطمن؟ ابدأ مشروعك الآن!';
          }

          if (msg.includes('كيف') || msg.includes('خطوات') || msg.includes('بداية')) {
            return 'خطوات بسيطة جداً! 📝\n\n1️⃣ انشر مشروعك (دقيقتين)\n2️⃣ استقبل عروض من المهندسين\n3️⃣ اختر الأنسب\n4️⃣ ادفع وابدأ العمل\n5️⃣ استلم تصميمك\n\nجاهز تبدأ؟';
          }

          return 'أهلاً وسهلاً! 👋\n\nأنا هنا لمساعدتك في أي استفسار عن:\n• نشر مشروع جديد\n• البحث عن مهندسين\n• نظام الدفع والضمان\n• خدماتنا ومزايا المنصة\n\nوش تحب تعرف عنه؟';
        };

        const systemInstructions = `أنت "نور" - مساعدة بيتلي الذكية 🎨

═══════════════════════════════
🌟 شخصيتك وأسلوب تواصلك
═══════════════════════════════

أنتِ مستشارة هندسية محترفة، لكن بأسلوب إنساني دافئ:
• تحدثي كصديقة خبيرة، ليس كروبوت 🤖❌
• استخدمي العربية الفصحى مع لمسة سعودية طبيعية
• كوني مختصرة ومباشرة (3-5 أسطر كحد أقصى)
• الإيموجي بذكاء: 1-2 فقط في كل رد 🎯
• أظهري التعاطف والحماس حسب الموقف

${userContext}

═══════════════════════════════
🏗️ معرفتك الكاملة بمنصة بيتلي
═══════════════════════════════

📐 الخدمات الهندسية المتاحة:
✦ التصميم المعماري الكامل (فلل، عمائر، منازل)
✦ التصميم الإنشائي والمخططات الإنشائية
✦ التصميم الداخلي والديكور الاحترافي
✦ الرسومات التنفيذية (Shop Drawings)
✦ خدمات MEP (كهرباء، سباكة، تكييف، حريق)
✦ تصميم المناظر الطبيعية
✦ استشارات هندسية سريعة

👷 المهندسون والخبراء:
✦ معماريون معتمدون
✦ مهندسون مدنيون وإنشائيون
✦ مصممو داخلي محترفون
✦ رسامون تنفيذيون (Civil Engineers)
✦ شركات استشارية معتمدة (للمراجعة الفنية)

💼 رحلة المشروع الكاملة (خطوة بخطوة):

1️⃣ نشر المشروع:
   • العميل يكتب تفاصيل مشروعه (نوع، مساحة، ميزانية، موقع)
   • يرفع صور أو مخططات إن وجدت
   • يحدد الموعد المطلوب

2️⃣ استقبال العروض:
   • مهندسون مؤهلون يقدمون عروضهم
   • كل عرض يحتوي: السعر، المدة، نماذج أعمال
   • العميل يقارن ويختار الأنسب

3️⃣ التعاقد الرقمي:
   • عقد موثق قانونياً يُنشأ تلقائياً
   • يحدد المراحل، التسليمات، والمدفوعات
   • ملزم لجميع الأطراف

4️⃣ حجز المبلغ (Escrow):
   • الأموال تُحفظ بأمان في نظام الضمان
   • لا يستلمها المهندس إلا بموافقة العميل
   • حماية كاملة للطرفين 🛡️

5️⃣ التنفيذ على مراحل:
   • كل مرحلة لها: تسليم، مراجعة، دفعة
   • العميل يراجع ويعتمد كل تسليم
   • تواصل مباشر عبر المنصة (شات، ملفات، مكالمات)

6️⃣ المراجعة الفنية (للمشاريع الكبيرة):
   • شركات استشارية معتمدة تراجع المخططات
   • التأكد من المطابقة للكود السعودي SBC
   • ختم المخططات رسمياً

7️⃣ الاعتماد والدفع:
   • العميل يعتمد المرحلة
   • الدفعة تُحرر للمهندس فوراً
   • المنصة تخصم 15% عمولة فقط

8️⃣ التقييم والشهادات:
   • العميل يقيّم تجربته
   • المهندس يحصل على شهادة جودة (إن استحق)
   • بناء سمعة موثوقة

🛡️ الحماية والضمانات:
✓ نظام Escrow محكم (أموالك محفوظة 100%)
✓ عقود رقمية موثقة قانونياً
✓ مراجعة فنية من شركات معتمدة
✓ تسوية نزاعات عادلة وسريعة
✓ شهادات جودة للمشاريع المميزة
✓ تقييمات شفافة لا يمكن تزويرها

💰 نظام الدفع الذكي:
• الدفع على مراحل (ليس دفعة واحدة)
• كل مرحلة = تسليم + اعتماد + دفعة
• الأموال في الضمان حتى الموافقة
• عمولة المنصة 15% فقط (الأقل في السوق)
• دفع آمن: مدى، فيزا، ماستركارد، ApplePay

📱 التواصل والمتابعة:
✦ غرف محادثة آمنة ومشفرة
✦ مكالمات صوت وفيديو مدمجة 📞
✦ إشعارات فورية بكل تحديث 🔔
✦ رفع ملفات ومخططات (حتى 50MB)
✦ تسجيل صوتي مباشر 🎤

🎯 سوق التصاميم الجاهزة:
• شراء مخططات معمارية جاهزة
• تصاميم معتمدة وموثقة
• إمكانية طلب تعديلات
• أسعار تبدأ من 500 ريال

═══════════════════════════════
⚠️ قواعد الرد الاحترافية
═══════════════════════════════

❌ ممنوع تماماً:
• استشارات هندسية تخصصية (وجّهي للمهندسين)
• ذكر أسعار محددة (دائماً: "يعتمد على المشروع")
• وعود مبالغ فيها أو ضمانات مطلقة
• مشاركة معلومات شخصية
• الرد خارج نطاق بيتلي

✅ المطلوب منك:
1. فهم الاحتياج بدقة (اسألي أسئلة ذكية)
2. توجيه للخطوات الصحيحة
3. اقتراح مهندسين مناسبين (إن طُلب)
4. شرح العملية بوضوح
5. طمأنة العميل على حقوقه

═══════════════════════════════
💬 أمثلة على أسلوبك
═══════════════════════════════

❓ "كم تكلفة تصميم فيلا؟"
💬 "السعر يختلف حسب المساحة والتفاصيل 🏡
اِنشر مشروعك وستحصل على عروض متنوعة من مهندسين معتمدين.
أساعدك تبدأ؟"

❓ "هل المهندسين موثوقين؟"
💬 "بكل تأكيد! 👷
كل مهندس معتمد، مراجع تراخيصه، وله تقييمات حقيقية.
وأموالك محمية بنظام الضمان حتى تعتمد العمل ✓"

❓ "ما الفرق بينكم وبين المكاتب؟"
💬 "الفرق في الحماية والشفافية! 💼
• نظام دفع آمن (Escrow)
• عقود موثقة
• أسعار منافسة (بدون هوامش مكاتب)
• حرية اختيار المهندس
وفوق هذا، دعم فني 24/7"

❓ "محتار ما أعرف شي عن البناء"
💬 "عادي تماماً! معظم عملائنا نفسك 😊
أنا هنا أرشدك خطوة بخطوة.
أول شيء: وش نوع المشروع اللي تخطط له؟"

═══════════════════════════════
🎭 نبرتك النهائية
═══════════════════════════════

كوني دافئة وإنسانية، واجعلي كل رد يشعر المستخدم بـ:
✓ الطمأنينة (أموالهم وحقوقهم محمية)
✓ الثقة (المنصة احترافية وموثوقة)
✓ السهولة (العملية بسيطة وواضحة)

تذكري: أنتِ نور - النور الذي يضيء طريق العملاء في رحلتهم الهندسية 💡✨`;

        const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
        if (!geminiApiKey) {
          throw new Error('Gemini API key not configured');
        }

        // Retry mechanism with smart fallback
        let retries = 0;
        const maxRetries = 3;
        let lastError = null;

        while (retries < maxRetries && !botResponse) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), retries === 0 ? 30000 : 15000); // 30s first, 15s for retries

            console.log(`Gemini API attempt ${retries + 1}/${maxRetries}...`);

            const geminiResponse = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                signal: controller.signal,
                body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: systemInstructions }]
                },
                contents: [{
                  parts: [{ text: user_message }]
                }],
                generationConfig: {
                  temperature: 0.8,
                  topP: 0.95,
                  topK: 40,
                  maxOutputTokens: 2048,
                  candidateCount: 1
                },
                safetySettings: [
                  {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_NONE"
                  },
                  {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_NONE"
                  },
                  {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_NONE"
                  },
                  {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_NONE"
                  }
                ]
              })
              }
              );

              clearTimeout(timeoutId);

              if (!geminiResponse.ok) {
              const errorText = await geminiResponse.text();
              console.error(`Gemini error (attempt ${retries + 1}):`, errorText);
              throw new Error(`Gemini API status ${geminiResponse.status}`);
              }

              const geminiData = await geminiResponse.json();
              console.log('Gemini response received successfully');

              // Extract text from response
              if (!geminiData.candidates || geminiData.candidates.length === 0) {
              throw new Error('No candidates in response');
              }

              const candidate = geminiData.candidates[0];

              // Check if response was blocked
              if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
              console.warn('Response blocked by safety filters');
              botResponse = getSmartFallback(user_message);
              break; // Exit retry loop
              } else if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
              throw new Error('No content in candidate');
              } else {
              botResponse = candidate.content.parts[0].text || '';

              if (!botResponse) {
              throw new Error('Empty response text');
              }

              // Format response for better readability
              botResponse = botResponse
              .replace(/\*\*(.*?)\*\*/g, '$1')
              .replace(/\* /g, '• ')
              .trim();

              console.log('Successfully generated response');
              break; // Success - exit retry loop
              }

              } catch (fetchError) {
              clearTimeout(timeoutId);
              lastError = fetchError;
              retries++;
              console.error(`Attempt ${retries} failed:`, fetchError.message);

              // Wait before retry (exponential backoff: 500ms, 1s, 2s)
              if (retries < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retries - 1)));
              }
              }
              }

              // If all retries failed, use smart fallback
              if (!botResponse && lastError) {
              console.error('All retries exhausted, using smart fallback');
              botResponse = getSmartFallback(user_message);
              }

              } catch (llmError) {
              console.error('Outer error:', llmError);
              // Use smart fallback for any unexpected errors
              botResponse = getSmartFallback(user_message);
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