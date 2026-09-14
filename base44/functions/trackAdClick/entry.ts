import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { ad_id } = await req.json();
    if (!ad_id) return Response.json({ error: 'ad_id required' }, { status: 400 });

    const [ad] = await base44.asServiceRole.entities.Advertisement.filter({ id: ad_id });
    if (ad) {
      await base44.asServiceRole.entities.Advertisement.update(ad_id, {
        clicks: (ad.clicks || 0) + 1
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});