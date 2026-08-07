import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CreditCard, Loader2, ExternalLink, Copy, Check, Search, FileText, DollarSign } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const STATUS_LABELS = {
  draft: { label: "مسودة", color: "bg-slate-100 text-slate-600" },
  sent: { label: "مرسلة", color: "bg-blue-100 text-blue-700" },
  paid: { label: "مدفوعة", color: "bg-green-100 text-green-700" },
  overdue: { label: "متأخرة", color: "bg-red-100 text-red-700" },
  cancelled: { label: "ملغاة", color: "bg-slate-100 text-slate-400" },
};

export default function SquareInvoicePayment() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(null);
  const [results, setResults] = useState({});
  const [copied, setCopied] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Invoice.list("-created_date", 50);
      setInvoices(data);
    } catch (err) {
      toast({ title: "تعذّر تحميل الفواتير", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleProcess = async (invoiceId) => {
    setProcessing(invoiceId);
    try {
      const res = await base44.functions.invoke("processSquarePayment", { invoice_id: invoiceId });
      setResults((prev) => ({ ...prev, [invoiceId]: res }));
      toast({ title: "✅ تم إنشاء رابط الدفع عبر Square" });
      // Update invoice status in local state
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? { ...inv, payment_method: "square", square_checkout_url: res.checkout_url, status: inv.status === "draft" ? "sent" : inv.status }
            : inv
        )
      );
    } catch (err) {
      toast({ title: "تعذّر معالجة الدفع", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = invoices.filter(
    (inv) =>
      !search ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.client_email?.toLowerCase().includes(search.toLowerCase()) ||
      inv.project_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#4A3F35]">دفع فواتير المشاريع عبر Square</h1>
          <p className="text-sm text-slate-500">
            أنشئ رابط دفع Square لأي فاتورة عميل وشاركه فوراً
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="ابحث برقم الفاتورة، بريد العميل، أو معرف المشروع..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="border-[#C9A66B]/20">
          <CardContent className="flex items-center gap-3 p-4">
            <FileText className="w-8 h-8 text-[#C9A66B]" />
            <div>
              <p className="text-2xl font-bold text-[#4A3F35]">{invoices.length}</p>
              <p className="text-xs text-slate-500">إجمالي الفواتير</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#C9A66B]/20">
          <CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-[#4A3F35]">
                {invoices.filter((i) => i.status === "paid").length}
              </p>
              <p className="text-xs text-slate-500">مدفوعة</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#C9A66B]/20">
          <CardContent className="flex items-center gap-3 p-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-[#4A3F35]">
                {invoices.filter((i) => i.payment_method === "square").length}
              </p>
              <p className="text-xs text-slate-500">عبر Square</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500">لا توجد فواتير مطابقة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => {
            const result = results[inv.id];
            const statusInfo = STATUS_LABELS[inv.status] || STATUS_LABELS.draft;
            const isPaid = inv.status === "paid";

            return (
              <Card key={inv.id} className="border-[#C9A66B]/15 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Invoice Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[#4A3F35]">
                          {inv.invoice_number || `INV-${inv.id.slice(-6)}`}
                        </span>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        {inv.payment_method === "square" && (
                          <Badge className="bg-[#C9A66B]/15 text-[#C9A66B]">Square</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 truncate">
                        {inv.client_email} {inv.client_company ? `· ${inv.client_company}` : ""}
                      </p>
                      {inv.project_id && (
                        <p className="text-xs text-slate-400 mt-0.5">مشروع: {inv.project_id.slice(-8)}</p>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="text-left">
                      <p className="text-lg font-bold text-[#4A3F35]">
                        {(inv.total_amount || inv.amount || 0).toFixed(2)} ر.س
                      </p>
                      {inv.tax_amount > 0 && (
                        <p className="text-xs text-slate-400">شامل ضريبة {inv.tax_amount.toFixed(2)} ر.س</p>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex flex-col gap-2 min-w-[160px]">
                      {result || inv.square_checkout_url ? (
                        <>
                          <a
                            href={result?.checkout_url || inv.square_checkout_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button className="w-full bg-[#6B5D4F] text-white hover:bg-[#4A3F35] h-10">
                              <ExternalLink className="w-4 h-4" />
                              فتح صفحة الدفع
                            </Button>
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() =>
                              handleCopy(result?.checkout_url || inv.square_checkout_url, inv.id)
                            }
                          >
                            {copied === inv.id ? (
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            نسخ الرابط
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => handleProcess(inv.id)}
                          disabled={processing === inv.id || isPaid}
                          className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90 h-10"
                        >
                          {processing === inv.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CreditCard className="w-4 h-4" />
                          )}
                          {isPaid ? "مدفوعة" : "دفع عبر Square"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}