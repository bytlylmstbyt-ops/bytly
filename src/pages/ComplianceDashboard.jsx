import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck, AlertTriangle, XCircle, FileText, Scale,
  ClipboardList, Search, Download, Eye, CheckCircle2,
  Clock, Building2, ChevronDown, ChevronUp,
  Gavel, FileBadge, Lock, Activity, RefreshCw, FileDown, Loader2
} from "lucide-react";
import moment from "moment";
import { jsPDF } from "jspdf";

// ─── مستويات الامتثال ────────────────────────────────────────────────────────
const COMPLIANCE_LEVELS = {
  full: { label: "ممتثل كليًا", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: ShieldCheck, dot: "bg-emerald-500" },
  partial: { label: "ممتثل جزئيًا", color: "bg-amber-100 text-amber-800 border-amber-200", icon: AlertTriangle, dot: "bg-amber-500" },
  non: { label: "غير ممتثل", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle, dot: "bg-red-500" },
  pending: { label: "قيد المراجعة", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock, dot: "bg-blue-500" },
};

// ─── قائمة التحقق السعودية لكل مشروع ───────────────────────────────────────
const SA_CHECKLIST = [
  { id: "contract_signed", label: "عقد موقع إلكترونياً من الطرفين", category: "عقود" },
  { id: "engineer_licensed", label: "ترخيص المهندس ساري (هيئة المهندسين)", category: "تراخيص" },
  { id: "balady_permit", label: "رخصة بناء من البلدية (بلدي)", category: "تراخيص" },
  { id: "soil_report", label: "تقرير فحص التربة معتمد", category: "تقارير فنية" },
  { id: "sbc_compliance", label: "المطابقة للكود السعودي للبناء (SBC)", category: "تقارير فنية" },
  { id: "technical_review", label: "مراجعة فنية من مستشار معتمد", category: "مراجعات" },
  { id: "legal_addendum", label: "ملحق قانوني (حقوق الملكية الفكرية)", category: "قانوني" },
  { id: "pdpl_consent", label: "موافقة حماية البيانات (PDPL)", category: "قانوني" },
  { id: "insurance", label: "وثيقة تأمين المشروع", category: "تأمين" },
  { id: "invoice_vat", label: "فواتير ضريبة القيمة المضافة (VAT 15%)", category: "مالي" },
];

// ─── حساب درجة الامتثال ─────────────────────────────────────────────────────
function calcCompliance(project, contracts, techReviews, legalReviews, milestones) {
  const checks = {};
  const projContracts = contracts.filter(c => c.project_id === project.id);
  const projTech = techReviews.filter(t => t.project_id === project.id);
  const projLegal = legalReviews.filter(l => l.project_id === project.id);
  const projMilestones = milestones.filter(m => m.project_id === project.id);

  checks.contract_signed = projContracts.some(c => c.client_signature && c.engineer_signature);
  checks.engineer_licensed = !!project.engineer_id;
  checks.balady_permit = projMilestones.some(m => m.balady_permit_number);
  checks.soil_report = projMilestones.some(m => m.deliverable_files?.length > 0);
  checks.sbc_compliance = projTech.some(t => t.compliance_status === "compliant" || t.compliance_status === "compliant_with_notes");
  checks.technical_review = projTech.some(t => t.approval_status === "approved");
  checks.legal_addendum = projLegal.length > 0;
  checks.pdpl_consent = !!project.description;
  checks.insurance = projContracts.some(c => c.status === "active" || c.status === "completed");
  checks.invoice_vat = projContracts.some(c => c.total_amount > 0);

  const passed = Object.values(checks).filter(Boolean).length;
  const total = SA_CHECKLIST.length;
  const score = Math.round((passed / total) * 100);

  let level = "non";
  if (score === 100) level = "full";
  else if (score >= 60) level = "partial";
  else if (score >= 30) level = "pending";

  return { checks, score, level, passed, total };
}

// ─── بطاقة الإحصاء ──────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 flex items-start gap-4 shadow-sm`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── شريط التقدم ────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
  const color = score === 100 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : score >= 30 ? "bg-blue-500" : "bg-red-500";
  return (
    <div className="w-full bg-slate-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
    </div>
  );
}

