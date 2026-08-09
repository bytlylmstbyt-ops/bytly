// ════════════════════════════════════════════════════════════════════════
// Shared change-planning registry + runner. Used by BOTH
// platformChangePlanner/entry.ts (standalone endpoint, kept for backwards
// compatibility) and platformAgent/entry.ts (the unified agent).
//
// Hard rule: the only entity this module ever writes to is
// AIChangeRequestLog. No platform data, no source files, no deploy step.
// Applying an approved plan to the actual app is always a separate,
// manual step done by a human developer/AI-builder session.
// ════════════════════════════════════════════════════════════════════════

export const PAGE_REGISTRY = [
  { page: 'PlatformDashboard', area: 'نظرة عامة', editable: ['بطاقات المؤشرات', 'ترتيب البطاقات', 'العناوين'] },
  { page: 'AdminProjects', area: 'إدارة المشاريع', editable: ['فلاتر الجدول', 'أعمدة الجدول', 'خانة البحث', 'ألوان وحالة الأزرار', 'ترتيب الفرز'] },
  { page: 'Projects', area: 'سوق المشاريع', editable: ['بطاقات المشاريع', 'الفلاتر', 'الفرز'] },
  { page: 'ProjectProposals', area: 'إدارة العروض', editable: ['أعمدة الجدول', 'الفلاتر'] },
  { page: 'CompareProposals', area: 'مقارنة العروض', editable: ['تخطيط المقارنة', 'الأعمدة المعروضة'] },
  { page: 'AdminEngineers', area: 'إدارة المهندسين', editable: ['أعمدة الجدول (مثل عمود تقييم)', 'الفلاتر', 'خانة البحث', 'ترتيب الفرز'] },
  { page: 'AdminClients', area: 'إدارة العملاء', editable: ['أعمدة الجدول', 'الفلاتر', 'خانة البحث'] },
  { page: 'PendingApprovals', area: 'الموافقات المعلقة', editable: ['تخطيط القائمة', 'الفلاتر'] },
  { page: 'AdminProviders', area: 'مقدمو الخدمة', editable: ['أعمدة الجدول', 'الفلاتر'] },
  { page: 'ContractManager', area: 'إدارة العقود', editable: ['أعمدة الجدول', 'الفلاتر', 'الفرز'] },
  { page: 'AdminWallet', area: 'إدارة المحافظ', editable: ['تخطيط العرض', 'الفلاتر'] },
  { page: 'AllWithdrawalRequests', area: 'طلبات السحب', editable: ['أعمدة الجدول', 'الفلاتر'] },
  { page: 'InvoiceManager', area: 'إدارة الفواتير', editable: ['أعمدة الجدول', 'الفلاتر'] },
  { page: 'RevenueDashboard', area: 'لوحة الإيرادات', editable: ['الرسوم البيانية', 'بطاقات المؤشرات'] },
  { page: 'AdminDisputes', area: 'النزاعات', editable: ['أعمدة الجدول', 'الفلاتر', 'ترتيب الأولوية'] },
  { page: 'NotificationCenter', area: 'مركز الإشعارات', editable: ['تخطيط القائمة', 'الفلاتر'] },
  { page: 'AdminReports', area: 'تقارير المنصة', editable: ['الرسوم البيانية', 'تخطيط التقرير'] },
  { page: 'AdminReviews', area: 'إدارة التقييمات', editable: ['أعمدة الجدول', 'الفلاتر'] },
  { page: 'AdminCategories', area: 'إدارة التصنيفات', editable: ['قائمة التصنيفات', 'الترتيب'] },
  { page: 'AdminControlCenter', area: 'مركز الإدارة', editable: ['ترتيب الفئات', 'أيقونات الفئات', 'تخطيط البطاقات'] },
  { page: 'AdminAIAssistant', area: 'مساعد الذكاء الاصطناعي', editable: ['نصوص الواجهة', 'الأسئلة المقترحة'] },
];

export const BLOCKED_TOPICS_AR_EN =
  'database schema / تعديل بنية قاعدة البيانات، creating or deleting or updating database records / إنشاء أو حذف أو تعديل سجلات قاعدة البيانات، ' +
  'authentication / المصادقة، roles / الأدوار، permissions / الصلاحيات، payments / المدفوعات، refunds / المبالغ المستردة، ' +
  'withdrawals / طلبات السحب، commissions / العمولات، escrow / الضمان المالي، contracts / العقود، ' +
  'financial calculations / الحسابات المالية، production deployment / النشر على الإنتاج، API secrets / مفاتيح الـ API، ' +
  'external OAuth credentials / بيانات اعتماد OAuth الخارجية';

