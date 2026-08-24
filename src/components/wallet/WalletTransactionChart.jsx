import React, { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

const DEPOSIT_TYPES = ["deposit", "escrow_release", "withdrawal_completed"];
const WITHDRAWAL_TYPES = ["withdrawal", "withdrawal_request", "escrow_hold"];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatCurrency(val) {
  return Number(val || 0).toLocaleString("ar-SA");
}

export default function WalletTransactionChart({ transactions = [] }) {
  // Group transactions by date (last 14 entries with activity)
  const chartData = useMemo(() => {
    const byDate = {};

    transactions.forEach(t => {
      const dateKey = new Date(t.created_date).toISOString().split("T")[0];
      if (!byDate[dateKey]) byDate[dateKey] = { date: dateKey, deposit: 0, withdrawal: 0 };
      const amount = Math.abs(t.amount || 0);
      if (DEPOSIT_TYPES.includes(t.type)) {
        byDate[dateKey].deposit += amount;
      } else if (WITHDRAWAL_TYPES.includes(t.type)) {
        byDate[dateKey].withdrawal += amount;
      }
    });

    return Object.values(byDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-14)
      .map(d => ({ ...d, label: formatDate(d.date) }));
  }, [transactions]);

  const totals = useMemo(() => {
    const deposit = transactions
      .filter(t => DEPOSIT_TYPES.includes(t.type))
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    const withdrawal = transactions
      .filter(t => WITHDRAWAL_TYPES.includes(t.type))
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    return { deposit, withdrawal };
  }, [transactions]);

  return (
    <Card className="border-[#C9A66B]/20 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 text-lg text-[#4A3F35]">
            <TrendingUp className="w-5 h-5 text-[#C9A66B]" />
            حركة الإيداع والسحب
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-slate-600">إيداع</span>
              <span className="font-bold text-green-600">{formatCurrency(totals.deposit)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-600">سحب</span>
              <span className="font-bold text-red-600">{formatCurrency(totals.withdrawal)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <TrendingDown className="w-10 h-10 mb-2 text-slate-300" />
            <p className="text-sm">لا توجد معاملات لعرضها</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", direction: "rtl" }}
                formatter={(value) => [formatCurrency(value) + " ريال", ""]}
                labelStyle={{ fontWeight: "bold", color: "#4A3F35" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="deposit" name="إيداع" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="withdrawal" name="سحب" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}