import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet, ArrowDownCircle, ArrowUpCircle, Shield } from "lucide-react";

const TX_TYPES = {
  deposit: "إيداع", withdrawal: "سحب", escrow_hold: "حجز ضمان", escrow_release: "تحرير ضمان",
  commission: "عمولة", refund: "استرداد", subscription: "اشتراك", payment: "دفع",
};

const TX_STATUS = {
  pending: "معلق", completed: "مكتمل", failed: "فشل", cancelled: "ملغي", held_in_escrow: "محجوز ضمان",
};

export default function PaymentsViewDialog({ project, open, onOpenChange }) {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !project?.id) return;
    setLoading(true);
    base44.entities.Transaction.filter({ project_id: project.id }, "-created_date", 50)
      .then(setTxs)
      .catch(() => setTxs([]))
      .finally(() => setLoading(false));
  }, [open, project?.id]);

  const escrow = project?.escrow_amount || 0;
  const released = project?.payment_status === "released" || project?.payment_status === "completed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#C9A66B]" />
            المدفوعات والمحفظة
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 max-h-[60vh] overflow-y-auto">
          {/* Wallet summary */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-3 rounded-lg bg-slate-50 text-center">
              <p className="text-xs text-slate-500">الضمان المحجوز</p>
              <p className="text-sm font-bold text-[#4A3F35]">{escrow.toLocaleString()} ر.س</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 text-center">
              <p className="text-xs text-slate-500">حالة الضمان</p>
              <p className="text-sm font-bold text-[#4A3F35]">
                {project?.escrow_status === "held" ? "محجوز" : project?.escrow_status === "released" ? "محرر" : project?.escrow_status === "refunded" ? "مسترد" : "—"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 text-center">
              <p className="text-xs text-slate-500">حالة الدفع</p>
              <p className="text-sm font-bold text-[#4A3F35]">
                {project?.payment_status === "unpaid" ? "غير مدفوع" : project?.payment_status === "escrowed" ? "محجوز" : project?.payment_status === "released" ? "محرر" : project?.payment_status === "completed" ? "مكتمل" : "—"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#C9A66B]" /></div>
          ) : txs.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">لا توجد معاملات مالية لهذا المشروع</p>
            </div>
          ) : (
            <div className="space-y-2">
              {txs.map((t) => {
                const isCredit = ["deposit", "escrow_release", "refund"].includes(t.type);
                const isEscrow = t.type === "escrow_hold" || t.type === "escrow_release";
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isEscrow ? "bg-blue-100" : isCredit ? "bg-green-100" : "bg-amber-100"}`}>
                      {isEscrow ? <Shield className="w-4 h-4 text-blue-600" /> : isCredit ? <ArrowDownCircle className="w-4 h-4 text-green-600" /> : <ArrowUpCircle className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#4A3F35]">{TX_TYPES[t.type] || t.type}</p>
                      <p className="text-xs text-slate-400">{new Date(t.created_date).toLocaleString("ar-SA")}</p>
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-bold ${isCredit ? "text-green-600" : "text-amber-600"}`}>
                        {isCredit ? "+" : "-"}{(t.amount || 0).toLocaleString()} ر.س
                      </p>
                      <Badge variant="outline" className="text-xs">{TX_STATUS[t.status] || t.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}