import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ════════════════════════════════════════════════════════════════════════
// platformDataAssistant
//
// A READ-ONLY natural-language Q&A layer over Bytly's platform data.
//
// Hard safety rules (do not relax these without a full architecture review):
//   • Every capability below may only call .filter()/.list() on entities.
//     None may call .create()/.update()/.delete() on platform data.
//   • The ONLY write this function performs is appending one row to
//     AIAssistantQueryLog — an audit trail of the question itself, not a
//     platform-data mutation.
//   • Admin-only. No financial, permission, or production mutation path
//     exists in this function at all — it is architecturally read-only.
//
// Modularity: to add a new question type, add one entry to CAPABILITIES.
// Nothing else in this file needs to change.
// ════════════════════════════════════════════════════════════════════════

const CAPABILITIES = [
  {
    key: 'overdue_projects',
    description_ar: 'المشاريع النشطة التي تجاوزت الموعد النهائي (متأخرة)',
    description_en: 'Active projects past their deadline (overdue)',
    admin_page: 'PlatformDashboard',
    data_sources: ['Project'],
    async run(base44) {
      const projects = await base44.asServiceRole.entities.Project.filter({
        status: { $in: ['open', 'in_progress', 'awaiting_technical_review', 'technical_approved', 'pending_client_approval'] }
      });
      const today = new Date();
      const overdue = projects.filter(p => p.deadline && new Date(p.deadline) < today);
      overdue.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      return {
        columns: [
          { key: 'title', label_ar: 'المشروع', label_en: 'Project' },
          { key: 'status', label_ar: 'الحالة', label_en: 'Status' },
          { key: 'deadline', label_ar: 'الموعد النهائي', label_en: 'Deadline' },
        ],
        rows: overdue.slice(0, 50).map(p => ({ id: p.id, title: p.title, status: p.status, deadline: p.deadline })),
        stats: { overdue_count: overdue.length, active_count: projects.length },
      };
    },
  },
  {
    key: 'revenue_this_month',
    description_ar: 'إيرادات المنصة (العمولات المكتملة) خلال الشهر الحالي',
    description_en: "Platform revenue (completed commissions) this calendar month",
    admin_page: 'RevenueDashboard',
    data_sources: ['Transaction'],
    async run(base44) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const txs = await base44.asServiceRole.entities.Transaction.filter({ type: 'commission', status: 'completed' });
      const thisMonth = txs.filter(t => t.created_date && new Date(t.created_date) >= monthStart);
      const total = thisMonth.reduce((sum, t) => sum + (t.amount || 0), 0);
      return {
        columns: [
          { key: 'description', label_ar: 'الوصف', label_en: 'Description' },
          { key: 'amount', label_ar: 'المبلغ', label_en: 'Amount' },
          { key: 'created_date', label_ar: 'التاريخ', label_en: 'Date' },
        ],
        rows: thisMonth.slice(0, 50).map(t => ({ id: t.id, description: t.description || t.type, amount: t.amount, created_date: t.created_date })),
        stats: { total_revenue: total, transaction_count: thisMonth.length },
      };
    },
  },
  {
    key: 'top_engineers',
    description_ar: 'أعلى المهندسين المعتمدين تقييمًا',
    description_en: 'Top-rated approved engineers',
    admin_page: 'AdminEngineers',
    data_sources: ['Engineer'],
    async run(base44) {
      const engineers = await base44.asServiceRole.entities.Engineer.filter({ status: 'approved' });
      engineers.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      const top = engineers.slice(0, 10);
      return {
        columns: [
          { key: 'full_name', label_ar: 'الاسم', label_en: 'Name' },
          { key: 'rating', label_ar: 'التقييم', label_en: 'Rating' },
          { key: 'total_reviews', label_ar: 'عدد التقييمات', label_en: 'Reviews' },
          { key: 'completed_projects', label_ar: 'المشاريع المكتملة', label_en: 'Completed' },
        ],
        rows: top.map(e => ({ id: e.id, full_name: e.full_name, rating: e.rating, total_reviews: e.total_reviews, completed_projects: e.completed_projects })),
        stats: { total_approved_engineers: engineers.length },
      };
    },
  },
  {
    key: 'open_disputes',
    description_ar: 'النزاعات المفتوحة (غير محلولة أو مغلقة)',
    description_en: 'Open disputes (not resolved or closed)',
    admin_page: 'AdminDisputes',
    data_sources: ['Dispute'],
    async run(base44) {
      const disputes = await base44.asServiceRole.entities.Dispute.filter({
        status: { $in: ['submitted', 'under_review', 'investigation', 'mediation', 'escalated'] }
      });
      disputes.sort((a, b) => {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
      });
      return {
        columns: [
          { key: 'title', label_ar: 'عنوان النزاع', label_en: 'Dispute' },
          { key: 'priority', label_ar: 'الأولوية', label_en: 'Priority' },
          { key: 'status', label_ar: 'الحالة', label_en: 'Status' },
        ],
        rows: disputes.slice(0, 50).map(d => ({ id: d.id, title: d.title, priority: d.priority, status: d.status })),
        stats: { open_count: disputes.length },
      };
    },
  },
  {
    key: 'pending_engineer_approvals',
    description_ar: 'طلبات انضمام مهندسين بانتظار المراجعة',
    description_en: 'Engineer applications pending review/approval',
    admin_page: 'PendingApprovals',
    data_sources: ['Engineer'],
    async run(base44) {
      const pending = await base44.asServiceRole.entities.Engineer.filter({ status: 'pending' });
      return {
        columns: [
          { key: 'full_name', label_ar: 'الاسم', label_en: 'Name' },
          { key: 'specialization', label_ar: 'التخصص', label_en: 'Specialization' },
          { key: 'city', label_ar: 'المدينة', label_en: 'City' },
        ],
        rows: pending.slice(0, 50).map(e => ({ id: e.id, full_name: e.full_name, specialization: e.specialization, city: e.city })),
        stats: { pending_count: pending.length },
      };
    },
  },
  {
    key: 'pending_withdrawals',
    description_ar: 'طلبات سحب الأرصدة قيد الانتظار',
    description_en: 'Withdrawal requests currently pending',
    admin_page: 'AllWithdrawalRequests',
    data_sources: ['WithdrawalRequest'],
    async run(base44) {
      const pending = await base44.asServiceRole.entities.WithdrawalRequest.filter({ status: 'pending' });
      const total = pending.reduce((sum, w) => sum + (w.amount || 0), 0);
      return {
        columns: [
          { key: 'provider_type', label_ar: 'نوع مقدم الخدمة', label_en: 'Provider type' },
          { key: 'amount', label_ar: 'المبلغ', label_en: 'Amount' },
          { key: 'request_date', label_ar: 'تاريخ الطلب', label_en: 'Requested' },
        ],
        rows: pending.slice(0, 50).map(w => ({ id: w.id, provider_type: w.provider_type, amount: w.amount, request_date: w.request_date })),
        stats: { pending_count: pending.length, pending_total_amount: total },
      };
    },
  },
  {
    key: 'contracts_by_status',
    description_ar: 'توزيع العقود حسب الحالة',
    description_en: 'Contract counts grouped by status',
    admin_page: 'ContractManager',
    data_sources: ['Contract'],
    async run(base44) {
      const contracts = await base44.asServiceRole.entities.Contract.list();
      const byStatus = {};
      for (const c of contracts) byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      return {
        columns: [
          { key: 'status', label_ar: 'الحالة', label_en: 'Status' },
          { key: 'count', label_ar: 'العدد', label_en: 'Count' },
        ],
        rows: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
        stats: { total_contracts: contracts.length },
      };
    },
  },
  {
    key: 'platform_overview',
    description_ar: 'نظرة عامة سريعة على المنصة (افتراضي عند عدم تطابق سؤال محدد)',
    description_en: 'General platform snapshot (default/fallback capability)',
    admin_page: 'PlatformDashboard',
    data_sources: ['Project', 'Engineer', 'Client', 'Dispute'],
    async run(base44) {
      const [projects, engineers, clients, disputes] = await Promise.all([
        base44.asServiceRole.entities.Project.list(),
        base44.asServiceRole.entities.Engineer.filter({ status: 'approved' }),
        base44.asServiceRole.entities.Client.list(),
        base44.asServiceRole.entities.Dispute.filter({ status: { $in: ['submitted', 'under_review', 'investigation', 'mediation', 'escalated'] } }),
      ]);
      const activeProjects = projects.filter(p => ['open', 'in_progress'].includes(p.status));
      return {
        columns: [
          { key: 'metric', label_ar: 'المؤشر', label_en: 'Metric' },
          { key: 'value', label_ar: 'القيمة', label_en: 'Value' },
        ],
        rows: [
          { metric: 'إجمالي المشاريع / Total projects', value: projects.length },
          { metric: 'مشاريع نشطة / Active projects', value: activeProjects.length },
          { metric: 'مهندسون معتمدون / Approved engineers', value: engineers.length },
          { metric: 'إجمالي العملاء / Total clients', value: clients.length },
          { metric: 'نزاعات مفتوحة / Open disputes', value: disputes.length },
        ],
        stats: {},
      };
    },
  },
];

