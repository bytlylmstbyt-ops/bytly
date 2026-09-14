import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ════════════════════════════════════════════════════════════════════════
// platformChangePlanner  (Phase 3 + Project Context + Monitoring extension)
//
// This function NEVER writes to platform data and NEVER writes to the
// app's own source code. Its writes are limited to two things:
//   • AIChangeRequestLog — the change-plan audit/queue entity (create/update)
//   • ProjectIndexMeta   — read-only status only, no writes from here
// There is no code-execution path here: "approve" only flips a status
// field on the log row. Applying an approved plan to the actual app is
// always a separate, manual step done by a human developer/AI-builder
// session — never triggered from this endpoint.
//
// Project Context: before planning, this function searches the
// ProjectIndexEntry entity (read-only .list()/.filter()) — a curated,
// refreshable map of pages/entities/functions/integrations — instead of
// reasoning from a fixed hardcoded list.
//
// Lifecycle (per plan), matching AIChangeRequestLog.status:
//   planned → awaiting_approval → approved/rejected → (if approved,
//   applied manually by the assistant in the editor session) executing →
//   verifying → completed/failed. This function only ever sets
//   awaiting_approval (on propose) and approved/rejected (on decide) —
//   the executing/verifying/completed/failed transitions are set
//   manually by the assistant when it actually performs the work,
//   never automatically from this endpoint.
//
// Security analysis: every plan includes a security_notes field — a
// permissions/write-path review — even when the request isn't blocked,
// so the admin always sees an explicit statement of what the change
// does and doesn't touch on the privilege/write-access front.
//
// Do not add any capability here that calls .create()/.update()/.delete()
// on anything other than AIChangeRequestLog. Never request, log, or store
// API keys/secrets/OAuth credentials anywhere in this file or in
// ProjectIndexEntry — integrations are referenced by name only.
// ════════════════════════════════════════════════════════════════════════

const BLOCKED_TOPICS_AR_EN =
  'database schema / تعديل بنية قاعدة البيانات، creating or deleting or updating database records / إنشاء أو حذف أو تعديل سجلات قاعدة البيانات، ' +
  'authentication / المصادقة، roles / الأدوار، permissions / الصلاحيات، payments / المدفوعات، refunds / المبالغ المستردة، ' +
  'withdrawals / طلبات السحب، commissions / العمولات، escrow / الضمان المالي، contracts / العقود، ' +
  'financial calculations / الحسابات المالية، production deployment / النشر على الإنتاج، API secrets / مفاتيح الـ API، ' +
  'external OAuth credentials / بيانات اعتماد OAuth الخارجية';

