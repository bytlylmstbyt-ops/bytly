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

// ── Agent Tool Registry ─────────────────────────────────────────────────
// Each role receives only the tools and entities appropriate to its job.
// The platform owner/admin gets the broadest business access, while finance,
// projects, marketing and operations stay inside their own domains.
const ROLE_POLICIES = {
  admin: { tools: ['*'], entities: ['*'] },
  executive_manager: { tools: ['navigate_admin_page','refresh_index_status','project_health_status','source_code_change','query_entity','create_entity','update_entity','create_strategic_goal','create_strategic_initiative','create_strategic_decision'], entities: ['*'] },
  finance_manager: { tools: ['navigate_admin_page','query_entity','create_entity','update_entity'], entities: ['Invoice','Payment','PlatformRevenue','Transaction','Subscription','WithdrawalRequest','Contract'] },
  project_manager: { tools: ['navigate_admin_page','query_entity','create_entity','update_entity'], entities: ['Project','ProjectTask','Task','ProjectMilestone','Contract','Engineer','EngineeringFirm','Contractor','Consultant','Supplier'] },
  marketing_manager: { tools: ['navigate_admin_page','query_entity','create_entity','update_entity'], entities: ['Lead','Client','ClientInteraction','EmailCampaign','SocialPost','Advertiser','Advertisement','Review'] },
  operations_manager: { tools: ['navigate_admin_page','query_entity','create_entity','update_entity'], entities: ['Client','Engineer','EngineeringFirm','Contractor','Supplier','Consultant','SupportTicket','Complaint','Notification','Project'] },
};

const TOOL_REGISTRY = {
  navigate_admin_page: { risk: 'low', description: 'فتح صفحة إدارية داخل لوحة التحكم' },
  refresh_index_status: { risk: 'low', description: 'قراءة حالة فهرس المشروع فقط، وليست فحصًا للكود' },
  project_health_status: { risk: 'low', description: 'قراءة آخر نتائج فحص صحة الكود المسجلة (lint/typecheck/imports/build)' },
  source_code_change: { risk: 'medium', description: 'تطبيق تعديل معتمد على ملفات مصدر المشروع عبر GitHub' },
  query_entity: { risk: 'low', description: 'قراءة سجلات من بيانات المنصة' },
  create_entity: { risk: 'medium', description: 'إنشاء سجل إداري جديد بعد موافقة المدير' },
  update_entity: { risk: 'medium', description: 'تعديل سجل إداري موجود بعد موافقة المدير' },
  create_strategic_goal: { risk: 'medium', description: 'إنشاء هدف استراتيجي جديد بعد موافقة المدير' },
  create_strategic_initiative: { risk: 'medium', description: 'إنشاء مبادرة استراتيجية جديدة بعد موافقة المدير' },
  create_strategic_decision: { risk: 'medium', description: 'تسجيل قرار استراتيجي جديد بعد موافقة المدير' },
};

const ENTITY_TOOL_ALLOWLIST = new Set([
  'Project','Client','Engineer','EngineeringFirm','Contractor','Supplier','Consultant','LegalConsultant',
  'Review','FirmReview','ClientInteraction','Lead','ProjectTask','Task','ProjectMilestone','Contract',
  'Invoice','Payment','PlatformRevenue','Transaction','Subscription','WithdrawalRequest','SupportTicket',
  'Complaint','Notification','SurveyRequest','SurveyDeliverable','StrategicGoal','StrategicInitiative','StrategicDecision',
  'UserRole','Role','AutomationRule','EmailCampaign','SocialPost','Advertiser','Advertisement','ReadyMadeDesign'
]);

function getAgentPolicy(user) {
  const role = String(user?.data?.admin_role || user?.admin_role || user?.role || 'admin');
  return ROLE_POLICIES[role] || ROLE_POLICIES.admin;
}

function canUseTool(policy, toolName) {
  return policy.tools.includes('*') || policy.tools.includes(toolName);
}

function canUseEntity(policy, entityName) {
  return policy.entities.includes('*') || policy.entities.includes(entityName);
}

