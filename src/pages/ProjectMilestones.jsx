import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, Clock, Upload, DollarSign, XCircle, FileUp, AlertCircle, Wallet } from "lucide-react";
import PaymentMethodChoice from "@/components/payment/PaymentMethodChoice";
import { motion } from "framer-motion";
import { sendNotification } from "@/components/notifications/NotificationHelper";

export default function ProjectMilestones() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [user, setUser] = useState(null);
  const [isEngineer, setIsEngineer] = useState(false);
  const [engineer, setEngineer] = useState(null);
  const [client, setClient] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submittingMilestone, setSubmittingMilestone] = useState(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [projectData] = await base44.entities.Project.filter({ id: projectId });
      setProject(projectData);

      const milestonesData = await base44.entities.ProjectMilestone.filter(
        { project_id: projectId },
        "order"
      );
      setMilestones(milestonesData);

      const [engineerData] = await base44.entities.Engineer.filter({ 
        id: projectData.assigned_engineer_id 
      });
      setEngineer(engineerData);
      setIsEngineer(engineerData?.email === currentUser.email);

      const [clientData] = await base44.entities.Client.filter({ 
        id: projectData.client_id 
      });
      setClient(clientData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitMilestone = async (milestone) => {
    if (!milestone.deliverable_files || milestone.deliverable_files.length === 0) {
      alert("يرجى رفع ملفات التسليم أولاً");
      return;
    }

    try {
      await base44.entities.ProjectMilestone.update(milestone.id, {
        status: "submitted",
        submitted_date: new Date().toISOString()
      });

      // Notify client
      await sendNotification({
        recipientEmail: client.email,
        title: "تم تقديم مرحلة جديدة",
        message: `قام المهندس بتقديم: ${milestone.title}. يرجى المراجعة والموافقة`,
        type: "milestone",
        projectId: projectId,
        priority: "high"
      });

      setSubmittingMilestone(null);
      await loadData();
    } catch (error) {
      console.error("Error submitting milestone:", error);
      alert("حدث خطأ في تقديم المرحلة");
    }
  };

  const uploadDeliverable = async (milestone, files) => {
    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }

      await base44.entities.ProjectMilestone.update(milestone.id, {
        deliverable_files: [...(milestone.deliverable_files || []), ...uploadedUrls],
        status: "in_progress"
      });

      await loadData();
    } catch (error) {
      console.error("Error uploading:", error);
      alert("حدث خطأ في رفع الملفات");
    } finally {
      setUploading(false);
    }
  };

  const approveMilestone = async (milestone) => {
    // Check if firm approval is required and not yet approved (only for full construction projects)
    if (project.project_type === "full_construction" && !milestone.firm_approved) {
      alert("يجب اعتماد المرحلة من الشركة الاستشارية أولاً قبل تحرير الدفع");
      return;
    }

    try {
      const now = new Date().toISOString();
      
      // Calculate commission (15% platform fee for projects)
      const commissionRate = 0.15;
      const commissionAmount = milestone.amount * commissionRate;
      const netAmount = milestone.amount - commissionAmount;

      // Update milestone status
      await base44.entities.ProjectMilestone.update(milestone.id, {
        client_approved: true,
        client_approval_date: now,
        payment_released: true,
        payment_release_date: now,
        status: "approved",
        completion_date: now
      });

      // Move from pending to available balance (after commission)
      const currentPending = engineer.pending_balance || 0;
      const currentAvailable = engineer.available_balance || 0;

      await base44.entities.Engineer.update(engineer.id, {
        pending_balance: currentPending - milestone.amount,
        available_balance: currentAvailable + netAmount
      });

      // Create escrow release transaction
      await base44.entities.Transaction.create({
        user_email: engineer.email,
        user_type: "engineer",
        type: "escrow_release",
        amount: milestone.amount,
        commission_amount: commissionAmount,
        net_amount: netAmount,
        status: "completed",
        description: `تحرير دفعة: ${milestone.title} (بعد خصم 15% عمولة)`,
        project_id: projectId,
        milestone_id: milestone.id,
        from_wallet: "escrow",
        to_wallet: engineer.email
      });

      // Create commission transaction for platform
      await base44.entities.Transaction.create({
        user_email: "platform@bytly.com",
        user_type: "platform",
        type: "commission",
        amount: commissionAmount,
        status: "completed",
        description: `عمولة المنصة (15%) - ${milestone.title}`,
        project_id: projectId,
        milestone_id: milestone.id,
        from_wallet: engineer.email,
        to_wallet: "platform"
      });

      // Create platform revenue record
      await base44.entities.PlatformRevenue.create({
        source_type: "project_milestone",
        project_id: projectId,
        milestone_id: milestone.id,
        total_amount: milestone.amount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        seller_email: engineer.email,
        seller_earnings: netAmount,
        status: "collected",
        payment_date: now
      });

      // Deduct from client's locked funds
      await base44.entities.Client.update(client.id, {
        wallet_balance: (client.wallet_balance || 0) - milestone.amount
      });

      // Update project escrow
      await base44.entities.Project.update(projectId, {
        escrow_amount: (project.escrow_amount || 0) - milestone.amount
      });

      // Notify engineer with net amount breakdown
      await sendNotification({
        recipientEmail: engineer.email,
        title: "تم تحرير دفعة مرحلة",
        message: `تم تحرير ${netAmount.toLocaleString('ar-SA')} ريال (${milestone.amount.toLocaleString('ar-SA')} - 15% عمولة منصة) لمرحلة: ${milestone.title}`,
        type: "payment",
        projectId: projectId,
        priority: "high"
      });

      await loadData();
    } catch (error) {
      console.error("Error approving milestone:", error);
      alert("حدث خطأ في الموافقة");
    }
  };

  const handlePayMilestone = async (milestone) => {
    setSelectedMilestone(milestone);
    setShowPaymentDialog(true);
  };

  const payWithWallet = async () => {
    const milestone = selectedMilestone;
    
    if (client.wallet_balance < milestone.amount) {
      alert("رصيد المحفظة غير كافٍ");
      return;
    }

    setProcessingPayment(true);
    try {
      const now = new Date().toISOString();

      // Deduct from wallet and hold in escrow
      await base44.entities.Client.update(client.id, {
        wallet_balance: client.wallet_balance - milestone.amount
      });

      await base44.entities.ProjectMilestone.update(milestone.id, {
        status: 'in_progress',
        start_date: now
      });

      await base44.entities.Project.update(projectId, {
        escrow_amount: (project.escrow_amount || 0) + milestone.amount,
        escrow_status: 'held'
      });

      await base44.entities.Engineer.update(engineer.id, {
        pending_balance: (engineer.pending_balance || 0) + milestone.amount
      });

      await base44.entities.Transaction.create({
        user_email: client.email,
        user_type: 'client',
        type: 'escrow_hold',
        amount: milestone.amount,
        status: 'held_in_escrow',
        description: `حجز دفعة (من المحفظة): ${milestone.title}`,
        project_id: projectId,
        milestone_id: milestone.id,
        payment_method: 'wallet',
        balance_before: client.wallet_balance,
        balance_after: client.wallet_balance - milestone.amount
      });

      setShowPaymentDialog(false);
      await loadData();
    } catch (error) {
      console.error("Error paying with wallet:", error);
      alert("حدث خطأ في الدفع");
    } finally {
      setProcessingPayment(false);
    }
  };

  const payWithStripe = async () => {
    setProcessingPayment(true);
    try {
      const response = await base44.functions.invoke('createMilestoneCheckout', {
        milestone_id: selectedMilestone.id,
        project_id: projectId,
        success_url: `${window.location.origin}/payment-success?project_id=${projectId}`,
        cancel_url: `${window.location.origin}/project-milestones?id=${projectId}`
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      alert("حدث خطأ في إنشاء الدفع");
      setProcessingPayment(false);
    }
  };

  const requestInvoice = async () => {
    const milestone = selectedMilestone;
    
    setProcessingPayment(true);
    try {
      await base44.entities.Invoice.create({
        client_id: client.id,
        client_email: client.email,
        project_id: projectId,
        milestone_id: milestone.id,
        amount: milestone.amount,
        description: `فاتورة دفع مرحلة: ${milestone.title}`,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pending"
      });

      alert("تم إرسال طلب الفاتورة. سيتم التواصل معك قريباً");
      setShowPaymentDialog(false);
    } catch (error) {
      alert("حدث خطأ");
    } finally {
      setProcessingPayment(false);
    }
  };

  const requestRevision = async (milestone) => {
    if (!revisionNotes.trim()) {
      alert("يرجى إدخال ملاحظات التعديل");
      return;
    }

    try {
      await base44.entities.ProjectMilestone.update(milestone.id, {
        status: "revision_requested",
        revision_notes: revisionNotes,
        revision_count: (milestone.revision_count || 0) + 1
      });

      // Notify engineer
      await sendNotification({
        recipientEmail: engineer.email,
        title: "طلب تعديل على مرحلة",
        message: `طلب العميل تعديلات على: ${milestone.title}`,
        type: "milestone",
        projectId: projectId,
        priority: "high"
      });

      setRevisionNotes("");
      await loadData();
    } catch (error) {
      console.error("Error requesting revision:", error);
      alert("حدث خطأ في طلب التعديل");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600">المشروع غير موجود</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedMilestones = milestones.filter(m => m.status === "approved").length;
  const progress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">
              مراحل المشروع
            </h1>
            <p className="text-slate-600">{project.title}</p>
          </div>

          {/* Progress Overview */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">التقدم الكلي</span>
                  <span className="text-sm text-slate-600">
                    {completedMilestones} من {milestones.length} مراحل مكتملة
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Milestones List */}
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={milestone.status === "approved" ? "border-green-300 bg-green-50/30" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="text-xs">
                            المرحلة {milestone.order}
                          </Badge>
                          {milestone.status === "approved" && (
                            <Badge className="bg-green-600 text-white text-xs">
                              <CheckCircle className="w-3 h-3 ml-1" />
                              مكتملة
                            </Badge>
                          )}
                          {milestone.status === "in_progress" && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              <Clock className="w-3 h-3 ml-1" />
                              قيد التنفيذ
                            </Badge>
                          )}
                          {milestone.status === "submitted" && (
                            <Badge className="bg-purple-600 text-white text-xs">
                              <FileUp className="w-3 h-3 ml-1" />
                              تم التقديم - بانتظار الموافقة
                            </Badge>
                          )}
                          {milestone.status === "revision_requested" && (
                            <Badge className="bg-amber-600 text-white text-xs">
                              <AlertCircle className="w-3 h-3 ml-1" />
                              مطلوب تعديل
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{milestone.title}</CardTitle>
                        {milestone.description && (
                          <p className="text-sm text-slate-600 mt-2">{milestone.description}</p>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-green-600">
                          {milestone.amount.toLocaleString('ar-SA')} ريال
                        </p>
                        <p className="text-xs text-slate-500">{milestone.percentage}% من المبلغ</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Revision Notes */}
                    {milestone.status === "revision_requested" && milestone.revision_notes && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm font-medium text-amber-800 mb-1">ملاحظات التعديل:</p>
                        <p className="text-sm text-amber-700">{milestone.revision_notes}</p>
                      </div>
                    )}

                    {/* Deliverable Files */}
                    {milestone.deliverable_files && milestone.deliverable_files.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800 mb-2 font-medium">الملفات المقدمة:</p>
                        <div className="space-y-2">
                          {milestone.deliverable_files.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline block"
                            >
                              📎 ملف {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Client Payment Action */}
                    {!isEngineer && milestone.status === "pending" && !milestone.payment_released && (
                      <div className="mb-4">
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg text-sm">
                          <p className="text-blue-800 mb-2">💡 نظام الدفع الآمن:</p>
                          <ul className="text-xs text-blue-700 space-y-1">
                            <li>• يُحجز المبلغ في نظام الضمان (Escrow)</li>
                            <li>• يُحرّر للمهندس بعد موافقتك على العمل</li>
                            <li>• يُخصم 15% عمولة منصة تلقائياً</li>
                          </ul>
                        </div>
                        <Button
                          onClick={() => handlePayMilestone(milestone)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <DollarSign className="w-4 h-4 ml-2" />
                          دفع المرحلة ({milestone.amount.toLocaleString('ar-SA')} ريال)
                        </Button>
                      </div>
                    )}

                    {/* Payment Method Dialog */}
                    <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>اختر طريقة الدفع</DialogTitle>
                        </DialogHeader>
                        {selectedMilestone && client && (
                          <PaymentMethodChoice
                            amount={selectedMilestone.amount}
                            walletBalance={client.wallet_balance || 0}
                            showInvoiceOption={client.client_type === "investor"}
                            onWalletPay={payWithWallet}
                            onStripePay={payWithStripe}
                            onInvoiceRequest={requestInvoice}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    {/* Engineer Actions */}
                    {isEngineer && (milestone.status === "pending" || milestone.status === "in_progress" || milestone.status === "revision_requested") && (
                      <div className="space-y-3">
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          <input
                            type="file"
                            multiple
                            onChange={(e) => uploadDeliverable(milestone, Array.from(e.target.files))}
                            className="hidden"
                            id={`upload-${milestone.id}`}
                          />
                          <label htmlFor={`upload-${milestone.id}`} className="cursor-pointer">
                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-600">رفع ملفات المرحلة</p>
                          </label>
                        </div>
                        
                        {milestone.deliverable_files && milestone.deliverable_files.length > 0 && milestone.status !== "submitted" && (
                          <Button
                            onClick={() => submitMilestone(milestone)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <FileUp className="w-4 h-4 ml-2" />
                            تقديم المرحلة للعميل
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Firm Approval Notice - Only for full construction projects */}
                    {project.project_type === "full_construction" && milestone.status === "submitted" && !milestone.firm_approved && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                        <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          <p className="font-medium">في انتظار اعتماد الشركة الاستشارية</p>
                          <p className="text-xs mt-1">الدفعة محجوزة حتى تتم المراجعة والاعتماد من قبل الشركة الهندسية الاستشارية</p>
                        </div>
                      </div>
                    )}

                    {/* Client Actions - After firm approval for full construction, or directly for express */}
                    {!isEngineer && (
                      (project.project_type === "full_construction" && milestone.status === "firm_approved") ||
                      (project.project_type === "express_service" && milestone.status === "submitted")
                    ) && !milestone.client_approved && (
                      <div className="space-y-3">
                        {project.project_type === "full_construction" && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <p className="text-sm text-green-800 font-semibold">
                                تم اعتماد المطابقة الفنية (SBC)
                              </p>
                            </div>
                            <div className="text-xs text-green-700 space-y-1">
                              <p>الشركة: {milestone.firm_name || "شركة استشارية معتمدة"}</p>
                              {milestone.balady_permit_number && (
                                <p>رقم الرخصة: {milestone.balady_permit_number}</p>
                              )}
                              <p>التاريخ: {new Date(milestone.firm_approval_date).toLocaleDateString('ar-SA')}</p>
                            </div>
                          </div>
                        )}

                        <div className="mb-3 p-3 bg-slate-50 rounded-lg text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-600">المبلغ الإجمالي:</span>
                            <span className="font-semibold">{milestone.amount.toLocaleString('ar-SA')} ريال</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>عمولة المنصة (15%):</span>
                            <span>- {(milestone.amount * 0.15).toLocaleString('ar-SA')} ريال</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t text-green-600 font-bold">
                            <span>صافي المهندس:</span>
                            <span>{(milestone.amount * 0.85).toLocaleString('ar-SA')} ريال</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => approveMilestone(milestone)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 ml-2" />
                          الموافقة وتحرير الدفعة
                        </Button>
                        
                        <div className="space-y-2">
                          <Textarea
                            placeholder="ملاحظات التعديل المطلوبة..."
                            value={revisionNotes}
                            onChange={(e) => setRevisionNotes(e.target.value)}
                            rows={3}
                          />
                          <Button
                            onClick={() => requestRevision(milestone)}
                            variant="outline"
                            className="w-full border-amber-500 text-amber-700 hover:bg-amber-50"
                          >
                            <XCircle className="w-4 h-4 ml-2" />
                            طلب تعديلات
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Payment Released Status */}
                    {milestone.payment_released && (
                      <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                        <DollarSign className="w-4 h-4" />
                        <span>تم تحرير الدفعة للمهندس في {new Date(milestone.payment_release_date).toLocaleDateString('ar-SA')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}