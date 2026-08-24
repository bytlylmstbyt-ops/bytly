import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DollarSign, Users, Search, Wallet, CheckCircle,
  Clock, Download, RefreshCw
} from "lucide-react";
import jsPDF from "jspdf";

export default function CommissionManager() {
  const [loading, setLoading] = useState(true);
  const [engineers, setEngineers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [engineersData, projectsData, transactionsData] = await Promise.all([
        base44.entities.Engineer.filter({ status: "approved" }),
        base44.entities.Project.filter({ status: "completed" }, "-client_approval_date", 200),
        base44.entities.Transaction.filter({}, "-created_date", 500),
      ]);
      setEngineers(engineersData);
      setProjects(projectsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate earnings per engineer
  const engineerEarnings = engineers.map(engineer => {
    const engineerProjects = projects.filter(p => p.assigned_engineer_id === engineer.id);
    const completedProjects = engineerProjects.filter(p => p.status === "completed");
    
    const totalEarnings = completedProjects.reduce((sum, p) => sum + (p.engineer_payment || 0), 0);
    const totalCommission = completedProjects.reduce((sum, p) => sum + (p.platform_commission || 0), 0);
    const pendingAmount = engineer.pending_balance || 0;
    const availableAmount = engineer.available_balance || 0;

    // Check if there are completed but unpaid projects
    const unpaidProjects = completedProjects.filter(p => 
      p.payment_status !== "released" && p.payment_status !== "completed"
    );

    return {
      engineer,
      totalProjects: completedProjects.length,
      totalEarnings,
      totalCommission,
      pendingAmount,
      availableAmount,
      unpaidProjects,
      canDisburse: availableAmount > 0 || unpaidProjects.length > 0
    };
  }).filter(data => data.totalProjects > 0 || data.availableAmount > 0);

  const filteredData = engineerEarnings.filter(data => {
    const matchesSearch = data.engineer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         data.engineer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "pending" && data.unpaidProjects.length > 0) ||
                         (filterStatus === "paid" && data.unpaidProjects.length === 0);
    return matchesSearch && matchesStatus;
  });

  const handleDisburse = async (engineerId, amount) => {
    if (!confirm(`هل أنت متأكد من صرف ${amount.toLocaleString('ar-SA')} ريال؟`)) return;
    
    setProcessingId(engineerId);
    try {
      const result = await base44.functions.invoke('payFromWallet', {
        engineer_id: engineerId,
        amount: amount
      });
      
      if (result.data.success) {
        alert('تم صرف المستحقات بنجاح');
        loadData(); // Refresh data
      } else {
        alert('حدث خطأ أثناء الصرف: ' + (result.data.error || 'غير معروف'));
      }
    } catch (error) {
      console.error('Disbursement error:', error);
      alert('حدث خطأ أثناء الصرف: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const exportCommissionReport = (engineerData) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFont("helvetica");

    // Header
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(212, 165, 116);
    doc.setFontSize(22);
    doc.text("COMMISSION REPORT", 105, 18, { align: "center" });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text("Bytly - لمسة بيت", 105, 30, { align: "center" });

    // Engineer Info
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    let y = 52;
    doc.setFontSize(13);
    doc.setTextColor(26, 26, 46);
    doc.text("Engineer Details", 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Name: ${engineerData.engineer.full_name || "-"}`, 14, y); y += 6;
    doc.text(`Email: ${engineerData.engineer.email || "-"}`, 14, y); y += 6;
    doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, 14, y); y += 10;

    // Financial Summary
    doc.setFontSize(13);
    doc.setTextColor(26, 26, 46);
    doc.text("Financial Summary", 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    
    const summaryRows = [
      ["Total Projects", engineerData.totalProjects],
      ["Total Earnings", `${engineerData.totalEarnings.toLocaleString("en-SA")} SAR`],
      ["Platform Commission", `${engineerData.totalCommission.toLocaleString("en-SA")} SAR`],
      ["Pending Balance", `${engineerData.pendingAmount.toLocaleString("en-SA")} SAR`],
      ["Available Balance", `${engineerData.availableAmount.toLocaleString("en-SA")} SAR`],
    ];

    summaryRows.forEach(([label, value]) => {
      doc.text(`${label}:`, 14, y);
      doc.text(`${value}`, 155, y, { align: "right" });
      y += 8;
    });

    // Unpaid Projects
    if (engineerData.unpaidProjects.length > 0) {
      y += 5;
      doc.setFontSize(13);
      doc.setTextColor(26, 26, 46);
      doc.text("Unpaid Projects", 14, y);
      y += 7;
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);

      engineerData.unpaidProjects.slice(0, 10).forEach((p, idx) => {
        doc.text(`${idx + 1}. ${p.title} - ${p.engineer_payment || 0} SAR`, 14, y);
        y += 5;
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text("Generated by Bytly Platform | info@mybytly.com", 105, 285, { align: "center" });

    doc.save(`commission_${engineerData.engineer.id?.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-12 h-12 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  const totalPending = engineerEarnings.reduce((sum, e) => sum + e.pendingAmount, 0);
  const totalAvailable = engineerEarnings.reduce((sum, e) => sum + e.availableAmount, 0);
  const totalCommission = engineerEarnings.reduce((sum, e) => sum + e.totalCommission, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            إدارة عمولات المهندسين
          </h1>
          <p className="text-slate-600 mb-8">متابعة وصرف مستحقات المهندسين من المشاريع المكتملة</p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">إجمالي المهندسين</p>
              <p className="text-3xl font-bold text-purple-900">{engineerEarnings.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">مستحقات معلقة</p>
              <p className="text-3xl font-bold text-amber-900">{totalPending.toLocaleString('ar-SA')} <span className="text-lg">ر.س</span></p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">أرصدة متاحة</p>
              <p className="text-3xl font-bold text-green-900">{totalAvailable.toLocaleString('ar-SA')} <span className="text-lg">ر.س</span></p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">عمولات المنصة</p>
              <p className="text-3xl font-bold text-blue-900">{totalCommission.toLocaleString('ar-SA')} <span className="text-lg">ر.س</span></p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="بحث باسم المهندس أو البريد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                  size="sm"
                >
                  الكل
                </Button>
                <Button
                  variant={filterStatus === "pending" ? "default" : "outline"}
                  onClick={() => setFilterStatus("pending")}
                  size="sm"
                >
                  مستحقات معلقة
                </Button>
                <Button
                  variant={filterStatus === "paid" ? "default" : "outline"}
                  onClick={() => setFilterStatus("paid")}
                  size="sm"
                >
                  تم السداد
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engineers Table */}
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل أرباح المهندسين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">المهندس</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">المشاريع</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">إجمالي الأرباح</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">معلق</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">متاح</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">عمولات معلقة</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((data, idx) => (
                    <motion.tr
                      key={data.engineer.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center text-white font-bold">
                            {data.engineer.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{data.engineer.full_name}</p>
                            <p className="text-xs text-slate-500">{data.engineer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className="bg-blue-100 text-blue-700">
                          {data.totalProjects} مشروع
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-green-600">{data.totalEarnings.toLocaleString('ar-SA')} ر.س</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-amber-600">{data.pendingAmount.toLocaleString('ar-SA')} ر.س</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-green-600">{data.availableAmount.toLocaleString('ar-SA')} ر.س</p>
                      </td>
                      <td className="py-4 px-4">
                        {data.unpaidProjects.length > 0 ? (
                          <Badge className="bg-red-100 text-red-700">
                            {data.unpaidProjects.length} مشاريع
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 ml-1" />
                            مكتمل
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => exportCommissionReport(data)}
                            variant="outline"
                            size="sm"
                            className="gap-1"
                          >
                            <Download className="w-4 h-4" />
                            تقرير
                          </Button>
                          {data.canDisburse && (
                            <Button
                              onClick={() => handleDisburse(data.engineer.id, data.availableAmount)}
                              disabled={processingId === data.engineer.id || data.availableAmount === 0}
                              size="sm"
                              className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-1"
                            >
                              {processingId === data.engineer.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              صرف {data.availableAmount > 0 ? data.availableAmount.toLocaleString('ar-SA') : '0'} ر.س
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filteredData.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-16 h-16 mx-auto mb-3 opacity-20" />
                  <p>لا توجد بيانات مطابقة</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}