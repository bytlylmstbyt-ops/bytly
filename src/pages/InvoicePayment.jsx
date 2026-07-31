import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  FileText, Download, CheckCircle, Clock, Building,
  Calendar, DollarSign, Upload, Loader2, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function InvoicePayment() {
  const urlParams = new URLSearchParams(window.location.search);
  const invoiceId = urlParams.get("id");

  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    setIsLoading(true);
    const [invoiceData] = await base44.entities.Invoice.filter({ id: invoiceId });
    setInvoice(invoiceData);
    setIsLoading(false);
  };

  const handleUploadProof = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPaymentProof(file_url);
    setIsLoading(false);
  };

  const handleSubmitPayment = async () => {
    if (!paymentReference.trim()) {
      alert("يرجى إدخال رقم مرجع الدفع");
      return;
    }

    setIsSubmitting(true);

    try {
      await base44.entities.Invoice.update(invoiceId, {
        status: "paid",
        payment_date: new Date().toISOString(),
        payment_method: "bank_transfer",
        payment_reference: paymentReference,
        notes: paymentNotes
      });

      // Notify admin
      await base44.entities.Notification.create({
        recipient_email: "admin@bytly.com",
        title: "دفع فاتورة جديد",
        message: `تم تقديم دفعة للفاتورة ${invoice.invoice_number} بمبلغ ${invoice.total_amount.toLocaleString('ar-SA')} ريال`,
        type: "payment",
        priority: "high"
      });

      alert("تم إرسال إثبات الدفع بنجاح. سيتم مراجعته والتحقق منه خلال 24 ساعة");
      loadInvoice();
    } catch (error) {
      console.error("Error:", error);
      alert("حدث خطأ");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600">الفاتورة غير موجودة</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status !== "paid";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8" />
                  <div>
                    <CardTitle className="text-2xl">فاتورة رقم</CardTitle>
                    <p className="text-sm text-slate-200">#{invoice.invoice_number}</p>
                  </div>
                </div>
                <Badge className={
                  invoice.status === "paid" ? "bg-green-600" :
                  isOverdue ? "bg-red-600" :
                  "bg-amber-600"
                }>
                  {invoice.status === "paid" ? "مدفوعة" :
                   isOverdue ? "متأخرة" : "قيد الانتظار"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Invoice Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">الشركة</p>
                    <p className="font-semibold">{invoice.client_company}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">البريد الإلكتروني</p>
                    <p className="font-semibold">{invoice.client_email}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500">تاريخ الإصدار</p>
                      <p className="font-semibold">
                        {new Date(invoice.issue_date).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500">تاريخ الاستحقاق</p>
                      <p className="font-semibold">
                        {new Date(invoice.due_date).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="p-6 bg-slate-50 rounded-xl space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">المبلغ الأساسي:</span>
                  <span className="font-semibold">{invoice.amount.toLocaleString('ar-SA')} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ضريبة القيمة المضافة (15%):</span>
                  <span className="font-semibold">{(invoice.tax_amount || 0).toLocaleString('ar-SA')} ر.س</span>
                </div>
                <div className="flex justify-between pt-3 border-t-2 border-slate-200">
                  <span className="text-lg font-bold text-[#1a1a2e]">المبلغ الإجمالي:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {invoice.total_amount.toLocaleString('ar-SA')} ر.س
                  </span>
                </div>
              </div>

              {/* Payment Actions */}
              {invoice.status !== "paid" && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 mb-3 font-semibold">طرق الدفع المتاحة:</p>
                    <div className="space-y-2 text-sm text-blue-700">
                      <p>💳 التحويل البنكي المباشر</p>
                      <p>💰 الدفع عن طريق شيك</p>
                      <p>📧 إرسال إثبات الدفع للمراجعة</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>رقم مرجع الدفع / الشيك *</Label>
                      <Input
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="أدخل رقم مرجع التحويل أو الشيك"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>إثبات الدفع (اختياري)</Label>
                      <div className="border-2 border-dashed rounded-xl p-4 text-center">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleUploadProof}
                          className="hidden"
                          id="payment_proof"
                        />
                        <label htmlFor="payment_proof" className="cursor-pointer">
                          {paymentProof ? (
                            <div className="flex items-center justify-center gap-2 text-green-600">
                              <CheckCircle className="w-5 h-5" />
                              <span className="text-sm">تم رفع المستند</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                              <p className="text-sm text-slate-500">رفع صورة أو PDF للإثبات</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>ملاحظات (اختياري)</Label>
                      <Textarea
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="أي ملاحظات إضافية..."
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleSubmitPayment}
                      disabled={isSubmitting || !paymentReference}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-6 text-lg"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-6 h-6 animate-spin ml-2" />
                      ) : (
                        <>
                          <CheckCircle className="w-6 h-6 ml-2" />
                          تأكيد الدفع
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {invoice.status === "paid" && (
                <div className="p-6 bg-green-50 border-2 border-green-200 rounded-xl text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="text-lg font-semibold text-green-800 mb-2">تم الدفع</p>
                  <p className="text-sm text-green-700">
                    تاريخ السداد: {new Date(invoice.payment_date).toLocaleDateString('ar-SA')}
                  </p>
                  {invoice.payment_reference && (
                    <p className="text-xs text-green-600 mt-2">
                      رقم المرجع: {invoice.payment_reference}
                    </p>
                  )}
                </div>
              )}

              {invoice.invoice_file_url && (
                <a 
                  href={invoice.invoice_file_url} 
                  download 
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full">
                    <Download className="w-5 h-5 ml-2" />
                    تحميل الفاتورة PDF
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}