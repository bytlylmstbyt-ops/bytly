import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle } from "lucide-react";
import moment from "moment";
import "moment/locale/ar";

moment.locale('ar');

export default function TransactionHistory({ transactions }) {
  const getTransactionIcon = (type) => {
    if (type === "withdrawal" || type === "withdrawal_request" || type === "withdrawal_completed") {
      return <ArrowUpRight className="w-5 h-5 text-red-600" />;
    }
    return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "قيد المعالجة", color: "bg-yellow-100 text-yellow-800" },
      completed: { label: "مكتمل", color: "bg-green-100 text-green-800" },
      failed: { label: "فشل", color: "bg-red-100 text-red-800" },
      cancelled: { label: "ملغي", color: "bg-slate-100 text-slate-800" }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTypeLabel = (type) => {
    const labels = {
      deposit: "إيداع",
      withdrawal: "سحب",
      escrow_hold: "حجز في الضمان",
      escrow_release: "تحرير من الضمان",
      subscription: "اشتراك",
      commission: "عمولة",
      refund: "استرداد",
      withdrawal_request: "طلب سحب",
      withdrawal_completed: "سحب مكتمل"
    };
    return labels[type] || type;
  };

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
    <Card>
      <CardHeader>
        <CardTitle>سجل المعاملات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="p-2 rounded-full bg-slate-100">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-slate-900">
                      {getTypeLabel(transaction.type)}
                    </p>
                    {getStatusBadge(transaction.status)}
                  </div>
                  {transaction.description && (
                    <p className="text-sm text-slate-600">{transaction.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {moment(transaction.created_date).fromNow()}
                  </p>
                </div>
              </div>
              <div className="text-left">
                <p className={`text-lg font-bold ${
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
                  {transaction.amount.toLocaleString('ar-SA')} ريال
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}