Deno.serve(async (req) => {
  const startedAt = Date.now();
  const base44 = createClientFromRequest(req);
  let user;
  let question = '';

  try {
    user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json();
    question = (body?.question || '').trim();
    if (!question) return Response.json({ error: 'Missing question' }, { status: 400 });

    // ── Step 1: route the question to a capability (read-only classification) ──
    const routing = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a routing classifier for a read-only admin data assistant on a construction/engineering marketplace platform called Bytly.
Given the admin's question (which may be in Arabic or English), pick the single best-matching capability from this list, or "platform_overview" if nothing matches well.

Capabilities:
${CAPABILITIES.map(c => `- ${c.key}: ${c.description_en} / ${c.description_ar}`).join('\n')}

Question: "${question}"

Also detect the question's language (ar or en).`,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          capability: { type: 'string', enum: CAPABILITIES.map(c => c.key) },
          language: { type: 'string', enum: ['ar', 'en'] },
        },
        required: ['capability', 'language'],
      },
    });

    const capability = CAPABILITIES.find(c => c.key === routing.capability) || CAPABILITIES.find(c => c.key === 'platform_overview');
    const language = routing.language === 'en' ? 'en' : 'ar';

    // ── Step 2: execute the capability — READ ONLY (.filter()/.list() only) ──
    const { columns, rows, stats } = await capability.run(base44);

    // ── Step 3: compose a natural-language answer from the retrieved data ──
    const composed = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a data assistant inside the admin dashboard of Bytly, a construction/engineering marketplace platform.
