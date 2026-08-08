import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ════════════════════════════════════════════════════════════════════════
// platformDataAssistant  (Phase 2 — "Platform Admin AI Copilot")
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
//   • If a question doesn't match a capability well, the function says so
//     explicitly (coverage: "unsupported") instead of guessing an answer.
//
// Modularity: to add a new question type, add one entry to CAPABILITIES.
// Nothing else in this file needs to change. This is still Phase 2 —
// no write tools exist anywhere in this registry, and none should be
// added without a separate, explicit safety review.
// ════════════════════════════════════════════════════════════════════════

const CAPABILITIES = [
  // ── Projects ──────────────────────────────────────────────────────────
  {
    key: 'overdue_projects',
    category: 'projects',
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
    key: 'projects_needing_attention',
    category: 'projects',
    description_ar: 'ملخص شامل للأمور التي تحتاج انتباه المسؤول الآن: مشاريع متأخرة، نزاعات مفتوحة، وموافقات معلقة',
    description_en: 'Combined snapshot of things needing admin attention now: overdue projects, open disputes, pending approvals',
    admin_page: 'PlatformDashboard',
    data_sources: ['Project', 'Dispute', 'Engineer'],
    async run(base44) {
      const [projects, disputes, pendingEngineers] = await Promise.all([
        base44.asServiceRole.entities.Project.filter({
          status: { $in: ['open', 'in_progress', 'awaiting_technical_review', 'technical_approved', 'pending_client_approval'] }
        }),
        base44.asServiceRole.entities.Dispute.filter({ status: { $in: ['submitted', 'under_review', 'investigation', 'mediation', 'escalated'] } }),
        base44.asServiceRole.entities.Engineer.filter({ status: 'pending' }),
      ]);
      const today = new Date();
      const overdue = projects.filter(p => p.deadline && new Date(p.deadline) < today);
      const rows = [
        { item: 'مشاريع متأخرة / Overdue projects', count: overdue.length },
        { item: 'نزاعات مفتوحة / Open disputes', count: disputes.length },
        { item: 'مهندسون بانتظار الموافقة / Engineers pending approval', count: pendingEngineers.length },
      ];
      return {
        columns: [
          { key: 'item', label_ar: 'البند', label_en: 'Item' },
          { key: 'count', label_ar: 'العدد', label_en: 'Count' },
        ],
        rows,
        stats: { overdue_projects: overdue.length, open_disputes: disputes.length, pending_engineers: pendingEngineers.length },
      };
    },
  },
  // ── Engineers ─────────────────────────────────────────────────────────
  {
    key: 'top_engineers',
    category: 'engineers',
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
    key: 'engineers_with_overdue_projects',
    category: 'engineers',
    description_ar: 'المهندسون الذين لديهم مشروع متأخر واحد أو أكثر',
    description_en: 'Engineers who currently have one or more overdue projects assigned',
    admin_page: 'AdminEngineers',
    data_sources: ['Project', 'Engineer'],
    async run(base44) {
      const projects = await base44.asServiceRole.entities.Project.filter({
        status: { $in: ['open', 'in_progress', 'awaiting_technical_review', 'technical_approved', 'pending_client_approval'] }
      });
      const today = new Date();
      const overdue = projects.filter(p => p.deadline && new Date(p.deadline) < today && p.assigned_engineer_id);
      const byEngineer = {};
      for (const p of overdue) {
        byEngineer[p.assigned_engineer_id] = (byEngineer[p.assigned_engineer_id] || 0) + 1;
      }
      const engineerIds = Object.keys(byEngineer);
      const engineers = engineerIds.length
        ? await base44.asServiceRole.entities.Engineer.filter({ id: { $in: engineerIds } })
        : [];
      const rows = engineers.map(e => ({ id: e.id, full_name: e.full_name, overdue_projects: byEngineer[e.id] || 0 }))
        .sort((a, b) => b.overdue_projects - a.overdue_projects);
      return {
        columns: [
          { key: 'full_name', label_ar: 'المهندس', label_en: 'Engineer' },
          { key: 'overdue_projects', label_ar: 'عدد المشاريع المتأخرة', label_en: 'Overdue projects' },
        ],
        rows,
        stats: { engineers_affected: rows.length },
      };
    },
  },
  {
    key: 'pending_engineer_approvals',
    category: 'approvals',
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
  // ── Clients ───────────────────────────────────────────────────────────
  {
    key: 'clients_overview',
    category: 'clients',
    description_ar: 'نظرة عامة على العملاء: العدد الإجمالي وأكثرهم نشاطًا',
    description_en: 'Client overview: total count and most active clients by project count',
    admin_page: 'AdminClients',
    data_sources: ['Client'],
    async run(base44) {
      const clients = await base44.asServiceRole.entities.Client.list();
      const sorted = [...clients].sort((a, b) => (b.total_projects || 0) - (a.total_projects || 0)).slice(0, 10);
      return {
        columns: [
          { key: 'full_name', label_ar: 'العميل', label_en: 'Client' },
          { key: 'total_projects', label_ar: 'عدد المشاريع', label_en: 'Projects' },
          { key: 'city', label_ar: 'المدينة', label_en: 'City' },
        ],
        rows: sorted.map(c => ({ id: c.id, full_name: c.full_name, total_projects: c.total_projects, city: c.city })),
        stats: { total_clients: clients.length },
      };
    },
  },
  // ── Service providers / marketplace entities ─────────────────────────
  {
    key: 'pending_provider_approvals',
    category: 'approvals',
    description_ar: 'طلبات شركات هندسية/استشارية بانتظار الاعتماد',
    description_en: 'Engineering/consulting firm applications pending approval',
    admin_page: 'AdminProviders',
    data_sources: ['EngineeringFirm'],
    async run(base44) {
      const pending = await base44.asServiceRole.entities.EngineeringFirm.filter({ status: 'pending' });
      return {
        columns: [
          { key: 'company_name', label_ar: 'اسم الشركة', label_en: 'Company' },
          { key: 'city', label_ar: 'المدينة', label_en: 'City' },
          { key: 'team_size', label_ar: 'حجم الفريق', label_en: 'Team size' },
        ],
        rows: pending.slice(0, 50).map(f => ({ id: f.id, company_name: f.company_name, city: f.city, team_size: f.team_size })),
        stats: { pending_count: pending.length },
      };
    },
  },
  {
    key: 'marketplace_entities_overview',
    category: 'providers',
    description_ar: 'كيانات سوق المطورين والمستثمرين: العدد والتوثيق',
    description_en: 'Developer/investor marketplace entities: counts and verification status',
    admin_page: 'AdminMarketEntities',
    data_sources: ['MarketEntity'],
    async run(base44) {
      const entities = await base44.asServiceRole.entities.MarketEntity.list();
      const developers = entities.filter(e => e.entity_type === 'developer');
      const investors = entities.filter(e => e.entity_type === 'investor');
      const verified = entities.filter(e => e.is_verified);
      return {
        columns: [
          { key: 'metric', label_ar: 'المؤشر', label_en: 'Metric' },
          { key: 'value', label_ar: 'القيمة', label_en: 'Value' },
        ],
        rows: [
          { metric: 'المطورون / Developers', value: developers.length },
          { metric: 'المستثمرون / Investors', value: investors.length },
          { metric: 'موثّقون / Verified', value: verified.length },
          { metric: 'الإجمالي / Total', value: entities.length },
        ],
        stats: { total: entities.length },
      };
    },
  },
  // ── Contracts ─────────────────────────────────────────────────────────
  {
    key: 'active_contracts',
    category: 'contracts',
    description_ar: 'العقود النشطة حاليًا',
    description_en: 'Currently active contracts',
    admin_page: 'ContractManager',
    data_sources: ['Contract'],
    async run(base44) {
      const contracts = await base44.asServiceRole.entities.Contract.filter({ status: { $in: ['active', 'signed', 'in_progress'] } });
      return {
        columns: [
          { key: 'id', label_ar: 'رقم العقد', label_en: 'Contract' },
          { key: 'status', label_ar: 'الحالة', label_en: 'Status' },
          { key: 'total_amount', label_ar: 'القيمة الإجمالية', label_en: 'Total amount' },
        ],
        rows: contracts.slice(0, 50).map(c => ({ id: c.id, status: c.status, total_amount: c.total_amount })),
        stats: { active_count: contracts.length },
      };
    },
  },
  {
    key: 'contracts_by_status',
    category: 'contracts',
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
  // ── Payments / revenue / withdrawals / invoices / commissions ───────────
  {
    key: 'revenue_this_month',
    category: 'revenue',
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
    key: 'revenue_month_comparison',
    category: 'revenue',
    description_ar: 'مقارنة إيرادات الشهر الحالي بالشهر الماضي',
    description_en: "This month's revenue compared to last month",
    admin_page: 'RevenueDashboard',
    data_sources: ['Transaction'],
    async run(base44) {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const txs = await base44.asServiceRole.entities.Transaction.filter({ type: 'commission', status: 'completed' });
      const thisMonth = txs.filter(t => t.created_date && new Date(t.created_date) >= thisMonthStart);
      const lastMonth = txs.filter(t => t.created_date && new Date(t.created_date) >= lastMonthStart && new Date(t.created_date) < thisMonthStart);
      const thisTotal = thisMonth.reduce((s, t) => s + (t.amount || 0), 0);
      const lastTotal = lastMonth.reduce((s, t) => s + (t.amount || 0), 0);
      const change = lastTotal > 0 ? (((thisTotal - lastTotal) / lastTotal) * 100).toFixed(1) : null;
      return {
        columns: [
          { key: 'period', label_ar: 'الفترة', label_en: 'Period' },
          { key: 'revenue', label_ar: 'الإيراد', label_en: 'Revenue' },
        ],
        rows: [
          { period: 'الشهر الحالي / This month', revenue: thisTotal },
          { period: 'الشهر الماضي / Last month', revenue: lastTotal },
        ],
        stats: { this_month: thisTotal, last_month: lastTotal, change_percent: change },
      };
    },
  },
  {
    key: 'commission_summary',
    category: 'commissions',
    description_ar: 'إجمالي عمولات المنصة (كل الوقت وهذا الشهر)',
    description_en: 'Platform commission totals (all-time and this month)',
    admin_page: 'AdminCommissionSettings',
    data_sources: ['Transaction'],
    async run(base44) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const txs = await base44.asServiceRole.entities.Transaction.filter({ type: 'commission', status: 'completed' });
      const allTime = txs.reduce((s, t) => s + (t.amount || 0), 0);
      const thisMonth = txs.filter(t => t.created_date && new Date(t.created_date) >= monthStart).reduce((s, t) => s + (t.amount || 0), 0);
      return {
        columns: [
          { key: 'period', label_ar: 'الفترة', label_en: 'Period' },
          { key: 'amount', label_ar: 'المبلغ', label_en: 'Amount' },
        ],
        rows: [
          { period: 'كل الوقت / All-time', amount: allTime },
          { period: 'هذا الشهر / This month', amount: thisMonth },
        ],
        stats: { all_time_commission: allTime, this_month_commission: thisMonth, transaction_count: txs.length },
      };
    },
  },
  {
    key: 'pending_withdrawals',
    category: 'payments',
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
    key: 'pending_invoices',
    category: 'invoices',
    description_ar: 'الفواتير غير المدفوعة أو المتأخرة',
    description_en: 'Unpaid or overdue invoices',
    admin_page: 'InvoiceManager',
    data_sources: ['Invoice'],
    async run(base44) {
      const invoices = await base44.asServiceRole.entities.Invoice.filter({ status: { $in: ['sent', 'overdue'] } });
      const totalOutstanding = invoices.reduce((s, i) => s + ((i.total_amount || i.amount || 0) - (i.paid_amount || 0)), 0);
      return {
        columns: [
          { key: 'invoice_number', label_ar: 'رقم الفاتورة', label_en: 'Invoice #' },
          { key: 'status', label_ar: 'الحالة', label_en: 'Status' },
          { key: 'total_amount', label_ar: 'المبلغ', label_en: 'Amount' },
          { key: 'due_date', label_ar: 'تاريخ الاستحقاق', label_en: 'Due date' },
        ],
        rows: invoices.slice(0, 50).map(i => ({ id: i.id, invoice_number: i.invoice_number, status: i.status, total_amount: i.total_amount, due_date: i.due_date })),
        stats: { outstanding_count: invoices.length, outstanding_amount: totalOutstanding },
      };
    },
  },
  // ── Subscriptions ─────────────────────────────────────────────────────
  {
    key: 'active_subscriptions',
    category: 'subscriptions',
    description_ar: 'الاشتراكات النشطة حاليًا وعددها',
    description_en: 'Currently active subscriptions and their count',
    admin_page: 'AdminSubscriptionControl',
    data_sources: ['Subscription'],
    async run(base44) {
      const subs = await base44.asServiceRole.entities.Subscription.filter({ status: 'active' });
      const byPlan = {};
      for (const s of subs) byPlan[s.plan_type] = (byPlan[s.plan_type] || 0) + 1;
      return {
        columns: [
          { key: 'plan_type', label_ar: 'نوع الخطة', label_en: 'Plan' },
          { key: 'count', label_ar: 'العدد', label_en: 'Count' },
        ],
        rows: Object.entries(byPlan).map(([plan_type, count]) => ({ plan_type, count })),
        stats: { active_subscriptions: subs.length },
      };
    },
  },
  // ── Disputes ──────────────────────────────────────────────────────────
  {
    key: 'open_disputes',
    category: 'disputes',
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
  // ── Ratings & reviews ─────────────────────────────────────────────────
  {
    key: 'ratings_reviews_summary',
    category: 'reviews',
    description_ar: 'متوسط التقييمات وعدد المراجعات حسب نوع مقدم الخدمة',
    description_en: 'Average rating and review count by service-provider type',
    admin_page: 'AdminReviews',
    data_sources: ['Review'],
    async run(base44) {
      const reviews = await base44.asServiceRole.entities.Review.filter({ status: 'completed' });
      const byType = {};
      for (const r of reviews) {
        const t = r.target_type || 'engineer';
        if (!byType[t]) byType[t] = { count: 0, sum: 0 };
        byType[t].count += 1;
        byType[t].sum += (r.rating || 0);
      }
      const rows = Object.entries(byType).map(([target_type, v]) => ({
        target_type, review_count: v.count, average_rating: v.count ? (v.sum / v.count).toFixed(2) : 0,
      }));
      return {
        columns: [
          { key: 'target_type', label_ar: 'النوع', label_en: 'Type' },
          { key: 'review_count', label_ar: 'عدد المراجعات', label_en: 'Reviews' },
          { key: 'average_rating', label_ar: 'متوسط التقييم', label_en: 'Avg rating' },
        ],
        rows,
        stats: { total_reviews: reviews.length },
      };
    },
  },
  // ── Notifications ─────────────────────────────────────────────────────
  {
    key: 'notifications_overview',
    category: 'notifications',
    description_ar: 'نظرة عامة على الإشعارات غير المقروءة حسب النوع',
    description_en: 'Overview of unread notifications by type',
    admin_page: 'NotificationCenter',
    data_sources: ['Notification'],
    async run(base44) {
      const unread = await base44.asServiceRole.entities.Notification.filter({ is_read: false });
      const byType = {};
      for (const n of unread) byType[n.type] = (byType[n.type] || 0) + 1;
      return {
        columns: [
          { key: 'type', label_ar: 'النوع', label_en: 'Type' },
          { key: 'count', label_ar: 'العدد', label_en: 'Count' },
        ],
        rows: Object.entries(byType).map(([type, count]) => ({ type, count })),
        stats: { total_unread: unread.length },
      };
    },
  },
  // ── Platform activity ─────────────────────────────────────────────────
  {
    key: 'platform_activity_recent',
    category: 'activity',
    description_ar: 'أحدث نشاط للمستخدمين على المنصة',
    description_en: 'Most recently active users on the platform',
    admin_page: 'PlatformDashboard',
    data_sources: ['UserActivity'],
    async run(base44) {
      const activity = await base44.asServiceRole.entities.UserActivity.list('-last_active_at', 20);
      return {
        columns: [
          { key: 'user_name', label_ar: 'المستخدم', label_en: 'User' },
          { key: 'current_page', label_ar: 'الصفحة الحالية', label_en: 'Current page' },
          { key: 'last_active_at', label_ar: 'آخر نشاط', label_en: 'Last active' },
        ],
        rows: activity.map(a => ({ id: a.id, user_name: a.user_name || a.user_email, current_page: a.current_page, last_active_at: a.last_active_at })),
        stats: { recent_active_users: activity.length },
      };
    },
  },
  // ── General overview (fallback capability) ───────────────────────────
  {
    key: 'platform_overview',
    category: 'overview',
    description_ar: 'نظرة عامة سريعة وشاملة على حالة المنصة اليوم',
    description_en: "General platform snapshot / today's status summary (default/fallback capability)",
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

const CAPABILITY_KEYS = CAPABILITIES.map(c => c.key);

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

    // ── Step 1: route the question — conversational, not exact-match ──────
    // The admin may phrase things informally in Arabic (MSA or dialect) or
    // English ("إيش المشاريع اللي تحتاج متابعة؟", "who's top rated?"). The
    // classifier's job is to map intent, not exact wording, onto ONE of the
    // fixed read-only capabilities below — or say plainly that none fit.
    const routing = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a routing classifier for a READ-ONLY admin data assistant on a construction/engineering marketplace platform called Bytly. You do not answer questions yourself — you only pick which read-only capability (if any) can answer the admin's question, including informal/conversational Arabic (dialect) or English phrasing.

Available capabilities:
${CAPABILITIES.map(c => `- ${c.key} [${c.category}]: ${c.description_en} / ${c.description_ar}`).join('\n')}

Question: "${question}"

Decide:
1. capability: the single best-matching capability key, or "platform_overview" if the question is a general/vague status request (e.g. "summarize today", "what needs my attention"), or "none" if the question asks for something no capability above can answer (e.g. asks to change/delete/pay/publish something, or asks about data no capability covers).
2. coverage: "supported" if the capability directly answers the question, "partial" if it's related but only partially answers it, "unsupported" if capability is "none".
3. language: "ar" or "en" — the question's language.
4. detected_intent: one short sentence (in English, for internal logging) describing what the admin is actually asking for.`,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          capability: { type: 'string', enum: [...CAPABILITY_KEYS, 'none'] },
          coverage: { type: 'string', enum: ['supported', 'partial', 'unsupported'] },
          language: { type: 'string', enum: ['ar', 'en'] },
          detected_intent: { type: 'string' },
        },
        required: ['capability', 'coverage', 'language', 'detected_intent'],
      },
    });

    const language = routing.language === 'en' ? 'en' : 'ar';
    const responseTimeMsSoFar = () => Date.now() - startedAt;

    // ── Unsupported: say so plainly, do not guess, do not run any query ──
    if (routing.capability === 'none' || routing.coverage === 'unsupported') {
      const cannotAnswer = language === 'ar'
        ? 'هذا السؤال خارج نطاق ما يستطيع هذا المساعد الإجابة عليه حاليًا (مساعد قراءة فقط لبيانات المنصة). لا أستطيع تخمين إجابة لا تستند إلى بيانات فعلية.'
        : "This question is outside what this assistant can currently answer (it's a read-only data assistant). I won't guess an answer that isn't backed by real data.";

      await base44.asServiceRole.entities.AIAssistantQueryLog.create({
        question,
        language,
        asked_by_email: user.email,
        asked_by_name: user.full_name || user.email,
        capability_used: 'none',
        detected_intent: routing.detected_intent?.slice(0, 300),
        coverage: 'unsupported',
        data_sources: [],
        row_count: 0,
        answer_summary: cannotAnswer,
        success: true,
        response_time_ms: responseTimeMsSoFar(),
      });

      return Response.json({
        success: true,
        answer: cannotAnswer,
        language,
        coverage: 'unsupported',
        capability_used: null,
        admin_page: null,
        read_only: true,
        table: null,
        stats: {},
      });
    }

    const capability = CAPABILITIES.find(c => c.key === routing.capability) || CAPABILITIES.find(c => c.key === 'platform_overview');
    const coverage = ['supported', 'partial'].includes(routing.coverage) ? routing.coverage : 'supported';

    // ── Step 2: execute the capability — READ ONLY (.filter()/.list() only) ──
    const { columns, rows, stats } = await capability.run(base44);

    // ── Step 3: compose a natural-language answer from the retrieved data ──
    const composed = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a data assistant inside the admin dashboard of Bytly, a construction/engineering marketplace platform. This is a READ-ONLY tool — you never suggest actions that write, delete, pay, or publish anything.
Answer the admin's question in ${language === 'ar' ? 'Arabic' : 'English'}, in 2-4 sentences, using ONLY the data below. Reference concrete numbers. Do not restate every row — a table is already shown below your answer. Do not invent any figure not present in the data.
${coverage === 'partial' ? 'Note: the matched capability only partially covers this question — mention briefly what part of the question this data addresses.' : ''}

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

    const responseTimeMs = responseTimeMsSoFar();

    // ── Audit log (the only write this function performs) ──
    await base44.asServiceRole.entities.AIAssistantQueryLog.create({
      question,
      language,
      asked_by_email: user.email,
      asked_by_name: user.full_name || user.email,
      capability_used: capability.key,
      detected_intent: routing.detected_intent?.slice(0, 300),
      coverage,
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
      coverage,
      capability_used: capability.key,
      admin_page: capability.admin_page,
      read_only: true,
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
