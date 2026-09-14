import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let connection;
    try {
      connection = await base44.asServiceRole.connectors.getConnection("tiktok");
    } catch (e) {
      return Response.json({ error: 'TikTok not connected' });
    }

    if (!connection?.accessToken) {
      return Response.json({ error: 'TikTok not connected' });
    }

    const response = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=display_name,is_verified,avatar_url,follower_count,following_count,video_count,profile_deep_link",
      {
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || data.error?.code !== "ok") {
      console.warn('TikTok API error:', JSON.stringify(data));
      return Response.json({ error: data.error?.message || 'TikTok API error' });
    }

    const tiktokUser = data.data?.user || {};
    return Response.json({
      display_name: tiktokUser.display_name,
      is_verified: tiktokUser.is_verified || false,
      avatar_url: tiktokUser.avatar_url,
      follower_count: tiktokUser.follower_count,
      following_count: tiktokUser.following_count,
      video_count: tiktokUser.video_count,
      profile_deep_link: tiktokUser.profile_deep_link,
    });
  } catch (error) {
    console.error('tiktokProfile error:', error.message);
    return Response.json({ error: error.message });
  }
});