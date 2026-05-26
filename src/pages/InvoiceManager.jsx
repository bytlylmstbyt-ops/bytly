import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  FileText, CheckCircle, Loader2, Building,
  CreditCard, Clock, BadgeCheck, XCircle, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES = {
  pending:   { cls: "bg-amber-100 text-amber-700",  label: "قيد الانتظار", Icon: Clock },
  sent:      { cls: "bg-blue-100 text-blue-700",    label: "بانتظار السداد", Icon: Clock },
  paid:      { cls: "bg-green-100 text-green-700",  label: "مدفوعة", Icon: BadgeCheck },
  cancelled: { cls: "bg-red-100 text-red-700",      label: "ملغية", Icon: XCircle },
};

export default function InvoiceManager() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [markingId, setMarkingId] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const filter = currentUser.role === "admin" ? {} : { client_email: currentUser.email };
    const data = await base44.entities.Invoice.filter(filter, "-created_date");
    setInvoices(data);
    setIsLoading(false);
  };

  // Stripe direct payment
  const handlePayNow = async (invoice) => {
    if (window.self !== window.top) {
      alert("الدفع يعمل فقط من التطبيق المنشور. يرجى فتح التطبيق في تبويب مستقل.");
      return;
    }
    setPayingId(invoice.id);
    const res = await base44.functions.invoke("payMilestoneInvoice", {
      invoice_id: invoice.id,
      success_url: `${window.location.origin}/PaymentSuccess?invoice=${invoice.id}`,
      cancel_url:  `${window.location.origin}/InvoiceManager`,
    });
    setPayingId(null);
    if (res.data?.checkout_url) window.location.href = res.data.checkout_url;
  };

  // Admin: manual mark as paid
  const handleMarkAsPaid = async (invoice) => {
    if (!confirm("هل تأكدت من استلام الدفع؟")) return;
    setMarkingId(invoice.id);
    try {
      await base44.entities.Invoice.update(invoice.id, {
        status: "paid",
        paid_date: new Date().toISOString()
      });
      if (invoice.milestone_id) {
        const [project] = await base44.entities.Project.filter({ id: invoice.project_id });
        const [engineer] = await base44.entities.Engineer.filter({ id: project?.assigned_engineer_id });
        const [client]   = await base44.entities.Client.filter({ id: invoice.client_id });
        if (invoice.milestone_id)
          await base44.entities.ProjectMilestone.update(invoice.milestone_id, { status: 'in_progress', start_date: new Date().toISOString() });
        if (project)
          await base44.entities.Project.update(project.id, { escrow_amount: (project.escrow_amount || 0) + invoice.amount, escrow_status: 'held' });
        if (engineer)
          await base44.entities.Engineer.update(engineer.id, { pending_balance: (engineer.pending_balance || 0) + invoice.amount });
        if (client)
          await base44.entities.Transaction.create({
            user_email: client.email, user_type: 'client', type: 'escrow_hold',
            amount: invoice.amount, status: 'held_in_escrow',
            description: `حجز دفعة (فاتورة)`, project_id: invoice.project_id, milestone_id: invoice.milestone_id
          });
      }
    } catch (e) { console.error(e); }
    setMarkingId(null);
    loadData();
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a2e] mb-1">الفواتير</h1>
            <p className="text-slate-500 text-sm">فواتير المراحل الإنشائية مع الدفع المباشر</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ml-1 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#C9A66B]" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600">لا توجد فواتير حتى الآن</h3>
            <p className="text-slate-400 text-sm mt-1">ستظهر الفواتير تلقائياً عند الموافقة على مراحل المشروع</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice, i) => {
              const st = STATUS_STYLES[invoice.status] || STATUS_STYLES.pending;
              const canPay = !isAdmin && ["sent", "pending"].includes(invoice.status);
              const canMarkPaid = isAdmin && ["sent", "pending"].includes(invoice.status);

              return (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 mt-1">
                          <FileText className="w-5 h-5 text-[#C9A66B]" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="font-bold text-[#1a1a2e] text-sm">{invoice.invoice_number || `#${invoice.id.slice(0,8)}`}</p>
                              <p className="text-slate-600 text-sm mt-0.5 line-clamp-1">{invoice.notes || 'فاتورة مشروع'}</p>
                            </div>
                            <Badge className={`${st.cls} text-xs shrink-0`}>
                              <st.Icon className="w-3 h-3 ml-1" />
                              {st.label}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                            {invoice.client_email && <span>📧 {invoice.client_email}</span>}
                            {invoice.issue_date  && <span>📅 الإصدار: {invoice.issue_date}</span>}
                            {invoice.due_date    && <span>⏰ الاستحقاق: {invoice.due_date}</span>}
                          </div>

                          {/* Amounts */}
                          <div className="flex items-center gap-4 mt-3 flex-wrap">
                            <div className="text-xs text-slate-400">
                              قبل الضريبة: <span className="text-slate-600 font-medium">{(invoice.amount || 0).toLocaleString('ar-SA')} ر.س</span>
                            </div>
                            {invoice.tax_amount > 0 && (
                              <div className="text-xs text-slate-400">
                                VAT 15%: <span className="text-slate-600 font-medium">{invoice.tax_amount.toLocaleString('ar-SA')} ر.س</span>
                              </div>
                            )}
                            <div className="text-base font-bold text-[#C9A66B]">
                              الإجمالي: {(invoice.total_amount || invoice.amount || 0).toLocaleString('ar-SA')} ر.س
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {(canPay || canMarkPaid) && (
                        <div className="flex justify-end mt-4 pt-3 border-t border-slate-100 gap-2">
                          {canPay && (
                            <Button
                              onClick={() => handlePayNow(invoice)}
                              disabled={payingId === invoice.id}
                              className="bg-gradient-to-r from-[#C9A66B] to-[#8B6914] hover:opacity-90 text-white text-sm"
                            >
                              {payingId === invoice.id
                                ? <><Loader2 className="w-4 h-4 animate-spin ml-1" /> جارٍ التحميل...</>
                                : <><CreditCard className="w-4 h-4 ml-1" /> ادفع الآن</>}
                            </Button>
                          )}
                          {canMarkPaid && (
                            <Button
                              onClick={() => handleMarkAsPaid(invoice)}
                              disabled={markingId === invoice.id}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {markingId === invoice.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <><CheckCircle className="w-4 h-4 ml-1" /> تأكيد الدفع</>}
                            </Button>
                          )}
                        </div>
                      )}

                      {invoice.status === 'paid' && (
                        <div className="flex justify-end mt-4 pt-3 border-t border-slate-100">
                          <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                            <BadgeCheck className="w-4 h-4" /> تم السداد
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}