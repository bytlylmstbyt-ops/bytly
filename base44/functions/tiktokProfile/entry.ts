import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("tiktok");

    const response = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=display_name,is_verified,avatar_url,follower_count,following_count,video_count,profile_deep_link",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || data.error?.code !== "ok") {
      return Response.json({ error: data.error?.message || "Failed to fetch TikTok profile" }, { status: 400 });
    }

    const user = data.data?.user || {};
    return Response.json({
      display_name: user.display_name,
      is_verified: user.is_verified || false,
      avatar_url: user.avatar_url,
      follower_count: user.follower_count,
      following_count: user.following_count,
      video_count: user.video_count,
      profile_deep_link: user.profile_deep_link,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});