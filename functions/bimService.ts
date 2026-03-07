import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Helper: get 2-legged token (client credentials)
async function getTwoLeggedToken(clientId, clientSecret) {
    const res = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
            scope: 'data:read data:write bucket:read bucket:create metadata:read'
        })
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error('Autodesk auth failed: ' + err);
    }
    const data = await res.json();
    return data.access_token;
}

// Helper: APS API call
async function apsGet(url, token) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`APS GET ${url} failed: ${err}`);
    }
    return res.json();
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, hub_id, project_id, folder_id, item_id, model_urn, guid } = body;

        const clientId = Deno.env.get("AUTODESK_CLIENT_ID");
        const clientSecret = Deno.env.get("AUTODESK_CLIENT_SECRET");
        const token = await getTwoLeggedToken(clientId, clientSecret);

        // ─── TOKEN ─────────────────────────────────────────────
        if (action === 'get_token') {
            return Response.json({ access_token: token, expires_in: 3600 });
        }

        // ─── LIST HUBS (ACC / BIM 360 accounts) ───────────────
        if (action === 'list_hubs') {
            const data = await apsGet('https://developer.api.autodesk.com/project/v1/hubs', token);
            return Response.json({ hubs: data.data || [] });
        }

        // ─── LIST PROJECTS in a hub ────────────────────────────
        if (action === 'list_projects' && hub_id) {
            const data = await apsGet(
                `https://developer.api.autodesk.com/project/v1/hubs/${hub_id}/projects`,
                token
            );
            return Response.json({ projects: data.data || [] });
        }

        // ─── LIST TOP FOLDERS in a project ────────────────────
        if (action === 'list_top_folders' && hub_id && project_id) {
            const data = await apsGet(
                `https://developer.api.autodesk.com/project/v1/hubs/${hub_id}/projects/${project_id}/topFolders`,
                token
            );
            return Response.json({ folders: data.data || [] });
        }

        // ─── LIST FOLDER CONTENTS ──────────────────────────────
        if (action === 'list_folder_contents' && project_id && folder_id) {
            const data = await apsGet(
                `https://developer.api.autodesk.com/data/v1/projects/${project_id}/folders/${folder_id}/contents`,
                token
            );
            const items = (data.data || []).map(item => ({
                id: item.id,
                type: item.type,
                name: item.attributes?.displayName || item.attributes?.name || 'بدون اسم',
                extension: item.attributes?.fileType || '',
                last_modified: item.attributes?.lastModifiedTime,
                version_id: item.relationships?.tip?.data?.id
            }));
            return Response.json({ items });
        }

        // ─── GET ITEM VERSIONS (for sync detection) ───────────
        if (action === 'get_item_versions' && project_id && item_id) {
            const data = await apsGet(
                `https://developer.api.autodesk.com/data/v1/projects/${project_id}/items/${item_id}/versions`,
                token
            );
            const versions = (data.data || []).map(v => ({
                id: v.id,
                version_number: v.attributes?.versionNumber,
                last_modified: v.attributes?.lastModifiedTime,
                urn: v.relationships?.derivatives?.data?.id || null,
                file_name: v.attributes?.name
            }));
            return Response.json({ versions });
        }

        // ─── IMPORT ITEM → CREATE BIMModel record ──────────────
        if (action === 'import_item' && project_id && item_id) {
            // Get latest version
            const versionsData = await apsGet(
                `https://developer.api.autodesk.com/data/v1/projects/${project_id}/items/${item_id}/versions`,
                token
            );
            const latest = versionsData.data?.[0];
            if (!latest) {
                return Response.json({ error: 'No versions found for this item' }, { status: 404 });
            }

            const urn = latest.relationships?.derivatives?.data?.id;
            const fileName = latest.attributes?.name || 'Unknown';
            const lastModified = latest.attributes?.lastModifiedTime;

            // Check if already imported
            const existing = await base44.asServiceRole.entities.BIMModel.filter({ item_id });
            if (existing.length > 0) {
                // Update existing record with new version info
                await base44.asServiceRole.entities.BIMModel.update(existing[0].id, {
                    model_urn: urn || existing[0].model_urn,
                    last_bim360_sync: new Date().toISOString(),
                    bim360_version_id: latest.id,
                    bim360_last_modified: lastModified
                });
                return Response.json({ status: 'updated', model: existing[0] });
            }

            // Create new BIMModel record
            const newModel = await base44.asServiceRole.entities.BIMModel.create({
                name: fileName,
                model_urn: urn || '',
                item_id,
                project_id,
                hub_id: body.hub_id || '',
                folder_id: folder_id || '',
                bim360_version_id: latest.id,
                bim360_last_modified: lastModified,
                last_bim360_sync: new Date().toISOString(),
                source: 'bim360'
            });

            return Response.json({ status: 'imported', model: newModel });
        }

        // ─── SYNC ALL - check for updates ─────────────────────
        if (action === 'sync_all') {
            if (user.role !== 'admin') {
                return Response.json({ error: 'Admin only' }, { status: 403 });
            }
            const models = await base44.asServiceRole.entities.BIMModel.filter({ source: 'bim360' });
            const updated = [];

            for (const model of models) {
                if (!model.item_id || !model.project_id) continue;
                try {
                    const versionsData = await apsGet(
                        `https://developer.api.autodesk.com/data/v1/projects/${model.project_id}/items/${model.item_id}/versions`,
                        token
                    );
                    const latest = versionsData.data?.[0];
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
                        updated.push({ id: model.id, name: model.name });
                    }
                } catch (e) {
                    console.error(`Sync failed for model ${model.id}:`, e.message);
                }
            }

            return Response.json({ synced: models.length, updated_count: updated.length, updated });
        }

        // ─── METADATA & PROPERTIES ────────────────────────────
        if (action === 'get_metadata' && model_urn) {
            const encodedUrn = model_urn.startsWith('urn:') ? btoa(model_urn).replace(/=/g, '') : model_urn;
            const meta = await apsGet(
                `https://developer.api.autodesk.com/modelderivative/v2/designdata/${encodedUrn}/metadata`,
                token
            );
            return Response.json({ metadata: meta });
        }

        if (action === 'get_properties' && model_urn && guid) {
            const encodedUrn = model_urn.startsWith('urn:') ? btoa(model_urn).replace(/=/g, '') : model_urn;
            const props = await apsGet(
                `https://developer.api.autodesk.com/modelderivative/v2/designdata/${encodedUrn}/metadata/${guid}/properties`,
                token
            );
            const elements = props?.data?.collection || [];
            return Response.json({
                properties: elements.map(el => ({
                    objectid: el.objectid,
                    name: el.name,
                    properties: el.properties
                })),
                total: elements.length
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('BIM Service error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});