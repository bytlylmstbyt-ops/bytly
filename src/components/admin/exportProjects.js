// Export projects table to an Excel-readable .xls file (HTML table with UTF-8 BOM).
// Preserves Arabic text; Excel opens HTML tables natively.

const STATUS_LABELS = {
  open: "مفتوح", in_progress: "قيد التنفيذ", awaiting_technical_review: "بانتظار المراجعة الفنية",
  technical_approved: "معتمد فنيًا", pending_client_approval: "بانتظار موافقة العميل",
  completed: "مكتمل", cancelled: "ملغي", disputed: "نزاع",
};

const TYPE_LABELS = { full_construction: "بناء كامل", express_service: "خدمة سريعة" };

function esc(v) {
  if (v === null || v === undefined) return "";
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtDate(d) {
  if (!d) return "";
  try { return new Date(d).toLocaleString("ar-SA"); } catch { return d; }
}

export default async function exportProjectsToExcel({ projects, clients, engineers }) {
  const clientMap = {};
  (clients || []).forEach(c => { clientMap[c.id] = c.full_name || "—"; });
  const engMap = {};
  (engineers || []).forEach(e => { engMap[e.id] = e.full_name || "—"; });

  const headers = [
    "رقم المشروع", "اسم المشروع", "الوصف", "العميل", "المهندس المسؤول",
    "المدينة", "نوع المشروع", "قيمة العقد (ر.س)", "الضمان المحجوز (ر.س)",
    "الإنجاز %", "الحالة", "حالة الدفع", "حالة الضمان", "عدد العروض",
    "تاريخ الإنشاء", "آخر تحديث",
  ];

  const rows = (projects || []).map(p => [
    `#${(p.id || "").slice(-6)}`,
    esc(p.title), esc(p.description), esc(clientMap[p.client_id] || "—"), esc(engMap[p.assigned_engineer_id] || "—"),
    esc(p.location), esc(TYPE_LABELS[p.project_type] || p.project_type || "—"),
    (p.escrow_amount || p.budget_max || 0).toLocaleString("en-US"),
    (p.escrow_amount || 0).toLocaleString("en-US"),
    `${p.revisions_count || 0}/${p.max_revisions || 3}`,
    esc(STATUS_LABELS[p.status] || p.status),
    esc(p.payment_status === "unpaid" ? "غير مدفوع" : p.payment_status === "escrowed" ? "محجوز" : p.payment_status === "released" ? "محرر" : p.payment_status === "completed" ? "مكتمل" : "—"),
    esc(p.escrow_status === "none" ? "—" : p.escrow_status === "held" ? "محجوز" : p.escrow_status === "released" ? "محرر" : p.escrow_status === "refunded" ? "مسترد" : "—"),
    p.total_proposals || 0,
    fmtDate(p.created_date), fmtDate(p.updated_date),
  ]);

  const tableHtml = `<table border="1"><thead><tr>${headers.map(h => `<th style="background:#4A3F35;color:white;font-weight:bold;padding:6px">${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td style="padding:5px">${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body>${tableHtml}</body></html>`;
  const blob = new Blob(["\uFEFF", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `مشاريع_بيتلي_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}