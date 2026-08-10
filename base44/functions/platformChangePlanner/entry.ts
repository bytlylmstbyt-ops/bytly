import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ════════════════════════════════════════════════════════════════════════
// platformChangePlanner  (Phase 3 + Project Context extension)
//
// This function NEVER writes to platform data and NEVER writes to the
// app's own source code. Its writes are limited to two things:
//   • AIChangeRequestLog — the change-plan audit/queue entity (create/update)
//   • ProjectIndexMeta   — a "refresh requested" timestamp only (update)
// There is no code-execution path here: "approve" only flips a status
// field on the log row. Applying an approved plan to the actual app is
// always a separate, manual step done by a human developer/AI-builder
// session — never triggered from this endpoint.
//
// Project Context: before planning, this function searches the
// ProjectIndexEntry entity (read-only .list()/.filter()) — a curated,
// refreshable map of pages/entities/functions/integrations — instead of
// reasoning from a fixed hardcoded list. This is genuine "search before
// deciding": a lightweight keyword match narrows ~hundreds of indexed
// rows down to the ones actually relevant to the admin's request, and
// only those are given to the planning LLM.
//
// State machine (per plan):
//   User Request → Intent Detection → Project Index Search (Impact
//   Analysis inputs) → Risk Classification → Change Plan + Change Scope
//   → Preview/Diff → Human Approval → (manual, out-of-band) Execution.
//
// Do not add any capability here that calls .create()/.update()/.delete()
// on anything other than AIChangeRequestLog / ProjectIndexMeta. Never
// request, log, or store API keys/secrets/OAuth credentials anywhere in
// this file or in ProjectIndexEntry — integrations are referenced by
// name only.
// ════════════════════════════════════════════════════════════════════════

const BLOCKED_TOPICS_AR_EN =
  'database schema / تعديل بنية قاعدة البيانات، creating or deleting or updating database records / إنشاء أو حذف أو تعديل سجلات قاعدة البيانات، ' +
  'authentication / المصادقة، roles / الأدوار، permissions / الصلاحيات، payments / المدفوعات، refunds / المبالغ المستردة، ' +
  'withdrawals / طلبات السحب، commissions / العمولات، escrow / الضمان المالي، contracts / العقود، ' +
  'financial calculations / الحسابات المالية، production deployment / النشر على الإنتاج، API secrets / مفاتيح الـ API، ' +
  'external OAuth credentials / بيانات اعتماد OAuth الخارجية';

// Defensive fallback net — independent of what the classifier LLM
// decided. Includes destructive verbs (delete/حذف) explicitly, since a
// request like "delete all users" must never slip through on wording alone.
const DANGER_WORDS = /(database|db schema|قاعدة البيانات|صلاحي|role|auth|دفع|payment|refund|استرداد|سحب|withdraw|عمولة|commission|escrow|ضمان مالي|عقد|contract|deploy|نشر|api key|secret|oauth|\bحذف\b|\bdelete\b|\bremove all\b|جميع المستخدمين|all users)/i;

// Very light stopword-free keyword extraction for matching the request
// against the Project Index. Deliberately simple — this is a relevance
// pre-filter to keep the LLM prompt small and focused, not a search engine.
function extractKeywords(text) {
  return Array.from(new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3)
  ));
}

async function searchProjectIndex(base44, request) {
  const keywords = extractKeywords(request);
  let allEntries = [];
  try {
    allEntries = await base44.asServiceRole.entities.ProjectIndexEntry.list();
  } catch (_e) {
    allEntries = [];
  }
  if (!allEntries.length) return { matched: [], totalIndexed: 0 };

  const scored = allEntries.map(entry => {
    const haystack = `${entry.name || ''} ${entry.description || ''} ${(entry.related_entities || []).join(' ')} ${(entry.related_functions || []).join(' ')} ${(entry.related_integrations || []).join(' ')}`.toLowerCase();
    let score = 0;
    for (const kw of keywords) if (haystack.includes(kw)) score += 1;
    return { entry, score };
  });

  const matched = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(s => s.entry);

  // Always include a small set of admin-hub pages as a fallback so the
  // planner still has structural context even on a poor keyword match.
  const fallback = allEntries.filter(e => e.file_type === 'page' && e.route?.startsWith('/Admin')).slice(0, 10);
  const combined = matched.length ? matched : fallback;

  return { matched: combined, totalIndexed: allEntries.length };
}

