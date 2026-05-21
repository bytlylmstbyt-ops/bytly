import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// --- Instagram Analytics ---
async function getInstagramAnalytics(accessToken) {
  try {
    // Get user ID
    const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
    const me = await meRes.json();
    if (me.error) throw new Error(me.error.message);

    // Get recent media (last 10 posts)
    const mediaRes = await fetch(
      `https://graph.instagram.com/${me.id}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,media_url,permalink&limit=10&access_token=${accessToken}`
    );
    const mediaData = await mediaRes.json();
    if (mediaData.error) throw new Error(mediaData.error.message);

    const posts = mediaData.data || [];
    const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0);
    const totalComments = posts.reduce((s, p) => s + (p.comments_count || 0), 0);
    const totalEngagement = totalLikes + totalComments;

    return {
      platform: 'instagram',
      username: me.username,
      posts_count: posts.length,
      total_likes: totalLikes,
      total_comments: totalComments,
      total_engagement: totalEngagement,
      avg_engagement: posts.length ? Math.round(totalEngagement / posts.length) : 0,
      top_post: posts.sort((a, b) => ((b.like_count || 0) + (b.comments_count || 0)) - ((a.like_count || 0) + (a.comments_count || 0)))[0] || null,
      posts,
    };
  } catch (e) {
    return { platform: 'instagram', error: e.message };
  }
}

