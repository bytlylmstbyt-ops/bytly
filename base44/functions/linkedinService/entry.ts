import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Authorization: posting to the official platform LinkedIn account is admin-only.
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('linkedin');
    const body = await req.json();
    const { action, data } = body;

    // Get LinkedIn profile URN
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!profileRes.ok) {
      return Response.json({ error: 'فشل جلب بيانات LinkedIn' }, { status: 400 });
    }
    const profile = await profileRes.json();
    const authorUrn = `urn:li:person:${profile.sub}`;

    const postToLinkedIn = async (text) => {
      const postBody = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };
      const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(postBody)
      });
      if (!res.ok) {
        const err = await res.text();
        console.error('LinkedIn post error:', err);
        throw new Error('فشل النشر على LinkedIn: ' + err);
      }
      return await res.json();
    };

    switch (action) {

      // 1. مشاركة الأعمال التصميمية المكتملة تلقائيًا
      case 'shareDesignWork': {
        const { title, description, designCategory, projectUrl, engineerName, firmName } = data;

        const caption = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `اكتب منشور LinkedIn احترافي وجذاب باللغة العربية لمشاركة عمل تصميمي هندسي مكتمل.
المعطيات:
- العنوان: ${title}
- التصنيف: ${designCategory || 'تصميم هندسي'}
- الوصف: ${description}
- المهندس: ${engineerName || ''}
- الشركة: ${firmName || 'Bytly'}

المنشور يجب أن:
- يبدأ بجملة جذابة تشويقية
- يصف العمل بشكل احترافي (100-130 كلمة)
- يذكر Bytly كمنصة موثوقة للخدمات الهندسية
- يختتم بـ hashtags: #تصميم_داخلي #هندسة #معمارية #Bytly #mybytly #تصميم
- يكون مناسبًا للجمهور المهني`
        });

        const postData = await postToLinkedIn(caption);

        return Response.json({
          success: true,
          message: 'تم نشر العمل التصميمي على LinkedIn بنجاح ✅',
          postId: postData.id,
          caption,
          profileName: profile.name
        });
      }

      // 2. البحث عن عملاء محتملين وصياغة رسائل تواصل
      case 'searchAndOutreachClients': {
        const { industry, location, projectType, customMessage } = data;

        // صياغة رسالة تواصل مخصصة للعملاء
        const clientMessage = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `اكتب رسالة تواصل LinkedIn احترافية موجهة لعملاء محتملين في مجال ${industry || 'البناء والتصميم'}.
المعطيات:
- الموقع: ${location || 'المملكة العربية السعودية'}
- نوع المشروع المطلوب: ${projectType || 'تصميم معماري وداخلي'}
- رسالة مخصصة: ${customMessage || ''}

الرسالة يجب أن:
- تكون شخصية ومهنية (70-90 كلمة)
- تعرّف بـ Bytly كمنصة موثوقة تربط العملاء بأفضل المهندسين
- تذكر مزايا المنصة: ضمان الجودة، الدفع الآمن، مهندسون معتمدون
- تنتهي بدعوة واضحة للتواصل أو زيارة mybytly.com
- لا تكون ترويجية بشكل مبالغ فيه`,
          add_context_from_internet: false
        });

        // صياغة منشور للبحث عن عملاء
        const searchPost = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `اكتب منشور LinkedIn يستهدف العملاء الباحثين عن خدمات هندسية وتصميمية في ${location || 'المملكة العربية السعودية'}.
نوع الخدمة المطلوب: ${projectType || 'تصميم معماري وداخلي'}
المنشور يجب أن يكون 80-100 كلمة ويشجع على زيارة mybytly.com
Hashtags: #تصميم_منازل #بناء #معمارية #تصميم_داخلي #Bytly`
        });

        const postData = await postToLinkedIn(searchPost);

        return Response.json({
          success: true,
          message: 'تم إنشاء منشور للبحث عن عملاء محتملين ✅',
          outreachMessageDraft: clientMessage,
          postId: postData.id,
          searchPost,
          tip: 'استخدم مسودة الرسالة أعلاه لإرسالها مباشرةً للعملاء عبر LinkedIn InMail'
        });
      }

      // 3. إرسال طلبات تواصل للمهندسين المحترفين
      case 'outreachToEngineers': {
        const { engineerName, engineerSpecialization, engineerCity, customNote } = data;

        // صياغة رسالة طلب تواصل مخصصة للمهندس
        const connectionMessage = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `اكتب رسالة طلب تواصل LinkedIn موجهة لمهندس محترف للانضمام لمنصة Bytly.
المعطيات:
- اسم المهندس: ${engineerName || 'المهندس'}
- التخصص: ${engineerSpecialization || 'هندسة معمارية وتصميم داخلي'}
- المدينة: ${engineerCity || 'الرياض'}
- ملاحظة مخصصة: ${customNote || ''}

الرسالة يجب أن:
- تكون مختصرة جداً (40-60 كلمة) مناسبة لطلب تواصل LinkedIn
- تذكر تخصص المهندس وكيف يتناسب مع Bytly
- تذكر مزايا الانضمام: مشاريع متنوعة، دفع آمن، تطوير مهني
- تنتهي بدعوة للاطلاع على mybytly.com
- تكون شخصية ومباشرة`
        });

        // منشور استقطاب مهندسين
        const recruitPost = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `اكتب منشور LinkedIn لاستقطاب مهندسين متخصصين في ${engineerSpecialization || 'التصميم المعماري والداخلي'} للانضمام لمنصة Bytly.
المنشور 80-100 كلمة، يذكر مزايا المنصة للمهندسين ويختتم بـ:
Hashtags: #وظائف_هندسية #مهندس_معماري #تصميم_داخلي #فرص_عمل #Bytly`
        });

        const postData = await postToLinkedIn(recruitPost);

        return Response.json({
          success: true,
          message: 'تم نشر منشور استقطاب المهندسين وإنشاء رسالة التواصل ✅',
          connectionRequestDraft: connectionMessage,
          postId: postData.id,
          recruitPost,
          tip: 'استخدم مسودة الرسالة أعلاه عند إرسال طلب تواصل LinkedIn للمهندس'
        });
      }

      // 4. مشاركة تلقائية عند اكتمال مشروع
      case 'autoShareCompletedProject': {
        const { projectId } = data;

        const project = await base44.asServiceRole.entities.Project.get(projectId);
        if (!project) {
          return Response.json({ error: 'المشروع غير موجود' }, { status: 404 });
        }

        const caption = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `اكتب منشور LinkedIn احترافي للإعلان عن إتمام مشروع هندسي على منصة Bytly.
تفاصيل المشروع:
- العنوان: ${project.title}
- التصنيف: ${project.category || 'تصميم'}
- الوصف: ${project.description}
- الموقع: ${project.location || ''}

المنشور:
- 100-130 كلمة احترافية
- يعبر عن الفخر بإنجاز المشروع
- يذكر Bytly كضامن للجودة
- Hashtags: #مشروع_مكتمل #هندسة #تصميم #جودة #Bytly #mybytly`
        });

        const postData = await postToLinkedIn(caption);

        return Response.json({
          success: true,
          message: `تم نشر إتمام مشروع "${project.title}" على LinkedIn تلقائيًا ✅`,
          postId: postData.id,
          caption
        });
      }

      // 5. صياغة رسالة تواصل فقط (بدون نشر)
      case 'draftOutreachMessage': {
        const { recipientName, recipientRole, purpose, projectDetails } = data;

        const message = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `اكتب رسالة تواصل LinkedIn احترافية باللغة العربية.
- اسم المستلم: ${recipientName}
- الدور: ${recipientRole === 'client' ? 'عميل محتمل' : 'مهندس محتمل'}
- الهدف: ${purpose}
- تفاصيل: ${projectDetails || 'منصة Bytly للخدمات الهندسية'}
الرسالة: قصيرة (60-80 كلمة)، مهنية، تعرف بـ Bytly، دعوة للتواصل.`
        });

        return Response.json({
          success: true,
          draft: message,
          recipientName,
          tip: 'أرسل هذه الرسالة مباشرةً عبر LinkedIn InMail'
        });
      }

      default:
        return Response.json({ error: 'Action غير معروف' }, { status: 400 });
    }

  } catch (error) {
    console.error('LinkedIn service error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});