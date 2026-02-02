import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { 
  FileText, Download, Send, CheckCircle, Clock, 
  XCircle, Loader2, Building, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function InvoiceManager() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    setIsAdmin(currentUser.role === "admin");

    let invoicesData;
    if (currentUser.role === "admin") {
      invoicesData = await base44.entities.Invoice.filter({}, "-created_date");
    } else {
      invoicesData = await base44.entities.Invoice.filter(
        { client_email: currentUser.email },
        "-created_date"
      );
    }
    
    setInvoices(invoicesData);
    setIsLoading(false);
  };

  const handleMarkAsPaid = async (invoice) => {
    if (!confirm("هل تأكدت من استلام الدفع؟")) return;

    try {
      await base44.entities.Invoice.update(invoice.id, {
        status: "paid",
        paid_date: new Date().toISOString()
      });

      // Process the payment (add to escrow or complete transaction)
      if (invoice.milestone_id) {
        // Milestone payment
        const [milestone] = await base44.entities.ProjectMilestone.filter({ id: invoice.milestone_id });
        const [project] = await base44.entities.Project.filter({ id: invoice.project_id });
        const [engineer] = await base44.entities.Engineer.filter({ id: project.assigned_engineer_id });
        const [client] = await base44.entities.Client.filter({ id: invoice.client_id });

        await base44.entities.ProjectMilestone.update(invoice.milestone_id, {
          status: 'in_progress',
          start_date: new Date().toISOString()
        });

        await base44.entities.Project.update(invoice.project_id, {
          escrow_amount: (project.escrow_amount || 0) + invoice.amount,
          escrow_status: 'held'
        });

        await base44.entities.Engineer.update(engineer.id, {
          pending_balance: (engineer.pending_balance || 0) + invoice.amount
        });

        await base44.entities.Transaction.create({
          user_email: client.email,
          user_type: 'client',
          type: 'escrow_hold',
          amount: invoice.amount,
          status: 'held_in_escrow',
          description: `حجز دفعة (فاتورة): ${milestone.title}`,
          project_id: invoice.project_id,
          milestone_id: invoice.milestone_id,
          payment_method: 'bank_transfer'
        });
      }

      alert("تم تسجيل الدفع بنجاح");
      loadData();
    } catch (error) {
      alert("حدث خطأ");
    }
  };

  const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700"
  };

  const statusLabels = {
    pending: "قيد الانتظار",
    sent: "تم الإرسال",
    paid: "مدفوعة",
    cancelled: "ملغية"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">إدارة الفواتير</h1>
            <p className="text-slate-600">فواتير الدفع للشركات والمستثمرين</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-[#d4a574]" />
            </div>
          ) : invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.map((invoice, index) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Building className="w-5 h-5 text-slate-500" />
                            <h3 className="font-semibold text-lg">{invoice.description}</h3>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className={statusColors[invoice.status]}>
                              {statusLabels[invoice.status]}
                            </Badge>
                            <span className="text-sm text-slate-500">
                              #{invoice.id.slice(0, 8)}
                            </span>
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            <p>العميل: {invoice.client_email}</p>
                            <p>تاريخ الإصدار: {new Date(invoice.created_date).toLocaleDateString('ar-SA')}</p>
                            <p>تاريخ الاستحقاق: {new Date(invoice.due_date).toLocaleDateString('ar-SA')}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-3xl font-bold text-green-600">
                            {invoice.amount.toLocaleString('ar-SA')} ر.س
                          </p>
                          {isAdmin && invoice.status === "pending" && (
                            <Button
                              onClick={() => handleMarkAsPaid(invoice)}
                              size="sm"
                              className="mt-3 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 ml-1" />
                              تأكيد الدفع
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText className="w-20 h-20 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">لا توجد فواتير</h3>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}