// --- LinkedIn Analytics ---
async function getLinkedInAnalytics(accessToken) {
  try {
    // Get profile info
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const profile = await profileRes.json();
    if (profile.error) throw new Error(profile.error_description || profile.error);

    // Get recent posts (shares/ugcPosts)
    const postsRes = await fetch(
      `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(${encodeURIComponent('urn:li:person:' + profile.sub)})&count=10`,
      { headers: { 'Authorization': `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' } }
    );
    const postsData = await postsRes.json();
    const posts = postsData.elements || [];

    // Get social actions (likes/comments) for each post
    let totalLikes = 0;
    let totalComments = 0;

    for (const post of posts.slice(0, 5)) {
      const urn = encodeURIComponent(post.id);
      const statsRes = await fetch(
        `https://api.linkedin.com/v2/socialActions/${urn}?fields=likesSummary,commentsSummary`,
        { headers: { 'Authorization': `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' } }
      );
      const stats = await statsRes.json();
      totalLikes += stats.likesSummary?.totalLikes || 0;
      totalComments += stats.commentsSummary?.totalFirstLevelComments || 0;
    }

    const totalEngagement = totalLikes + totalComments;

    return {
      platform: 'linkedin',
      username: profile.name || profile.email,
      posts_count: posts.length,
      total_likes: totalLikes,
      total_comments: totalComments,
      total_engagement: totalEngagement,
      avg_engagement: posts.length ? Math.round(totalEngagement / Math.min(posts.length, 5)) : 0,
      posts: posts.slice(0, 10).map(p => ({
        id: p.id,
        text: p.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '',
        timestamp: p.created?.time ? new Date(p.created.time).toISOString() : null,
      })),
    };
  } catch (e) {
    return { platform: 'linkedin', error: e.message };
  }
}

// --- Twitter/X Analytics ---
async function getTwitterAnalytics(apiKey, apiSecret, accessToken, accessTokenSecret) {
  async function hmacSha1(key, data) {
    const enc = new TextEncoder();
    const ck = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', ck, enc.encode(data));
    return btoa(String.fromCharCode(...new Uint8Array(sig)));
  }
  function pe(s) { return encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase()); }

  async function oauthHeader(method, url, extraParams = {}) {
    const oauthParams = {
      oauth_consumer_key: apiKey,
      oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: accessToken,
      oauth_version: '1.0',
    };
    const allParams = { ...oauthParams, ...extraParams };
    const sortedParams = Object.keys(allParams).sort().map(k => `${pe(k)}=${pe(allParams[k])}`).join('&');
    const base = `${method}&${pe(url)}&${pe(sortedParams)}`;
    const signingKey = `${pe(apiSecret)}&${pe(accessTokenSecret)}`;
    oauthParams.oauth_signature = await hmacSha1(signingKey, base);
    return 'OAuth ' + Object.keys(oauthParams).sort().map(k => `${pe(k)}="${pe(oauthParams[k])}"`).join(', ');
  }

  try {
    // Get user info
    const meUrl = 'https://api.twitter.com/2/users/me';
    const meRes = await fetch(meUrl, { headers: { 'Authorization': await oauthHeader('GET', meUrl) } });
    const meData = await meRes.json();
    if (meData.errors) throw new Error(meData.errors[0]?.detail || 'Twitter API error');
    const userId = meData.data?.id;

    // Get recent tweets with public metrics
    const tweetsUrl = `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=public_metrics,created_at,text`;
    const tweetsParams = { max_results: '10', 'tweet.fields': 'public_metrics,created_at,text' };
    const tweetsRes = await fetch(tweetsUrl, { headers: { 'Authorization': await oauthHeader('GET', `https://api.twitter.com/2/users/${userId}/tweets`, tweetsParams) } });
    const tweetsData = await tweetsRes.json();
    const tweets = tweetsData.data || [];

    const totalLikes = tweets.reduce((s, t) => s + (t.public_metrics?.like_count || 0), 0);
    const totalReplies = tweets.reduce((s, t) => s + (t.public_metrics?.reply_count || 0), 0);
    const totalRetweets = tweets.reduce((s, t) => s + (t.public_metrics?.retweet_count || 0), 0);
    const totalEngagement = totalLikes + totalReplies + totalRetweets;

    const topTweet = [...tweets].sort((a, b) =>
      ((b.public_metrics?.like_count || 0) + (b.public_metrics?.reply_count || 0)) -
      ((a.public_metrics?.like_count || 0) + (a.public_metrics?.reply_count || 0))
    )[0] || null;

    return {
      platform: 'twitter',
      username: meData.data?.username,
      posts_count: tweets.length,
      total_likes: totalLikes,
      total_comments: totalReplies,
      total_retweets: totalRetweets,
      total_engagement: totalEngagement,
      avg_engagement: tweets.length ? Math.round(totalEngagement / tweets.length) : 0,
      top_post: topTweet ? {
        id: topTweet.id,
        text: topTweet.text,
        timestamp: topTweet.created_at,
        url: `https://x.com/bytlylmstbyt/status/${topTweet.id}`,
        likes: topTweet.public_metrics?.like_count || 0,
        comments: topTweet.public_metrics?.reply_count || 0,
        retweets: topTweet.public_metrics?.retweet_count || 0,
      } : null,
      posts: tweets.map(t => ({
        id: t.id,
        text: t.text,
        timestamp: t.created_at,
        url: `https://x.com/bytlylmstbyt/status/${t.id}`,
        likes: t.public_metrics?.like_count || 0,
        comments: t.public_metrics?.reply_count || 0,
        retweets: t.public_metrics?.retweet_count || 0,
      })),
    };
  } catch (e) {
    return { platform: 'twitter', error: e.message };
  }
}

// --- Main Handler ---
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch tokens in parallel
    const [igConn, liConn] = await Promise.all([
      base44.asServiceRole.connectors.getConnection('instagram').catch(() => null),
      base44.asServiceRole.connectors.getConnection('linkedin').catch(() => null),
    ]);

    const apiKey = Deno.env.get('TWITTER_API_KEY');
    const apiSecret = Deno.env.get('TWITTER_API_SECRET');
    const twitterAccessToken = Deno.env.get('TWITTER_ACCESS_TOKEN');
    const twitterAccessTokenSecret = Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET');

    // Fetch analytics in parallel
    const [instagram, linkedin, twitter] = await Promise.all([
      igConn ? getInstagramAnalytics(igConn.accessToken) : Promise.resolve({ platform: 'instagram', error: 'Not connected' }),
      liConn ? getLinkedInAnalytics(liConn.accessToken) : Promise.resolve({ platform: 'linkedin', error: 'Not connected' }),
      (apiKey && apiSecret && twitterAccessToken && twitterAccessTokenSecret)
        ? getTwitterAnalytics(apiKey, apiSecret, twitterAccessToken, twitterAccessTokenSecret)
        : Promise.resolve({ platform: 'twitter', error: 'API keys not configured' }),
    ]);

    const platforms = [instagram, linkedin, twitter];
    const totalEngagement = platforms.reduce((s, p) => s + (p.total_engagement || 0), 0);
    const totalLikes = platforms.reduce((s, p) => s + (p.total_likes || 0), 0);
    const totalComments = platforms.reduce((s, p) => s + (p.total_comments || 0), 0);

    return Response.json({
      success: true,
      generated_at: new Date().toISOString(),
      summary: { totalEngagement, totalLikes, totalComments },
      platforms: { instagram, linkedin, twitter },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});