// Defensive fallback net — independent of what the classifier LLM
// decided. Includes destructive verbs (delete/حذف) explicitly, and now
// also privilege-expansion phrasing, since a request like "اجعلني admin"
// or "grant this user more access" must never slip through on wording alone.
const DANGER_WORDS = /(database|db schema|قاعدة البيانات|صلاحي|role|auth|دفع|payment|refund|استرداد|سحب|withdraw|عمولة|commission|escrow|ضمان مالي|عقد|contract|deploy|نشر|api key|secret|oauth|\bحذف\b|\bdelete\b|\bremove all\b|جميع المستخدمين|all users|admin access|اجعلني ادمن|وسّع صلاحي|grant access|elevate)/i;

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

  // Always TOP UP with a broad sample of indexed pages, even when the
  // keyword pre-filter already found some matches. The index mixes
  // Arabic-named entries (score well against Arabic requests) and
  // English-only entries (e.g. RegisterEngineer, with an empty
  // description) that score exactly 0 against an Arabic query no matter
  // how relevant they are — so relying on "if matched is non-empty, skip
  // the broader pool" would silently starve the LLM of the single most
  // relevant page whenever a handful of weaker, unrelated entries
  // happen to score >0 on a shared word. Merging both pools and letting
  // the LLM's own semantic judgment pick the right target is more
  // reliable than trusting this crude keyword score alone.
  const matchedIds = new Set(matched.map(e => e.id));
  const topUp = allEntries
    .filter(e => e.file_type === 'page' && !matchedIds.has(e.id));
  const combined = [...matched, ...topUp];

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
        ? 'تمت الموافقة — سيتم تنفيذ التغيير يدويًا من قبل المطوّر/جلسة المساعد (executing → verifying → completed). لا يوجد تنفيذ تلقائي في هذه المرحلة.'
        : 'تم رفض الاقتراح ولن يُنفَّذ.';
      await base44.asServiceRole.entities.AIChangeRequestLog.update(id, { status, execution_note });
      return Response.json({ success: true, status });
    }

    // ── Refresh index status: read-only stats only.
    // IMPORTANT: this is NOT a project health scan. It must never be
    // presented as one. A real code scan is performed by the editor/agent
    // session and its findings are stored in ProjectHealthCheck.
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
        note: 'هذا الإجراء يعرض حالة الفهرس الحالي فقط ولا يفحص أخطاء الكود. فحص lint/typecheck/build/imports يحتاج جلسة المحرر/المساعد التي تملك وصولًا لملفات المشروع.'
      });
    }

    // ── Diagnostic status: return the latest REAL health-check records.
    // This gives the admin a truthful diagnostic answer instead of
    // confusing index statistics with code-health results.
    if (action === 'project_health_status') {
      let checks = [];
      try {
        checks = await base44.asServiceRole.entities.ProjectHealthCheck.list('-checked_at', 50);
      } catch (_e) { /* entity may be empty/unavailable */ }
      const latestByType = {};
      for (const check of checks || []) {
        if (!latestByType[check.check_type]) latestByType[check.check_type] = check;
      }
      const types = ['lint', 'typecheck', 'broken_imports', 'build', 'manual_review'];
      const missing = types.filter(type => !latestByType[type]);
      const issueCount = Object.values(latestByType).reduce((sum, c) => sum + Number(c.issue_count || 0), 0);
      const severities = Object.values(latestByType).map(c => c.severity || 'none');
      const severityRank = { none: 0, low: 1, medium: 2, high: 3 };
      const maxSeverity = severities.reduce((max, s) => severityRank[s] > severityRank[max] ? s : max, 'none');
      return Response.json({
        success: true,
        scanned: Object.keys(latestByType).length > 0,
        latest_checks: latestByType,
        missing_checks: missing,
        issue_count: issueCount,
        severity: maxSeverity,
        note: missing.length
          ? `لم يكتمل الفحص بعد. الفحوصات الناقصة: ${missing.join(', ')}.`
          : 'هذه نتائج فحص صحة الكود المسجلة فعليًا، وليست إحصاءات الفهرس.'
      });
    }

    // ── Propose: search Project Index → security + risk classify → plan ──
    const request = (body?.request || '').trim();
    if (!request) return Response.json({ error: 'Missing request' }, { status: 400 });

    const { matched: indexMatches, totalIndexed } = await searchProjectIndex(base44, request);

    const planning = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an AI Change Planner with Project Context inside the admin dashboard of Bytly, a construction/engineering marketplace platform built with React (frontend) and Base44 (backend/entities). You NEVER execute changes yourself — you only produce a structured, human-reviewable Change Plan for a non-technical admin. You do not have live access to the source code; reason using the Project Index search results below, which come from a real, refreshable index of the platform's pages/entities/functions/integrations.

Project Index search results relevant to this request (name [type]: description — related entities/functions/integrations):
${indexMatches.map(e => `- ${e.name} [${e.file_type}]${e.route ? ` (${e.route})` : ''}: ${e.description || ''} — entities: ${(e.related_entities || []).join(', ') || 'none'}; functions: ${(e.related_functions || []).join(', ') || 'none'}; integrations: ${(e.related_integrations || []).join(', ') || 'none'}`).join('\n') || '(no relevant index entries found — say so plainly in your answer rather than guessing)'}

Categories that must ALWAYS be blocked from automatic execution — if the request touches any of these, set blocked=true and change_type accordingly, and briefly explain why in block_reason (do not produce a full plan for the blocked parts):
${BLOCKED_TOPICS_AR_EN}

SECURITY ANALYSIS (always required, even for safe requests): before proposing anything, explicitly check whether the request would touch permission/role logic, expand any user's access, or open a new write path to data that isn't already safely writable through this planner. Fill security_notes with a one-to-two-sentence Arabic statement of this review's outcome — e.g. confirming the change stays UI-only with no privilege or write-path impact, or flagging exactly what privilege/write concern it raises (in which case blocked must be true).

CRITICAL: never ask for, request, or reference any API key, secret, or OAuth credential value, even for integration-related requests — only describe what KIND of credential/auth an integration needs (e.g. "OAuth" or "API key"), never a value.

