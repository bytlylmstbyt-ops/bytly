import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, model_urn, guid, project_id } = body;

        const clientId = Deno.env.get("AUTODESK_CLIENT_ID");
        const clientSecret = Deno.env.get("AUTODESK_CLIENT_SECRET");

        // Step 1: Get Access Token
        const tokenRes = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'client_credentials',
                scope: 'data:read bucket:read metadata:read'
            })
        });

        if (!tokenRes.ok) {
            const err = await tokenRes.text();
            console.error('Token error:', err);
            return Response.json({ error: 'Failed to authenticate with Autodesk', details: err }, { status: 500 });
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        // Return token only (for viewer initialization)
        if (action === 'get_token') {
            return Response.json({ access_token: accessToken, expires_in: tokenData.expires_in });
        }

        // Step 2: Get metadata GUIDs for a model
        if (action === 'get_metadata' && model_urn) {
            const encodedUrn = btoa(model_urn).replace(/=/g, '');
            const metaRes = await fetch(
                `https://developer.api.autodesk.com/modelderivative/v2/designdata/${encodedUrn}/metadata`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (!metaRes.ok) {
                const err = await metaRes.text();
                console.error('Metadata error:', err);
                return Response.json({ error: 'Failed to fetch metadata', details: err }, { status: 500 });
            }

            const meta = await metaRes.json();
            return Response.json({ metadata: meta });
        }

        // Step 3: Get element properties for search indexing
        if (action === 'get_properties' && model_urn && guid) {
            const encodedUrn = btoa(model_urn).replace(/=/g, '');
            const propsRes = await fetch(
                `https://developer.api.autodesk.com/modelderivative/v2/designdata/${encodedUrn}/metadata/${guid}/properties`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (!propsRes.ok) {
                const err = await propsRes.text();
                console.error('Properties error:', err);
                return Response.json({ error: 'Failed to fetch properties', details: err }, { status: 500 });
            }

            const props = await propsRes.json();

            // Flatten properties for search indexing
            const elements = props?.data?.collection || [];
            const indexed = elements.map(el => ({
                objectid: el.objectid,
                name: el.name,
                properties: el.properties
            }));

            return Response.json({ properties: indexed, total: indexed.length });
        }

        // Step 4: List hubs/projects from BIM 360
        if (action === 'list_hubs') {
            const hubsRes = await fetch(
                'https://developer.api.autodesk.com/project/v1/hubs',
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (!hubsRes.ok) {
                const err = await hubsRes.text();
                console.error('Hubs error:', err);
                return Response.json({ error: 'Failed to fetch hubs', details: err }, { status: 500 });
            }

            const hubs = await hubsRes.json();
            return Response.json({ hubs: hubs.data || [] });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('BIM Service error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});