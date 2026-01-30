import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { FileText, Download, Send, CreditCard, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InvoiceManager() {
  const [user, setUser] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const allInvoices = await base44.entities.Invoice.list();
    const userInvoices = allInvoices.filter(inv => 
      inv.client_id === currentUser.id || inv.engineer_id === currentUser.id
    );
    
    setInvoices(userInvoices);
    setFilteredInvoices(userInvoices);
    setLoading(false);
  };

  useEffect(() => {
    let filtered = invoices;

    if (statusFilter !== "all") {
      filtered = filtered.filter(inv => inv.payment_status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(inv => 
        inv.invoice_number.includes(searchQuery) || 
        inv.description.includes(searchQuery)
      );
    }

    setFilteredInvoices(filtered);
  }, [searchQuery, statusFilter, invoices]);

  const handlePayment = async (invoiceId) => {
    const response = await base44.functions.invoke('createPaymentCheckout', { invoiceId });
    if (response.data.checkout_url) {
      window.location.href = response.data.checkout_url;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      unpaid: 'bg-red-100 text-red-800',
      overdue: 'bg-red-200 text-red-900'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#1a1a2e] flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#d4a574]" />
            إدارة الفواتير
          </h1>
        </motion.div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="ابحث برقم الفاتورة أو الوصف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  الكل
                </Button>
                <Button
                  variant={statusFilter === "paid" ? "default" : "outline"}
                  onClick={() => setStatusFilter("paid")}
                >
                  المدفوعة
                </Button>
                <Button
                  variant={statusFilter === "unpaid" ? "default" : "outline"}
                  onClick={() => setStatusFilter("unpaid")}
                >
                  غير المدفوعة
                </Button>
                <Button
                  variant={statusFilter === "overdue" ? "default" : "outline"}
                  onClick={() => setStatusFilter("overdue")}
                >
                  المتأخرة
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-600 text-sm">إجمالي الفواتير</p>
                <p className="text-2xl font-bold text-[#1a1a2e]">{invoices.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-600 text-sm">المدفوعة</p>
                <p className="text-2xl font-bold text-green-600">
                  {invoices.filter(i => i.payment_status === 'paid').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-600 text-sm">غير المدفوعة</p>
                <p className="text-2xl font-bold text-red-600">
                  {invoices.filter(i => i.payment_status === 'unpaid').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-600 text-sm">الإجمالي المستحق</p>
                <p className="text-2xl font-bold text-amber-600">
                  {invoices
                    .filter(i => i.payment_status !== 'paid')
                    .reduce((sum, i) => sum + (i.total_amount || 0), 0)
                    .toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle>الفواتير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-3">رقم الفاتورة</th>
                    <th className="text-right p-3">المبلغ</th>
                    <th className="text-right p-3">تاريخ الاستحقاق</th>
                    <th className="text-right p-3">حالة الدفع</th>
                    <th className="text-right p-3">الحالة</th>
                    <th className="text-right p-3">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center p-6 text-slate-500">
                        لا توجد فواتير
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-medium">{invoice.invoice_number}</td>
                        <td className="p-3">{invoice.total_amount.toLocaleString()} ريال</td>
                        <td className="p-3">
                          {new Date(invoice.due_date).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(invoice.payment_status)}>
                            {invoice.payment_status === 'paid' ? 'مدفوعة' :
                             invoice.payment_status === 'partial' ? 'جزئية' : 'غير مدفوعة'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge>
                            {invoice.status === 'overdue' ? 'متأخرة' :
                             invoice.status === 'paid' ? 'مدفوعة' : 'قيد الانتظار'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {invoice.payment_status !== 'paid' && (
                              <Button
                                size="sm"
                                onClick={() => handlePayment(invoice.id)}
                                className="gap-1 bg-[#d4a574] hover:bg-[#c9a227]"
                              >
                                <CreditCard className="w-4 h-4" />
                                دفع
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}