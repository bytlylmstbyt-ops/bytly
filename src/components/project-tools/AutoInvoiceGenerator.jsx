import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Receipt, Download, CheckCircle, Clock,
  Loader2, DollarSign, FileText, Calendar, RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function AutoInvoiceGenerator({ project, user }) {
  const [milestones, setMilestones] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [project.id]);

  const loadData = async () => {
    try {
      const [milestonesData, invoicesData] = await Promise.all([
        base44.entities.ProjectMilestone.filter({ project_id: project.id }),
        base44.entities.Invoice.filter({ project_id: project.id })
      ]);
      
      setMilestones(milestonesData.sort((a, b) => a.order - b.order));
      setInvoices(invoicesData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (milestone) => {
    if (milestone.status !== "completed") {
      alert("لا يمكن إصدار فاتورة لمرحلة غير مكتملة");
      return;
    }

    setGenerating(true);
    try {
      // Check if invoice already exists for this milestone
      const existingInvoice = invoices.find(inv => inv.milestone_id === milestone.id);
      if (existingInvoice) {
        alert("تم إصدار فاتورة لهذه المرحلة مسبقاً");
        setGenerating(false);
        return;
      }

      // Generate invoice number
      const invoiceNumber = `INV-${project.id.substring(0, 8)}-${milestone.order}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days payment term

      // Create invoice
      await base44.entities.Invoice.create({
        contract_id: project.contract_id || null,
        project_id: project.id,
        client_id: project.client_id,
        engineer_id: project.assigned_engineer_id,
        milestone_id: milestone.id,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        invoice_type: "milestone",
        amount: milestone.amount,
        percentage: milestone.percentage,
        total_amount: milestone.amount,
        description: `فاتورة ${milestone.title}`,
        payment_terms: "الدفع خلال 30 يوم من تاريخ الإصدار",
        status: "issued",
        payment_status: "unpaid"
      });

      await loadData();
      alert("تم إصدار الفاتورة بنجاح");
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("حدث خطأ في إصدار الفاتورة");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAllInvoices = async () => {
    if (!confirm("هل تريد إصدار فواتير لجميع المراحل المكتملة؟")) return;

    setGenerating(true);
    try {
      const completedMilestones = milestones.filter(m => m.status === "completed");
      
      for (const milestone of completedMilestones) {
        const existingInvoice = invoices.find(inv => inv.milestone_id === milestone.id);
        if (!existingInvoice) {
          await handleGenerateInvoice(milestone);
        }
      }

      alert("تم إصدار الفواتير بنجاح");
    } catch (error) {
      console.error("Error generating invoices:", error);
      alert("حدث خطأ في إصدار الفواتير");
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      issued: "bg-blue-100 text-blue-700",
      sent: "bg-amber-100 text-amber-700",
      paid: "bg-green-100 text-green-700",
      overdue: "bg-red-100 text-red-700",
      cancelled: "bg-slate-100 text-slate-700"
    };
    
    const labels = {
      issued: "صادرة",
      sent: "مرسلة",
      paid: "مدفوعة",
      overdue: "متأخرة",
      cancelled: "ملغاة"
    };

    return (
      <Badge className={styles[status] || styles.issued}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#6B5D4F] mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const completedMilestones = milestones.filter(m => m.status === "completed");
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalPaid = invoices.filter(inv => inv.payment_status === "paid").reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              إصدار الفواتير التلقائي
            </CardTitle>
            <Button 
              onClick={handleGenerateAllInvoices} 
              disabled={generating || completedMilestones.length === 0}
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <RefreshCw className="w-4 h-4 ml-2" />
              )}
              إصدار فواتير للمراحل المكتملة
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1a1a2e]">{invoices.length}</p>
                <p className="text-sm text-slate-600">إجمالي الفواتير</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1a1a2e]">{totalInvoiced.toLocaleString('ar-SA')}</p>
                <p className="text-sm text-slate-600">المبلغ المفوتر (ريال)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1a1a2e]">{totalPaid.toLocaleString('ar-SA')}</p>
                <p className="text-sm text-slate-600">المبلغ المدفوع (ريال)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>مراحل المشروع</CardTitle>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مراحل للمشروع</p>
            </div>
          ) : (
            <div className="space-y-3">
              {milestones.map((milestone) => {
                const hasInvoice = invoices.some(inv => inv.milestone_id === milestone.id);
                const isCompleted = milestone.status === "completed";
                
                return (
                  <div key={milestone.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{milestone.title}</h4>
                          {isCompleted ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 ml-1" />
                              مكتملة
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-700">
                              <Clock className="w-3 h-3 ml-1" />
                              {milestone.status === "in_progress" ? "قيد التنفيذ" : "قيد الانتظار"}
                            </Badge>
                          )}
                          {hasInvoice && (
                            <Badge className="bg-blue-100 text-blue-700">
                              <Receipt className="w-3 h-3 ml-1" />
                              تم إصدار فاتورة
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-slate-600">
                          <span>المبلغ: {milestone.amount?.toLocaleString('ar-SA')} ريال</span>
                          <span>النسبة: {milestone.percentage}%</span>
                        </div>
                      </div>
                      {isCompleted && !hasInvoice && (
                        <Button
                          size="sm"
                          onClick={() => handleGenerateInvoice(milestone)}
                          disabled={generating}
                        >
                          {generating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Receipt className="w-4 h-4 ml-1" />
                              إصدار فاتورة
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>الفواتير الصادرة</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لم يتم إصدار أي فواتير بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{invoice.invoice_number}</h4>
                        {getStatusBadge(invoice.status)}
                        {invoice.payment_status === "paid" && (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 ml-1" />
                            مدفوعة
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{invoice.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          تاريخ الإصدار: {format(new Date(invoice.invoice_date), "d MMM yyyy", { locale: ar })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          تاريخ الاستحقاق: {format(new Date(invoice.due_date), "d MMM yyyy", { locale: ar })}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          المبلغ: {invoice.total_amount?.toLocaleString('ar-SA')} ريال
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 ml-1" />
                      تحميل
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}