import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Lock, Wallet, FileText } from "lucide-react";

export default function ProviderFinancialReport({ provider, providerType, userEmail }) {
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    loadReportData();
  }, [userEmail]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const [txns, wdrls] = await Promise.all([
        base44.entities.Transaction.filter(
          { user_email: userEmail, user_type: providerType },
          "-created_date",
          500
        ),
        base44.entities.WithdrawalRequest.filter(
          { provider_type: providerType },
          "-created_date",
          100
        )
      ]);

      // Filter withdrawal requests that belong to this provider
      const idField = providerType === "contractor" ? "contractor_id" : "supplier_id";
      const myWithdrawals = wdrls.filter(w => w[idField] === provider?.id);

      setTransactions(txns);
      setWithdrawals(myWithdrawals);
    } catch (error) {
      console.error("Error loading financial report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#C9A66B]" />
        </CardContent>
      </Card>
    );
  }

  // Compute summary from transactions
  const summary = transactions.reduce((acc, t) => {
    const amt = t.amount || 0;
    if (t.type === "deposit" && t.status === "completed") acc.totalDeposits += amt;
    if (t.type === "withdrawal" || t.type === "withdrawal_completed") {
      if (t.status === "completed") acc.totalWithdrawals += amt;
    }
    if (t.type === "escrow_hold" && t.status === "held_in_escrow") acc.totalEscrowHeld += amt;
    if (t.type === "escrow_release" && t.status === "completed") acc.totalEscrowReleased += amt;
    if (t.type === "commission" && t.status === "completed") acc.totalCommissions += amt;
    if (t.type === "refund" && t.status === "completed") acc.totalRefunds += amt;
    if (t.type === "payment" && t.status === "completed") acc.totalPayments += amt;
    return acc;
  }, {
    totalDeposits: 0, totalWithdrawals: 0, totalEscrowHeld: 0,
    totalEscrowReleased: 0, totalCommissions: 0, totalRefunds: 0, totalPayments: 0
  });

  // Held amounts
  const pendingBalance = provider?.pending_balance || 0;
  const pendingWithdrawals = withdrawals
    .filter(w => w.status === "pending" || w.status === "processing")
    .reduce((sum, w) => sum + (w.amount || 0), 0);
  const totalHeld = pendingBalance + pendingWithdrawals;

  // Due amounts
  const availableBalance = provider?.available_balance || 0;
  const walletBalance = provider?.wallet_balance || 0;
  const releasedPending = transactions
    .filter(t => t.type === "escrow_release" && t.status === "pending")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const fmt = (n) => n.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const summaryCards = [
    { label: "إجمالي الإيداعات", value: summary.totalDeposits, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "إجمالي السحوبات", value: summary.totalWithdrawals, icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
    { label: "المبالغ المحجوزة (ضمان)", value: summary.totalEscrowHeld, icon: Lock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "المبالغ المُحررة (ضمان)", value: summary.totalEscrowReleased, icon: Wallet, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">{label}</span>
                <div className={`p-1.5 rounded-lg ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
              <p className="text-lg font-bold text-slate-800">
                {fmt(value)} <span className="text-xs font-normal text-slate-400">ريال</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Held & Due Amounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Held Amounts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              المبالغ المحجوزة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="رصيد معلق (قيد الاعتماد)" value={pendingBalance} fmt={fmt} />
            <Row label="طلبات سحب قيد المعالجة" value={pendingWithdrawals} fmt={fmt} />
            <div className="border-t border-slate-100 pt-3">
              <Row label="إجمالي المحجوز" value={totalHeld} fmt={fmt} bold />
            </div>
          </CardContent>
        </Card>

        {/* Due Amounts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-4 h-4 text-green-600" />
              المبالغ المستحقة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="الرصيد المتاح للسحب" value={availableBalance} fmt={fmt} highlight />
            <Row label="تسديدات قيد المعالجة" value={releasedPending} fmt={fmt} />
            <div className="border-t border-slate-100 pt-3">
              <Row label="إجمالي رصيد المحفظة" value={walletBalance} fmt={fmt} bold />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#C9A66B]" />
            تفاصيل إضافية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <Stat label="العمولات" value={summary.totalCommissions} fmt={fmt} />
            <Stat label="المبالغ المستردة" value={summary.totalRefunds} fmt={fmt} />
            <Stat label="إجمالي المدفوعات" value={summary.totalPayments} fmt={fmt} />
            <Stat label="عدد المعاملات" value={transactions.length} fmt={(n) => String(n)} raw />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, fmt, bold, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`${bold ? "font-bold text-slate-800" : highlight ? "font-semibold text-green-600" : "font-medium text-slate-700"}`}>
        {fmt(value)} <span className="text-xs font-normal text-slate-400">ريال</span>
      </span>
    </div>
  );
}

function Stat({ label, value, fmt, raw }) {
  return (
    <div className="p-2 rounded-lg bg-slate-50">
      <p className="text-sm font-bold text-slate-700">{fmt(value)}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}