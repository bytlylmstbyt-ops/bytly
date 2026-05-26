import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Percent, TrendingDown, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import moment from "moment";
import "moment/locale/ar";

moment.locale("ar");

/**
 * CommissionTracker — يعرض تفاصيل عمولات المنصة المخصومة من المهندس
 * أو المدفوعة من العميل، مع رسم بياني شهري.
 */
export default function CommissionTracker({ transactions = [], userType = "engineer" }) {
  // استخرج معاملات العمولة فقط
  const commissionTx = transactions.filter(t => t.type === "commission");

  const totalCommissions = commissionTx.reduce(
    (sum, t) => sum + (t.commission_amount || t.amount || 0),
    0
  );

  const thisMonthCommissions = commissionTx
    .filter(t => moment(t.created_date).isSame(moment(), "month"))
    .reduce((sum, t) => sum + (t.commission_amount || t.amount || 0), 0);

  // بيانات الرسم البياني — آخر 6 أشهر
  const monthly = commissionTx.reduce((acc, t) => {
    const key = moment(t.created_date).format("MMM YY");
    acc[key] = (acc[key] || 0) + (t.commission_amount || t.amount || 0);
    return acc;
  }, {});

  const chartData = Object.entries(monthly)
    .slice(-6)
    .map(([month, amount]) => ({ month, amount }));

  if (commissionTx.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-700">
            <Percent className="w-5 h-5 text-orange-500" />
            عمولات المنصة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-slate-400">
            <Percent className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">لم يتم خصم أي عمولات بعد</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-slate-700">
            <Percent className="w-5 h-5 text-orange-500" />
            تتبع عمولات المنصة
          </CardTitle>
          <Badge className="bg-orange-100 text-orange-700 border border-orange-200">
            نسبة العمولة: 15%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-slate-500">إجمالي العمولات</span>
            </div>
            <p className="text-2xl font-bold text-orange-700">
              {totalCommissions.toLocaleString("ar-SA")}
              <span className="text-sm font-normal text-slate-500 mr-1">ر.س</span>
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-slate-500">هذا الشهر</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">
              {thisMonthCommissions.toLocaleString("ar-SA")}
              <span className="text-sm font-normal text-slate-500 mr-1">ر.س</span>
            </p>
          </div>
        </div>

        {/* ملاحظة توضيحية */}
        <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            {userType === "engineer"
              ? "يتم خصم عمولة المنصة (15%) تلقائياً عند تحرير كل مرحلة دفع لصالحك."
              : "تُحتسب عمولة المنصة ضمن تكلفة المشروع وتُخصم عند دفع كل مرحلة."}
          </p>
        </div>

        {/* رسم بياني */}
        {chartData.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-600 mb-3">العمولات الشهرية (آخر 6 أشهر)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v) => [`${v.toLocaleString("ar-SA")} ر.س`, "عمولة"]}
                  contentStyle={{ direction: "rtl", fontSize: 12 }}
                />
                <Bar dataKey="amount" fill="#f97316" radius={[4, 4, 0, 0]} name="عمولة" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* آخر معاملات العمولة */}
        <div>
          <p className="text-sm font-medium text-slate-600 mb-3">آخر عمليات الخصم</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {commissionTx.slice(0, 10).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 bg-orange-50 rounded-lg text-sm"
              >
                <div className="min-w-0">
                  <p className="text-slate-700 truncate">{t.description || "عمولة منصة"}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {moment(t.created_date).format("DD/MM/YYYY")}
                  </p>
                </div>
                <p className="font-bold text-orange-600 shrink-0 mr-3">
                  -{(t.commission_amount || t.amount || 0).toLocaleString("ar-SA")} ر.س
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}