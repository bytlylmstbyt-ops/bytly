import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('linkedin');
    const body = await req.json();
    const { action, data } = body;

    // Get LinkedIn profile URN first
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await profileRes.json();
    const authorUrn = `urn:li:person:${profile.sub}`;

    switch (action) {

      // 1. مشاركة أعمال تصميمية على LinkedIn
      case 'shareDesignWork': {
        const { title, description, imageUrl, projectUrl, designCategory } = data;

        // صياغة منشور احترافي بالذكاء الاصطناعي
        const aiCaption = await base44.integrations.Core.InvokeLLM({
          prompt: `اكتب منشور LinkedIn احترافي وجذاب باللغة العربية (مع بعض الإنجليزية للمصطلحات) لمشاركة عمل تصميمي هندسي.
المعطيات:
- العنوان: ${title}
- التصنيف: ${designCategory}
- الوصف: ${description}

المنشور يجب أن:
- يكون بين 100-150 كلمة
- يبدأ بجملة جذابة
- يذكر إنجازات وتفاصيل المشروع
- يختتم بـ hashtags مناسبة مثل #تصميم_داخلي #هندسة #Bytly #mybytly
- يكون مناسباً لجمهور LinkedIn المهني`
        });

        const postBody = {
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: aiCaption },
              shareMediaCategory: imageUrl ? 'NONE' : 'NONE',
              ...(projectUrl && {
                media: [{
                  status: 'READY',
                  originalUrl: projectUrl,
                  title: { text: title }
                }]
              })
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        };

        const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          },
          body: JSON.stringify(postBody)
        });

        if (!postRes.ok) {
          const err = await postRes.text();
          console.error('LinkedIn post error:', err);
          return Response.json({ error: 'فشل نشر المنشور', details: err }, { status: 400 });
        }

        const postData = await postRes.json();
        return Response.json({ 
          success: true, 
          message: 'تم نشر العمل التصميمي على LinkedIn بنجاح',
          postId: postData.id,
          caption: aiCaption
        });
      }

      // 2. إنشاء رسالة تواصل مع عميل/مهندس محتمل
      case 'draftOutreachMessage': {
        const { recipientName, recipientRole, purpose, projectDetails } = data;

        const message = await base44.integrations.Core.InvokeLLM({
          prompt: `اكتب رسالة تواصل احترافية على LinkedIn باللغة العربية.
المعطيات:
- اسم المستلم: ${recipientName}
- دوره: ${recipientRole === 'client' ? 'عميل محتمل' : 'مهندس محتمل'}
- الهدف: ${purpose}
- تفاصيل: ${projectDetails || 'منصة Bytly للخدمات الهندسية'}

الرسالة يجب أن:
- تكون قصيرة (60-80 كلمة)
- مهنية ودافئة
- تعرّف بـ Bytly كمنصة ربط بين العملاء والمهندسين
- تحتوي دعوة واضحة للتواصل
- لا تكون ترويجية بشكل مبالغ فيه`
        });

        return Response.json({
          success: true,
          message: 'تم صياغة رسالة التواصل',
          draft: message,
          recipientName,
          tip: 'يمكنك إرسال هذه الرسالة مباشرة عبر LinkedIn InMail'
        });
      }

      // 3. نشر إعلان عن مشروع متاح للمهندسين
      case 'shareProjectOpportunity': {
        const { projectTitle, projectCategory, projectBudget, projectLocation } = data;

        const aiCaption = await base44.integrations.Core.InvokeLLM({
          prompt: `اكتب منشور LinkedIn للإعلان عن فرصة مشروع هندسي متاحة للمهندسين.
المعطيات:
- عنوان المشروع: ${projectTitle}
- التصنيف: ${projectCategory}
- الميزانية: ${projectBudget} ريال
- الموقع: ${projectLocation}

المنشور يجب أن:
- يكون جذاباً للمهندسين
- يشجع على التقديم عبر Bytly
- يتضمن hashtags: #وظائف_هندسية #مهندس #تصميم #Bytly
- بين 80-120 كلمة`
        });

        const postBody = {
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: aiCaption },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        };

        const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          },
          body: JSON.stringify(postBody)
        });

        if (!postRes.ok) {
          const err = await postRes.text();
          console.error('LinkedIn post error:', err);
          return Response.json({ error: 'فشل نشر المنشور', details: err }, { status: 400 });
        }

        return Response.json({
          success: true,
          message: 'تم نشر فرصة المشروع على LinkedIn',
          caption: aiCaption
        });
      }

      default:
        return Response.json({ error: 'Action غير معروف' }, { status: 400 });
    }

  } catch (error) {
    console.error('LinkedIn service error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});