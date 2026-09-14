import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    // Publishing to the company Instagram account is admin-only.
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { action, imageUrl, caption } = body;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("instagram");

    // Get Instagram user ID
    const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
    const meData = await meRes.json();

    if (meData.error) {
      console.error("Instagram me error:", meData.error);
      return Response.json({ error: meData.error.message }, { status: 400 });
    }

    const igUserId = meData.id;

    if (action === "getProfile") {
      return Response.json({ success: true, profile: { id: meData.id, username: meData.username } });
    }

    if (action === "publishPhoto") {
      if (!imageUrl || !caption) {
        return Response.json({ error: "imageUrl and caption are required" }, { status: 400 });
      }

      // Step 1: Create media container
      const containerRes = await fetch(
        `https://graph.instagram.com/v19.0/${igUserId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: imageUrl,
            caption: caption,
            access_token: accessToken,
          }),
        }
      );
      const containerData = await containerRes.json();
      console.log("Container response:", JSON.stringify(containerData));

      if (containerData.error) {
        return Response.json({ error: containerData.error.message }, { status: 400 });
      }

      const creationId = containerData.id;

      // Step 2: Publish
      const publishRes = await fetch(
        `https://graph.instagram.com/v19.0/${igUserId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: accessToken,
          }),
        }
      );
      const publishData = await publishRes.json();
      console.log("Publish response:", JSON.stringify(publishData));

      if (publishData.error) {
        return Response.json({ error: publishData.error.message }, { status: 400 });
      }

      return Response.json({ success: true, postId: publishData.id, message: "تم نشر الصورة على Instagram ✓" });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });

  } catch (error) {
    console.error("instagramPortfolio error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});