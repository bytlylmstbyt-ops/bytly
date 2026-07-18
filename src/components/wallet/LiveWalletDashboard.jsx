import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet, TrendingUp, TrendingDown, Percent, ArrowDownLeft, ArrowUpRight,
  Clock, CheckCircle2, XCircle, Lock, RefreshCw, Zap, DollarSign,
  BarChart3, List, Shield, AlertCircle, ChevronDown, Building2, User
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import moment from "moment";
import "moment/locale/ar";

moment.locale("ar");

// ── helpers ───────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString("ar-SA");

const TYPE_META = {
  deposit:             { label: "إيداع",              color: "text-green-600",  bg: "bg-green-50",  icon: ArrowDownLeft },
  payment:             { label: "دفعة مستلمة",        color: "text-green-600",  bg: "bg-green-50",  icon: ArrowDownLeft },
  escrow_release:      { label: "تحرير ضمان",          color: "text-blue-600",   bg: "bg-blue-50",   icon: CheckCircle2 },
  withdrawal:          { label: "سحب",                color: "text-red-600",    bg: "bg-red-50",    icon: ArrowUpRight },
  withdrawal_request:  { label: "طلب سحب",            color: "text-red-500",    bg: "bg-red-50",    icon: ArrowUpRight },
  withdrawal_completed:{ label: "سحب مكتمل",          color: "text-red-600",    bg: "bg-red-50",    icon: ArrowUpRight },
  commission:          { label: "عمولة منصة",          color: "text-orange-600", bg: "bg-orange-50", icon: Percent },
  escrow_hold:         { label: "حجز في الضمان",      color: "text-purple-600", bg: "bg-purple-50", icon: Lock },
  refund:              { label: "استرداد",             color: "text-teal-600",   bg: "bg-teal-50",   icon: RefreshCw },
  subscription:        { label: "اشتراك",             color: "text-slate-600",  bg: "bg-slate-50",  icon: Shield },
};

const STATUS_BADGE = {
  completed:      { label: "مكتمل",         cls: "bg-green-100 text-green-700 border-green-200" },
  pending:        { label: "معلق",           cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  held_in_escrow: { label: "في الضمان",     cls: "bg-blue-100 text-blue-700 border-blue-200" },
  failed:         { label: "فشل",           cls: "bg-red-100 text-red-700 border-red-200" },
  cancelled:      { label: "ملغي",          cls: "bg-slate-100 text-slate-600 border-slate-200" },
};

const isDebit = (type) =>
  ["withdrawal", "withdrawal_request", "withdrawal_completed", "commission", "escrow_hold"].includes(type);

// ── Sub-components ────────────────────────────────────────────────────

function LiveIndicator() {
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1200);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
      <span className={`w-2 h-2 rounded-full bg-green-500 transition-opacity ${pulse ? "opacity-100" : "opacity-30"}`} />
      مباشر
    </span>
  );
}

