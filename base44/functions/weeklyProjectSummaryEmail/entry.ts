import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const STATUS_LABELS = {
  open: "مفتوح", in_progress: "قيد التنفيذ", awaiting_technical_review: "بانتظار المراجعة الفنية",
  technical_approved: "معتمد فنيًا", pending_client_approval: "بانتظار موافقة العميل",
  completed: "مكتمل", cancelled: "ملغي", disputed: "نزاع",
};

const ACTION_LABELS = {
  status_changed: "تغيير حالة", updated: "تعديل مالي", created: "إنشاء", deleted: "حذف",
};

function esc(v) {
  if (v === null || v === undefined) return "";
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function money(v) {
  return Number(v || 0).toLocaleString("en-US");
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    // ── Gather data ──────────────────────────────────────────────
    const [projects, recentLogs, adminUsers, invoices] = await Promise.all([
      base44.asServiceRole.entities.Project.list("-created_date", 500),
      base44.asServiceRole.entities.TaskActivityLog.list("-created_date", 50),
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Invoice.list("-created_date", 200),
    ]);

    const admins = adminUsers.filter((u) => u.role === "admin" && u.email);
    if (admins.length === 0) {
      return Response.json({ success: false, message: "لا يوجد أدمن مسجل لإرسال الملخص إليه" });
    }

    // ── Statistics ───────────────────────────────────────────────
    const byStatus = {};
    projects.forEach((p) => { byStatus[p.status] = (byStatus[p.status] || 0) + 1; });
    const totalEscrow = projects.reduce((s, p) => s + (p.escrow_amount || 0), 0);
    const totalReleased = projects.filter((p) => p.payment_status === "released" || p.payment_status === "completed")
      .reduce((s, p) => s + (p.escrow_amount || 0), 0);
    const activeCount = (byStatus.in_progress || 0) + (byStatus.open || 0) + (byStatus.awaiting_technical_review || 0) + (byStatus.pending_client_approval || 0);
    const completedThisCycle = byStatus.completed || 0;
    const disputedCount = byStatus.disputed || 0;
    const cancelledCount = byStatus.cancelled || 0;

    // ── Recent activity (last 7 days) ────────────────────────────
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekLogs = recentLogs.filter((l) => new Date(l.created_date) >= weekAgo);
    const statusChanges = weekLogs.filter((l) => l.action_type === "status_changed");
    const financialChanges = weekLogs.filter((l) => l.action_type === "updated" && l.field_name !== "title/description");

    // ── Outstanding debts (unpaid / overdue invoices + unpaid projects) ──
    const outstandingInvoices = invoices.filter((inv) => ["sent", "overdue"].includes(inv.status));
    const totalOutstanding = outstandingInvoices.reduce((s, inv) => s + Number(inv.total_amount || 0) - Number(inv.paid_amount || 0), 0);
    const overdueInvoices = outstandingInvoices.filter((inv) => inv.due_date && new Date(inv.due_date) < new Date());
    const totalOverdue = overdueInvoices.reduce((s, inv) => s + Number(inv.total_amount || 0) - Number(inv.paid_amount || 0), 0);
    const unpaidProjects = projects.filter((p) => ["unpaid", "escrowed"].includes(p.payment_status));
    const unpaidProjectsEscrow = unpaidProjects.reduce((s, p) => s + Number(p.escrow_amount || 0), 0);

    // ── Build HTML email ─────────────────────────────────────────
    const periodStart = weekAgo.toLocaleDateString("ar-SA");
    const periodEnd = new Date().toLocaleDateString("ar-SA");

    const debtRows = outstandingInvoices
      .sort((a, b) => (b.total_amount - b.paid_amount) - (a.total_amount - a.paid_amount))
      .slice(0, 12)
      .map((inv) => {
        const due = Number(inv.total_amount || 0) - Number(inv.paid_amount || 0);
        const isOverdue = inv.due_date && new Date(inv.due_date) < new Date();
        const statusColor = isOverdue ? "#dc2626" : "#b45309";
        const statusLabel = isOverdue ? "متأخر" : "مستحق";
        return `
        <tr>
          <td style="padding:6px 10px;border:1px solid #eee;font-size:12px;font-weight:bold">${esc(inv.invoice_number || "—")}</td>
          <td style="padding:6px 10px;border:1px solid #eee;font-size:12px">${esc(inv.client_company || inv.client_email || "—")}</td>
          <td style="padding:6px 10px;border:1px solid #eee;font-size:12px;font-weight:bold;text-align:center">${money(due)} ر.س</td>
          <td style="padding:6px 10px;border:1px solid #eee;font-size:12px;text-align:center;color:${statusColor};font-weight:bold">${statusLabel}</td>
          <td style="padding:6px 10px;border:1px solid #eee;font-size:12px;color:#666;text-align:center">${inv.due_date ? new Date(inv.due_date).toLocaleDateString("ar-SA") : "—"}</td>
        </tr>`;
      }).join("");

    const statsRows = Object.entries(STATUS_LABELS).map(([k, label]) => `
      <tr>
        <td style="padding:6px 10px;border:1px solid #eee">${esc(label)}</td>
        <td style="padding:6px 10px;border:1px solid #eee;text-align:center;font-weight:bold">${byStatus[k] || 0}</td>
      </tr>`).join("");

    const activityRows = weekLogs.slice(0, 20).map((l) => {
      const meta = ACTION_LABELS[l.action_type] || l.action_type;
      const color = l.action_type === "status_changed" ? "#b45309" : l.action_type === "deleted" ? "#dc2626" : "#2563eb";
      return `
      <tr>
        <td style="padding:6px 10px;border:1px solid #eee;font-size:12px;color:${color};font-weight:bold">${esc(meta)}</td>
        <td style="padding:6px 10px;border:1px solid #eee;font-size:12px">${esc(l.summary || "—")}</td>
        <td style="padding:6px 10px;border:1px solid #eee;font-size:12px;color:#666">${esc(l.actor_name || l.actor_email || "—")}</td>
        <td style="padding:6px 10px;border:1px solid #eee;font-size:12px;color:#999">${new Date(l.created_date).toLocaleString("ar-SA")}</td>
      </tr>`;
    }).join("");

    const html = `
    <div dir="rtl" style="font-family:'Segoe UI',Tahoma,sans-serif;background:#f5f0e8;padding:20px">
      <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5d4b8">
        <div style="background:#4A3F35;color:#fff;padding:24px">
          <h1 style="margin:0;font-size:20px">📋 الملخص الأسبوعي للمشاريع — بيتلي</h1>
          <p style="margin:6px 0 0;color:#C9A66B;font-size:13px">للفترة من ${esc(periodStart)} إلى ${esc(periodEnd)}</p>
        </div>

        <div style="padding:20px">
          <h2 style="font-size:15px;color:#4A3F35;margin:0 0 12px">📊 الإحصائيات الحالية</h2>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:8px">
            <tr><td style="padding:8px 12px;background:#f9f5ee;border:1px solid #eee">إجمالي المشاريع</td>
                <td style="padding:8px 12px;background:#f9f5ee;border:1px solid #eee;font-weight:bold;text-align:center">${projects.length}</td></tr>
            <tr><td style="padding:8px 12px;border:1px solid #eee">المشاريع النشطة</td>
                <td style="padding:8px 12px;border:1px solid #eee;font-weight:bold;text-align:center;color:#2563eb">${activeCount}</td></tr>
            <tr><td style="padding:8px 12px;border:1px solid #eee">مكتملة</td>
                <td style="padding:8px 12px;border:1px solid #eee;font-weight:bold;text-align:center;color:#16a34a">${completedThisCycle}</td></tr>
            <tr><td style="padding:8px 12px;border:1px solid #eee">في نزاع</td>
                <td style="padding:8px 12px;border:1px solid #eee;font-weight:bold;text-align:center;color:#dc2626">${disputedCount}</td></tr>
            <tr><td style="padding:8px 12px;border:1px solid #eee">ملغاة</td>
                <td style="padding:8px 12px;border:1px solid #eee;font-weight:bold;text-align:center;color:#6b7280">${cancelledCount}</td></tr>
            <tr><td style="padding:8px 12px;border:1px solid #eee">إجمالي الضمان المحجوز</td>
                <td style="padding:8px 12px;border:1px solid #eee;font-weight:bold;text-align:center">${money(totalEscrow)} ر.س</td></tr>
            <tr><td style="padding:8px 12px;border:1px solid #eee">المبالغ المُحرّرة</td>
                <td style="padding:8px 12px;border:1px solid #eee;font-weight:bold;text-align:center;color:#16a34a">${money(totalReleased)} ر.س</td></tr>
          </table>

          <h3 style="font-size:13px;color:#4A3F35;margin:16px 0 8px">التوزيع حسب الحالة</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="background:#f9f5ee">
              <th style="padding:6px 10px;border:1px solid #eee;text-align:right">الحالة</th>
              <th style="padding:6px 10px;border:1px solid #eee">العدد</th>
            </tr></thead>
            <tbody>${statsRows}</tbody>
          </table>

          <h2 style="font-size:15px;color:#4A3F35;margin:20px 0 12px">🔄 حركة العمل هذا الأسبوع</h2>
          <p style="font-size:12px;color:#666;margin:0 0 8px">
            تغييرات الحالة: <strong>${statusChanges.length}</strong> ·
            تغييرات مالية: <strong>${financialChanges.length}</strong> ·
            إجمالي الأنشطة: <strong>${weekLogs.length}</strong>
          </p>
          ${weekLogs.length === 0 ? `
            <p style="padding:16px;text-align:center;color:#999;background:#fafafa;border-radius:8px;font-size:13px">لا يوجد نشاط مسجل هذا الأسبوع</p>
          ` : `
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <thead><tr style="background:#f9f5ee">
                <th style="padding:6px 10px;border:1px solid #eee;text-align:right">النوع</th>
                <th style="padding:6px 10px;border:1px solid #eee;text-align:right">التفاصيل</th>
                <th style="padding:6px 10px;border:1px solid #eee;text-align:right">بواسطة</th>
                <th style="padding:6px 10px;border:1px solid #eee;text-align:right">التاريخ</th>
              </tr></thead>
              <tbody>${activityRows}</tbody>
            </table>
          `}

          <h2 style="font-size:15px;color:#4A3F35;margin:20px 0 12px">💰 الديون المستحقة</h2>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:8px">
            <tr><td style="padding:8px 12px;background:#fef2f2;border:1px solid #fee2e2">إجمالي الفواتير المستحقة</td>
                <td style="padding:8px 12px;background:#fef2f2;border:1px solid #fee2e2;font-weight:bold;text-align:center;color:#dc2626">${money(totalOutstanding)} ر.س</td></tr>
            <tr><td style="padding:8px 12px;border:1px solid #eee">منها متأخرة السداد</td>
                <td style="padding:8px 12px;border:1px solid #eee;font-weight:bold;text-align:center;color:#b91c1c">${money(totalOverdue)} ر.س (${overdueInvoices.length} فاتورة)</td></tr>
            <tr><td style="padding:8px 12px;border:1px solid #eee">ضمان محجوز لمشاريع غير مدفوعة</td>
                <td style="padding:8px 12px;border:1px solid #eee;font-weight:bold;text-align:center">${money(unpaidProjectsEscrow)} ر.س (${unpaidProjects.length} مشروع)</td></tr>
          </table>
          ${outstandingInvoices.length === 0 ? `
            <p style="padding:14px;text-align:center;color:#16a34a;background:#f0fdf4;border-radius:8px;font-size:13px">✅ لا توجد ديون مستحقة حاليًا</p>
          ` : `
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <thead><tr style="background:#fef2f2">
                <th style="padding:6px 10px;border:1px solid #fee2e2;text-align:right">رقم الفاتورة</th>
                <th style="padding:6px 10px;border:1px solid #fee2e2;text-align:right">العميل</th>
                <th style="padding:6px 10px;border:1px solid #fee2e2">المبلغ المستحق</th>
                <th style="padding:6px 10px;border:1px solid #fee2e2">الحالة</th>
                <th style="padding:6px 10px;border:1px solid #fee2e2">تاريخ الاستحقاق</th>
              </tr></thead>
              <tbody>${debtRows}</tbody>
            </table>
          `}

          <div style="margin-top:24px;padding:14px;background:#f9f5ee;border-radius:8px;border:1px solid #e5d4b8">
            <p style="margin:0;font-size:12px;color:#6B5D4F">
              📌 هذا التقرير يُرسل تلقائيًا كل أسبوع. للمتابعة التفصيلية ادخل إلى لوحة إدارة المشاريع في منصة بيتلي.
            </p>
          </div>
        </div>

        <div style="background:#4A3F35;color:#999;padding:12px;text-align:center;font-size:11px">
          © ${new Date().getFullYear()} بيتلي — المنظومة الهندسية المتكاملة
        </div>
      </div>
    </div>`;

    // ── Send to all admins ────────────────────────────────────────
    const subject = `📋 الملخص الأسبوعي للمشاريع — بيتلي (${periodEnd})`;
    const results = await Promise.all(admins.map((a) =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: a.email,
        subject,
        body: html,
        from_name: "بيتلي — تقارير المشاريع",
      })
        .then(() => base44.asServiceRole.entities.SentEmail.create({
          to_email: a.email,
          recipient_name: a.full_name || a.email,
          subject,
          body: html,
          source: "weeklyProjectSummaryEmail",
          sent_at: new Date().toISOString(),
          status: "sent",
          description: `ملخص أسبوعي للمشاريع للفترة ${periodStart} - ${periodEnd}`,
        }).catch(() => {}))
        .then(() => ({ email: a.email, ok: true }))
        .catch((err) => ({ email: a.email, ok: false, error: err.message }))
    ));

    const sent = results.filter((r) => r.ok).length;
    return Response.json({ success: true, sent, total: admins.length, results, stats: { total: projects.length, active: activeCount, completed: completedThisCycle, disputed: disputedCount, weekActivity: weekLogs.length } });
  } catch (error) {
    console.error("weeklyProjectSummaryEmail error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}