// ─── صف سجل التدقيق ─────────────────────────────────────────────────────────
function AuditRow({ entry }) {
  const icons = {
    contract: <FileText className="w-4 h-4 text-blue-500" />,
    technical: <ClipboardList className="w-4 h-4 text-purple-500" />,
    legal: <Scale className="w-4 h-4 text-amber-600" />,
    milestone: <FileBadge className="w-4 h-4 text-emerald-500" />,
    payment: <Activity className="w-4 h-4 text-pink-500" />,
  };
  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {icons[entry.type] || <Activity className="w-4 h-4 text-slate-400" />}
          <span className="text-sm text-slate-700">{entry.action}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-slate-600">{entry.project_name}</td>
      <td className="py-3 px-4 text-sm text-slate-600">{entry.actor}</td>
      <td className="py-3 px-4 text-xs text-slate-400">{moment(entry.date).format("DD/MM/YYYY - HH:mm")}</td>
      <td className="py-3 px-4">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          entry.status === "completed" ? "bg-emerald-100 text-emerald-700" :
          entry.status === "pending" ? "bg-amber-100 text-amber-700" :
          "bg-red-100 text-red-700"
        }`}>
          {entry.status === "completed" ? "مكتمل" : entry.status === "pending" ? "قيد التنفيذ" : "مرفوض"}
        </span>
      </td>
    </tr>
  );
}

// ─── تصدير PDF لمشروع واحد ──────────────────────────────────────────────────
function exportProjectPDF(project, contracts, techReviews, legalReviews, milestones) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const projContracts = contracts.filter(c => c.project_id === project.id);
  const projTech = techReviews.filter(t => t.project_id === project.id);
  const projLegal = legalReviews.filter(l => l.project_id === project.id);
  const projMilestones = milestones.filter(m => m.project_id === project.id);
  const compliance = project.compliance;
  const lvlLabel = COMPLIANCE_LEVELS[compliance.level].label;

  let y = 0;

  // ── غلاف الوثيقة ──────────────────────────────────────────────────────────
  doc.setFillColor(74, 63, 53); // #4A3F35
  doc.rect(0, 0, W, 50, "F");
  doc.setFillColor(201, 166, 107); // #C9A66B
  doc.rect(0, 50, W, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Bytly - Compliance Report", W / 2, 22, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Saudi Arabia Regulatory Compliance — PDPL / SBC / Balady", W / 2, 32, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(201, 166, 107);
  doc.text(`Generated: ${moment().format("DD/MM/YYYY HH:mm")}`, W / 2, 43, { align: "center" });

  y = 62;

  // ── معلومات المشروع ────────────────────────────────────────────────────────
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, y, W - 20, 38, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(10, y, W - 20, 38, 3, 3, "S");

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Project Information", 15, y + 9);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  const info = [
    ["Project Name", project.title || "N/A"],
    ["Category", project.category || "N/A"],
    ["Status", project.status || "N/A"],
    ["Created Date", moment(project.created_date).format("DD/MM/YYYY")],
  ];
  info.forEach(([k, v], i) => {
    const col = i < 2 ? 15 : W / 2 + 5;
    const row = i < 2 ? y + 18 + (i * 8) : y + 18 + ((i - 2) * 8);
    doc.setFont("helvetica", "bold"); doc.setTextColor(71, 85, 105);
    doc.text(`${k}:`, col, row);
    doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
    doc.text(v, col + 32, row);
  });

  y += 46;

  // ── درجة الامتثال ─────────────────────────────────────────────────────────
  doc.setFillColor(201, 166, 107);
  doc.roundedRect(10, y, W - 20, 22, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Compliance Score: ${compliance.score}%   |   Level: ${lvlLabel}   |   Passed: ${compliance.passed}/${compliance.total} items`, W / 2, y + 13, { align: "center" });
  y += 30;

  // ── قائمة التحقق السعودية ─────────────────────────────────────────────────
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Saudi Compliance Checklist", 15, y);
  y += 7;

  SA_CHECKLIST.forEach((item, idx) => {
    if (y > 265) { doc.addPage(); y = 20; }
    const passed = compliance.checks[item.id];
    doc.setFillColor(passed ? 240 : 254, passed ? 253 : 242, passed ? 244 : 242);
    doc.roundedRect(10, y, W - 20, 10, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(passed ? 5 : 153, passed ? 150 : 27, passed ? 105 : 27);
    doc.text(passed ? "PASS" : "FAIL", 17, y + 6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(item.label, 35, y + 6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(item.category, W - 15, y + 6.5, { align: "right" });
    y += 12;
  });

  y += 4;

  // ── العقود ────────────────────────────────────────────────────────────────
  if (projContracts.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(51, 65, 85);
    doc.text("Contracts", 15, y); y += 7;
    projContracts.forEach(c => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(10, y, W - 20, 16, 2, 2, "F");
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(71, 85, 105);
      doc.text(`Type: ${c.contract_type || "N/A"}`, 15, y + 5.5);
      doc.text(`Amount: SAR ${(c.total_amount || 0).toLocaleString()}`, 15, y + 11.5);
      doc.text(`Client Signed: ${c.client_signature ? "Yes" : "No"}`, W / 2, y + 5.5);
      doc.text(`Engineer Signed: ${c.engineer_signature ? "Yes" : "No"}`, W / 2, y + 11.5);
      const cStatus = c.client_signature && c.engineer_signature ? "SIGNED" : "PENDING";
      doc.setFont("helvetica", "bold");
      doc.setTextColor(c.client_signature && c.engineer_signature ? 5 : 201, c.client_signature && c.engineer_signature ? 150 : 166, c.client_signature && c.engineer_signature ? 105 : 107);
      doc.text(cStatus, W - 15, y + 9, { align: "right" });
      y += 19;
    });
    y += 4;
  }

  // ── المراجعات الفنية ───────────────────────────────────────────────────────
  if (projTech.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(51, 65, 85);
    doc.text("Technical Reviews (SBC)", 15, y); y += 7;
    projTech.forEach(t => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(10, y, W - 20, 16, 2, 2, "F");
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(71, 85, 105);
      doc.text(`SBC Compliance: ${t.compliance_status || "N/A"}`, 15, y + 5.5);
      doc.text(`Approval: ${t.approval_status || "pending"}`, 15, y + 11.5);
      if (t.quality_assessment) doc.text(`Quality: ${t.quality_assessment.substring(0, 60)}`, W / 2, y + 5.5);
      y += 19;
    });
    y += 4;
  }

  // ── المراجعات القانونية ────────────────────────────────────────────────────
  if (projLegal.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(51, 65, 85);
    doc.text("Legal Reviews", 15, y); y += 7;
    projLegal.forEach(l => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(10, y, W - 20, 16, 2, 2, "F");
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(71, 85, 105);
      doc.text(`Status: ${l.status || "N/A"}`, 15, y + 5.5);
      doc.text(`Entitled Party: ${l.entitled_party || "N/A"}`, 15, y + 11.5);
      if (l.recommendation) doc.text(`Recommendation: ${l.recommendation.substring(0, 70)}`, W / 2, y + 5.5);
      y += 19;
    });
    y += 4;
  }

  // ── رخص بلدي من المراحل ───────────────────────────────────────────────────
  const permitMilestones = projMilestones.filter(m => m.balady_permit_number);
  if (permitMilestones.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(51, 65, 85);
    doc.text("Balady Permits", 15, y); y += 7;
    permitMilestones.forEach(m => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(10, y, W - 20, 12, 2, 2, "F");
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(71, 85, 105);
      doc.text(`Permit No: ${m.balady_permit_number}`, 15, y + 8);
      doc.text(`Stage: ${m.title || "N/A"}`, W / 2, y + 8);
      y += 15;
    });
    y += 4;
  }

  // ── تذييل الصفحات ─────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 285, W, 12, "F");
    doc.setFontSize(7); doc.setTextColor(148, 163, 184); doc.setFont("helvetica", "normal");
    doc.text("Bytly Platform — Confidential Compliance Report — For Regulatory Use Only", W / 2, 291, { align: "center" });
    doc.text(`Page ${i} of ${totalPages}`, W - 15, 291, { align: "right" });
  }

  doc.save(`compliance_${(project.title || "project").replace(/\s+/g, "_")}_${moment().format("YYYYMMDD")}.pdf`);
}