DIAGNOSTIC REQUESTS: if the admin is reporting a problem/bug (e.g. "فيه خطأ في...", "الصفحة مو شغالة", "kind of broken", "not working") rather than requesting a new feature, fill problem_description (what's wrong) and likely_cause (best-effort diagnosis grounded in the Project Index matches) — otherwise leave both empty strings.

Admin's message (Arabic or English, possibly informal): "${request}"

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
10. security_notes: the security analysis outcome described above (always fill this, in Arabic)
11. problem_description: filled only for diagnostic/bug-report style requests (see above), else empty string
12. likely_cause: filled only alongside problem_description, else empty string
13. change_type: "ui_only", "logic", or "data"
14. risk_level: "low", "medium", or "high"
15. requires_db_change / requires_backend_change / requires_permission_change: booleans
16. tests_required: short list of what should be checked before/after applying the change
17. blocked: true if this touches any of the always-blocked categories above, OR if change_type is "data" or the request implies deleting/overwriting real records or expanding any privilege, OR if the Project Index has no relevant match at all for a page/component-specific request
18. block_reason: if blocked, a one-sentence Arabic explanation of why this needs additional human review
19. plain_explanation_ar: 2-4 sentences in clear, simple Arabic explaining what would change, written for a non-programmer, referencing the actual page/entity/function names found. If blocked, explain what was understood and why it needs a developer instead.
20. diff_preview: a short, human-readable, diff-style text preview of the proposed change. If blocked, leave this empty.`,
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
          security_notes: { type: 'string' },
          problem_description: { type: 'string' },
          likely_cause: { type: 'string' },
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
          'affected_functions', 'affected_integrations', 'unaffected_summary', 'security_notes', 'problem_description',
          'likely_cause', 'change_type', 'risk_level', 'requires_db_change', 'requires_backend_change',
          'requires_permission_change', 'tests_required', 'blocked', 'block_reason', 'plain_explanation_ar', 'diff_preview',
        ],
      },
    });

    const language = planning.language === 'en' ? 'en' : 'ar';

    let forceBlocked = planning.blocked || !!planning.requires_permission_change || DANGER_WORDS.test(request);
    let blockReason = planning.blocked || planning.requires_permission_change
      ? (planning.block_reason || 'هذا الطلب يمس الصلاحيات ويحتاج مراجعة مطوّر مباشرة.')
      : (forceBlocked ? 'هذا الطلب يمس مجالًا حساسًا (بيانات/صلاحيات/أمور مالية/نشر) ويحتاج مراجعة مطوّر مباشرة.' : '');

    // When the request is a safe UI/logic source change, use the real
    // GitHub-connected source agent to inspect files and prepare executable
    // file operations. If GitHub is not connected yet, keep the existing
    // planner behavior and explicitly say that source execution is waiting
    // for the connection instead of pretending it was applied.
    let executionTool = '';
    let executionArgs = {};
    let sourceExecutionNote = '';
    if (!forceBlocked && (planning.change_type === 'ui_only' || planning.change_type === 'logic')) {
      try {
        const sourcePlanResponse = await base44.functions.invoke('sourceCodeAgent', { action: 'plan', request });
        const sourcePlan = sourcePlanResponse?.data?.plan;
        if (sourcePlan?.blocked) {
          forceBlocked = true;
          blockReason = sourcePlan.block_reason || 'تعذر تجهيز تعديل المصدر بأمان.';
        } else if (sourcePlan?.needs_more_context) {
          sourceExecutionNote = `يحتاج المساعد قراءة ملفات إضافية قبل التنفيذ: ${(sourcePlan.missing_paths || []).join('، ')}`;
        } else if (sourcePlan?.operations?.length) {
          executionTool = 'source_code_change';
          executionArgs = { action: 'apply', branch: sourcePlan.branch || 'main', message: request, operations: sourcePlan.operations };
          planning.affected_files = sourcePlan.operations.map(op => op.path);
          planning.tests_required = Array.from(new Set([...(planning.tests_required || []), ...(sourcePlan.tests || [])]));
          sourceExecutionNote = 'تم تجهيز عمليات الملفات من المصدر الحقيقي في GitHub، وستُطبّق بعد موافقة المالك ثم تُسجّل نتيجة الـcommit.';
        } else {
          sourceExecutionNote = 'لم يجد المساعد تعديلًا مصدريًا آمنًا من الملفات المتاحة؛ لم يتم اختراع أي ملف أو تغيير.';
        }
      } catch (sourceError) {
        sourceExecutionNote = `التنفيذ المصدري ينتظر ربط GitHub: ${sourceError?.message || 'GitHub غير متصل بعد.'}`;
      }
    }

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
      security_notes: planning.security_notes?.slice(0, 800) || '',
      problem_description: planning.problem_description?.slice(0, 800) || '',
      likely_cause: planning.likely_cause?.slice(0, 500) || '',
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
      status: 'awaiting_approval',
      execution_tool: forceBlocked ? '' : executionTool,
      execution_args: forceBlocked ? {} : executionArgs,
      execution_note: forceBlocked
        ? 'محظور من التنفيذ الآلي — يحتاج مراجعة مطوّر مباشرة.'
        : (sourceExecutionNote || 'بانتظار الموافقة والتنفيذ في جلسة موثوقة.'),
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
        security_notes: planning.security_notes || '',
        problem_description: forceBlocked ? '' : (planning.problem_description || ''),
        likely_cause: forceBlocked ? '' : (planning.likely_cause || ''),
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
        execution_tool: forceBlocked ? '' : executionTool,
        execution_ready: !!executionTool,
        execution_note: sourceExecutionNote || '',
        status: 'awaiting_approval',
      },
      response_time_ms: Date.now() - startedAt,
    });
  } catch (error) {
    console.error('platformChangePlanner error:', error);
    return Response.json({ error: 'Something went wrong generating that change plan.' }, { status: 500 });
  }
});