import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DollarSign, TrendingUp, Clock, Download, Search,
  FileText, CheckCircle, ArrowUpRight,
  ArrowDownRight, Wallet, BarChart2, Filter
} from "lucide-react";
import jsPDF from "jspdf";

const STATUS_CONFIG = {
  completed:       { label: "مكتمل",      color: "bg-green-100 text-green-700" },
  pending:         { label: "معلق",       color: "bg-amber-100 text-amber-700" },
  held_in_escrow:  { label: "محجوز",      color: "bg-blue-100 text-blue-700" },
  failed:          { label: "فشل",        color: "bg-red-100 text-red-700" },
  cancelled:       { label: "ملغي",       color: "bg-slate-100 text-slate-500" },
};

const TYPE_LABELS = {
  deposit:           "إيداع",
  withdrawal:        "سحب",
  escrow_hold:       "حجز ضمان",
  escrow_release:    "إفراج ضمان",
  commission:        "عمولة",
  refund:            "استرداد",
  withdrawal_request:"طلب سحب",
  withdrawal_completed:"سحب مكتمل",
  payment:           "دفعة",
};

export default function EngineerFinancialDashboard() {
  const [engineer, setEngineer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const [eng] = await base44.entities.Engineer.filter({ email: user.email });
      setEngineer(eng);
      if (!eng) return;

      const [txns, projs, miles] = await Promise.all([
        base44.entities.Transaction.filter({ user_email: user.email }, "-created_date", 100),
        base44.entities.Project.filter({ assigned_engineer_id: eng.id }, "-created_date", 50),
        base44.entities.ProjectMilestone.filter({ engineer_id: eng.id }, "-created_date", 100),
      ]);
      setTransactions(txns);
      setProjects(projs);
      setMilestones(miles);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTxns = transactions.filter((t) => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.description?.toLowerCase().includes(q) || t.reference_id?.toLowerCase().includes(q);
    }
    return true;
  });

  const totalEarned = transactions
    .filter(t => t.type === "escrow_release" || t.type === "payment")
    .reduce((s, t) => s + (t.net_amount || t.amount || 0), 0);

  const totalWithdrawn = transactions
    .filter(t => t.type === "withdrawal_completed" || t.type === "withdrawal")
    .reduce((s, t) => s + (t.amount || 0), 0);

  const monthlyEarnings = (() => {
    const now = new Date();
    return transactions
      .filter(t => {
        const d = new Date(t.created_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          && (t.type === "escrow_release" || t.type === "payment");
      })
      .reduce((s, t) => s + (t.net_amount || t.amount || 0), 0);
  })();

  const completedProjects = projects.filter(p => p.status === "completed").length;

  // ─── PDF Export ──────────────────────────────────────────────────────────────
  const exportInvoicePDF = (project) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFont("helvetica");

    // Header bar
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(212, 165, 116);
    doc.setFontSize(22);
    doc.text("INVOICE", 105, 18, { align: "center" });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text("Bytly - لمسة بيت", 105, 30, { align: "center" });

    // Engineer info
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    let y = 52;
    doc.setFontSize(13);
    doc.setTextColor(26, 26, 46);
    doc.text("Engineer Details", 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Name: ${engineer?.full_name || "-"}`, 14, y); y += 6;
    doc.text(`Email: ${engineer?.email || "-"}`, 14, y); y += 6;
    doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, 14, y); y += 10;

    // Project info
    doc.setFontSize(13);
    doc.setTextColor(26, 26, 46);
    doc.text("Project Details", 14, y); y += 7;
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Project: ${project.title}`, 14, y); y += 6;
    doc.text(`Status: ${project.status}`, 14, y); y += 6;
    doc.text(`Category: ${project.category || "-"}`, 14, y); y += 6;
    if (project.deadline) { doc.text(`Deadline: ${project.deadline}`, 14, y); y += 6; }

    // Financials table header
    y += 6;
    doc.setFillColor(240, 240, 245);
    doc.rect(14, y, 182, 8, "F");
    doc.setFontSize(10);
    doc.setTextColor(26, 26, 46);
    doc.text("Description", 18, y + 5.5);
    doc.text("Amount (SAR)", 155, y + 5.5);
    y += 12;

    const rows = [
      ["Escrow Amount", project.escrow_amount || 0],
      ["Platform Commission (15%)", project.platform_commission ? (project.escrow_amount || 0) * 0.15 : 0],
      ["Engineer Net Payment", project.engineer_payment || 0],
    ];

    rows.forEach(([label, val]) => {
      doc.setTextColor(60, 60, 60);
      doc.text(label, 18, y);
      doc.text(`${Number(val).toLocaleString("en-SA")}`, 175, y, { align: "right" });
      doc.setDrawColor(220, 220, 220);
      doc.line(14, y + 3, 196, y + 3);
      y += 10;
    });

    // Total
    y += 2;
    doc.setFillColor(212, 165, 116);
    doc.rect(14, y, 182, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text("Net Engineer Payment", 18, y + 7);
    doc.text(`${Number(project.engineer_payment || 0).toLocaleString("en-SA")} SAR`, 193, y + 7, { align: "right" });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text("Generated by Bytly Platform | info@mybytly.com", 105, 285, { align: "center" });

    doc.save(`invoice_${project.id?.slice(0, 8)}_${project.title?.replace(/\s/g, "_")}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]" />
      </div>
    );
  }

  if (!engineer) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500" dir="rtl">
        لا يوجد ملف مهندس مرتبط بحسابك.
      </div>
    );
  }

  const tabs = [
    { key: "overview",      label: "نظرة عامة",    icon: BarChart2 },
    { key: "invoices",      label: "الفواتير",      icon: FileText },
    { key: "transactions",  label: "المعاملات",     icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a1a2e] flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-[#C9A66B]" />
            اللوحة المالية
          </h1>
          <p className="text-slate-500 mt-1">مرحباً {engineer.full_name} — ملخص أرباحك ومعاملاتك</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "إجمالي الأرباح", value: totalEarned, icon: TrendingUp, color: "from-green-500 to-emerald-600", prefix: "ر.س" },
            { label: "الرصيد المتاح",  value: engineer.available_balance || 0, icon: Wallet, color: "from-[#1a1a2e] to-[#2d2d4e]", prefix: "ر.س" },
            { label: "قيد التحصيل",   value: engineer.pending_balance || 0, icon: Clock, color: "from-amber-500 to-amber-600", prefix: "ر.س" },
            { label: "أرباح الشهر",   value: monthlyEarnings, icon: BarChart2, color: "from-[#C9A66B] to-[#b8865a]", prefix: "ر.س" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="overflow-hidden">
                <div className={`bg-gradient-to-br ${s.color} p-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-xs mb-1">{s.label}</p>
                      <p className="text-white text-2xl font-bold">{Number(s.value).toLocaleString("ar-SA")}</p>
                      <p className="text-white/70 text-xs">{s.prefix}</p>
                    </div>
                    <s.icon className="w-10 h-10 text-white/30" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                activeTab === t.key
                  ? "bg-[#1a1a2e] text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Summary */}
            <Card>
              <CardHeader><CardTitle className="text-[#1a1a2e]">ملخص مالي</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "إجمالي المُحوَّل", value: totalWithdrawn, icon: ArrowUpRight, color: "text-red-500" },
                  { label: "إجمالي الأرباح", value: totalEarned, icon: ArrowDownRight, color: "text-green-500" },
                  { label: "المشاريع المكتملة", value: `${completedProjects} مشروع`, icon: CheckCircle, color: "text-blue-500", raw: true },
                  { label: "عدد المعاملات", value: `${transactions.length} معاملة`, icon: FileText, color: "text-purple-500", raw: true },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <row.icon className={`w-4 h-4 ${row.color}`} />
                      <span className="text-sm text-slate-600">{row.label}</span>
                    </div>
                    <span className="font-semibold text-[#1a1a2e]">
                      {row.raw ? row.value : `${Number(row.value).toLocaleString("ar-SA")} ر.س`}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader><CardTitle className="text-[#1a1a2e]">آخر المعاملات</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {transactions.slice(0, 6).map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{TYPE_LABELS[t.type] || t.type}</p>
                      <p className="text-xs text-slate-400">{new Date(t.created_date).toLocaleDateString("ar-SA")}</p>
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-bold ${t.type?.includes("withdrawal") ? "text-red-500" : "text-green-600"}`}>
                        {t.type?.includes("withdrawal") ? "-" : "+"}{Number(t.amount || 0).toLocaleString("ar-SA")} ر.س
                      </p>
                      <Badge className={`text-xs ${STATUS_CONFIG[t.status]?.color || "bg-slate-100 text-slate-500"}`}>
                        {STATUS_CONFIG[t.status]?.label || t.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4">لا توجد معاملات بعد</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Invoices Tab */}
        {activeTab === "invoices" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{projects.length} مشروع</p>
            </div>
            {projects.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <FileText className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <p>لا توجد فواتير بعد</p>
              </div>
            ) : (
              projects.map((p, idx) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-[#1a1a2e]">{p.title}</h3>
                            <Badge className={STATUS_CONFIG[p.status]?.color || "bg-slate-100 text-slate-500"}>
                              {STATUS_CONFIG[p.status]?.label || p.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-slate-400 text-xs">المبلغ المحجوز</p>
                              <p className="font-medium">{Number(p.escrow_amount || 0).toLocaleString("ar-SA")} ر.س</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs">صافي الاستحقاق</p>
                              <p className="font-medium text-green-600">{Number(p.engineer_payment || 0).toLocaleString("ar-SA")} ر.س</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs">عمولة المنصة</p>
                              <p className="font-medium text-amber-600">{p.platform_commission || 15}%</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs">حالة الدفع</p>
                              <p className="font-medium capitalize">{p.payment_status || "—"}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => exportInvoicePDF(p)}
                          className="bg-[#1a1a2e] hover:bg-[#C9A66B] text-white gap-2 shrink-0"
                          size="sm"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-slate-500 flex items-center gap-1"><Filter className="w-3 h-3" />النوع:</span>
                {["all", "payment", "escrow_release", "withdrawal", "withdrawal_completed"].map((v) => (
                  <button key={v} onClick={() => setTypeFilter(v)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${typeFilter === v ? "bg-[#1a1a2e] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {v === "all" ? "الكل" : TYPE_LABELS[v] || v}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-sm text-slate-500">{filteredTxns.length} معاملة</p>

            {filteredTxns.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Wallet className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <p>لا توجد معاملات مطابقة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTxns.map((t, idx) => (
                  <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type?.includes("withdrawal") ? "bg-red-50" : "bg-green-50"}`}>
                              {t.type?.includes("withdrawal")
                                ? <ArrowUpRight className="w-5 h-5 text-red-500" />
                                : <ArrowDownRight className="w-5 h-5 text-green-500" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-slate-800">{TYPE_LABELS[t.type] || t.type}</p>
                              {t.description && <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>}
                              <p className="text-xs text-slate-400">{new Date(t.created_date).toLocaleString("ar-SA")}</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className={`font-bold text-base ${t.type?.includes("withdrawal") ? "text-red-500" : "text-green-600"}`}>
                              {t.type?.includes("withdrawal") ? "-" : "+"}{Number(t.amount || 0).toLocaleString("ar-SA")} ر.س
                            </p>
                            {t.commission_amount > 0 && (
                              <p className="text-xs text-amber-500">عمولة: {Number(t.commission_amount).toLocaleString("ar-SA")} ر.س</p>
                            )}
                            <Badge className={`text-xs mt-1 ${STATUS_CONFIG[t.status]?.color || "bg-slate-100 text-slate-500"}`}>
                              {STATUS_CONFIG[t.status]?.label || t.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}