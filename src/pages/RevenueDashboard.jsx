import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  TrendingUp, DollarSign, RefreshCw, Calendar, Download,
  Percent, CreditCard, Briefcase, BarChart3, PieChart as PieIcon, Loader2
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import moment from "moment";

const formatSAR = (n) =>
  new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n || 0);

const fmtNum = (n) => (n || 0).toLocaleString("ar-SA");

// ── KPI Card ────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon: Icon, color = "#C9A66B", trend, loading }) {
  const up = trend === "up";
  return (
    <Card className="border-r-4 hover:shadow-md transition-shadow" style={{ borderColor: color }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 mb-1 truncate">{title}</p>
            {loading ? (
              <div className="h-7 w-28 bg-slate-100 rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-[#4A3F35] leading-tight">{value}</p>
            )}
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="p-2 rounded-lg" style={{ backgroundColor: color + "1A" }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const SOURCE_LABELS = {
  subscription: "اشتراكات",
  project_milestone: "عمولات المشاريع",
  design_purchase: "عمولات التصاميم",
};

const SOURCE_COLORS = {
  subscription: "#C9A66B",
  project_milestone: "#3B82F6",
  design_purchase: "#22C55E",
};

export default function RevenueDashboard() {
  const [revenues, setRevenues] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Date filter state
  const today = moment().format("YYYY-MM-DD");
  const monthAgo = moment().subtract(30, "days").format("YYYY-MM-DD");
  const [dateFrom, setDateFrom] = useState(monthAgo);
  const [dateTo, setDateTo] = useState(today);
  const [activePreset, setActivePreset] = useState("30d");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [revs, txns] = await Promise.all([
        base44.entities.PlatformRevenue.list("-created_date", 500),
        base44.entities.Transaction.filter(
          { user_type: "platform" },
          "-created_date",
          500
        ),
      ]);
      setRevenues(revs || []);
      setTransactions(txns || []);
    } catch (error) {
      console.error("Error loading revenue data:", error);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Filter data by date range ────────────────────────────────────────
  const filteredRevenues = useMemo(() => {
    const from = dateFrom ? moment(dateFrom).startOf("day") : null;
    const to = dateTo ? moment(dateTo).endOf("day") : null;
    return revenues.filter((r) => {
      const d = moment(r.payment_date || r.created_date);
      if (from && d.isBefore(from)) return false;
      if (to && d.isAfter(to)) return false;
      return true;
    });
  }, [revenues, dateFrom, dateTo]);

  const filteredTransactions = useMemo(() => {
    const from = dateFrom ? moment(dateFrom).startOf("day") : null;
    const to = dateTo ? moment(dateTo).endOf("day") : null;
    return transactions.filter((t) => {
      const d = moment(t.created_date);
      if (from && d.isBefore(from)) return false;
      if (to && d.isAfter(to)) return false;
      return true;
    });
  }, [transactions, dateFrom, dateTo]);

  // ── Compute metrics ──────────────────────────────────────────────────
  const metrics = useMemo(() => {
    // Subscription revenue from PlatformRevenue where source_type = "subscription"
    const subRevs = filteredRevenues.filter((r) => r.source_type === "subscription");
    const subscriptionTotal = subRevs.reduce((s, r) => s + (r.commission_amount || 0), 0);
    const subscriptionCount = subRevs.length;

    // Project commission revenue from PlatformRevenue where source_type = "project_milestone"
    const projRevs = filteredRevenues.filter((r) => r.source_type === "project_milestone");
    const projectCommissionTotal = projRevs.reduce((s, r) => s + (r.commission_amount || 0), 0);
    const projectCount = projRevs.length;

    // Design purchase commissions
    const designRevs = filteredRevenues.filter((r) => r.source_type === "design_purchase");
    const designCommissionTotal = designRevs.reduce((s, r) => s + (r.commission_amount || 0), 0);
    const designCount = designRevs.length;

    // Platform transactions (additional subscription payment records)
    const platformSubTxns = filteredTransactions.filter((t) => t.type === "subscription" || t.type === "commission");
    const txnCommissionTotal = platformSubTxns
      .filter((t) => t.type === "commission")
      .reduce((s, t) => s + (t.commission_amount || t.net_amount || t.amount || 0), 0);

    const totalRevenue = subscriptionTotal + projectCommissionTotal + designCommissionTotal;
    const totalCount = subscriptionCount + projectCount + designCount;

    // Average commission rate
    const allWithRate = filteredRevenues.filter((r) => r.commission_rate);
    const avgRate =
      allWithRate.length > 0
        ? allWithRate.reduce((s, r) => s + (r.commission_rate || 0), 0) / allWithRate.length
        : 0;

    // Total transaction volume (gross amounts processed)
    const grossVolume = filteredRevenues.reduce((s, r) => s + (r.total_amount || 0), 0);

    return {
      subscriptionTotal,
      subscriptionCount,
      projectCommissionTotal,
      projectCount,
      designCommissionTotal,
      designCount,
      totalRevenue,
      totalCount,
      avgRate,
      grossVolume,
      txnCommissionTotal,
    };
  }, [filteredRevenues, filteredTransactions]);

  // ── Chart data: daily revenue trend ───────────────────────────────────
  const chartData = useMemo(() => {
    const from = dateFrom ? moment(dateFrom) : moment().subtract(30, "days");
    const to = dateTo ? moment(dateTo) : moment();
    const days = Math.max(1, to.diff(from, "days") + 1);

    const dailyMap = {};
    for (let i = 0; i < days; i++) {
      const day = moment(from).add(i, "days").format("YYYY-MM-DD");
      dailyMap[day] = { date: day, subscription: 0, project: 0, design: 0, total: 0 };
    }

    filteredRevenues.forEach((r) => {
      const day = moment(r.payment_date || r.created_date).format("YYYY-MM-DD");
      if (dailyMap[day]) {
        const amt = r.commission_amount || 0;
        if (r.source_type === "subscription") dailyMap[day].subscription += amt;
        else if (r.source_type === "project_milestone") dailyMap[day].project += amt;
        else if (r.source_type === "design_purchase") dailyMap[day].design += amt;
        dailyMap[day].total += amt;
      }
    });

    return Object.values(dailyMap).map((d) => ({
      ...d,
      label: moment(d.date).format("DD/MM"),
    }));
  }, [filteredRevenues, dateFrom, dateTo]);

  // ── Pie chart data: revenue by source ────────────────────────────────
  const pieData = useMemo(() => {
    const data = [];
    if (metrics.subscriptionTotal > 0)
      data.push({ name: "اشتراكات", value: metrics.subscriptionTotal, color: SOURCE_COLORS.subscription });
    if (metrics.projectCommissionTotal > 0)
      data.push({ name: "عمولات المشاريع", value: metrics.projectCommissionTotal, color: SOURCE_COLORS.project_milestone });
    if (metrics.designCommissionTotal > 0)
      data.push({ name: "عمولات التصاميم", value: metrics.designCommissionTotal, color: SOURCE_COLORS.design_purchase });
    return data.length > 0 ? data : [{ name: "لا توجد بيانات", value: 1, color: "#E2E8F0" }];
  }, [metrics]);

  // ── Table data: recent revenue records ───────────────────────────────
  const tableData = useMemo(() => {
    return [...filteredRevenues]
      .sort((a, b) => moment(b.payment_date || b.created_date).diff(moment(a.payment_date || a.created_date)))
      .slice(0, 50);
  }, [filteredRevenues]);

  // ── Preset handlers ──────────────────────────────────────────────────
  const applyPreset = (preset) => {
    setActivePreset(preset);
    const end = moment().format("YYYY-MM-DD");
    let start;
    switch (preset) {
      case "7d": start = moment().subtract(6, "days").format("YYYY-MM-DD"); break;
      case "30d": start = moment().subtract(29, "days").format("YYYY-MM-DD"); break;
      case "90d": start = moment().subtract(89, "days").format("YYYY-MM-DD"); break;
      case "1y": start = moment().subtract(1, "year").format("YYYY-MM-DD"); break;
      default: return;
    }
    setDateFrom(start);
    setDateTo(end);
  };

  const handleDateChange = (field, value) => {
    setActivePreset(null);
    if (field === "from") setDateFrom(value);
    else setDateTo(value);
  };

  const exportCSV = () => {
    const headers = ["التاريخ", "نوع المصدر", "المبلغ الإجمالي", "نسبة العمولة", "قيمة العمولة", "الحالة", "الوصف"];
    const rows = filteredRevenues.map((r) => [
      moment(r.payment_date || r.created_date).format("YYYY-MM-DD HH:mm"),
      SOURCE_LABELS[r.source_type] || r.source_type || "-",
      r.total_amount || 0,
      r.commission_rate || 0,
      r.commission_amount || 0,
      r.status || "-",
      (r.description || "").replace(/"/g, "'"),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-report-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#4A3F35] flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-[#C9A66B]" />
            لوحة إيرادات المنصة
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            إجمالي الإيرادات من الاشتراكات والعمولات — آخر تحديث:{" "}
            {lastRefresh.toLocaleTimeString("ar-SA")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={loading}>
            <Download className="w-4 h-4 ml-1" />
            تصدير CSV
          </Button>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ml-1 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>
      </div>

      {/* ── Date Filter Bar ─────────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                الفترة:
              </span>
              {[
                { key: "7d", label: "7 أيام" },
                { key: "30d", label: "30 يوم" },
                { key: "90d", label: "90 يوم" },
                { key: "1y", label: "سنة" },
              ].map((p) => (
                <Button
                  key={p.key}
                  size="sm"
                  variant={activePreset === p.key ? "default" : "outline"}
                  className={
                    activePreset === p.key
                      ? "bg-[#6B5D4F] text-white hover:bg-[#4A3F35]"
                      : ""
                  }
                  onClick={() => applyPreset(p.key)}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            {/* Custom date range */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <label className="text-xs text-slate-500">من</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => handleDateChange("from", e.target.value)}
                  className="w-40 h-9 text-sm"
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-slate-500">إلى</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => handleDateChange("to", e.target.value)}
                  className="w-40 h-9 text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="إجمالي الإيرادات"
          value={formatSAR(metrics.totalRevenue)}
          sub={`${metrics.totalCount} معاملة`}
          icon={DollarSign}
          color="#C9A66B"
          loading={loading}
        />
        <KpiCard
          title="إيرادات الاشتراكات"
          value={formatSAR(metrics.subscriptionTotal)}
          sub={`${metrics.subscriptionCount} اشتراك`}
          icon={CreditCard}
          color="#3B82F6"
          loading={loading}
        />
        <KpiCard
          title="عمولات المشاريع"
          value={formatSAR(metrics.projectCommissionTotal)}
          sub={`${metrics.projectCount} مشروع مكتمل`}
          icon={Briefcase}
          color="#22C55E"
          loading={loading}
        />
        <KpiCard
          title="إجمالي الحجم المالي"
          value={formatSAR(metrics.grossVolume)}
          sub={`متوسط العمولة: ${metrics.avgRate.toFixed(1)}%`}
          icon={BarChart3}
          color="#8B5CF6"
          loading={loading}
        />
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue trend chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-[#4A3F35]">
              <TrendingUp className="w-4 h-4 text-[#C9A66B]" />
              اتجاه الإيرادات اليومية
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-72 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
                لا توجد بيانات في هذه الفترة
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" tickFormatter={(v) => v.toLocaleString("ar-SA")} />
                  <Tooltip
                    formatter={(value) => formatSAR(value)}
                    contentStyle={{ direction: "rtl", fontSize: "12px", borderRadius: "8px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Area
                    type="monotone"
                    dataKey="subscription"
                    name="اشتراكات"
                    stroke="#3B82F6"
                    fill="url(#subGrad)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="project"
                    name="عمولات المشاريع"
                    stroke="#22C55E"
                    fill="url(#projGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie chart: revenue by source */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-[#4A3F35]">
              <PieIcon className="w-4 h-4 text-[#C9A66B]" />
              توزيع الإيرادات حسب المصدر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-72 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatSAR(value)}
                    contentStyle={{ direction: "rtl", fontSize: "12px", borderRadius: "8px" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px" }}
                    formatter={(value) => value}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Breakdown bar chart ─────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-[#4A3F35]">
            <BarChart3 className="w-4 h-4 text-[#C9A66B]" />
            مقارنة مصادر الإيرادات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={[
                  { name: "اشتراكات", amount: metrics.subscriptionTotal, count: metrics.subscriptionCount },
                  { name: "عمولات المشاريع", amount: metrics.projectCommissionTotal, count: metrics.projectCount },
                  { name: "عمولات التصاميم", amount: metrics.designCommissionTotal, count: metrics.designCount },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" tickFormatter={(v) => v.toLocaleString("ar-SA")} />
                <Tooltip
                  formatter={(value) => formatSAR(value)}
                  contentStyle={{ direction: "rtl", fontSize: "12px", borderRadius: "8px" }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  <Cell fill="#3B82F6" />
                  <Cell fill="#22C55E" />
                  <Cell fill="#C9A66B" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Detailed Table ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-[#4A3F35]">
            <Percent className="w-4 h-4 text-[#C9A66B]" />
            تفاصيل سجلات الإيرادات
            <Badge variant="secondary" className="mr-2 text-xs">
              {filteredRevenues.length} سجل
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : tableData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
              لا توجد سجلات في هذه الفترة
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs">
                    <th className="text-right py-3 px-2 font-medium">التاريخ</th>
                    <th className="text-right py-3 px-2 font-medium">المصدر</th>
                    <th className="text-right py-3 px-2 font-medium">المبلغ الإجمالي</th>
                    <th className="text-right py-3 px-2 font-medium">نسبة العمولة</th>
                    <th className="text-right py-3 px-2 font-medium">قيمة العمولة</th>
                    <th className="text-right py-3 px-2 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2.5 px-2 text-slate-600 text-xs whitespace-nowrap">
                        {moment(r.payment_date || r.created_date).format("YYYY-MM-DD HH:mm")}
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: (SOURCE_COLORS[r.source_type] || "#94A3B8") + "1A",
                            color: SOURCE_COLORS[r.source_type] || "#64748B",
                          }}
                        >
                          {SOURCE_LABELS[r.source_type] || r.source_type || "-"}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-700 font-medium">
                        {formatSAR(r.total_amount)}
                      </td>
                      <td className="py-2.5 px-2 text-slate-500">
                        {r.commission_rate ? `${r.commission_rate}%` : "-"}
                      </td>
                      <td className="py-2.5 px-2 text-[#4A3F35] font-bold">
                        {formatSAR(r.commission_amount)}
                      </td>
                      <td className="py-2.5 px-2">
                        <Badge
                          variant="outline"
                          className={
                            r.status === "collected"
                              ? "border-green-200 text-green-700 bg-green-50"
                              : r.status === "pending"
                              ? "border-amber-200 text-amber-700 bg-amber-50"
                              : "border-red-200 text-red-700 bg-red-50"
                          }
                        >
                          {r.status === "collected" ? "محصلة" : r.status === "pending" ? "معلقة" : r.status === "refunded" ? "مسترجعة" : r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}