function BalanceCard({ title, amount, subtitle, icon: Icon, gradient, border, badge }) {
  return (
    <Card className={`relative overflow-hidden border-2 ${border}`}>
      <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${gradient}`} />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-md`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {badge && <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 font-medium">{badge}</span>}
        </div>
        <p className="text-xs text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-900">
          {fmt(amount)} <span className="text-sm font-normal text-slate-400">ر.س</span>
        </p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function TransactionRow({ tx }) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[tx.type] || { label: tx.type, color: "text-slate-600", bg: "bg-slate-50", icon: DollarSign };
  const Icon = meta.icon;
  const debit = isDebit(tx.type);
  const status = STATUS_BADGE[tx.status] || STATUS_BADGE.pending;
  const amount = tx.net_amount || tx.amount || 0;
  const commission = tx.commission_amount || 0;

  const hasDetails = tx.reference_id || tx.payment_method || tx.balance_before != null ||
    tx.balance_after != null || tx.from_wallet || tx.to_wallet || tx.related_transaction_id ||
    (tx.metadata && Object.keys(tx.metadata).length > 0);

  return (
    <div className={`rounded-xl border hover:shadow-sm transition-all ${meta.bg} border-transparent hover:border-slate-200 overflow-hidden`}>
      <button
        className={`flex items-center gap-3 p-3.5 w-full text-right ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
          <Icon className={`w-4 h-4 ${meta.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800">{meta.label}</span>
            <Badge className={`text-[10px] px-1.5 py-0 border ${status.cls}`}>{status.label}</Badge>
            {commission > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-600 border border-orange-200">
                عمولة {fmt(commission)} ر.س
              </Badge>
            )}
            {hasDetails && (
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform mr-auto ${expanded ? "rotate-180" : ""}`} />
            )}
          </div>
          {tx.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{tx.description}</p>}
          <p className="text-[10px] text-slate-400 mt-0.5">{moment(tx.created_date).format("DD/MM/YYYY – HH:mm")} · {moment(tx.created_date).fromNow()}</p>
        </div>
        <p className={`text-base font-bold shrink-0 ${debit ? "text-red-600" : "text-green-600"}`}>
          {debit ? "−" : "+"}{fmt(amount)}
          <span className="text-[10px] font-normal text-slate-400 mr-0.5"> ر.س</span>
        </p>
      </button>
      {expanded && hasDetails && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-200/60 bg-white/50">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mt-2">
            {tx.reference_id && <DetailItem label="رقم المرجع" value={tx.reference_id} mono />}
            {tx.payment_method && <DetailItem label="طريقة الدفع" value={tx.payment_method} />}
            {tx.balance_before != null && <DetailItem label="الرصيد قبل" value={`${fmt(tx.balance_before)} ر.س`} />}
            {tx.balance_after != null && <DetailItem label="الرصيد بعد" value={`${fmt(tx.balance_after)} ر.س`} />}
            {tx.from_wallet && <DetailItem label="من محفظة" value={tx.from_wallet} />}
            {tx.to_wallet && <DetailItem label="إلى محفظة" value={tx.to_wallet} />}
            {tx.related_transaction_id && <DetailItem label="معاملة مرتبطة" value={tx.related_transaction_id} mono />}
            {tx.project_id && <DetailItem label="المشروع" value={tx.project_id} mono />}
            {tx.milestone_id && <DetailItem label="المرحلة" value={tx.milestone_id} mono />}
          </div>
          {tx.metadata && Object.keys(tx.metadata).length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-100">
              <p className="text-[10px] font-semibold text-slate-500 mb-1">بيانات إضافية</p>
              <pre className="text-[10px] text-slate-600 bg-slate-50 rounded p-2 overflow-x-auto" dir="ltr">
                {JSON.stringify(tx.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className={`font-medium text-slate-700 truncate ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function CommissionPanel({ transactions }) {
  const commissions = transactions.filter(t => t.type === "commission");
  const total = commissions.reduce((s, t) => s + (t.commission_amount || t.amount || 0), 0);
  const thisMonth = commissions
    .filter(t => moment(t.created_date).isSame(moment(), "month"))
    .reduce((s, t) => s + (t.commission_amount || t.amount || 0), 0);

  const monthly = commissions.reduce((acc, t) => {
    const k = moment(t.created_date).format("MM/YY");
    acc[k] = (acc[k] || 0) + (t.commission_amount || t.amount || 0);
    return acc;
  }, {});
  const chartData = Object.entries(monthly).slice(-6).map(([month, amount]) => ({ month, amount }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
          <p className="text-xs text-slate-500 mb-1">إجمالي العمولات</p>
          <p className="text-xl font-bold text-orange-700">{fmt(total)} <span className="text-xs font-normal">ر.س</span></p>
        </div>
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-xs text-slate-500 mb-1">هذا الشهر</p>
          <p className="text-xl font-bold text-amber-700">{fmt(thisMonth)} <span className="text-xs font-normal">ر.س</span></p>
        </div>
      </div>
      <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 flex items-start gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>تُخصم عمولة المنصة (15%) تلقائياً عند تحرير كل مرحلة دفع.</span>
      </div>
      {chartData.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">العمولات الشهرية</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${fmt(v)} ر.س`, "عمولة"]} contentStyle={{ direction: "rtl", fontSize: 11 }} />
              <Bar dataKey="amount" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {commissions.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Percent className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">لا توجد عمولات مخصومة حتى الآن</p>
        </div>
      )}
      {commissions.length > 0 && (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {commissions.slice(0, 15).map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg text-sm">
              <div>
                <p className="text-slate-700 text-xs">{t.description || "عمولة منصة"}</p>
                <p className="text-[10px] text-slate-400">{moment(t.created_date).format("DD/MM/YYYY")}</p>
              </div>
              <p className="font-bold text-orange-600 text-sm">−{fmt(t.commission_amount || t.amount)} ر.س</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HeldAmountsPanel({ transactions, profile }) {
  const escrowHolds = transactions.filter(t => t.type === "escrow_hold" && t.status === "held_in_escrow");
  const totalEscrowHeld = escrowHolds.reduce((s, t) => s + (t.amount || 0), 0);
  const pendingBalance = profile?.pending_balance || 0;
  const totalHeld = totalEscrowHeld + pendingBalance;

  // Group escrow holds by project
  const byProject = escrowHolds.reduce((acc, t) => {
    const key = t.project_id || "غير محدد";
    if (!acc[key]) acc[key] = { project: key, amount: 0, count: 0 };
    acc[key].amount += t.amount || 0;
    acc[key].count += 1;
    return acc;
  }, {});
  const projectBreakdown = Object.values(byProject);

  const heldItems = [
    { label: "رصيد معلق (قيد اعتماد العميل)", amount: pendingBalance, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "مبالغ محجوزة في الضمان", amount: totalEscrowHeld, icon: Lock, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
  ];

  return (
    <Card className="border-2 border-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
          <Lock className="w-4 h-4 text-purple-500" />
          المبالغ المحجوزة
          <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border border-purple-200">
            الإجمالي: {fmt(totalHeld)} ر.س
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {heldItems.map(({ label, amount, icon: Icon, color, bg, border }) => (
            <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border ${bg} ${border}`}>
              <div className="p-2 rounded-lg bg-white shadow-sm">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`text-base font-bold ${color}`}>{fmt(amount)} <span className="text-[10px] font-normal">ر.س</span></p>
              </div>
            </div>
          ))}
        </div>

        {projectBreakdown.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">تفصيل المبالغ المحجوزة حسب المشروع</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {projectBreakdown.map(({ project, amount, count }) => (
                <div key={project} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-slate-500 truncate">{project}</span>
                    <Badge className="text-[9px] px-1 py-0 bg-white text-slate-500 border border-slate-200">{count} حجز</Badge>
                  </div>
                  <span className="font-bold text-purple-600 shrink-0">{fmt(amount)} ر.س</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalHeld === 0 && (
          <div className="text-center py-6 text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">لا توجد مبالغ محجوزة حالياً</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function LiveWalletDashboard({ profile, userType, userEmail }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [newTxCount, setNewTxCount] = useState(0);

  const loadTransactions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await base44.entities.Transaction.filter(
        { user_email: userEmail },
        "-created_date",
        150
      );
      setTransactions(data);
      setLastUpdated(new Date());
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    loadTransactions();

    // Real-time subscription
    const unsubscribe = base44.entities.Transaction.subscribe((event) => {
      if (event.data?.user_email === userEmail) {
        setNewTxCount(c => c + 1);
        loadTransactions(true);
      }
    });

    return unsubscribe;
  }, [loadTransactions, userEmail]);

  // Computed balances
  const availableBalance = profile?.available_balance || 0;
  const pendingBalance = profile?.pending_balance || 0;
  const totalBalance = availableBalance + pendingBalance;

  // Summary stats
  const completedTx = transactions.filter(t => t.status === "completed");
  const totalIncome = completedTx
    .filter(t => !isDebit(t.type))
    .reduce((s, t) => s + (t.amount || 0), 0);
  const totalWithdrawals = completedTx
    .filter(t => t.type === "withdrawal" || t.type === "withdrawal_completed")
    .reduce((s, t) => s + (t.amount || 0), 0);
  const totalCommissions = completedTx
    .filter(t => t.type === "commission")
    .reduce((s, t) => s + (t.commission_amount || t.amount || 0), 0);

  // Area chart data — last 8 weeks
  const weeklyData = transactions.reduce((acc, t) => {
    if (t.status !== "completed") return acc;
    const week = moment(t.created_date).startOf("isoWeek").format("DD/MM");
    if (!acc[week]) acc[week] = { week, income: 0, out: 0 };
    if (isDebit(t.type)) acc[week].out += t.amount || 0;
    else acc[week].income += t.amount || 0;
    return acc;
  }, {});
  const chartData = Object.values(weeklyData).slice(-8);

  // Filtered list
  const filtered = filterType === "all"
    ? transactions
    : filterType === "income" ? transactions.filter(t => !isDebit(t.type))
    : filterType === "debit" ? transactions.filter(t => isDebit(t.type) && t.type !== "commission")
    : transactions.filter(t => t.type === "commission");

  const FILTERS = [
    { key: "all", label: "الكل" },
    { key: "income", label: "دخل" },
    { key: "debit", label: "سحوبات" },
    { key: "commission", label: "عمولات" },
  ];

  return (
    <div className="space-y-6" dir="rtl">

      {/* Live status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LiveIndicator />
          {newTxCount > 0 && (
            <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-xs gap-1">
              <Zap className="w-3 h-3" />
              {newTxCount} تحديث جديد
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {lastUpdated && <span>آخر تحديث: {moment(lastUpdated).format("HH:mm:ss")}</span>}
          <button onClick={() => { setNewTxCount(0); loadTransactions(); }} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BalanceCard
          title="الرصيد المتاح للسحب"
          amount={availableBalance}
          subtitle="قابل للسحب فوراً"
          icon={DollarSign}
          gradient="from-green-500 to-emerald-500"
          border="border-green-200"
          badge="✓ متاح"
        />
        <BalanceCard
          title="الرصيد المعلق"
          amount={pendingBalance}
          subtitle="في انتظار اعتماد العميل"
          icon={Lock}
          gradient="from-amber-500 to-orange-500"
          border="border-amber-200"
          badge="⏳ معلق"
        />
        <BalanceCard
          title="الرصيد الإجمالي"
          amount={totalBalance}
          subtitle="المتاح + المعلق"
          icon={Wallet}
          gradient="from-blue-500 to-indigo-500"
          border="border-blue-200"
        />
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "إجمالي الدخل", amount: totalIncome, color: "text-green-700", bg: "bg-green-50 border-green-100", icon: TrendingUp },
          { label: "إجمالي السحوبات", amount: totalWithdrawals, color: "text-red-700", bg: "bg-red-50 border-red-100", icon: TrendingDown },
          { label: "عمولات المنصة", amount: totalCommissions, color: "text-orange-700", bg: "bg-orange-50 border-orange-100", icon: Percent },
        ].map(({ label, amount, color, bg, icon: Icon }) => (
          <Card key={label} className={`border ${bg}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <p className="text-xs text-slate-500">{label}</p>
              </div>
              <p className={`text-lg font-bold ${color}`}>{fmt(amount)} <span className="text-xs font-normal">ر.س</span></p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Held Amounts Panel */}
      <HeldAmountsPanel transactions={transactions} profile={profile} />

      {/* Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              نشاط المحفظة الأسبوعي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v, name) => [`${fmt(v)} ر.س`, name === "income" ? "دخل" : "خرج"]}
                  contentStyle={{ direction: "rtl", fontSize: 11 }}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incGrad)" strokeWidth={2} name="دخل" />
                <Area type="monotone" dataKey="out" stroke="#ef4444" fill="url(#outGrad)" strokeWidth={2} name="خرج" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Transactions + Commissions */}
      <Tabs defaultValue="transactions">
        <TabsList className="w-full">
          <TabsTrigger value="transactions" className="flex-1">
            <List className="w-3.5 h-3.5 ml-1" /> المعاملات ({transactions.length})
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex-1">
            <Percent className="w-3.5 h-3.5 ml-1" /> العمولات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4 space-y-3">
          {/* Filter buttons */}
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <Button
                key={f.key}
                size="sm"
                variant={filterType === f.key ? "default" : "outline"}
                className="h-7 text-xs rounded-full"
                onClick={() => setFilterType(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">جارٍ التحميل...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد معاملات</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {filtered.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="commissions" className="mt-4">
          <CommissionPanel transactions={transactions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}