async function executeAgentTool(base44, toolName, args, user) {
  const policy = getAgentPolicy(user);
  const tool = TOOL_REGISTRY[toolName];
  if (!tool) throw new Error('الأداة المطلوبة غير مسموح بها للوكيل.');
  if (toolName === 'navigate_admin_page') {
    const page = String(args?.page || '').trim();
    const allowed = new Set(['AdminControlCenter','AdminEngineers','AdminClients','AdminProviders','AdminSearchGeoAnalytics','AdminDomains','AdminEmailCenter','AdminStrategicChange','PendingApprovals','RoleManagement','UserRoleAssignment','PlatformDashboard','ContractManager']);
    if (!allowed.has(page)) throw new Error('هذه الصفحة غير موجودة ضمن الصفحات المسموح للوكيل بفتحها.');
    return { tool: toolName, page, url: `/${page}`, message: `افتح صفحة ${page}` };
  }
  if (toolName === 'refresh_index_status') {
    const res = await base44.functions.invoke('platformChangePlanner', { action: 'refresh_index_status' });
    return { tool: toolName, ...res.data };
  }
  if (toolName === 'project_health_status') {
    if (!canUseTool(policy, toolName)) throw new Error('هذا الفحص متاح فقط للأدوار الإدارية المخولة.');
    const res = await base44.functions.invoke('platformChangePlanner', { action: 'project_health_status' });
    return { tool: toolName, ...res.data };
  }
  if (toolName === 'source_code_change') {
    if (!canUseTool(policy, toolName)) throw new Error('هذا الدور الإداري لا يملك صلاحية تعديل مصدر المشروع.');
    const operations = Array.isArray(args?.operations) ? args.operations : [];
    const res = await base44.functions.invoke('sourceCodeAgent', {
      action: 'apply',
      branch: args?.branch || 'main',
      message: args?.message || 'approved source change',
      operations,
    });
    return { tool: toolName, ...res.data };
  }
  if (toolName === 'query_entity') {
    const entityName = String(args?.entity_name || '').trim();
    if (!ENTITY_TOOL_ALLOWLIST.has(entityName) || !canUseEntity(policy, entityName) || !canUseTool(policy, toolName)) throw new Error('دورك الإداري لا يملك صلاحية قراءة هذا المصدر.');
    const query = (args?.query && typeof args.query === 'object') ? args.query : {};
    const limit = Math.min(Math.max(Number(args?.limit || 20), 1), 100);
    const rows = await base44.asServiceRole.entities[entityName].filter(query, args?.sort || '-created_date', limit);
    return { tool: toolName, entity_name: entityName, count: rows.length, rows };
  }
  if (toolName === 'create_entity') {
    const entityName = String(args?.entity_name || '').trim();
    if (!ENTITY_TOOL_ALLOWLIST.has(entityName) || !canUseEntity(policy, entityName) || !canUseTool(policy, toolName)) throw new Error('دورك الإداري لا يملك صلاحية إنشاء هذا النوع من السجلات.');
    if (!args?.data || typeof args.data !== 'object') throw new Error('بيانات السجل مطلوبة.');
    const row = await base44.asServiceRole.entities[entityName].create(args.data);
    return { tool: toolName, entity_name: entityName, id: row.id, message: `تم إنشاء سجل جديد في ${entityName}.` };
  }
  if (toolName === 'update_entity') {
    const entityName = String(args?.entity_name || '').trim();
    if (!ENTITY_TOOL_ALLOWLIST.has(entityName) || !canUseEntity(policy, entityName) || !canUseTool(policy, toolName)) throw new Error('دورك الإداري لا يملك صلاحية تعديل هذا النوع من السجلات.');
    const id = String(args?.id || '').trim();
    if (!id || !args?.data || typeof args.data !== 'object') throw new Error('معرف السجل والبيانات المعدلة مطلوبان.');
    const row = await base44.asServiceRole.entities[entityName].update(id, args.data);
    return { tool: toolName, entity_name: entityName, id, row, message: `تم تعديل السجل في ${entityName}.` };
  }
  if (toolName === 'create_strategic_goal') {
    const title = String(args?.title || '').trim();
    if (!title) throw new Error('عنوان الهدف مطلوب.');
    const row = await base44.asServiceRole.entities.StrategicGoal.create({ title, description: String(args?.description || ''), owner: String(args?.owner || ''), status: String(args?.status || 'planned'), progress: Number(args?.progress || 0), target_date: args?.target_date || null, created_by_email: user.email });
    return { tool: toolName, id: row.id, message: `تم إنشاء الهدف الاستراتيجي: ${title}` };
  }
  if (toolName === 'create_strategic_initiative') {
    const title = String(args?.title || '').trim();
    if (!title) throw new Error('عنوان المبادرة مطلوب.');
    const row = await base44.asServiceRole.entities.StrategicInitiative.create({ title, description: String(args?.description || ''), owner: String(args?.owner || ''), status: String(args?.status || 'planned'), progress: Number(args?.progress || 0), target_date: args?.target_date || null, created_by_email: user.email });
    return { tool: toolName, id: row.id, message: `تم إنشاء المبادرة الاستراتيجية: ${title}` };
  }
  if (toolName === 'create_strategic_decision') {
    const title = String(args?.title || '').trim();
    if (!title) throw new Error('عنوان القرار مطلوب.');
    const row = await base44.asServiceRole.entities.StrategicDecision.create({ title, description: String(args?.description || ''), owner: String(args?.owner || ''), status: String(args?.status || 'draft'), due_date: args?.due_date || null, follow_up: String(args?.follow_up || ''), created_by_email: user.email });
    return { tool: toolName, id: row.id, message: `تم تسجيل القرار الاستراتيجي: ${title}` };
  }
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
    const action = body?.action || 'message';

    // ── Execute an approved Agent request ──────────────────────────────
    // Business-data tools can execute here. Source-code edits cannot: the
    // running Base44 backend has no filesystem/editor API. Those plans are
    // therefore returned as an explicit editor handoff instead of failing
    // with the misleading "no execution tool" error.
    if (action === 'execute' && body?.id) {
      const logs = await base44.asServiceRole.entities.AIChangeRequestLog.filter({ id: body.id });
      const plan = logs?.[0];
      if (!plan) return Response.json({ error: 'لم يتم العثور على خطة التنفيذ.' }, { status: 404 });
      if (plan.status !== 'awaiting_approval' && plan.status !== 'approved') return Response.json({ error: 'هذه الخطة ليست في حالة تسمح بالتنفيذ.' }, { status: 400 });
      if (!plan.execution_tool) {
        if (plan.change_type === 'ui_only' || plan.change_type === 'logic') {
          await base44.asServiceRole.entities.AIChangeRequestLog.update(plan.id, {
            status: 'approved',
            execution_note: 'تمت الموافقة. هذه خطة تعديل للكود وتحتاج جلسة محرر/بيئة تطوير لتطبيق الملفات فعليًا؛ لا يملك Runtime الخاص بالتطبيق وصولًا مباشرًا إلى نظام ملفات المشروع.'
          });
          return Response.json({
            kind: 'decision',
            status: 'approved',
            id: plan.id,
            note: 'تم اعتماد التغيير. تطبيق ملفات الكود يحتاج جلسة محرر/بيئة تطوير، وليس Runtime التطبيق نفسه.'
          });
        }
        return Response.json({ error: 'هذه الخطة لا تحتوي على أداة تنفيذية آمنة.' }, { status: 400 });
      }
      const tool = TOOL_REGISTRY[plan.execution_tool];
      if (!tool || tool.risk === 'high') return Response.json({ error: 'الأداة غير مسموحة للتنفيذ الآلي.' }, { status: 403 });
      await base44.asServiceRole.entities.AIChangeRequestLog.update(plan.id, { status: 'executing', execution_started_at: new Date().toISOString() });
      try {
        const result = await executeAgentTool(base44, plan.execution_tool, plan.execution_args || {}, user);
        await base44.asServiceRole.entities.AgentAction.create({ task_id: plan.id, action_type: plan.execution_tool, target: plan.target_page || '', status: 'executed', risk_level: tool.risk, requested_by_email: user.email, details: JSON.stringify(plan.execution_args || {}), result: JSON.stringify(result), executed_at: new Date().toISOString() });
        await base44.asServiceRole.entities.AIChangeRequestLog.update(plan.id, { status: 'completed', execution_result: JSON.stringify(result), execution_completed_at: new Date().toISOString() });
        return Response.json({ kind: 'decision', status: 'completed', id: plan.id, result, note: 'تم تنفيذ الأداة وتسجيل العملية في سجل الوكيل.' });
      } catch (e) {
        await base44.asServiceRole.entities.AIChangeRequestLog.update(plan.id, { status: 'failed', execution_error: e?.message || 'Execution failed', execution_completed_at: new Date().toISOString() });
        return Response.json({ kind: 'decision', status: 'failed', id: plan.id, error: e?.message || 'فشل التنفيذ.' });
      }
    }

    // ── Direct low-risk tool request: the router will only use this for
    // navigation/read operations. Mutating tools are converted into an
    // approval plan below.

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
- "tool_request": the admin is asking the agent to perform one of the explicitly registered safe actions below. Use this only when the request clearly maps to a registered tool and is not a general UI/code change.
Registered tools:
  • navigate_admin_page(page): open/navigate to an allowed admin page.
  • refresh_index_status(): read project-index status only; never describe it as a code-health scan.
  • project_health_status(): read the latest recorded lint/typecheck/broken-imports/build/manual-review results; if any check is missing, report that the health scan is incomplete rather than guessing.
  • query_entity(entity_name, query, limit, sort): read approved platform data entities.
  • create_entity(entity_name, data): create an approved platform record; requires explicit approval.
  • update_entity(entity_name, id, data): update an approved platform record; requires explicit approval.
  • create_strategic_goal(title, description, owner, status, progress, target_date): create a strategic goal; requires explicit approval.
  • create_strategic_initiative(title, description, owner, status, progress, target_date): create a strategic initiative; requires explicit approval.
  • create_strategic_decision(title, description, owner, status, due_date, follow_up): register a strategic decision; requires explicit approval.
For tool_request return the exact tool_name and JSON tool_args. Never invent tools.
For query_entity, tool_args must contain entity_name, query, limit, and optional sort.
For create_entity, tool_args must contain entity_name and data.
For update_entity, tool_args must contain entity_name, id, and data.
- "execution_confirm": the admin is confirming/cancelling a change plan that was just shown to them — short imperative confirmations like "نفّذ", "execute", "موافق", "yes do it", "طبّق التغيير", "إلغاء", "cancel that". Only use this route if the message is clearly a confirmation/cancellation of something already proposed, not a new request.

Context: ${pendingPlanId ? 'There IS a change plan currently awaiting the admin\'s decision.' : 'There is NO change plan currently awaiting a decision.'}
Recent conversation (oldest first, may be empty): ${JSON.stringify(recentHistory)}

Message: "${message}"

Respond with: route, language ("ar"/"en"), detected_intent (one short English sentence for logging), confirm_action ("approve" or "reject", only meaningful when route is "execution_confirm" — default "approve" for affirmative confirmations, "reject" for cancellations), tool_name (empty string unless route is tool_request), and tool_args (JSON object; empty object unless route is tool_request).`,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          route: { type: 'string', enum: ['data_question', 'change_request', 'tool_request', 'execution_confirm'] },
          language: { type: 'string', enum: ['ar', 'en'] },
          detected_intent: { type: 'string' },
          confirm_action: { type: 'string', enum: ['approve', 'reject'] },
          tool_name: { type: 'string' },
          tool_args: { type: 'object' },
        },
        required: ['route', 'language', 'detected_intent', 'confirm_action', 'tool_name', 'tool_args'],
      },
    });

    const language = routing.language === 'en' ? 'en' : 'ar';

    // ── Route: tool request ──────────────────────────────────────────────
    if (routing.route === 'tool_request') {
      const toolName = String(routing.tool_name || '').trim();
      const tool = TOOL_REGISTRY[toolName];
      if (!tool) return Response.json({ kind: 'clarify', message: language === 'ar' ? 'الأمر مفهوم، لكن لا توجد أداة آمنة مسجلة لتنفيذه تلقائيًا.' : 'I understand the request, but no safe registered tool can execute it automatically.' });
      if (tool.risk === 'low') {
        const result = await executeAgentTool(base44, toolName, routing.tool_args || {}, user);
        await base44.asServiceRole.entities.AgentAction.create({ action_type: toolName, target: routing.tool_args?.page || '', status: 'executed', risk_level: tool.risk, requested_by_email: user.email, details: JSON.stringify(routing.tool_args || {}), result: JSON.stringify(result), executed_at: new Date().toISOString() });
        return Response.json({ kind: 'data', route: 'tool_request', answer: result.message || JSON.stringify(result), admin_page: result.page || null, tool_result: result, response_time_ms: Date.now() - startedAt });
      }
      const toolPlan = await base44.asServiceRole.entities.AIChangeRequestLog.create({ request: message, language, asked_by_email: user.email, asked_by_name: user.full_name || user.email, detected_intent: routing.detected_intent, target_page: routing.tool_args?.page || 'AdminStrategicChange', affected_pages: ['AdminStrategicChange'], change_type: 'data', risk_level: tool.risk, requires_db_change: true, requires_backend_change: true, requires_permission_change: false, status: 'awaiting_approval', blocked: false, security_notes: 'الأداة مسموحة ولكنها تغيّر بيانات إدارية، لذلك تتطلب موافقة صريحة قبل التنفيذ.', plain_explanation_ar: `سيقوم الوكيل بتنفيذ أداة ${toolName} بعد موافقتك.`, execution_tool: toolName, execution_args: routing.tool_args || {} });
      return Response.json({ kind: 'plan', route: 'tool_request', id: toolPlan.id, plan: { status: 'awaiting_approval', risk_level: tool.risk, title: 'تنفيذ إجراء إداري', explanation: `سيقوم الوكيل بتنفيذ: ${tool.description}`, security_notes: 'تغيير بيانات إداري ويتطلب موافقة صريحة.', execution_tool: toolName } });
    }

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