// Defensive fallback net — always includes destructive verbs (delete/حذف)
// in addition to the sensitive-domain words, independent of what the
// classifier LLM decided.
const DANGER_WORDS = /(database|db schema|قاعدة البيانات|صلاحي|role|auth|دفع|payment|refund|استرداد|سحب|withdraw|عمولة|commission|escrow|ضمان مالي|عقد|contract|deploy|نشر|api key|secret|oauth|\bحذف\b|\bdelete\b|\bremove all\b|جميع المستخدمين|all users)/i;

export async function proposeChangePlan(base44, user, request) {
  const startedAt = Date.now();

  const planning = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an AI Change Planner inside the admin dashboard of Bytly, a construction/engineering marketplace platform built with React (frontend) and Base44 (backend/entities). You NEVER execute changes yourself — you only produce a structured, human-reviewable Change Plan for a non-technical admin. You do not have live access to the source code; reason using the page/component registry below, which describes what is known to be safely editable on each admin page.

Page/component registry:
${PAGE_REGISTRY.map(p => `- ${p.page} (${p.area}): editable elements — ${p.editable.join(', ')}`).join('\n')}

Categories that must ALWAYS be blocked from automatic execution — if the request touches any of these, set blocked=true and change_type accordingly, and briefly explain why in block_reason (do not produce a full plan for the blocked parts):
${BLOCKED_TOPICS_AR_EN}

Admin's change request (Arabic or English, possibly informal): "${request}"

Analyze and respond with a full structured Change Plan:
1. language: "ar" or "en"
2. detected_intent: one short English sentence describing what the admin wants (for internal logging)
3. target_page: the single best-matching page key from the registry above, or "unknown" if none fits
4. affected_files: a short illustrative list of files/components likely involved (e.g. "src/pages/AdminProjects.jsx") — best-effort, clearly described as indicative not exact since there's no live file access
5. change_type: "ui_only", "logic", or "data"
6. risk_level: "low", "medium", or "high"
7. requires_db_change / requires_backend_change / requires_permission_change: booleans
8. tests_required: short list of what should be checked before/after applying the change
9. blocked: true if this touches any of the always-blocked categories above, OR if change_type is "data" or the request implies deleting/overwriting real records
10. block_reason: if blocked, a one-sentence Arabic explanation of why this needs additional human review and can't be auto-planned for execution
11. plain_explanation_ar: 2-4 sentences in clear, simple Arabic explaining what would change, written for a non-programmer. If blocked, explain what was understood and why it needs a developer instead.
12. diff_preview: a short, human-readable, diff-style text preview of the proposed change (e.g. "- إخفاء عمود X\\n+ إضافة عمود 'تقييم العميل' يعرض حقل client_rating الموجود في بيانات المشروع"). If blocked, leave this empty.`,
    add_context_from_internet: false,
    response_json_schema: {
      type: 'object',
      properties: {
        language: { type: 'string', enum: ['ar', 'en'] },
        detected_intent: { type: 'string' },
        target_page: { type: 'string' },
        affected_files: { type: 'array', items: { type: 'string' } },
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
        'language', 'detected_intent', 'target_page', 'affected_files', 'change_type', 'risk_level',
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

  return {
    kind: 'plan', success: true, id: logRow.id, language,
    plan: {
      request,
      detected_intent: planning.detected_intent,
      target_page: planning.target_page,
      affected_files: planning.affected_files || [],
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
  };
}

// Approve/reject an existing plan. ONLY updates the status field on the
// AIChangeRequestLog row — never triggers code execution.
export async function decideChangePlan(base44, id, action) {
  const status = action === 'approve' ? 'approved' : 'rejected';
  const execution_note = action === 'approve'
    ? 'تمت الموافقة — سيتم تنفيذ التغيير يدويًا من قبل المطوّر/جلسة المساعد. لا يوجد تنفيذ تلقائي في هذه المرحلة.'
    : 'تم رفض الاقتراح ولن يُنفَّذ.';
  await base44.asServiceRole.entities.AIChangeRequestLog.update(id, { status, execution_note });
  return { success: true, status };
}
