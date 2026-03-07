// Scheduled job: sync BIM 360 models for updates every hour
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const clientId = Deno.env.get("AUTODESK_CLIENT_ID");
        const clientSecret = Deno.env.get("AUTODESK_CLIENT_SECRET");

        // Get token
        const tokenRes = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'client_credentials',
                scope: 'data:read metadata:read'
            })
        });

        if (!tokenRes.ok) {
            const err = await tokenRes.text();
            console.error('Token error during sync:', err);
            return Response.json({ error: 'Auth failed' }, { status: 500 });
        }

        const { access_token } = await tokenRes.json();

        // Get all BIM360-sourced models
        const models = await base44.asServiceRole.entities.BIMModel.filter({ source: 'bim360' });
        console.log(`Syncing ${models.length} BIM 360 models...`);

        const updated = [];
        for (const model of models) {
            if (!model.item_id || !model.project_id) continue;
            try {
                const res = await fetch(
                    `https://developer.api.autodesk.com/data/v1/projects/${model.project_id}/items/${model.item_id}/versions`,
                    { headers: { Authorization: `Bearer ${access_token}` } }
                );
                if (!res.ok) continue;

                const data = await res.json();
                const latest = data.data?.[0];
                if (!latest) continue;

                const latestModified = latest.attributes?.lastModifiedTime;
                if (latestModified !== model.bim360_last_modified) {
                    const newUrn = latest.relationships?.derivatives?.data?.id;
                    await base44.asServiceRole.entities.BIMModel.update(model.id, {
                        model_urn: newUrn || model.model_urn,
                        bim360_version_id: latest.id,
                        bim360_last_modified: latestModified,
                        last_bim360_sync: new Date().toISOString()
                    });
                    updated.push(model.name);
                    console.log(`Updated: ${model.name}`);
                }
            } catch (e) {
                console.error(`Failed to sync ${model.name}:`, e.message);
            }
        }

        console.log(`Sync complete. Updated: ${updated.length}`);
        return Response.json({ synced: models.length, updated_count: updated.length, updated });

    } catch (error) {
        console.error('Sync job error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});