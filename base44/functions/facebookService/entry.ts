import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function postToFacebook(message) {
  const pageId = Deno.env.get('FACEBOOK_PAGE_ID');
  const accessToken = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');

  const url = `https://graph.facebook.com/v19.0/${pageId}/feed`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: accessToken }),
  });

  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error?.message || JSON.stringify(data));
  return data;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, ...params } = await req.json();

    let postText = '';

    if (action === 'share_design') {
      postText = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `أنت مسوّق محترف لمنصة Bytly للهندسة والتصميم المعماري في السعودية.
اكتب منشور فيسبوك احترافي باللغة العربية يعرض أعمال مهندس/مصمم.
معلومات: ${JSON.stringify(params)}
اجعله جذاباً مع هاشتاق مناسب #بيتلي #هندسة #تصميم #السعودية
أعطني نص المنشور فقط بدون أي مقدمة.`
      });
    } else if (action === 'project_completion') {
      postText = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `اكتب منشور فيسبوك احترافي باللغة العربية يعلن عن إتمام مشروع هندسي على منصة Bytly.
معلومات: ${JSON.stringify(params)}
هاشتاق: #بيتلي #مشروع_مكتمل #هندسة #السعودية
أعطني نص المنشور فقط.`
      });
    } else if (action === 'engineer_recruitment') {
      postText = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `اكتب منشور فيسبوك لاستقطاب مهندسين للانضمام لمنصة Bytly.
معلومات: ${JSON.stringify(params)}
هاشتاق: #بيتلي #وظائف_هندسة #مهندس_مميز #السعودية
أعطني نص المنشور فقط.`
      });
    } else if (action === 'custom') {
      postText = params.text || params.content || '';
    } else {
      postText = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `اكتب منشور تسويقي احترافي باللغة العربية لمنصة Bytly على فيسبوك.
الموضوع: ${action}
معلومات: ${JSON.stringify(params)}
هاشتاق: #بيتلي #هندسة #السعودية
أعطني نص المنشور فقط.`
      });
    }

    const result = await postToFacebook(postText);

    return Response.json({
      success: true,
      post_id: result.id,
      post_url: `https://www.facebook.com/${result.id}`,
      content: postText,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});