Deno.serve(async (req) => {
  const startedAt = Date.now();
  const base44 = createClientFromRequest(req);
  let user;

  try {
    user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json();
    const action = body?.action || 'propose';

    // ── Approve / reject an already-proposed plan ──────────────────────
    if (action === 'approve' || action === 'reject') {
      const { id } = body;
      if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });
      const status = action === 'approve' ? 'approved' : 'rejected';
      const execution_note = action === 'approve'
        ? 'تمت الموافقة — سيتم تنفيذ التغيير يدويًا من قبل المطوّر/جلسة المساعد. لا يوجد تنفيذ تلقائي في هذه المرحلة.'
        : 'تم رفض الاقتراح ولن يُنفَّذ.';
      await base44.asServiceRole.entities.AIChangeRequestLog.update(id, { status, execution_note });
      return Response.json({ success: true, status });
    }

    // ── Refresh index status: read-only stats, no live re-scan possible
    // from inside this function (no filesystem access to the source
    // tree). Real re-indexing is performed by the assistant/developer.
    if (action === 'refresh_index_status') {
      let meta = null;
      try {
        const rows = await base44.asServiceRole.entities.ProjectIndexMeta.list('-last_indexed_at', 1);
        meta = rows?.[0] || null;
      } catch (_e) { /* meta entity may be empty on first run */ }
      let total = 0;
      try {
        const all = await base44.asServiceRole.entities.ProjectIndexEntry.list();
        total = all.length;
      } catch (_e) { /* ignore */ }
      return Response.json({
        success: true,
        meta,
        live_total_indexed: total,
        note: 'إعادة الفهرسة الفعلية (مسح الملفات من جديد) تتم عبر المساعد في جلسة المحرر — هذا الإجراء يعرض حالة الفهرس الحالي فقط.',
      });
    }

    // ── Propose: search Project Index → classify + generate a change plan ──
    const request = (body?.request || '').trim();
    if (!request) return Response.json({ error: 'Missing request' }, { status: 400 });

    const { matched: indexMatches, totalIndexed } = await searchProjectIndex(base44, request);

    const planning = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI Change Planner with Project Context inside the admin dashboard of Bytly, a construction/engineering marketplace platform built with React (frontend) and Base44 (backend/entities). You NEVER execute changes yourself — you only produce a structured, human-reviewable Change Plan for a non-technical admin. You do not have live access to the source code; reason using the Project Index search results below, which come from a real, refreshable index of the platform's pages/entities/functions/integrations.

Project Index search results relevant to this request (name [type]: description — related entities/functions/integrations):
${indexMatches.map(e => `- ${e.name} [${e.file_type}]${e.route ? ` (${e.route})` : ''}: ${e.description || ''} — entities: ${(e.related_entities || []).join(', ') || 'none'}; functions: ${(e.related_functions || []).join(', ') || 'none'}; integrations: ${(e.related_integrations || []).join(', ') || 'none'}`).join('\n') || '(no relevant index entries found — say so plainly in your answer rather than guessing)'}

Categories that must ALWAYS be blocked from automatic execution — if the request touches any of these, set blocked=true and change_type accordingly, and briefly explain why in block_reason (do not produce a full plan for the blocked parts):
${BLOCKED_TOPICS_AR_EN}

CRITICAL: never ask for, request, or reference any API key, secret, or OAuth credential value, even for integration-related requests — only describe what KIND of credential/auth an integration needs (e.g. "OAuth" or "API key"), never a value.

Admin's change request (Arabic or English, possibly informal): "${request}"

Analyze and respond with a full structured Change Plan:
1. language: "ar" or "en"
2. detected_intent: one short English sentence describing what the admin wants (for internal logging)
3. target_page: the single best-matching page name from the Project Index results above, or "unknown" if none fits
4. affected_files: file_path values from the Project Index results that are actually relevant (best-effort, from real index data, not invented)
5. affected_pages: page names from the Project Index results that would be affected
6. affected_entities: entity names from the Project Index results that would be affected
7. affected_functions: backend function names from the Project Index results that would be affected
8. affected_integrations: integration names from the Project Index results that would be affected (empty array if none)
9. unaffected_summary: one or two Arabic sentences on what will NOT change (the safe boundary of this edit)
10. change_type: "ui_only", "logic", or "data"
11. risk_level: "low", "medium", or "high"
12. requires_db_change / requires_backend_change / requires_permission_change: booleans
13. tests_required: short list of what should be checked before/after applying the change
14. blocked: true if this touches any of the always-blocked categories above, OR if change_type is "data" or the request implies deleting/overwriting real records, OR if the Project Index has no relevant match at all for a page/component-specific request
15. block_reason: if blocked, a one-sentence Arabic explanation of why this needs additional human review
16. plain_explanation_ar: 2-4 sentences in clear, simple Arabic explaining what would change, written for a non-programmer, referencing the actual page/entity/function names found. If blocked, explain what was understood and why it needs a developer instead.
17. diff_preview: a short, human-readable, diff-style text preview of the proposed change. If blocked, leave this empty.`,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          language: { type: 'string', enum: ['ar', 'en'] },
          detected_intent: { type: 'string' },
          target_page: { type: 'string' },
          affected_files: { type: 'array', items: { type: 'string' } },
          affected_pages: { type: 'array', items: { type: 'string' } },
          affected_entities: { type: 'array', items: { type: 'string' } },
          affected_functions: { type: 'array', items: { type: 'string' } },
          affected_integrations: { type: 'array', items: { type: 'string' } },
          unaffected_summary: { type: 'string' },
          change_type: { type: 'string', enum: ['ui_only', 'logic', 'data'] },
          risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
          requires_db_change: { type: 'boolean' },
          requires_backend_change: { type: 'boolean' },
          requires_permission_change: { type: 'boolean' },
          tests_required: { type: 'array', items: { type: 'string' } },
          blocked: { type: 'boolean' },
          block_reason: { type: 'string' },
          plain_explanation_ar: { type: 'string' },
          diff_preview: { type: 'string' },
        },
        required: [
          'language', 'detected_intent', 'target_page', 'affected_files', 'affected_pages', 'affected_entities',
          'affected_functions', 'affected_integrations', 'unaffected_summary', 'change_type', 'risk_level',
          'requires_db_change', 'requires_backend_change', 'requires_permission_change', 'tests_required',
          'blocked', 'block_reason', 'plain_explanation_ar', 'diff_preview',
        ],
      },
    });

    const language = planning.language === 'en' ? 'en' : 'ar';

    const forceBlocked = planning.blocked || DANGER_WORDS.test(request);
    const blockReason = planning.blocked
      ? planning.block_reason
      : (forceBlocked ? 'هذا الطلب يمس مجالًا حساسًا (بيانات/صلاحيات/أمور مالية/نشر) ويحتاج مراجعة مطوّر مباشرة.' : '');

    const logRow = await base44.asServiceRole.entities.AIChangeRequestLog.create({
      request, language,
      asked_by_email: user.email,
      asked_by_name: user.full_name || user.email,
      detected_intent: planning.detected_intent?.slice(0, 300),
      target_page: planning.target_page,
      affected_files: planning.affected_files || [],
      affected_pages: planning.affected_pages || [],
      affected_entities: planning.affected_entities || [],
      affected_functions: planning.affected_functions || [],
      affected_integrations: planning.affected_integrations || [],
      unaffected_summary: planning.unaffected_summary?.slice(0, 800) || '',
      change_type: planning.change_type,
      risk_level: planning.risk_level,
      requires_db_change: !!planning.requires_db_change,
      requires_backend_change: !!planning.requires_backend_change,
      requires_permission_change: !!planning.requires_permission_change,
      tests_required: planning.tests_required || [],
      plain_explanation_ar: planning.plain_explanation_ar?.slice(0, 2000),
      diff_preview: forceBlocked ? '' : (planning.diff_preview || '').slice(0, 3000),
      blocked: forceBlocked,
      block_reason: blockReason?.slice(0, 500) || '',
      status: 'proposed',
      execution_note: forceBlocked
        ? 'محظور من التنفيذ الآلي — يحتاج مراجعة مطوّر مباشرة.'
        : 'بانتظار الموافقة. عند الموافقة، يُنفَّذ التغيير يدويًا — لا يوجد تنفيذ تلقائي في هذه المرحلة.',
    });

    return Response.json({
      success: true,
      id: logRow.id,
      language,
      index_matches_used: indexMatches.length,
      total_indexed: totalIndexed,
      plan: {
        request,
        detected_intent: planning.detected_intent,
        target_page: planning.target_page,
        affected_files: planning.affected_files || [],
        affected_pages: planning.affected_pages || [],
        affected_entities: planning.affected_entities || [],
        affected_functions: planning.affected_functions || [],
        affected_integrations: planning.affected_integrations || [],
        unaffected_summary: planning.unaffected_summary || '',
        change_type: planning.change_type,
        risk_level: planning.risk_level,
        requires_db_change: !!planning.requires_db_change,
        requires_backend_change: !!planning.requires_backend_change,
        requires_permission_change: !!planning.requires_permission_change,
        tests_required: planning.tests_required || [],
        plain_explanation_ar: planning.plain_explanation_ar,
        diff_preview: forceBlocked ? '' : planning.diff_preview,
        blocked: forceBlocked,
        block_reason: blockReason,
        status: 'proposed',
      },
      response_time_ms: Date.now() - startedAt,
    });
  } catch (error) {
    console.error('platformChangePlanner error:', error);
    return Response.json({ error: 'Something went wrong generating that change plan.' }, { status: 500 });
  }
});