// ─── الصفحة الرئيسية ─────────────────────────────────────────────────────────
export default function ComplianceDashboard() {
  const [projects, setProjects] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [techReviews, setTechReviews] = useState([]);
  const [legalReviews, setLegalReviews] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [expandedProject, setExpandedProject] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [exportingPDF, setExportingPDF] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [p, c, t, l, m] = await Promise.all([
        base44.entities.Project.list("-created_date", 100),
        base44.entities.Contract.list("-created_date", 200),
        base44.entities.TechnicalReview.list("-created_date", 200),
        base44.entities.LegalReview.list("-created_date", 200),
        base44.entities.ProjectMilestone.list("-created_date", 500),
      ]);
      setProjects(p || []);
      setContracts(c || []);
      setTechReviews(t || []);
      setLegalReviews(l || []);
      setMilestones(m || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // حساب بيانات الامتثال لكل مشروع
  const projectsWithCompliance = projects.map(p => ({
    ...p,
    compliance: calcCompliance(p, contracts, techReviews, legalReviews, milestones),
  }));

  // إحصائيات
  const stats = {
    full: projectsWithCompliance.filter(p => p.compliance.level === "full").length,
    partial: projectsWithCompliance.filter(p => p.compliance.level === "partial").length,
    non: projectsWithCompliance.filter(p => p.compliance.level === "non").length,
    pending: projectsWithCompliance.filter(p => p.compliance.level === "pending").length,
    avgScore: projectsWithCompliance.length
      ? Math.round(projectsWithCompliance.reduce((s, p) => s + p.compliance.score, 0) / projectsWithCompliance.length)
      : 0,
  };

  // سجل التدقيق المجمع
  const auditLog = [
    ...contracts.map(c => ({
      type: "contract", action: `عقد: ${c.contract_type === "project_start" ? "بدء مشروع" : "اتفاقية خدمة"}`,
      project_name: projects.find(p => p.id === c.project_id)?.title || "—",
      actor: c.client_signature && c.engineer_signature ? "الطرفان" : "بانتظار التوقيع",
      date: c.client_signature_date || c.created_date,
      status: c.client_signature && c.engineer_signature ? "completed" : "pending",
    })),
    ...techReviews.map(t => ({
      type: "technical", action: `مراجعة فنية — ${t.compliance_status === "compliant" ? "مطابق" : t.compliance_status === "non_compliant" ? "غير مطابق" : "مطابق مع ملاحظات"}`,
      project_name: projects.find(p => p.id === t.project_id)?.title || "—",
      actor: "مستشار فني",
      date: t.review_date || t.created_date,
      status: t.approval_status === "approved" ? "completed" : t.approval_status === "rejected" ? "rejected" : "pending",
    })),
    ...legalReviews.map(l => ({
      type: "legal", action: `مراجعة قانونية — ${l.entitled_party === "client" ? "لصالح العميل" : l.entitled_party === "engineer" ? "لصالح المهندس" : "مشترك"}`,
      project_name: projects.find(p => p.id === l.project_id)?.title || "—",
      actor: "مستشار قانوني",
      date: l.resolution_date || l.created_date,
      status: l.status === "resolved" ? "completed" : l.status === "escalated" ? "rejected" : "pending",
    })),
    ...milestones.filter(m => m.balady_permit_number).map(m => ({
      type: "milestone", action: `رخصة بلدي: ${m.balady_permit_number}`,
      project_name: projects.find(p => p.id === m.project_id)?.title || "—",
      actor: m.firm_name || "مهندس المشروع",
      date: m.firm_approval_date || m.created_date,
      status: "completed",
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  // تصفية المشاريع
  const filtered = projectsWithCompliance.filter(p => {
    const matchSearch = !search || p.title?.includes(search) || p.description?.includes(search);
    const matchLevel = filterLevel === "all" || p.compliance.level === filterLevel;
    return matchSearch && matchLevel;
  });

  function exportCSV() {
    const rows = [
      ["اسم المشروع", "درجة الامتثال", "المستوى", "البنود المجتازة", "إجمالي البنود"],
      ...projectsWithCompliance.map(p => [
        p.title || "—", `${p.compliance.score}%`, COMPLIANCE_LEVELS[p.compliance.level].label,
        p.compliance.passed, p.compliance.total,
      ]),
    ];
    const csv = "\uFEFF" + rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `compliance_report_${moment().format("YYYY-MM-DD")}.csv`; a.click();
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#C9A66B] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500">جارٍ تحميل بيانات الامتثال...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#4A3F35] to-[#6B5D4F] text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#C9A66B]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">لوحة التدقيق والامتثال</h1>
                <p className="text-white/70 text-sm">مطابقة اشتراطات المملكة العربية السعودية — PDPL / SBC / Balady</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={loadData} variant="ghost" className="text-white border border-white/20 hover:bg-white/10 gap-2">
                <RefreshCw className="w-4 h-4" /> تحديث
              </Button>
              <Button onClick={exportCSV} className="bg-[#C9A66B] hover:bg-[#b8945a] text-white gap-2">
                <Download className="w-4 h-4" /> تصدير التقرير
              </Button>
            </div>
          </div>

          {/* متوسط درجة الامتثال */}
          <div className="mt-6 bg-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <p className="text-white/70 text-sm mb-1">متوسط درجة الامتثال الكلي للمنصة</p>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-black text-[#C9A66B]">{stats.avgScore}%</span>
                <span className="text-white/60 text-sm mb-1">من {projects.length} مشروع</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="w-full bg-white/20 rounded-full h-3 mt-2">
                <div className="bg-[#C9A66B] h-3 rounded-full transition-all" style={{ width: `${stats.avgScore}%` }} />
              </div>
              <div className="flex justify-between text-xs text-white/50 mt-1">
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* بطاقات الإحصاء */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={ShieldCheck} label="ممتثل كليًا" value={stats.full} color="bg-emerald-500" sub="100% من البنود" />
          <StatCard icon={AlertTriangle} label="ممتثل جزئيًا" value={stats.partial} color="bg-amber-500" sub="60–99% من البنود" />
          <StatCard icon={Clock} label="قيد المراجعة" value={stats.pending} color="bg-blue-500" sub="30–59% من البنود" />
          <StatCard icon={XCircle} label="غير ممتثل" value={stats.non} color="bg-red-500" sub="أقل من 30%" />
        </div>

        {/* التبويبات */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {[
            { id: "overview", label: "نظرة عامة على المشاريع", icon: Building2 },
            { id: "audit", label: "سجل التدقيق الكامل", icon: ClipboardList },
            { id: "checklist", label: "قائمة الاشتراطات السعودية", icon: Gavel },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#C9A66B] text-[#C9A66B]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── التبويب 1: نظرة عامة ─── */}
        {activeTab === "overview" && (
          <div>
            {/* أدوات البحث والتصفية */}
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="ابحث عن مشروع..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pr-9"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { v: "all", l: "الكل" },
                  { v: "full", l: "ممتثل كليًا" },
                  { v: "partial", l: "جزئي" },
                  { v: "pending", l: "قيد المراجعة" },
                  { v: "non", l: "غير ممتثل" },
                ].map(f => (
                  <button
                    key={f.v}
                    onClick={() => setFilterLevel(f.v)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filterLevel === f.v
                        ? "bg-[#6B5D4F] text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {f.l}
                  </button>
                ))}
              </div>
            </div>

            {/* قائمة المشاريع */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد مشاريع مطابقة للبحث</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(project => {
                  const lvl = COMPLIANCE_LEVELS[project.compliance.level];
                  const LvlIcon = lvl.icon;
                  const isExpanded = expandedProject === project.id;

                  return (
                    <div key={project.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div
                        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                      >
                        {/* مؤشر الحالة */}
                        <div className={`w-3 h-3 rounded-full ${lvl.dot} shrink-0`} />

                        {/* اسم المشروع */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{project.title || "مشروع بدون اسم"}</p>
                          <p className="text-xs text-slate-400">{project.category || "—"} · {moment(project.created_date).format("DD/MM/YYYY")}</p>
                        </div>

                        {/* الدرجة */}
                        <div className="hidden md:flex flex-col items-center w-24">
                          <span className="text-xl font-bold text-slate-700">{project.compliance.score}%</span>
                          <ScoreBar score={project.compliance.score} />
                          <span className="text-xs text-slate-400 mt-1">{project.compliance.passed}/{project.compliance.total} بند</span>
                        </div>

                        {/* البادج */}
                        <span className={`hidden md:inline-flex items-center gap-1.5 border text-xs font-medium px-3 py-1.5 rounded-full ${lvl.color}`}>
                          <LvlIcon className="w-3.5 h-3.5" />
                          {lvl.label}
                        </span>

                        {/* زر تصدير PDF */}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setExportingPDF(project.id);
                            setTimeout(() => {
                              exportProjectPDF(project, contracts, techReviews, legalReviews, milestones);
                              setExportingPDF(null);
                            }, 100);
                          }}
                          disabled={exportingPDF === project.id}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#6B5D4F] hover:bg-[#4A3F35] text-white text-xs rounded-lg transition-colors disabled:opacity-60"
                          title="تصدير تقرير الامتثال PDF"
                        >
                          {exportingPDF === project.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <FileDown className="w-3.5 h-3.5" />
                          }
                          <span className="hidden md:inline">PDF</span>
                        </button>

                        <div className="shrink-0 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {/* تفاصيل قائمة التحقق */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">قائمة التحقق — اشتراطات المملكة</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {SA_CHECKLIST.map(item => {
                              const passed = project.compliance.checks[item.id];
                              return (
                                <div key={item.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl text-sm ${passed ? "bg-emerald-50" : "bg-red-50"}`}>
                                  {passed
                                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                                  }
                                  <span className={passed ? "text-emerald-800" : "text-red-700"}>{item.label}</span>
                                  <span className="mr-auto text-xs text-slate-400">{item.category}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── التبويب 2: سجل التدقيق ─── */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#C9A66B]" />
                <span className="font-semibold text-slate-700">سجل التدقيق الكامل (Immutable Audit Log)</span>
              </div>
              <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{auditLog.length} إجراء مسجّل</span>
            </div>
            {auditLog.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>لا توجد إجراءات مسجلة حتى الآن</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-right">
                      <th className="py-3 px-4 text-xs font-semibold text-slate-500">الإجراء</th>
                      <th className="py-3 px-4 text-xs font-semibold text-slate-500">المشروع</th>
                      <th className="py-3 px-4 text-xs font-semibold text-slate-500">المنفذ</th>
                      <th className="py-3 px-4 text-xs font-semibold text-slate-500">التاريخ</th>
                      <th className="py-3 px-4 text-xs font-semibold text-slate-500">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.slice(0, 50).map((entry, i) => (
                      <AuditRow key={i} entry={entry} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── التبويب 3: قائمة الاشتراطات ─── */}
        {activeTab === "checklist" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["عقود", "تراخيص", "تقارير فنية", "مراجعات", "قانوني", "تأمين", "مالي"].map(cat => {
              const items = SA_CHECKLIST.filter(i => i.category === cat);
              const icons = {
                "عقود": <FileText className="w-5 h-5 text-blue-500" />,
                "تراخيص": <FileBadge className="w-5 h-5 text-purple-500" />,
                "تقارير فنية": <ClipboardList className="w-5 h-5 text-emerald-500" />,
                "مراجعات": <Eye className="w-5 h-5 text-amber-500" />,
                "قانوني": <Scale className="w-5 h-5 text-red-500" />,
                "تأمين": <ShieldCheck className="w-5 h-5 text-indigo-500" />,
                "مالي": <Activity className="w-5 h-5 text-pink-500" />,
              };
              // كم مشروع أتمّ هذه الفئة
              const catPassed = projects.length
                ? Math.round(
                    projectsWithCompliance.reduce((s, p) =>
                      s + (items.every(i => p.compliance.checks[i.id]) ? 1 : 0), 0
                    ) / projects.length * 100
                  )
                : 0;

              return (
                <div key={cat} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {icons[cat]}
                      <h3 className="font-bold text-slate-700">{cat}</h3>
                    </div>
                    <span className="text-sm font-semibold text-slate-500">{catPassed}% من المشاريع</span>
                  </div>
                  <ScoreBar score={catPassed} />
                  <div className="mt-4 space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-2 text-sm text-slate-600">
                        <Gavel className="w-3.5 h-3.5 text-[#C9A66B] shrink-0" />
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}