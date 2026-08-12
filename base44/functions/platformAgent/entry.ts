import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ════════════════════════════════════════════════════════════════════════
// platformAgent — the unified Admin AI Agent entry point.
//
// This is NOT a second AI system. It classifies the admin's free-text
// message and delegates to the two existing, independently-tested
// endpoints via base44.functions.invoke() — the real deployed functions,
// not a copy of their logic:
//   • platformDataAssistant  — read-only data questions (unchanged)
//   • platformChangePlanner  — change plans / preview / approve-reject (unchanged)
//
// This file owns ONLY the routing decision (data question vs change
// request vs "نفّذ"/execute confirmation) and light conversation-context
// handling (which pending plan does "نفّذ" refer to). It contains no
// capability registry, no page registry, and no entity writes of its
// own — every actual read or write still happens inside the two
// functions above, under their existing safety rules.
//
// Execution semantics (unchanged from Phase 3, reaffirmed here):
//   "نفّذ" / "execute" / "موافقة" from the admin marks the referenced
//   change plan APPROVED in AIChangeRequestLog — it does not write any
//   code or deploy anything. There is no path in this file, or in the
//   functions it calls, that touches the app's own source or a
//   production deploy step. Applying an approved plan to real files is
//   always a separate, manual action taken by the assistant/developer
//   in an editor session — never triggered automatically from here.
// ════════════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  const startedAt = Date.now();
  const base44 = createClientFromRequest(req);
  let user;

  try {
    user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json();
    const action = body?.action || 'message';

    // ── Pass-through: approve/reject a plan (used by the ✓/✗ buttons on
    // a plan card). Delegates to the real, unchanged platformChangePlanner.
    if (action === 'approve' || action === 'reject') {
      const { id } = body;
      if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });
      const res = await base44.functions.invoke('platformChangePlanner', { action, id });
      return Response.json({ kind: 'decision', ...res.data });
    }

    // ── "تحديث معرفة المشروع" button — status only, no live re-scan
    // (delegates to platformChangePlanner, which owns ProjectIndex access).
    if (action === 'refresh_index_status') {
      const res = await base44.functions.invoke('platformChangePlanner', { action: 'refresh_index_status' });
      return Response.json({ kind: 'index_status', ...res.data });
    }

    // ── Unified free-text entry point ───────────────────────────────────
    const message = (body?.message || '').trim();
    const pendingPlanId = body?.pending_plan_id || null;
    const recentHistory = Array.isArray(body?.recent_history) ? body.recent_history.slice(-6) : [];
    if (!message) return Response.json({ error: 'Missing message' }, { status: 400 });

    // Step 1 — intent detection. The agent decides, from the message and
    // light session context (is there a plan awaiting confirmation?),
    // which of the two existing capabilities to invoke, or whether the
    // admin is just confirming/cancelling a plan already on screen.
    const routing = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the top-level intent router for a unified admin AI agent on a construction/engineering marketplace platform called Bytly. You do not answer anything yourself — you only decide which of three routes this message belongs to, using the message and recent conversation context.

Routes:
- "data_question": the admin is asking about existing platform data/status (e.g. "which projects need follow-up", "revenue this month", "top-rated engineers", "any pending requests", "summarize today").
- "change_request": the admin wants something about the platform's UI/behavior added, changed, or removed (e.g. "add a filter", "change this page's title", "add a stats card", "reorder these cards") — including requests that will turn out to need extra review (deleting data, changing commissions, permissions, payments, etc.) — those still route here and get blocked downstream, they are not a separate route.
- "execution_confirm": the admin is confirming/cancelling a change plan that was just shown to them — short imperative confirmations like "نفّذ", "execute", "موافق", "yes do it", "طبّق التغيير", "إلغاء", "cancel that". Only use this route if the message is clearly a confirmation/cancellation of something already proposed, not a new request.

Context: ${pendingPlanId ? 'There IS a change plan currently awaiting the admin\'s decision.' : 'There is NO change plan currently awaiting a decision.'}
Recent conversation (oldest first, may be empty): ${JSON.stringify(recentHistory)}

Message: "${message}"

Respond with: route, language ("ar"/"en"), detected_intent (one short English sentence for logging), and confirm_action ("approve" or "reject", only meaningful when route is "execution_confirm" — default "approve" for affirmative confirmations, "reject" for cancellations).`,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          route: { type: 'string', enum: ['data_question', 'change_request', 'execution_confirm'] },
          language: { type: 'string', enum: ['ar', 'en'] },
          detected_intent: { type: 'string' },
          confirm_action: { type: 'string', enum: ['approve', 'reject'] },
        },
        required: ['route', 'language', 'detected_intent', 'confirm_action'],
      },
    });

    const language = routing.language === 'en' ? 'en' : 'ar';

    // ── Route: data question → delegate to the real platformDataAssistant ──
    if (routing.route === 'data_question') {
      const res = await base44.functions.invoke('platformDataAssistant', { question: message });
      return Response.json({ kind: 'data', route: 'data_question', ...res.data, response_time_ms: Date.now() - startedAt });
    }

    // ── Route: execution confirm → approve/reject the pending plan only ──
    if (routing.route === 'execution_confirm') {
      if (!pendingPlanId) {
        const clarify = language === 'ar'
          ? 'ما تحديد أي تغيير تقصد — ما فيه خطة تغيير معروضة حاليًا بانتظار قرارك. صف التعديل الذي تريده أولًا.'
          : "I'm not sure which change you mean — there's no change plan currently awaiting a decision. Describe the change you want first.";
        return Response.json({ kind: 'clarify', route: 'execution_confirm', language, message: clarify });
      }
      const decideAction = routing.confirm_action === 'reject' ? 'reject' : 'approve';
      const res = await base44.functions.invoke('platformChangePlanner', { action: decideAction, id: pendingPlanId });
      const note = decideAction === 'approve'
        ? (language === 'ar'
            ? 'تمت الموافقة وتسجيلها. التنفيذ الفعلي يتم يدويًا في جلسة المحرر (Editor) فقط — لا يوجد تنفيذ تلقائي على الإنتاج من داخل التطبيق. أخبر المساعد بالموافقة ليطبّق التغيير فعليًا في هذه الجلسة.'
            : 'Approval recorded. Actual execution only happens manually in the editor session — there is no automatic production execution from inside the app. Tell the assistant to proceed and it will apply the change in this session.')
        : (language === 'ar' ? 'تم إلغاء الاقتراح.' : 'The proposal was cancelled.');
      return Response.json({ kind: 'decision', route: 'execution_confirm', id: pendingPlanId, ...res.data, note, response_time_ms: Date.now() - startedAt });
    }

    // ── Route: change request → delegate to the real platformChangePlanner ──
    const res = await base44.functions.invoke('platformChangePlanner', { action: 'propose', request: message });
    return Response.json({ kind: 'plan', route: 'change_request', ...res.data, response_time_ms: Date.now() - startedAt });
  } catch (error) {
    console.error('platformAgent error:', error);
    return Response.json({ error: 'Something went wrong handling that request.' }, { status: 500 });
  }
});
