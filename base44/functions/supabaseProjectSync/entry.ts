import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Bidirectional project-status sync between Base44 (Project entity) and a
 * Supabase table (`project_status_sync`).
 *
 * Triggered by the "Supabase Project Status Sync" workflow whenever a Project
 * entity is created / updated / deleted.
 *
 *  • PUSH  — reflects the triggered Base44 project change into Supabase (upsert
 *            on create/update, delete on delete). Base44 wins for the record
 *            that triggered the sync.
 *  • PULL  — reconciles Supabase-side edits back into Base44. A row is
 *            considered "externally edited" when its Supabase `updated_at` is
 *            >2s ahead of `base44_updated_at` (our push sets both timestamps
 *            together, so they stay aligned). Only rows whose values actually
 *            differ from Base44 are updated — this prevents cascading
 *            workflow re-triggers and converges to a stable state.
 */

const TABLE = 'project_status_sync';
const SYNC_FIELDS = [
  'title', 'status', 'phase', 'phase_progress', 'category', 'project_type',
  'assigned_engineer_id', 'client_id', 'location', 'start_date', 'deadline',
  'budget_min', 'budget_max',
];

const DDL = `
CREATE TABLE IF NOT EXISTS ${TABLE} (
  base44_id text PRIMARY KEY,
  title text,
  status text,
  phase text,
  phase_progress numeric,
  category text,
  project_type text,
  assigned_engineer_id text,
  client_id text,
  location text,
  start_date date,
  deadline date,
  budget_min numeric,
  budget_max numeric,
  base44_updated_at timestamptz,
  updated_at timestamptz DEFAULT now()
);
CREATE OR REPLACE FUNCTION ${TABLE}_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_${TABLE}_updated ON ${TABLE};
CREATE TRIGGER trg_${TABLE}_updated
  BEFORE UPDATE ON ${TABLE}
  FOR EACH ROW EXECUTE FUNCTION ${TABLE}_set_updated_at();
`;

const norm = (v: unknown) => (v === null || v === undefined ? '' : String(v));

function mapProject(p: any) {
  return {
    base44_id: p.id,
    title: p.title ?? null,
    status: p.status ?? null,
    phase: p.phase ?? null,
    phase_progress: p.phase_progress ?? null,
    category: p.category ?? null,
    project_type: p.project_type ?? null,
    assigned_engineer_id: p.assigned_engineer_id ?? null,
    client_id: p.client_id ?? null,
    location: p.location ?? null,
    start_date: p.start_date ?? null,
    deadline: p.deadline ?? null,
    budget_min: p.budget_min ?? null,
    budget_max: p.budget_max ?? null,
    base44_updated_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    // ── Supabase connection + project ref + service_role key ──────────
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');

    const projectsRes = await fetch('https://api.supabase.com/v1/projects', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!projectsRes.ok) {
      return Response.json(
        { error: `Supabase projects list failed (${projectsRes.status})` },
        { status: 502 }
      );
    }
    const projectsList = await projectsRes.json();
    const projectRef = projectsList?.[0]?.ref;
    if (!projectRef) {
      return Response.json(
        { error: 'No Supabase project found in your account' },
        { status: 404 }
      );
    }

    const keysRes = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/api-keys`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!keysRes.ok) {
      return Response.json({ error: 'Failed to fetch Supabase API keys' }, { status: 502 });
    }
    const keys = await keysRes.json();
    const serviceRoleKey = Array.isArray(keys)
      ? keys.find((k: any) => k.name === 'service_role')?.api_key
      : null;
    if (!serviceRoleKey) {
      return Response.json({ error: 'Supabase service_role key not found' }, { status: 500 });
    }

    const restUrl = `https://${projectRef}.supabase.co/rest/v1/${TABLE}`;
    const restHeaders = {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    };

    // ── Ensure sync table + updated_at trigger exist ──────────────────
    const ddlRes = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: DDL }),
      }
    );
    if (!ddlRes.ok) {
      const errText = await ddlRes.text();
      return Response.json(
        { error: `Failed to create sync table: ${errText}` },
        { status: 502 }
      );
    }

    const payload = await req.json().catch(() => ({}));
    const { project_id, event_type } = payload;

    let pushed = 0;
    let pulled = 0;

    // ── PUSH: reflect the triggered Base44 change into Supabase ──────
    if (project_id && event_type === 'delete') {
      const delRes = await fetch(`${restUrl}?base44_id=eq.${project_id}`, {
        method: 'DELETE',
        headers: restHeaders,
      });
      if (delRes.ok) pushed = 1;
    } else if (project_id) {
      try {
        const project = await base44.asServiceRole.entities.Project.get(project_id);
        if (project) {
          const upsertRes = await fetch(restUrl, {
            method: 'POST',
            headers: { ...restHeaders, Prefer: 'resolution=merge-duplicates' },
            body: JSON.stringify(mapProject(project)),
          });
          if (upsertRes.ok) pushed = 1;
        }
      } catch (e) {
        console.error('supabaseProjectSync push error:', e?.message || e);
      }
    }

    // ── PULL: reconcile externally-edited Supabase rows → Base44 ─────
    // A row is "externally edited" when its updated_at is >2s ahead of
    // base44_updated_at. The Supabase trigger bumps updated_at on every
    // external edit; our push sets both timestamps together so they stay
    // aligned and the row is not re-pulled.
    const pullRes = await fetch(
      `${restUrl}?select=base44_id,${SYNC_FIELDS.join(',')},updated_at,base44_updated_at&order=updated_at.desc&limit=10000`,
      { headers: restHeaders }
    );
    if (pullRes.ok) {
      const rows = await pullRes.json();
      for (const row of Array.isArray(rows) ? rows : []) {
        const updatedAt = row.updated_at ? new Date(row.updated_at).getTime() : 0;
        const base44UpdatedAt = row.base44_updated_at
          ? new Date(row.base44_updated_at).getTime()
          : 0;
        if (updatedAt - base44UpdatedAt <= 2000) continue; // not externally edited

        try {
          const current = await base44.asServiceRole.entities.Project.get(row.base44_id);
          if (!current) continue;

          const updateData: Record<string, any> = {};
          for (const f of SYNC_FIELDS) {
            if (row[f] === null || row[f] === undefined) continue;
            if (norm(row[f]) !== norm(current[f])) {
              updateData[f] = row[f];
            }
          }
          if (Object.keys(updateData).length > 0) {
            await base44.asServiceRole.entities.Project.update(row.base44_id, updateData);
            pulled++;
          }
        } catch {
          // project may have been deleted in Base44 — skip
        }
      }
    }

    return Response.json({ ok: true, project_ref: projectRef, pushed, pulled });
  } catch (error) {
    console.error('supabaseProjectSync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});