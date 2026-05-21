import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// OAuth 1.0a signature for Twitter API v2
async function hmacSha1(key, data) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataBuffer = encoder.encode(data);
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

async function buildOAuthHeader(method, url, body) {
  const apiKey = Deno.env.get('TWITTER_API_KEY');
  const apiSecret = Deno.env.get('TWITTER_API_SECRET');
  const accessToken = Deno.env.get('TWITTER_ACCESS_TOKEN');
  const accessTokenSecret = Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET');

  const nonce = crypto.randomUUID().replace(/-/g, '');
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const oauthParams = {
    oauth_consumer_key: apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: '1.0',
  };

  // Parse body params if any
  const bodyParams = {};
  if (body) {
    try {
      const parsed = JSON.parse(body);
      // For tweet text in body we don't include it in signature base (it's JSON body)
    } catch {}
  }

  const allParams = { ...oauthParams, ...bodyParams };
  const sortedParams = Object.keys(allParams).sort().map(k => `${percentEncode(k)}=${percentEncode(allParams[k])}`).join('&');
  const signatureBase = `${method}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
  const signingKey = `${percentEncode(apiSecret)}&${percentEncode(accessTokenSecret)}`;
  const signature = await hmacSha1(signingKey, signatureBase);

  oauthParams.oauth_signature = signature;
  const header = 'OAuth ' + Object.keys(oauthParams).sort().map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`).join(', ');
  return header;
}

async function postTweet(text) {
  const url = 'https://api.twitter.com/2/tweets';
  const body = JSON.stringify({ text });
  const oauthHeader = await buildOAuthHeader('POST', url, body);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': oauthHeader,
      'Content-Type': 'application/json',
    },
    body,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || data.title || JSON.stringify(data));
  return data;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, ...params } = await req.json();

    // Generate tweet content via LLM then post
    let tweetText = '';

    if (action === 'share_design') {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `أنت مسوّق محترف لمنصة Bytly للهندسة والتصميم المعماري في السعودية.
اكتب تغريدة احترافية باللغة العربية (280 حرف كحد أقصى) تعرض أعمال مهندس/مصمم.
معلومات: ${JSON.stringify(params)}
يجب أن تحتوي على هاشتاق مناسب مثل #بيتلي #هندسة #تصميم #السعودية
أعطني نص التغريدة فقط بدون أي مقدمة.`
      });
      tweetText = result;
    } else if (action === 'project_completion') {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `اكتب تغريدة احترافية باللغة العربية (280 حرف كحد أقصى) تعلن عن إتمام مشروع هندسي.
معلومات: ${JSON.stringify(params)}
هاشتاق: #بيتلي #مشروع_مكتمل #هندسة #السعودية
أعطني نص التغريدة فقط.`
      });
      tweetText = result;
    } else if (action === 'custom') {
      tweetText = params.text || params.content || '';
    } else {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `اكتب تغريدة تسويقية احترافية باللغة العربية لمنصة Bytly (280 حرف كحد أقصى).
الموضوع: ${action}
معلومات: ${JSON.stringify(params)}
هاشتاق: #بيتلي #هندسة #السعودية
أعطني نص التغريدة فقط.`
      });
      tweetText = result;
    }

    const tweet = await postTweet(tweetText);

    return Response.json({
      success: true,
      tweet_id: tweet.data?.id,
      tweet_url: `https://x.com/bytlylmstbyt/status/${tweet.data?.id}`,
      content: tweetText,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});