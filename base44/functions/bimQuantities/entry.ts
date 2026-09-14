import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Helper: APS GET
async function apsGet(url, token) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`APS GET failed [${res.status}]: ${await res.text()}`);
    return res.json();
}

// Helper: 2-legged token
async function getTwoLeggedToken(clientId, clientSecret) {
    const res = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
            scope: 'data:read bucket:read metadata:read viewables:read'
        })
    });
    if (!res.ok) throw new Error('Autodesk auth failed: ' + await res.text());
    return (await res.json()).access_token;
}

// Encode URN to base64 without padding
function encodeUrn(urn) {
    if (!urn.startsWith('urn:')) return urn;
    return btoa(urn).replace(/=/g, '');
}

// Extract material quantities from raw properties collection
function extractQuantities(elements) {
    const materialsMap = {};
    const priorityElements = [];

    for (const el of elements) {
        const props = el.properties || {};

        // Collect dimensions & material data
        const dimensions = props['Dimensions'] || props['المقاسات'] || {};
        const materials = props['Materials and Finishes'] || props['المواد والتشطيبات'] || props['Material'] || {};
        const identity = props['Identity Data'] || props['بيانات الهوية'] || {};
        const phasing = props['Phasing'] || props['المراحل'] || {};
        const structural = props['Structural'] || props['إنشائي'] || {};

        const elementName = el.name || 'Unknown';
        const category = identity['Type Name'] || identity['Category'] || 'غير مصنّف';
        const material = materials['Material: Name'] || materials['Structure Material'] || materials['Material'] || Object.values(materials)[0] || null;
        const cost = parseFloat(identity['Cost'] || identity['Unit Cost'] || 0);
        const status = phasing['Phase Created'] || identity['Status'] || null;

        // Volume / Area / Length
        const volume = parseFloat(
            dimensions['Volume'] || dimensions['الحجم'] ||
            structural['Volume'] || 0
        );
        const area = parseFloat(
            dimensions['Area'] || dimensions['المساحة'] ||
            dimensions['Cut Area'] || 0
        );
        const length = parseFloat(
            dimensions['Length'] || dimensions['الطول'] ||
            dimensions['Cut Length'] || 0
        );

        if (!material && volume === 0 && area === 0 && length === 0) continue;

        const key = material || elementName;

        if (!materialsMap[key]) {
            materialsMap[key] = {
                material: key,
                category,
                elements: [],
                totalVolume: 0,
                totalArea: 0,
                totalLength: 0,
                totalCost: 0,
                count: 0,
                status: status || 'غير محدد'
            };
        }

        materialsMap[key].elements.push(elementName);
        materialsMap[key].totalVolume += volume;
        materialsMap[key].totalArea += area;
        materialsMap[key].totalLength += length;
        materialsMap[key].totalCost += cost;
        materialsMap[key].count += 1;

        // Flag high-priority: high cost or large volume
        if (cost > 1000 || volume > 10) {
            priorityElements.push({
                id: el.objectid,
                name: elementName,
                material: key,
                cost,
                volume,
                area,
                status: status || 'غير محدد',
                priority: cost > 5000 || volume > 50 ? 'critical' : 'high'
            });
        }
    }

    const quantities = Object.values(materialsMap).map(m => ({
        ...m,
        totalVolume: Math.round(m.totalVolume * 100) / 100,
        totalArea: Math.round(m.totalArea * 100) / 100,
        totalLength: Math.round(m.totalLength * 100) / 100,
        totalCost: Math.round(m.totalCost * 100) / 100,
        elements: [...new Set(m.elements)].slice(0, 10) // unique names, max 10
    }));

    // Sort by total cost desc, then volume
    quantities.sort((a, b) => (b.totalCost || b.totalVolume) - (a.totalCost || a.totalVolume));

    // Sort priority elements by cost desc
    priorityElements.sort((a, b) => b.cost - a.cost);

    return { quantities, priorityElements: priorityElements.slice(0, 50) };
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { action, model_urn, model_id, guid } = body;

        const clientId = Deno.env.get("AUTODESK_CLIENT_ID");
        const clientSecret = Deno.env.get("AUTODESK_CLIENT_SECRET");

        // ─── GET QUANTITIES ────────────────────────────────────
        if (action === 'get_quantities' && model_urn) {
            const token = await getTwoLeggedToken(clientId, clientSecret);
            const encodedUrn = encodeUrn(model_urn);

            // 1. Get metadata GUIDs
            let guidToUse = guid;
            if (!guidToUse) {
                const meta = await apsGet(
                    `https://developer.api.autodesk.com/modelderivative/v2/designdata/${encodedUrn}/metadata`,
                    token
                );
                const views = meta?.data?.metadata || [];
                const defaultView = views.find(v => v.role === '3d') || views[0];
                if (!defaultView) return Response.json({ error: 'No viewable found' }, { status: 404 });
                guidToUse = defaultView.guid;
            }

            // 2. Fetch all properties
            console.log(`Fetching properties for URN: ${encodedUrn}, GUID: ${guidToUse}`);
            const propsRes = await apsGet(
                `https://developer.api.autodesk.com/modelderivative/v2/designdata/${encodedUrn}/metadata/${guidToUse}/properties?forceget=true`,
                token
            );

            const elements = propsRes?.data?.collection || [];
            console.log(`Total elements: ${elements.length}`);

            const { quantities, priorityElements } = extractQuantities(elements);

            // 3. Optionally save indexed properties to model entity
            if (model_id && quantities.length > 0) {
                // Authorization: verify caller owns / is assigned to this model (RLS-scoped fetch).
                const [dbModel] = await base44.entities.BIMModel.filter({ id: model_id });
                if (dbModel) {
                    await base44.asServiceRole.entities.BIMModel.update(model_id, {
                        indexed_properties: quantities.slice(0, 100),
                        last_indexed: new Date().toISOString()
                    });
                }
            }

            return Response.json({
                success: true,
                total_elements: elements.length,
                quantities_count: quantities.length,
                quantities,
                priority_elements: priorityElements,
                summary: {
                    total_materials: quantities.length,
                    total_cost: Math.round(quantities.reduce((s, q) => s + q.totalCost, 0) * 100) / 100,
                    total_volume: Math.round(quantities.reduce((s, q) => s + q.totalVolume, 0) * 100) / 100,
                    total_area: Math.round(quantities.reduce((s, q) => s + q.totalArea, 0) * 100) / 100,
                    critical_count: priorityElements.filter(e => e.priority === 'critical').length,
                    high_count: priorityElements.filter(e => e.priority === 'high').length,
                }
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('BIM Quantities error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});