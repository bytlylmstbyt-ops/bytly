import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  CreditCard, Plus, Loader2, CheckCircle2, Clock, Wallet,
  ArrowRight, Link2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TX_STATUS = {
  pending: { label: "معلقة", color: "bg-amber-100 text-amber-700" },
  completed: { label: "مكتملة", color: "bg-green-100 text-green-700" },
  failed: { label: "فشلت", color: "bg-red-100 text-red-700" },
  cancelled: { label: "ملغاة", color: "bg-slate-100 text-slate-500" },
  held_in_escrow: { label: "محجوزة في الضمان", color: "bg-blue-100 text-blue-700" },
};

const TX_TYPE = {
  deposit: "إيداع", withdrawal: "سحب",
  escrow_hold: "حجز ضمان", escrow_release: "تحرير ضمان",
  commission: "عمولة", refund: "استرداد",
  subscription: "اشتراك", payment: "دفعة",
  withdrawal_request: "طلب سحب", withdrawal_completed: "سحب مكتمل",
};

export default function ProjectPaymentsSection({
  project, transactions, user, userEngineer, onUpdated
}) {
  const [creating, setCreating] = useState(false);

  if (!user) return null;

  const isClient = project.created_by === user.email;
  const isEngineer = userEngineer && project.assigned_engineer_id === userEngineer.id;
  const canManage = isClient || user.role === "admin";

  const hasTx = transactions && transactions.length > 0;
  const totalAmount = hasTx
    ? transactions.filter(t => t.status === "completed").reduce((s, t) => s + (t.amount || 0), 0)
    : 0;

  const handleCreateFirstPayment = () => {
    // توجيه لصفحة الدفع لإنشاء أول دفعة
    const acceptedProposal = project.total_proposals > 0;
    window.location.href = createPageUrl("WalletTopup") + `?project=${project.id}`;
  };

  const handleLinkMilestonePayments = () => {
    // توجيه لصفحة فواتير المراحل
    window.location.href = createPageUrl("ProjectMilestones") + `?id=${project.id}`;
  };

  return (
    <Card className="border-0 shadow-lg" id="project-payments">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#C9A66B]" />
            المدفوعات والمعاملات
          </span>
          {hasTx && (
            <Badge variant="secondary">{transactions.length} معاملة</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasTx ? (
          /* لا توجد معاملات — أزرار إنشاء */
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-slate-600 font-medium mb-1">لا توجد معاملات بعد</p>
            <p className="text-sm text-slate-400 mb-4">
              ابدأ بإعداد الدفعات وربطها بمراحل المشروع
            </p>
            {canManage && (
              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                <Button
                  onClick={handleCreateFirstPayment}
                  className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2"
                >
                  <Plus className="w-4 h-4" />
                  إنشاء أول دفعة
                </Button>
                <Button
                  onClick={handleLinkMilestonePayments}
                  variant="outline"
                  className="gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  ربط جدول العقد بالدفعات
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* توجد معاملات — عرض الحالة والإجراءات */
          <div className="space-y-3">
            {/* ملخص */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">إجمالي المدفوعات المكتملة</p>
                <p className="font-bold text-green-700">{totalAmount.toLocaleString()} ر.س</p>
              </div>
            </div>

            {/* قائمة المعاملات */}
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx) => {
                const status = TX_STATUS[tx.status] || TX_STATUS.pending;
                return (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${status.color}`}>
                        {tx.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {TX_TYPE[tx.type] || tx.type}
                        </p>
                        <p className="text-xs text-slate-400">
                          {tx.created_date && new Date(tx.created_date).toLocaleDateString("ar-SA")}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-800">{tx.amount?.toLocaleString()} ر.س</p>
                      <Badge className={`text-xs ${status.color}`}>{status.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            {transactions.length > 5 && (
              <Link to={createPageUrl("MyContracts")}>
                <Button variant="ghost" className="w-full gap-1 text-[#C9A66B]">
                  عرض جميع المعاملات ({transactions.length})
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}