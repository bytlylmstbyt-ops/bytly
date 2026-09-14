import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import { TrendingUp, Users, Wallet, Loader2, Search,
  BarChart3, PieChartIcon, Activity, Building2, HandCoins,
  ArrowRightLeft, Landmark, CreditCard, Percent, ShieldCheck
} from "lucide-react";

const COLORS = ["#6B5D4F", "#C9A66B", "#E5D4B8", "#4A3F35", "#A89F91", "#8B7355"];

// ── Format helpers ──────────────────────────────────────────────────────────
const formatSAR = (n) => (n || 0).toLocaleString("ar-SA");
const fmtPct = (n) => (n || 0).toFixed(1);

export default function FinancialReports() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Summary metrics
  const [summary, setSummary] = useState({
    totalTransactions: 0,
    totalVolume: 0,
    totalCommissions: 0,
    totalEscrowHeld: 0,
    totalEngineerWallets: 0,
    totalClientWallets: 0,
    commissionRate: 15
  });

  // Charts data
  const [commissionsByMonth, setCommissionsByMonth] = useState([]);
  const [revenueBySource, setRevenueBySource] = useState([]);
  const [monthlyVolume, setMonthlyVolume] = useState([]);
  const [escrowPerProject, setEscrowPerProject] = useState([]);

  // Tables data
  const [engineers, setEngineers] = useState([]);
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [platformRevenue, setPlatformRevenue] = useState([]);

  // Search/filter
  const [searchEng, setSearchEng] = useState("");
  const [searchClient, setSearchClient] = useState("");
  const [searchTx, setSearchTx] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    if (currentUser.role !== "admin") { setLoading(false); return; }

    const [engineersList, clientsList, txList, prList, projectsList] = await Promise.all([
      base44.entities.Engineer.list(),
      base44.entities.Client.list(),
      base44.entities.Transaction.list("-created_date"),
      base44.entities.PlatformRevenue.list("-created_date"),
      base44.entities.Project.list()
    ]);

    // ── Summary calculations ─────────────────────────────────────────
    const totalTx = txList.length;
    const totalVolume = txList.reduce((s, t) => s + (t.amount || 0), 0);
    const totalCommissions = prList
      .filter(r => r.status === "collected")
      .reduce((s, r) => s + (r.commission_amount || 0), 0);
    const totalEscrow = projectsList
      .filter(p => p.escrow_status === "held")
      .reduce((s, p) => s + (p.escrow_amount || 0), 0);
    const engWallets = engineersList.reduce((s, e) => s + ((e.wallet_balance || 0) + (e.available_balance || 0) + (e.pending_balance || 0)), 0);
    const clientWallets = clientsList.reduce((s, c) => s + (c.wallet_balance || 0), 0);

    setSummary({
      totalTransactions: totalTx,
      totalVolume,
      totalCommissions,
      totalEscrowHeld: totalEscrow,
      totalEngineerWallets: engWallets,
      totalClientWallets: clientWallets,
      commissionRate: 15
    });

    // ── Monthly commission chart ──────────────────────────────────────
    const monthMap = {};
    prList.filter(r => r.status === "collected").forEach(r => {
      if (!r.payment_date) return;
      const d = new Date(r.payment_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = (monthMap[key] || 0) + (r.commission_amount || 0);
    });
    const monthsOrdered = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, amount]) => ({ month, amount }));
    setCommissionsByMonth(monthsOrdered);

    // ── Revenue by source pie ─────────────────────────────────────────
    const sourceMap = {};
    prList.filter(r => r.status === "collected").forEach(r => {
      const src = r.source_type === "project_milestone" ? "مراحل المشاريع"
        : r.source_type === "design_purchase" ? "شراء تصاميم"
        : r.source_type === "subscription" ? "اشتراكات" : "أخرى";
      sourceMap[src] = (sourceMap[src] || 0) + (r.commission_amount || 0);
    });
    setRevenueBySource(Object.entries(sourceMap).map(([name, value]) => ({ name, value })));

    // ── Monthly volume line chart ─────────────────────────────────────
    const volMap = {};
    txList.forEach(t => {
      const d = new Date(t.created_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      volMap[key] = (volMap[key] || 0) + (t.amount || 0);
    });
    const volOrdered = Object.entries(volMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, amount]) => ({ month, amount }));
    setMonthlyVolume(volOrdered);

    // ── Escrow per project (held + released + refunded) ───────────────
    const escrowData = projectsList
      .filter(p => (p.escrow_amount || 0) > 0)
      .sort((a, b) => (b.escrow_amount || 0) - (a.escrow_amount || 0))
      .slice(0, 15)
      .map(p => ({
        title: (p.title || "بدون عنوان").length > 18 ? (p.title.slice(0, 16) + "…") : (p.title || "بدون عنوان"),
        held: p.escrow_status === "held" ? (p.escrow_amount || 0) : 0,
        released: p.escrow_status === "released" ? (p.escrow_amount || 0) : 0,
        refunded: p.escrow_status === "refunded" ? (p.escrow_amount || 0) : 0,
        status: p.escrow_status,
        amount: p.escrow_amount || 0,
      }));
    setEscrowPerProject(escrowData);

    // ── Tables ────────────────────────────────────────────────────────
    setEngineers(engineersList.sort((a, b) => ((b.wallet_balance || 0) + (b.available_balance || 0)) - ((a.wallet_balance || 0) + (a.available_balance || 0))));
    setClients(clientsList.sort((a, b) => (b.wallet_balance || 0) - (a.wallet_balance || 0)));
    setTransactions(txList.slice(0, 100));
    setPlatformRevenue(prList);

    setLoading(false);
  };

  const filteredEngineers = engineers.filter(e =>
    !searchEng || e.full_name?.includes(searchEng) || e.email?.includes(searchEng)
  );
  const filteredClients = clients.filter(c =>
    !searchClient || c.full_name?.includes(searchClient) || c.email?.includes(searchClient)
  );
  const filteredTx = transactions.filter(t =>
    !searchTx || t.user_email?.includes(searchTx) || t.type?.includes(searchTx) || t.description?.includes(searchTx)
  );

  const txTypeLabels = {
    deposit: "إيداع", withdrawal: "سحب", escrow_hold: "حجز ضمان",
    escrow_release: "تحرير ضمان", commission: "عمولة", refund: "استرداد",
    withdrawal_request: "طلب سحب", withdrawal_completed: "سحب مكتمل",
    subscription: "اشتراك", payment: "دفع"
  };
  const txTypeColors = {
    deposit: "bg-green-100 text-green-700", withdrawal: "bg-red-100 text-red-700",
    escrow_hold: "bg-amber-100 text-amber-700", escrow_release: "bg-blue-100 text-blue-700",
    commission: "bg-purple-100 text-purple-700", refund: "bg-gray-100 text-gray-700",
    withdrawal_request: "bg-orange-100 text-orange-700", withdrawal_completed: "bg-teal-100 text-teal-700",
    subscription: "bg-indigo-100 text-indigo-700", payment: "bg-cyan-100 text-cyan-700"
  };

  // ── Custom tooltip for charts ──────────────────────────────────────
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white shadow-xl border rounded-xl p-3">
        <p className="text-sm font-bold text-[#4A3F35]">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatSAR(entry.value)} ريال
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500" dir="rtl">
        <Card className="max-w-md text-center p-8">
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
          <p>لا تملك صلاحية الوصول للتقارير المالية</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-6 px-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a1a2e]">التقارير المالية</h1>
              <p className="text-sm text-slate-500">نظرة شاملة على العمليات المالية وحالة المحافظ الإلكترونية</p>
            </div>
          </div>
        </motion.div>

        {/* ── Top Summary Cards ──────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: ArrowRightLeft, label: "إجمالي العمليات", value: summary.totalTransactions, color: "from-blue-500 to-blue-600", bg: "bg-blue-50", text: "text-blue-600" },
              { icon: Landmark, label: "حجم التعاملات", value: formatSAR(summary.totalVolume) + " ر.س", color: "from-indigo-500 to-indigo-600", bg: "bg-indigo-50", text: "text-indigo-600" },
              { icon: Percent, label: "العمولات المحصلة", value: formatSAR(summary.totalCommissions) + " ر.س", color: "from-purple-500 to-purple-600", bg: "bg-purple-50", text: "text-purple-600" },
              { icon: HandCoins, label: "محتجز في الضمان", value: formatSAR(summary.totalEscrowHeld) + " ر.س", color: "from-amber-500 to-amber-600", bg: "bg-amber-50", text: "text-amber-600" },
              { icon: Wallet, label: "محافظ المهندسين", value: formatSAR(summary.totalEngineerWallets) + " ر.س", color: "from-green-500 to-green-600", bg: "bg-green-50", text: "text-green-600" },
              { icon: CreditCard, label: "محافظ العملاء", value: formatSAR(summary.totalClientWallets) + " ر.س", color: "from-teal-500 to-teal-600", bg: "bg-teal-50", text: "text-teal-600" }
            ].map((card, i) => (
              <Card key={i} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                      <card.icon className={`w-5 h-5 ${card.text}`} />
                    </div>
                    <Badge variant="secondary" className={`${card.bg} ${card.text} text-xs`}>{card.label}</Badge>
                  </div>
                  <p className="text-sm md:text-lg font-bold text-[#1a1a2e] leading-tight">{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* ── Charts Row ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Commissions Bar Chart */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  العمولات الشهرية
                </CardTitle>
              </CardHeader>
              <CardContent>
                {commissionsByMonth.length === 0 ? (
                  <p className="text-center py-12 text-slate-400">لا توجد بيانات</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={commissionsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" name="العمولات" fill="#C9A66B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Revenue by Source Pie */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChartIcon className="w-5 h-5 text-amber-600" />
                  توزيع الإيرادات حسب المصدر
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueBySource.length === 0 ? (
                  <p className="text-center py-12 text-slate-400">لا توجد بيانات</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={revenueBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {revenueBySource.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* ── Monthly Volume Line Chart ──────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="w-5 h-5 text-blue-600" />
                حجم التعاملات الشهرية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyVolume.length === 0 ? (
                <p className="text-center py-12 text-slate-400">لا توجد بيانات</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyVolume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="amount" name="حجم التعاملات" stroke="#6B5D4F" strokeWidth={2} dot={{ fill: "#C9A66B", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Escrow per Project ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <HandCoins className="w-5 h-5 text-amber-600" />
                مبالغ الضمان المحجوزة لكل مشروع
                <Badge className="bg-amber-50 text-amber-700">{escrowPerProject.length} مشروع</Badge>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">متابعة الالتزامات المالية: المبالغ المحجوزة (برتقالي)، المُحرّرة (أخضر)، والمستردة (رمادي) لكل مشروع</p>
            </CardHeader>
            <CardContent>
              {escrowPerProject.length === 0 ? (
                <p className="text-center py-12 text-slate-400">لا توجد مبالغ ضمان مسجلة بعد</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={escrowPerProject} layout="vertical" margin={{ left: 20, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => formatSAR(v)} />
                      <YAxis type="category" dataKey="title" tick={{ fontSize: 11 }} width={130} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="held" name="محجوز" stackId="e" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="released" name="مُحرّر" stackId="e" fill="#16a34a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="refunded" name="مسترد" stackId="e" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="overflow-x-auto mt-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b text-slate-500">
                          <th className="text-right py-2 px-2">المشروع</th>
                          <th className="text-right py-2 px-2">حالة الضمان</th>
                          <th className="text-right py-2 px-2">المبلغ</th>
                          <th className="text-right py-2 px-2">نسبة من الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {escrowPerProject.map((p, i) => {
                          const pct = summary.totalEscrowHeld > 0 && p.status === "held"
                            ? (p.amount / summary.totalEscrowHeld) * 100 : 0;
                          const statusLabel = p.status === "held" ? "محجوز" : p.status === "released" ? "مُحرّر" : p.status === "refunded" ? "مسترد" : "لا يوجد";
                          const statusColor = p.status === "held" ? "bg-amber-100 text-amber-700" : p.status === "released" ? "bg-green-100 text-green-700" : p.status === "refunded" ? "bg-gray-100 text-gray-700" : "bg-slate-100 text-slate-500";
                          return (
                            <tr key={i} className="border-b hover:bg-slate-50 transition-colors">
                              <td className="py-2 px-2 font-medium text-[#1a1a2e]">{p.title}</td>
                              <td className="py-2 px-2"><Badge className={statusColor}>{statusLabel}</Badge></td>
                              <td className="py-2 px-2 font-bold text-amber-700">{formatSAR(p.amount)} ر.س</td>
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-2">
                                  <Progress value={pct} className="h-2 w-20" />
                                  <span className="text-slate-500">{fmtPct(pct)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Tabs: Wallets & Transactions ───────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Tabs defaultValue="engineer-wallets">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="engineer-wallets" className="gap-1.5"><Users className="w-4 h-4" /> محافظ المهندسين</TabsTrigger>
              <TabsTrigger value="client-wallets" className="gap-1.5"><Building2 className="w-4 h-4" /> محافظ العملاء</TabsTrigger>
              <TabsTrigger value="transactions" className="gap-1.5"><ArrowRightLeft className="w-4 h-4" /> سجل العمليات</TabsTrigger>
              <TabsTrigger value="commissions" className="gap-1.5"><Percent className="w-4 h-4" /> سجل العمولات</TabsTrigger>
            </TabsList>

            {/* ── Engineer Wallets ───────────────────────────────────── */}
            <TabsContent value="engineer-wallets">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-green-600" />
                      أرصدة المهندسين
                      <Badge className="bg-green-50 text-green-700">{filteredEngineers.length} مهندس</Badge>
                    </CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input placeholder="بحث..." value={searchEng} onChange={e => setSearchEng(e.target.value)} className="pr-9 text-sm" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-slate-500">
                          <th className="text-right py-3 px-2">المهندس</th>
                          <th className="text-right py-3 px-2">المدينة</th>
                          <th className="text-right py-3 px-2">الرصيد الكلي</th>
                          <th className="text-right py-3 px-2">المتاح للسحب</th>
                          <th className="text-right py-3 px-2">المعلق</th>
                          <th className="text-right py-3 px-2">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEngineers.slice(0, 50).map(e => (
                          <tr key={e.id} className="border-b hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-7 h-7"><AvatarImage src={e.profile_image} /><AvatarFallback className="text-xs bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white">{e.full_name?.charAt(0)}</AvatarFallback></Avatar>
                                <div>
                                  <p className="font-medium text-[#1a1a2e]">{e.full_name}</p>
                                  <p className="text-xs text-slate-400">{e.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-slate-600">{e.city || "-"}</td>
                            <td className="py-3 px-2 font-bold text-green-600">{formatSAR((e.wallet_balance || 0) + (e.available_balance || 0) + (e.pending_balance || 0))} ر.س</td>
                            <td className="py-3 px-2 font-bold text-blue-600">{formatSAR(e.available_balance)} ر.س</td>
                            <td className="py-3 px-2 font-bold text-amber-600">{formatSAR(e.pending_balance)} ر.س</td>
                            <td className="py-3 px-2">
                              <Badge className={e.status === "approved" ? "bg-green-100 text-green-700" : e.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>
                                {e.status === "approved" ? "معتمد" : e.status === "rejected" ? "مرفوض" : "معلق"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredEngineers.length === 0 && <p className="text-center py-8 text-slate-400">لا توجد نتائج</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Client Wallets ─────────────────────────────────────── */}
            <TabsContent value="client-wallets">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-teal-600" />
                      أرصدة العملاء
                      <Badge className="bg-teal-50 text-teal-700">{filteredClients.length} عميل</Badge>
                    </CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input placeholder="بحث..." value={searchClient} onChange={e => setSearchClient(e.target.value)} className="pr-9 text-sm" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-slate-500">
                          <th className="text-right py-3 px-2">العميل</th>
                          <th className="text-right py-3 px-2">المدينة</th>
                          <th className="text-right py-3 px-2">رصيد المحفظة</th>
                          <th className="text-right py-3 px-2">نسبة من الإجمالي</th>
                          <th className="text-right py-3 px-2">نوع العميل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClients.slice(0, 50).map(c => {
                          const pct = summary.totalClientWallets > 0 ? ((c.wallet_balance || 0) / summary.totalClientWallets) * 100 : 0;
                          return (
                            <tr key={c.id} className="border-b hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-7 h-7"><AvatarImage src={c.profile_image} /><AvatarFallback className="text-xs bg-gradient-to-br from-teal-500 to-cyan-500 text-white">{c.full_name?.charAt(0)}</AvatarFallback></Avatar>
                                  <div>
                                    <p className="font-medium text-[#1a1a2e]">{c.full_name}</p>
                                    <p className="text-xs text-slate-400">{c.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-2 text-slate-600">{c.city || "-"}</td>
                              <td className="py-3 px-2 font-bold text-teal-600">{formatSAR(c.wallet_balance)} ر.س</td>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <Progress value={pct} className="h-2 w-20" />
                                  <span className="text-xs text-slate-500">{fmtPct(pct)}%</span>
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <Badge variant="secondary">{c.client_type === "investor" ? "مستثمر" : c.client_type === "individual" ? "فردي" : c.client_type || "فردي"}</Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filteredClients.length === 0 && <p className="text-center py-8 text-slate-400">لا توجد نتائج</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Transactions Log ────────────────────────────────────── */}
            <TabsContent value="transactions">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                      سجل العمليات المالية
                      <Badge className="bg-indigo-50 text-indigo-700">{filteredTx.length} عملية</Badge>
                    </CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input placeholder="بحث..." value={searchTx} onChange={e => setSearchTx(e.target.value)} className="pr-9 text-sm" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-slate-500">
                          <th className="text-right py-3 px-2">المستخدم</th>
                          <th className="text-right py-3 px-2">النوع</th>
                          <th className="text-right py-3 px-2">المبلغ</th>
                          <th className="text-right py-3 px-2">الحالة</th>
                          <th className="text-right py-3 px-2">الوصف</th>
                          <th className="text-right py-3 px-2">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTx.map(t => (
                          <tr key={t.id} className="border-b hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-2">
                              <p className="font-medium">{t.user_email}</p>
                              <Badge variant="secondary" className="text-xs">{t.user_type}</Badge>
                            </td>
                            <td className="py-3 px-2">
                              <Badge className={txTypeColors[t.type] || "bg-gray-100 text-gray-700"}>
                                {txTypeLabels[t.type] || t.type}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 font-bold">
                              <span className={t.amount > 0 ? "text-green-600" : "text-red-600"}>
                                {t.amount > 0 ? "+" : ""}{formatSAR(t.amount)} ر.س
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <Badge className={t.status === "completed" ? "bg-green-100 text-green-700" : t.status === "failed" ? "bg-red-100 text-red-700" : t.status === "held_in_escrow" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}>
                                {t.status === "completed" ? "مكتمل" : t.status === "failed" ? "فشل" : t.status === "held_in_escrow" ? "محتجز" : t.status === "cancelled" ? "ملغي" : t.status || "معلق"}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-slate-500 max-w-[200px] truncate">{t.description || "-"}</td>
                            <td className="py-3 px-2 text-slate-400 text-xs">{t.created_date ? new Date(t.created_date).toLocaleDateString("ar-SA") : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredTx.length === 0 && <p className="text-center py-8 text-slate-400">لا توجد نتائج</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Commissions Log ─────────────────────────────────────── */}
            <TabsContent value="commissions">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Percent className="w-5 h-5 text-purple-600" />
                    سجل العمولات
                    <Badge className="bg-purple-50 text-purple-700">{platformRevenue.length} عملية</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-slate-500">
                          <th className="text-right py-3 px-2">المصدر</th>
                          <th className="text-right py-3 px-2">البائع</th>
                          <th className="text-right py-3 px-2">المبلغ الكلي</th>
                          <th className="text-right py-3 px-2">نسبة العمولة</th>
                          <th className="text-right py-3 px-2">قيمة العمولة</th>
                          <th className="text-right py-3 px-2">صافي البائع</th>
                          <th className="text-right py-3 px-2">الحالة</th>
                          <th className="text-right py-3 px-2">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {platformRevenue.slice(0, 100).map(r => (
                          <tr key={r.id} className="border-b hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-2">
                              <Badge variant="secondary">
                                {r.source_type === "project_milestone" ? "مرحلة مشروع" : r.source_type === "design_purchase" ? "شراء تصميم" : r.source_type === "subscription" ? "اشتراك" : r.source_type}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-slate-600">{r.seller_email || "-"}</td>
                            <td className="py-3 px-2 font-bold">{formatSAR(r.total_amount)} ر.س</td>
                            <td className="py-3 px-2">{r.commission_rate || 15}%</td>
                            <td className="py-3 px-2 font-bold text-purple-600">{formatSAR(r.commission_amount)} ر.س</td>
                            <td className="py-3 px-2 font-bold text-green-600">{formatSAR(r.seller_earnings)} ر.س</td>
                            <td className="py-3 px-2">
                              <Badge className={r.status === "collected" ? "bg-green-100 text-green-700" : r.status === "refunded" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>
                                {r.status === "collected" ? "محصلة" : r.status === "refunded" ? "مسترجع" : "معلقة"}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-slate-400 text-xs">{r.payment_date ? new Date(r.payment_date).toLocaleDateString("ar-SA") : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {platformRevenue.length === 0 && <p className="text-center py-8 text-slate-400">لا توجد عمولات مسجلة بعد</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

      </div>
    </div>
  );
}