Answer the admin's question in ${language === 'ar' ? 'Arabic' : 'English'}, in 2-4 sentences, using ONLY the data below. Reference concrete numbers. Do not restate every row — a table is already shown below your answer. Do not invent any figure not present in the data.

Question: "${question}"

Data (JSON):
${JSON.stringify({ stats, sample_rows: rows.slice(0, 20) })}`,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: { answer: { type: 'string' } },
        required: ['answer'],
      },
    });

    const responseTimeMs = Date.now() - startedAt;

    // ── Audit log (the only write this function performs) ──
    await base44.asServiceRole.entities.AIAssistantQueryLog.create({
      question,
      language,
      asked_by_email: user.email,
      asked_by_name: user.full_name || user.email,
      capability_used: capability.key,
      data_sources: capability.data_sources,
      row_count: rows.length,
      answer_summary: composed.answer.slice(0, 2000),
      success: true,
      response_time_ms: responseTimeMs,
    });

    return Response.json({
      success: true,
      answer: composed.answer,
      language,
      capability_used: capability.key,
      admin_page: capability.admin_page,
      table: { columns: columns.map(c => ({ key: c.key, label: language === 'ar' ? c.label_ar : (c.label_en || c.label_ar) })), rows },
      stats,
    });
  } catch (error) {
    console.error('platformDataAssistant error:', error);
    try {
      if (user) {
        await base44.asServiceRole.entities.AIAssistantQueryLog.create({
          question: question || '(unknown)',
          asked_by_email: user.email,
          asked_by_name: user.full_name || user.email,
          success: false,
          error_message: String(error?.message || error),
          response_time_ms: Date.now() - startedAt,
        });
      }
    } catch (_logErr) {
      // Logging failure should never mask the original error to the caller.
    }
    return Response.json({ error: 'Something went wrong answering that question.' }, { status: 500 });
  }
});
