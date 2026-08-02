import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Area, AreaChart
} from "recharts";
import { TrendingUp, ShieldCheck, ArrowRightLeft, Loader2 } from "lucide-react";

const MONTH_NAMES = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

const formatSAR = (n) => Number(n || 0).toLocaleString("en-US");
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (key) => {
  const [y, m] = key.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y.slice(2)}`;
};

function buildMonthBuckets(count) {
  const now = new Date();
  const out = {};
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = monthKey(d);
    out[k] = { key: k, label: monthLabel(k), subscriptions: 0, commissions: 0, income: 0, escrowHeld: 0, escrowReleased: 0, payments: 0, paymentsCount: 0 };
  }
  return out;
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white shadow-xl border border-slate-100 rounded-xl p-3">
      <p className="text-xs font-bold text-[#4A3F35] mb-1">{label}</p>
      {payload.map((e, i) => (
        <p key={i} className="text-xs" style={{ color: e.color || e.fill }}>
          {e.name}: {formatSAR(e.value)} ر.س
        </p>
      ))}
    </div>
  );
};

export default function FinancialChartsPanel() {
  const [loading, setLoading] = useState(true);
  const [incomeData, setIncomeData] = useState([]);
  const [escrowData, setEscrowData] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, escrowHeldNow: 0, paymentsVolume: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [subs, revenue, txList, projects] = await Promise.all([
          base44.entities.Subscription.list("-created_date", 200),
          base44.entities.PlatformRevenue.list("-created_date", 200),
          base44.entities.Transaction.list("-created_date", 200),
          base44.entities.Project.list(),
        ]);

        const buckets = buildMonthBuckets(8);

        // Income — subscriptions completed + commissions collected
        subs.forEach((s) => {
          if (s.payment_status !== "completed") return;
          const d = s.payment_date ? new Date(s.payment_date) : (s.created_date ? new Date(s.created_date) : null);
          if (!d) return;
          const k = monthKey(d);
          if (buckets[k]) buckets[k].subscriptions += Number(s.amount || 0);
        });
        revenue.forEach((r) => {
          if (r.status !== "collected") return;
          const d = r.payment_date ? new Date(r.payment_date) : (r.created_date ? new Date(r.created_date) : null);
          if (!d) return;
          const k = monthKey(d);
          if (buckets[k]) buckets[k].commissions += Number(r.commission_amount || 0);
        });

        // Escrow + payments from transactions
        txList.forEach((t) => {
          const d = t.created_date ? new Date(t.created_date) : null;
          if (!d) return;
          const k = monthKey(d);
          if (!buckets[k]) return;
          const amt = Number(t.amount || 0);
          if (t.type === "escrow_hold") buckets[k].escrowHeld += amt;
          if (t.type === "escrow_release") buckets[k].escrowReleased += amt;
          if (["deposit", "payment", "withdrawal_completed", "subscription", "commission"].includes(t.type)) {
            buckets[k].payments += amt;
            buckets[k].paymentsCount += 1;
          }
        });

        const arr = Object.values(buckets).map((b) => ({
          ...b,
          income: b.subscriptions + b.commissions,
        }));

        setIncomeData(arr.map((b) => ({ label: b.label, subscriptions: b.subscriptions, commissions: b.commissions, income: b.income })));
        setEscrowData(arr.map((b) => ({ label: b.label, held: b.escrowHeld, released: b.escrowReleased })));
        setPaymentsData(arr.map((b) => ({ label: b.label, payments: b.payments, count: b.paymentsCount })));

        const escrowHeldNow = projects
          .filter((p) => p.escrow_status === "held")
          .reduce((s, p) => s + Number(p.escrow_amount || 0), 0);

        setSummary({
          totalIncome: arr.reduce((s, m) => s + m.income, 0),
          escrowHeldNow,
          paymentsVolume: arr.reduce((s, m) => s + m.payments, 0),
        });
      } catch (e) {
        console.error("FinancialChartsPanel error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Card className="border-0 shadow-md mb-6">
        <CardContent className="p-8 flex items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">جارٍ تحميل الرسوم البيانية المالية...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md mb-6 overflow-hidden">
      <CardHeader className="bg-gradient-to-l from-[#1A1A2E] to-[#2D2D4E] text-white pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-5 h-5 text-[#C9A66B]" />
          التقارير المالية البيانية
        </CardTitle>
        <p className="text-xs text-slate-300 mt-1">متابعة الأداء المالي: إجمالي الدخل، مبالغ الضمان المحجوزة، وحركة المدفوعات الشهرية</p>
      </CardHeader>

      <CardContent className="p-4">
        {/* ── Mini summary strip ───────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 text-center">
            <p className="text-[11px] text-slate-600 mb-0.5">إجمالي الدخل (8 أشهر)</p>
            <p className="text-base font-bold text-[#4A3F35]">{formatSAR(summary.totalIncome)} <span className="text-[10px] font-normal">ر.س</span></p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 text-center">
            <p className="text-[11px] text-slate-600 mb-0.5">الضمان المحجوز حاليًا</p>
            <p className="text-base font-bold text-orange-700">{formatSAR(summary.escrowHeldNow)} <span className="text-[10px] font-normal">ر.س</span></p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 text-center">
            <p className="text-[11px] text-slate-600 mb-0.5">حركة المدفوعات (8 أشهر)</p>
            <p className="text-base font-bold text-blue-700">{formatSAR(summary.paymentsVolume)} <span className="text-[10px] font-normal">ر.س</span></p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* ── Chart 1: Total income (stacked) ─────────────────────── */}
          <div className="bg-white rounded-xl border border-slate-100 p-3">
            <p className="text-xs font-semibold text-[#4A3F35] mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#C9A66B]" />
              إجمالي الدخل الشهري
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={incomeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="subscriptions" name="اشتراكات" fill="#6366f1" stackId="inc" />
                <Bar dataKey="commissions" name="عمولات" fill="#C9A66B" stackId="inc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Chart 2: Escrow held vs released ─────────────────────── */}
          <div className="bg-white rounded-xl border border-slate-100 p-3">
            <p className="text-xs font-semibold text-[#4A3F35] mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              مبالغ الضمان المحجوزة والمحررة
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={escrowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="held" name="محجوز" fill="#f59e0b" stackId="esc" />
                <Bar dataKey="released" name="محرر" fill="#16a34a" stackId="esc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Chart 3: Monthly payment movements (full width) ───────── */}
        <div className="bg-white rounded-xl border border-slate-100 p-3 mt-4">
          <p className="text-xs font-semibold text-[#4A3F35] mb-2 flex items-center gap-1.5">
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            حركة المدفوعات الشهرية
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={paymentsData}>
              <defs>
                <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="payments" name="حركة المدفوعات" stroke="#2563eb" strokeWidth={2} fill="url(#payGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}