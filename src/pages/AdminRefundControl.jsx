import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCcw, 
  Lock, Loader2, Search
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminRefundControl() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsList, milestonesList] = await Promise.all([
        base44.entities.Project.filter({ status: { $in: ["in_progress", "disputed", "cancelled"] } }),
        base44.entities.ProjectMilestone.filter({ payment_released: false })
      ]);

      setProjects(projectsList);
      setMilestones(milestonesList);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (refundType) => {
    if (!selectedMilestone) return;

    if (refundType === "partial" && (!refundAmount || parseFloat(refundAmount) <= 0)) {
      toast.error("يرجى إدخال مبلغ الاسترجاع");
      return;
    }

    if (!refundReason.trim()) {
      toast.error("يرجى إدخال سبب الاسترجاع");
      return;
    }

    setProcessing(true);
    try {
      const response = await base44.functions.invoke('processRefund', {
        milestone_id: selectedMilestone.id,
        project_id: selectedMilestone.project_id,
        refund_type: refundType,
        refund_amount: refundType === "full" ? selectedMilestone.amount : parseFloat(refundAmount),
        reason: refundReason
      });

      if (response.data.success) {
        toast.success("تم استرجاع المبلغ بنجاح");
        setSelectedMilestone(null);
        setRefundAmount("");
        setRefundReason("");
        await loadData();
      } else {
        toast.error("حدث خطأ في الاسترجاع");
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      toast.error("حدث خطأ في معالجة الاسترجاع");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  const milestonesWithProjects = milestones.map(m => {
    const project = projects.find(p => p.id === m.project_id);
    return { ...m, project };
  });

  const filteredMilestones = milestonesWithProjects.filter(m =>
    m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.project?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEscrow = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 py-8" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            إدارة الاسترجاعات والضمان
          </h1>
          <p className="text-slate-600 mb-8">استرجاع الأموال من نظام الضمان</p>
        </motion.div>

        {/* Total Escrow */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-lg mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">إجمالي الأموال في الضمان</p>
                  <p className="text-3xl font-bold text-amber-900">
                    {totalEscrow.toLocaleString('ar-SA')} ر.س
                  </p>
                </div>
              </div>
              <Badge className="text-lg px-4 py-2">
                {milestones.length} مرحلة معلقة
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
              <Input
                placeholder="بحث بعنوان المرحلة أو المشروع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-12"
              />
            </div>
          </CardContent>
        </Card>

        {/* Milestones List */}
        <Card>
          <CardHeader>
            <CardTitle>المراحل المعلقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-900">{milestone.title}</p>
                      <Badge className="bg-amber-100 text-amber-700">
                        <Lock className="w-3 h-3 ml-1" />
                        في الضمان
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{milestone.project?.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      المبلغ: {milestone.amount.toLocaleString('ar-SA')} ر.س
                    </p>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setSelectedMilestone(milestone);
                          setRefundAmount(milestone.amount.toString());
                        }}
                      >
                        <RefreshCcw className="w-4 h-4 ml-2" />
                        استرجاع
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>استرجاع الأموال من الضمان</DialogTitle>
                        <DialogDescription>
                          المرحلة: {selectedMilestone?.title} | المبلغ: {selectedMilestone?.amount.toLocaleString('ar-SA')} ر.س
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            نوع الاسترجاع
                          </label>
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => setRefundAmount(selectedMilestone?.amount.toString())}
                            >
                              استرجاع كامل
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => setRefundAmount("")}
                            >
                              استرجاع جزئي
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            المبلغ (ر.س)
                          </label>
                          <Input
                            type="number"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            placeholder="أدخل المبلغ..."
                            max={selectedMilestone?.amount}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            سبب الاسترجاع
                          </label>
                          <Textarea
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            placeholder="أدخل سبب الاسترجاع (مطلوب للتوثيق)..."
                            rows={3}
                          />
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-sm text-red-800">
                            <AlertCircle className="w-4 h-4 inline ml-1" />
                            <strong>تحذير:</strong> هذا الإجراء سيقوم بإرجاع المبلغ من الضمان إلى محفظة العميل وخصمه من الرصيد المعلق للمهندس.
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleRefund(parseFloat(refundAmount) === selectedMilestone?.amount ? "full" : "partial")}
                            disabled={processing}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                          >
                            {processing ? (
                              <Loader2 className="w-4 h-4 animate-spin ml-2" />
                            ) : (
                              <RefreshCcw className="w-4 h-4 ml-2" />
                            )}
                            تنفيذ الاسترجاع
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}