import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { action, ...params } = await req.json();

    // Get Instagram access token via shared connector
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('instagram');

    // Get Instagram user ID
    const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
    const meData = await meRes.json();
    if (meData.error) throw new Error(meData.error.message);
    const igUserId = meData.id;

    // Generate caption via LLM
    let caption = '';

    if (action === 'share_design') {
      caption = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `أنت مسوّق محترف لمنصة Bytly للهندسة والتصميم المعماري في السعودية.
اكتب كابشن انستقرام احترافي وجذاب باللغة العربية لمشاركة عمل تصميمي.
معلومات: ${JSON.stringify(params)}
أضف هاشتاقات مناسبة مثل #بيتلي #تصميم_داخلي #هندسة_معمارية #ديكور #السعودية #منازل_فخمة
أعطني نص الكابشن فقط بدون أي مقدمة.`
      });
    } else if (action === 'project_completion') {
      caption = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `اكتب كابشن انستقرام احترافي باللغة العربية يعلن عن إتمام مشروع هندسي على منصة Bytly.
معلومات: ${JSON.stringify(params)}
هاشتاقات: #بيتلي #مشروع_مكتمل #هندسة #تصميم #السعودية
أعطني نص الكابشن فقط.`
      });
    } else if (action === 'engineer_recruitment') {
      caption = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `اكتب كابشن انستقرام لاستقطاب مهندسين للانضمام لمنصة Bytly.
معلومات: ${JSON.stringify(params)}
هاشتاقات: #بيتلي #وظائف_هندسة #مهندس #فرص_عمل #السعودية
أعطني نص الكابشن فقط.`
      });
    } else if (action === 'custom') {
      caption = params.text || params.content || '';
    } else {
      caption = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `اكتب كابشن انستقرام تسويقي احترافي باللغة العربية لمنصة Bytly للهندسة والتصميم.
الموضوع: ${action}
معلومات: ${JSON.stringify(params)}
هاشتاقات: #بيتلي #هندسة #تصميم #السعودية
أعطني نص الكابشن فقط.`
      });
    }

    // Instagram Graph API requires an image URL to create a media container
    // For text-only posts (carousels/reels need media), we use a placeholder approach
    // Note: Instagram does NOT support text-only posts - need an image URL
    const imageUrl = params.imageUrl || params.image_url;

    if (!imageUrl) {
      // Return the generated caption for manual posting if no image provided
      return Response.json({
        success: false,
        caption,
        note: 'Instagram يتطلب صورة للنشر. يمكنك نسخ الكابشن ونشره يدوياً مع صورة.',
        requires_image: true,
      });
    }

    // Step 1: Create media container
    const containerRes = await fetch(
      `https://graph.instagram.com/${igUserId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
      { method: 'POST' }
    );
    const containerData = await containerRes.json();
    if (containerData.error) throw new Error(containerData.error.message);

    // Step 2: Publish the container
    const publishRes = await fetch(
      `https://graph.instagram.com/${igUserId}/media_publish?creation_id=${containerData.id}&access_token=${accessToken}`,
      { method: 'POST' }
    );
    const publishData = await publishRes.json();
    if (publishData.error) throw new Error(publishData.error.message);

    return Response.json({
      success: true,
      media_id: publishData.id,
      caption,
      post_url: `https://www.instagram.com/bytlylmstbyt/`,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});