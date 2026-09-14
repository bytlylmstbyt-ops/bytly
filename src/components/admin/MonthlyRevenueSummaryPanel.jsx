import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Wallet, Percent, Calendar, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";

const MONTH_NAMES = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

const formatSAR = (n) => Number(n || 0).toLocaleString("en-US");

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

export default function MonthlyRevenueSummaryPanel() {
  const [loading, setLoading] = useState(true);
  const [monthly, setMonthly] = useState([]); // [{ key, label, subscriptions, commissions, total }]
  const [totals, setTotals] = useState({ subscriptions: 0, commissions: 0, total: 0, thisMonth: 0, lastMonth: 0, count: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [subs, revenue] = await Promise.all([
          base44.entities.Subscription.list("-created_date", 200),
          base44.entities.PlatformRevenue.list("-created_date", 200),
        ]);

        // ── Monthly buckets (last 6 months) ────────────────────────
        const now = new Date();
        const buckets = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          buckets[monthKey(d)] = { key: monthKey(d), subscriptions: 0, commissions: 0, total: 0 };
        }

        // Subscription income (completed payments)
        subs.forEach((s) => {
          if (s.payment_status !== "completed") return;
          const refDate = s.payment_date ? new Date(s.payment_date) : (s.created_date ? new Date(s.created_date) : null);
          if (!refDate) return;
          const k = monthKey(refDate);
          if (!buckets[k]) return;
          buckets[k].subscriptions += Number(s.amount || 0);
        });

        // Commission income (collected)
        revenue.forEach((r) => {
          if (r.status !== "collected") return;
          const refDate = r.payment_date ? new Date(r.payment_date) : (r.created_date ? new Date(r.created_date) : null);
          if (!refDate) return;
          const k = monthKey(refDate);
          if (!buckets[k]) return;
          buckets[k].commissions += Number(r.commission_amount || 0);
        });

        const monthlyArr = Object.values(buckets).map((b) => ({
          ...b,
          label: monthLabel(b.key),
          total: b.subscriptions + b.commissions,
        }));

        const nowKey = monthKey(now);
        const lastKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        const thisMonth = (buckets[nowKey]?.total || 0);
        const lastMonth = (buckets[lastKey]?.total || 0);

        setMonthly(monthlyArr);
        setTotals({
          subscriptions: monthlyArr.reduce((s, m) => s + m.subscriptions, 0),
          commissions: monthlyArr.reduce((s, m) => s + m.commissions, 0),
          total: monthlyArr.reduce((s, m) => s + m.total, 0),
          thisMonth,
          lastMonth,
          count: monthlyArr.length,
        });
      } catch (e) {
        console.error("MonthlyRevenueSummaryPanel error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const trendPct = totals.lastMonth > 0
    ? ((totals.thisMonth - totals.lastMonth) / totals.lastMonth) * 100
    : (totals.thisMonth > 0 ? 100 : 0);
  const isUp = trendPct >= 0;

  if (loading) {
    return (
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-8 flex items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">جارٍ تحميل الملخص المالي الشهري...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md mb-6 overflow-hidden">
      <CardHeader className="bg-gradient-to-l from-[#4A3F35] to-[#6B5D4F] text-white pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="w-5 h-5 text-[#C9A66B]" />
            الملخص المالي الشهري للدخل
          </CardTitle>
          <Link to={createPageUrl("FinancialReports")} className="text-xs text-[#C9A66B] hover:underline flex items-center gap-1">
            التقرير المالي التفصيلي
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-xs text-slate-300 mt-1">إجمالي الدخل من الاشتراكات والعمولات المكتملة خلال آخر 6 أشهر</p>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* ── Summary cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total income (6 months) */}
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-slate-600">إجمالي الدخل (6 أشهر)</span>
            </div>
            <p className="text-lg font-bold text-[#4A3F35]">{formatSAR(totals.total)} <span className="text-xs font-normal">ر.س</span></p>
          </div>

          {/* This month */}
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-slate-600">دخل هذا الشهر</span>
            </div>
            <p className="text-lg font-bold text-[#4A3F35]">{formatSAR(totals.thisMonth)} <span className="text-xs font-normal">ر.س</span></p>
            <div className={`flex items-center gap-1 text-xs mt-1 ${isUp ? "text-green-600" : "text-red-500"}`}>
              {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trendPct).toFixed(1)}% مقارنة بالشهر السابق
            </div>
          </div>

          {/* Subscriptions */}
          <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-xs font-medium text-slate-600">دخل الاشتراكات</span>
            </div>
            <p className="text-lg font-bold text-indigo-700">{formatSAR(totals.subscriptions)} <span className="text-xs font-normal">ر.س</span></p>
          </div>

          {/* Commissions */}
          <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Percent className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-slate-600">العمولات المكتملة</span>
            </div>
            <p className="text-lg font-bold text-purple-700">{formatSAR(totals.commissions)} <span className="text-xs font-normal">ر.س</span></p>
          </div>
        </div>

        {/* ── Chart + table ─────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 p-3">
            <p className="text-xs font-semibold text-[#4A3F35] mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#C9A66B]" />
              الدخل الشهري حسب المصدر
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} stackOffset="sign">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => `${formatSAR(v)} ر.س`}
                  contentStyle={{ borderRadius: 10, border: "1px solid #eee", fontSize: 12 }}
                />
                <Bar dataKey="subscriptions" name="اشتراكات" fill="#6366f1" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="commissions" name="عمولات" fill="#C9A66B" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <p className="text-xs font-semibold text-[#4A3F35] mb-2 p-3 pb-0 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#C9A66B]" />
              التفصيل الشهري
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b bg-slate-50">
                    <th className="text-right py-2 px-3 font-medium">الشهر</th>
                    <th className="text-right py-2 px-3 font-medium">اشتراكات</th>
                    <th className="text-right py-2 px-3 font-medium">عمولات</th>
                    <th className="text-right py-2 px-3 font-medium">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.slice().reverse().map((m) => {
                    const isCurrent = m.key === monthKey(new Date());
                    return (
                      <tr key={m.key} className={`border-b last:border-0 ${isCurrent ? "bg-amber-50/50" : "hover:bg-slate-50"}`}>
                        <td className="py-2 px-3 text-slate-700 font-medium">
                          {m.label}
                          {isCurrent && <Badge className="bg-amber-100 text-amber-700 mr-2 text-[10px] py-0">حالي</Badge>}
                        </td>
                        <td className="py-2 px-3 text-indigo-600 font-medium">{formatSAR(m.subscriptions)}</td>
                        <td className="py-2 px-3 text-purple-600 font-medium">{formatSAR(m.commissions)}</td>
                        <td className="py-2 px-3 text-[#4A3F35] font-bold">{formatSAR(m.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}