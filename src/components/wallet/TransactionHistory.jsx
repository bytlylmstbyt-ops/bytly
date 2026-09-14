import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, Clock, Percent, TrendingDown, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import moment from "moment";
import "moment/locale/ar";

moment.locale('ar');

export default function TransactionHistory({ transactions }) {
  const [filterType, setFilterType] = useState("all");

  const getTransactionIcon = (type) => {
    if (type === "withdrawal" || type === "withdrawal_request" || type === "withdrawal_completed") {
      return <ArrowUpRight className="w-5 h-5 text-red-600" />;
    }
    if (type === "commission") {
      return <Percent className="w-5 h-5 text-orange-600" />;
    }
    return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "قيد المعالجة", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      completed: { label: "مكتمل", color: "bg-green-100 text-green-800 border-green-300" },
      failed: { label: "فشل", color: "bg-red-100 text-red-800 border-red-300" },
      cancelled: { label: "ملغي", color: "bg-slate-100 text-slate-800 border-slate-300" },
      held_in_escrow: { label: "محجوز", color: "bg-blue-100 text-blue-800 border-blue-300" }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={`${config.color} border`}>{config.label}</Badge>;
  };

  const getTypeLabel = (type) => {
    const labels = {
      deposit: "إيداع",
      withdrawal: "سحب",
      escrow_hold: "حجز في الضمان",
      escrow_release: "تحرير من الضمان",
      subscription: "اشتراك",
      commission: "خصم عمولة المنصة",
      refund: "استرداد",
      withdrawal_request: "طلب سحب",
      withdrawal_completed: "سحب مكتمل",
      payment: "دفع"
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    if (type === "commission") return "bg-orange-50 border-orange-200";
    if (type.includes("withdrawal") || type === "escrow_hold") return "bg-red-50 border-red-200";
    return "bg-green-50 border-green-200";
  };

  // Calculate summary statistics
  const totalIncome = transactions
    .filter(t => t.type !== "withdrawal" && t.type !== "commission" && t.status === "completed")
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const totalWithdrawals = transactions
    .filter(t => (t.type === "withdrawal" || t.type === "withdrawal_completed") && t.status === "completed")
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const totalCommissions = transactions
    .filter(t => t.type === "commission" && t.status === "completed")
    .reduce((sum, t) => sum + (t.commission_amount || t.amount || 0), 0);

  // Filter transactions
  const filteredTransactions = filterType === "all" 
    ? transactions 
    : transactions.filter(t => {
        if (filterType === "income") return t.type !== "withdrawal" && t.type !== "commission";
        if (filterType === "withdrawal") return t.type.includes("withdrawal");
        if (filterType === "commission") return t.type === "commission";
        return true;
      });

  // Prepare chart data - group by month
  const monthlyData = transactions.reduce((acc, t) => {
    if (t.status !== "completed") return acc;
    const month = moment(t.created_date).format('MMM YYYY');
    if (!acc[month]) {
      acc[month] = { month, income: 0, withdrawals: 0, commissions: 0 };
    }
    if (t.type === "withdrawal" || t.type === "withdrawal_completed") {
      acc[month].withdrawals += t.amount;
    } else if (t.type === "commission") {
      acc[month].commissions += (t.commission_amount || t.amount);
    } else {
      acc[month].income += t.amount;
    }
    return acc;
  }, {});

  const chartData = Object.values(monthlyData).slice(-6); // Last 6 months

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>سجل المعاملات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد معاملات حتى الآن</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-slate-600 mb-1">إجمالي الدخل</p>
            <p className="text-2xl font-bold text-green-900">
              {totalIncome.toLocaleString('ar-SA')} ر.س
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-sm text-slate-600 mb-1">إجمالي السحوبات</p>
            <p className="text-2xl font-bold text-red-900">
              {totalWithdrawals.toLocaleString('ar-SA')} ر.س
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Percent className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-sm text-slate-600 mb-1">عمولات المنصة</p>
            <p className="text-2xl font-bold text-orange-900">
              {totalCommissions.toLocaleString('ar-SA')} ر.س
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>نشاط المحفظة - آخر 6 أشهر</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `${value.toLocaleString('ar-SA')} ر.س`}
                  contentStyle={{ direction: 'rtl' }}
                />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="دخل" />
                <Bar dataKey="withdrawals" fill="#ef4444" name="سحوبات" />
                <Bar dataKey="commissions" fill="#f59e0b" name="عمولات" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Transaction List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>سجل المعاملات المفصل</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              الكل
            </Button>
            <Button
              variant={filterType === "income" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("income")}
            >
              دخل
            </Button>
            <Button
              variant={filterType === "withdrawal" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("withdrawal")}
            >
              سحب
            </Button>
            <Button
              variant={filterType === "commission" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("commission")}
            >
              عمولات
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 hover:shadow-md transition-all ${getTypeColor(transaction.type)}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 rounded-xl bg-white shadow-sm">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-bold text-slate-900">
                        {getTypeLabel(transaction.type)}
                      </p>
                      {getStatusBadge(transaction.status)}
                      {transaction.commission_amount > 0 && (
                        <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                          عمولة: {transaction.commission_amount.toLocaleString('ar-SA')} ر.س
                        </Badge>
                      )}
                    </div>
                    {transaction.description && (
                      <p className="text-sm text-slate-700 mb-1">{transaction.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{moment(transaction.created_date).format('DD/MM/YYYY - HH:mm')}</span>
                      <span>•</span>
                      <span>{moment(transaction.created_date).fromNow()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <p className={`text-xl font-bold ${
                    transaction.type === "withdrawal" || 
                    transaction.type === "withdrawal_request" ||
                    transaction.type === "commission"
                      ? "text-red-600"
                      : "text-green-600"
                  }`}>
                    {transaction.type === "withdrawal" || 
                     transaction.type === "withdrawal_request" ||
                     transaction.type === "commission"
                      ? "-"
                      : "+"}{" "}
                    {(transaction.net_amount || transaction.amount).toLocaleString('ar-SA')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">ريال سعودي</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}