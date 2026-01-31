import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, CreditCard, AlertCircle, CheckCircle, Plus, Trash2, ListOrdered } from "lucide-react";
import { motion } from "framer-motion";
import { sendNotification } from "@/components/notifications/NotificationHelper";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function StripePaymentForm({ amount, onSuccess, processing, setProcessing, projectId, proposalId, projectTitle }) {
  const [error, setError] = useState(null);

  const handleStripeCheckout = async () => {
    // Check if running in iframe
    if (window.self !== window.top) {
      alert("الدفع بالبطاقة يعمل فقط من التطبيق المنشور. الرجاء فتح التطبيق في نافذة جديدة.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('createStripeCheckout', {
        amount,
        projectId,
        proposalId,
        projectTitle
      });

      if (response.data.url) {
        // Process escrow setup first
        await onSuccess();
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        setError("فشل إنشاء جلسة الدفع");
        setProcessing(false);
      }
    } catch (err) {
      console.error("Stripe checkout error:", err);
      setError("حدث خطأ في معالجة الدفع");
      setProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>الدفع ببطاقة الائتمان</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              سيتم تحويلك إلى صفحة دفع آمنة لإتمام العملية
            </p>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          <Button
            onClick={handleStripeCheckout}
            disabled={processing}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6 text-lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin ml-2" />
                جاري المعالجة...
              </>
            ) : (
              <>
                <CreditCard className="w-6 h-6 ml-2" />
                الدفع بالبطاقة ({amount.toLocaleString('ar-SA')} ريال)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("project");
  const proposalId = urlParams.get("proposal");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [project, setProject] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [engineer, setEngineer] = useState(null);
  const [client, setClient] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("wallet"); // wallet, stripe
  const [useMilestones, setUseMilestones] = useState(false);
  const [milestones, setMilestones] = useState([
    { title: "المرحلة الأولى - التصميم الأولي", percentage: 30, description: "" },
    { title: "المرحلة الثانية - التصميم النهائي", percentage: 40, description: "" },
    { title: "المرحلة الثالثة - التسليم", percentage: 30, description: "" }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      
      const [projectData] = await base44.entities.Project.filter({ id: projectId });
      const [proposalData] = await base44.entities.Proposal.filter({ id: proposalId });
      const [engineerData] = await base44.entities.Engineer.filter({ id: proposalData.engineer_id });
      const [clientData] = await base44.entities.Client.filter({ email: user.email });

      setProject(projectData);
      setProposal(proposalData);
      setEngineer(engineerData);
      setClient(clientData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const calculateFees = () => {
    const totalAmount = proposal.price;
    const platformCommission = totalAmount * 0.15; // 15% عمولة المنصة
    const technicalConsultantFee = totalAmount * 0.05; // 5% للمستشار الفني
    const legalConsultantFee = totalAmount * 0.03; // 3% للمستشار القانوني
    const engineerPayment = totalAmount - platformCommission;

    return {
      totalAmount,
      platformCommission,
      technicalConsultantFee,
      legalConsultantFee,
      engineerPayment
    };
  };

  const addMilestone = () => {
    setMilestones([...milestones, { title: "", percentage: 0, description: "" }]);
  };

  const removeMilestone = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const handlePayment = async () => {
    setProcessing(true);

    try {
      const fees = calculateFees();

      // Validate milestones if enabled
      if (useMilestones) {
        const totalPercentage = milestones.reduce((sum, m) => sum + Number(m.percentage), 0);
        if (totalPercentage !== 100) {
          alert("يجب أن يكون مجموع نسب المراحل 100%");
          setProcessing(false);
          return;
        }
      }

      // 1. Update proposal status
      await base44.entities.Proposal.update(proposalId, { status: "accepted" });

      // 2. Update project with escrow
      await base44.entities.Project.update(projectId, {
        status: "in_progress",
        assigned_engineer_id: proposal.engineer_id,
        escrow_amount: fees.totalAmount,
        escrow_status: "held",
        platform_commission: 15,
        technical_consultant_fee: fees.technicalConsultantFee,
        legal_consultant_fee: fees.legalConsultantFee,
        engineer_payment: fees.engineerPayment,
        payment_status: "escrowed"
      });

      // 3. Handle payment based on method
      if (paymentMethod === "wallet") {
        // Deduct from client wallet
        await base44.entities.Client.update(client.id, {
          wallet_balance: (client.wallet_balance || 0) - fees.totalAmount
        });

        // Create escrow transaction
        await base44.entities.Transaction.create({
          user_id: client.email,
          type: "escrow_hold",
          amount: fees.totalAmount,
          status: "completed",
          description: `حجز مبلغ مشروع: ${project.title}`,
          project_id: projectId,
          payment_method: "wallet",
          balance_before: client.wallet_balance || 0,
          balance_after: (client.wallet_balance || 0) - fees.totalAmount
        });
      } else if (paymentMethod === "stripe") {
        // Stripe payment will be handled in StripePaymentForm
        // Create pending transaction
        await base44.entities.Transaction.create({
          user_id: client.email,
          type: "escrow_hold",
          amount: fees.totalAmount,
          status: "pending",
          description: `حجز مبلغ مشروع: ${project.title}`,
          project_id: projectId,
          payment_method: "stripe"
        });
      }

      // 4. Create milestones if enabled
      if (useMilestones) {
        for (let i = 0; i < milestones.length; i++) {
          const milestone = milestones[i];
          await base44.entities.ProjectMilestone.create({
            project_id: projectId,
            title: milestone.title,
            description: milestone.description,
            amount: (fees.totalAmount * milestone.percentage) / 100,
            percentage: milestone.percentage,
            order: i + 1,
            status: "pending"
          });
        }
      }

      // 5. Assign random technical consultant
      const consultants = await base44.entities.Consultant.filter({ status: "approved" });
      if (consultants.length > 0) {
        const randomConsultant = consultants[Math.floor(Math.random() * consultants.length)];
        await base44.entities.Project.update(projectId, {
          technical_consultant_id: randomConsultant.id
        });

        // Notify technical consultant
        await sendNotification({
          recipientEmail: randomConsultant.email,
          title: "مشروع جديد للمراجعة الفنية",
          message: `تم تعيينك كمستشار فني لمشروع: ${project.title}`,
          type: "review",
          projectId: projectId,
          priority: "high"
        });
      }

      // 6. Assign random legal consultant
      const legalConsultants = await base44.entities.LegalConsultant.filter({ status: "approved" });
      if (legalConsultants.length > 0) {
        const randomLegal = legalConsultants[Math.floor(Math.random() * legalConsultants.length)];
        await base44.entities.Project.update(projectId, {
          legal_consultant_id: randomLegal.id
        });

        // Notify legal consultant
        await sendNotification({
          recipientEmail: randomLegal.email,
          title: "مشروع جديد لتوثيق العقد",
          message: `تم تعيينك كمستشار قانوني لمشروع: ${project.title}`,
          type: "project_update",
          projectId: projectId,
          priority: "high"
        });
      }

      // 7. Create contract
      await base44.entities.Contract.create({
        project_id: projectId,
        client_id: client.id,
        engineer_id: proposal.engineer_id,
        contract_type: "project_start",
        total_amount: fees.totalAmount,
        payment_terms: "دفعة كاملة بنظام الضمان",
        delivery_date: new Date(Date.now() + proposal.delivery_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "active"
      });

      // 8. Reject other proposals
      const allProposals = await base44.entities.Proposal.filter({ project_id: projectId });
      for (const p of allProposals) {
        if (p.id !== proposalId && p.status === "pending") {
          await base44.entities.Proposal.update(p.id, { status: "rejected" });
        }
      }

      // 9. Notify engineer
      await sendNotification({
        recipientEmail: engineer.email,
        title: "تم قبول عرضك!",
        message: `تم قبول عرضك على مشروع: ${project.title}. ابدأ العمل الآن.`,
        type: "project_update",
        projectId: projectId,
        priority: "high"
      });

      // 10. Notify admin
      await sendNotification({
        recipientEmail: "bytlylmstbyt@gmail.com",
        title: "مشروع جديد - دفع مكتمل",
        message: `تم دفع ${fees.totalAmount.toLocaleString('ar-SA')} ريال لمشروع: ${project.title}`,
        type: "payment",
        projectId: projectId,
        priority: "high"
      });

      alert("تم الدفع بنجاح! المبلغ محجوز في حساب الضمان.");
      navigate(createPageUrl("Dashboard"));

    } catch (error) {
      console.error("Error processing payment:", error);
      alert("حدث خطأ أثناء معالجة الدفع");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  if (!project || !proposal || !engineer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">خطأ في البيانات</h3>
            <p className="text-slate-600 mb-4">لم يتم العثور على بيانات الدفع</p>
            <Button onClick={() => navigate(createPageUrl("Projects"))}>
              العودة للمشاريع
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fees = calculateFees();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <ShieldCheck className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold gradient-text mb-2">
            الدفع الآمن بنظام الضمان
          </h1>
          <p className="text-slate-600">
            المبلغ سيُحجز في حساب ضمان بيتلي حتى إتمام المشروع
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Project Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>تفاصيل المشروع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">المشروع</p>
                  <p className="font-semibold">{project.title}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">المصمم</p>
                  <p className="font-semibold">{engineer.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">مدة التنفيذ</p>
                  <p className="font-semibold">{proposal.delivery_days} يوم</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">التخصص</p>
                  <p className="font-semibold">{engineer.specialization}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>تفاصيل الدفع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-600">قيمة العرض</span>
                  <span className="font-semibold">{fees.totalAmount.toLocaleString('ar-SA')} ريال</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-slate-500">عمولة بيتلي (15%)</span>
                  <span className="text-red-600">-{fees.platformCommission.toLocaleString('ar-SA')} ريال</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-slate-500">المستشار الفني (5%)</span>
                  <span className="text-blue-600">{fees.technicalConsultantFee.toLocaleString('ar-SA')} ريال</span>
                </div>
                <div className="flex justify-between py-2 text-sm border-b">
                  <span className="text-slate-500">المستشار القانوني (3%)</span>
                  <span className="text-blue-600">{fees.legalConsultantFee.toLocaleString('ar-SA')} ريال</span>
                </div>
                <div className="flex justify-between py-3 bg-green-50 rounded-lg px-3">
                  <span className="font-semibold text-green-900">صافي المصمم</span>
                  <span className="font-bold text-green-600">{fees.engineerPayment.toLocaleString('ar-SA')} ريال</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Escrow Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <ShieldCheck className="w-12 h-12 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-green-900 mb-2">حماية كاملة بنظام الضمان</h3>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>المبلغ محجوز في حساب ضمان بيتلي ولا يصل للمصمم إلا بعد موافقتك</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>مراجعة فنية من مستشار معتمد للتأكد من جودة العمل</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>توثيق قانوني للعقد من مستشار قانوني معتمد</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>يمكنك طلب 3 تعديلات مجانية من المصمم</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Method Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>طريقة الدفع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div
                  onClick={() => setPaymentMethod("wallet")}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === "wallet" 
                      ? "border-green-500 bg-green-50" 
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === "wallet" ? "border-green-500" : "border-slate-300"
                    }`}>
                      {paymentMethod === "wallet" && (
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">المحفظة</p>
                      <p className="text-sm text-slate-600">
                        الرصيد: {(client?.wallet_balance || 0).toLocaleString('ar-SA')} ريال
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod("stripe")}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === "stripe" 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === "stripe" ? "border-blue-500" : "border-slate-300"
                    }`}>
                      {paymentMethod === "stripe" && (
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">بطاقة ائتمان</p>
                      <p className="text-sm text-slate-600">Visa, Mastercard, mada</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Milestones Option */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5" />
                تقسيم المشروع إلى مراحل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={useMilestones}
                  onChange={(e) => setUseMilestones(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300"
                />
                <label className="text-sm text-slate-600">
                  تقسيم الدفعات على مراحل (يتم تحرير كل دفعة بعد موافقتك على المرحلة)
                </label>
              </div>

              {useMilestones && (
                <div className="space-y-3 mt-4">
                  {milestones.map((milestone, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-3">
                          <Input
                            placeholder="عنوان المرحلة"
                            value={milestone.title}
                            onChange={(e) => updateMilestone(index, "title", e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="النسبة %"
                            value={milestone.percentage}
                            onChange={(e) => updateMilestone(index, "percentage", e.target.value)}
                            min="0"
                            max="100"
                          />
                        </div>
                        {milestones.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMilestone(index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={addMilestone}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة مرحلة
                  </Button>
                  <p className="text-sm text-slate-500 text-center">
                    المجموع: {milestones.reduce((sum, m) => sum + Number(m.percentage), 0)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stripe Payment Form */}
        {paymentMethod === "stripe" ? (
          <StripePaymentForm
            amount={fees.totalAmount}
            onSuccess={handlePayment}
            processing={processing}
            setProcessing={setProcessing}
            projectId={projectId}
            proposalId={proposalId}
            projectTitle={project.title}
          />
        ) : (
          /* Action Buttons */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4"
          >
            <Button
              onClick={handlePayment}
              disabled={processing || (client?.wallet_balance || 0) < fees.totalAmount}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-6 text-lg"
            >
              {processing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin ml-2" />
                  جاري المعالجة...
                </>
              ) : (
                <>
                  <CreditCard className="w-6 h-6 ml-2" />
                  تأكيد الدفع ({fees.totalAmount.toLocaleString('ar-SA')} ريال)
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={processing}
              className="px-8 py-6"
            >
              إلغاء
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}