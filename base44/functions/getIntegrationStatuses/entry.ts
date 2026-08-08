import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { secrets } from 'base44:runtime';

// All integrations managed by the platform.
// kind: 'connector' = OAuth app connector (checked via getConnection)
//        'secret'   = API-key/secret based (checked via secrets.get)
const INTEGRATIONS = [
  { type: 'stripe', kind: 'secret', secretKey: 'STRIPE_SECRET_KEY' },
  { type: 'google_analytics', kind: 'connector' },
  { type: 'instagram', kind: 'connector' },
  { type: 'tiktok', kind: 'connector' },
  { type: 'googlecalendar', kind: 'connector' },
  { type: 'gmail', kind: 'connector' },
  { type: 'linkedin', kind: 'connector' },
  { type: 'googledrive', kind: 'connector' },
  { type: 'googlesheets', kind: 'connector' },
  { type: 'googlemeet', kind: 'connector' },
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch existing SyncState records for last-sync timestamps
    const syncStates = await base44.asServiceRole.entities.SyncState.list();
    const syncMap = {};
    syncStates.forEach((s) => { syncMap[s.service] = s; });

    const now = new Date().toISOString();

    // Run all checks in parallel for speed
    const checks = await Promise.allSettled(
      INTEGRATIONS.map(async (integ) => {
        const existing = syncMap[integ.type];
        let lastSync = existing?.last_sync || null;

        let connected = false;
        let needsReauth = false;
        let errorMsg = null;

        try {
          if (integ.kind === 'connector') {
            const conn = await base44.asServiceRole.connectors.getConnection(integ.type);
            if (conn?.accessToken) connected = true;
          } else if (integ.kind === 'secret') {
            const key = secrets.get(integ.secretKey);
            if (key) connected = true;
          }
        } catch (e) {
          errorMsg = e.message || String(e);
          if (errorMsg.includes('expired') || errorMsg.includes('revoked') || errorMsg.includes('invalid_grant') || errorMsg.includes('refresh')) {
            needsReauth = true;
          }
        }

        if (connected) {
          try {
            if (existing) {
              await base44.asServiceRole.entities.SyncState.update(existing.id, { last_sync: now });
            } else {
              await base44.asServiceRole.entities.SyncState.create({ service: integ.type, last_sync: now });
            }
            lastSync = now;
          } catch (_) { /* non-critical */ }
        }

        return {
          type: integ.type,
          kind: integ.kind,
          connected,
          needs_reauth: needsReauth,
          error: errorMsg,
          last_sync: lastSync,
        };
      })
    );

    const results = checks.map((c) =>
      c.status === 'fulfilled'
        ? c.value
        : { type: 'unknown', kind: 'unknown', connected: false, needs_reauth: false, error: c.reason?.message || String(c.reason), last_sync: null }
    );

    return Response.json({
      integrations: results,
      checked_at: now,
      total: results.length,
      connected_count: results.filter((r) => r.connected && !r.needs_reauth).length,
      action_needed_count: results.filter((r) => !r.connected || r.needs_reauth).length,
    });
  } catch (error) {
    console.error('getIntegrationStatuses error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}