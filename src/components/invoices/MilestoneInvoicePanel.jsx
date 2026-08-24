import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CreditCard, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";

const statusConfig = {
  draft: { label: "مسودة", color: "bg-slate-100 text-slate-600", icon: FileText },
  sent: { label: "بانتظار السداد", color: "bg-amber-100 text-amber-700", icon: Clock },
  paid: { label: "مدفوعة", color: "bg-green-100 text-green-700", icon: CheckCircle },
  overdue: { label: "متأخرة", color: "bg-red-100 text-red-700", icon: AlertCircle },
  cancelled: { label: "ملغية", color: "bg-slate-100 text-slate-500", icon: FileText },
};

export default function MilestoneInvoicePanel({ projectId, milestoneId, isClient }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, [projectId, milestoneId]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const filter = milestoneId
        ? { milestone_id: milestoneId }
        : { project_id: projectId, invoice_type: "project_milestone" };
      const data = await base44.entities.Invoice.filter(filter, "-created_date");
      setInvoices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (invoice) => {
    if (window !== window.top) {
      alert("الدفع متاح فقط من التطبيق المنشور. يرجى فتح التطبيق في نافذة مستقلة.");
      return;
    }
    setPaying(invoice.id);
    try {
      const res = await base44.functions.invoke("payMilestoneInvoice", {
        invoice_id: invoice.id,
        success_url: `${window.location.origin}/PaymentSuccess?invoice=${invoice.id}`,
        cancel_url: window.location.href,
      });
      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPaying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (invoices.length === 0) return null;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-5 h-5 text-[#C9A66B]" />
          الفواتير الإلكترونية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invoices.map((invoice) => {
          const cfg = statusConfig[invoice.status] || statusConfig.draft;
          const StatusIcon = cfg.icon;
          return (
            <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-xl hover:border-[#C9A66B] transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#C9A66B]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#1a1a2e]">{invoice.invoice_number}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{invoice.notes}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">استحقاق: {invoice.due_date}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="font-bold text-[#1a1a2e]">{invoice.total_amount?.toLocaleString()} ر.س</p>
                <p className="text-xs text-slate-400">شامل الضريبة {invoice.tax_amount?.toLocaleString()} ر.س</p>
                <Badge className={`text-xs ${cfg.color} border-0`}>
                  <StatusIcon className="w-3 h-3 ml-1" />
                  {cfg.label}
                </Badge>
                {isClient && invoice.status === "sent" && (
                  <Button
                    size="sm"
                    onClick={() => handlePay(invoice)}
                    disabled={paying === invoice.id}
                    className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white text-xs h-8"
                  >
                    {paying === invoice.id ? (
                      <Loader2 className="w-3 h-3 animate-spin ml-1" />
                    ) : (
                      <CreditCard className="w-3 h-3 ml-1" />
                    )}
                    ادفع الآن
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}