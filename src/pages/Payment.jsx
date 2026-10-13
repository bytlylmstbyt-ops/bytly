import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck, CreditCard, AlertCircle, CheckCircle, Plus, Trash2, ListOrdered } from "lucide-react";
import { motion } from "framer-motion";

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
      if (!supabase) throw new Error("Supabase غير مهيأ");
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("يجب تسجيل الدخول أولاً");

      const { data: projectData, error: projectError } = await supabase
        .from("projects").select("*").eq("id", projectId).single();
      if (projectError) throw projectError;
      if (projectData.client_user_id && projectData.client_user_id !== user.id) {
        throw new Error("غير مصرح لك بالوصول إلى هذا المشروع");
      }

      const { data: proposalData, error: proposalError } = await supabase
        .from("project_offers").select("*").eq("id", proposalId).eq("project_id", projectId).single();
      if (proposalError) throw proposalError;

      const { data: engineerData, error: engineerError } = await supabase
        .from("profiles").select("*").eq("id", proposalData.engineer_user_id).single();
      if (engineerError) throw engineerError;

      const { data: clientData, error: clientError } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      if (clientError) throw clientError;

      const { data: wallet } = await supabase
        .from("wallet_accounts").select("available_balance, held_balance").eq("user_id", user.id).maybeSingle();

      setProject(projectData);
      setProposal({
        ...proposalData,
        price: Number(proposalData.amount || 0),
        delivery_days: proposalData.duration_days || 0,
        engineer_id: proposalData.engineer_user_id
      });
      setEngineer({
        ...engineerData,
        full_name: engineerData.full_name || engineerData.name || "مقدم الخدمة",
        specialization: engineerData.specialization || engineerData.professional_specialization || ""
      });
      setClient({
        ...clientData,
        full_name: clientData.full_name || clientData.name || "",
        wallet_balance: Number(wallet?.available_balance || 0)
      });
    } catch (error) {
      console.error("Error loading data:", error);
      alert(error?.message || "حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const calculateFees = () => {
    const totalAmount = proposal.price;
    const platformCommission = totalAmount * 0.15; // 15% عمولة المنصة
    const technicalConsultantFee = totalAmount * 0.05; // 5% للمستشار الفني
    const legalConsultantFee = totalAmount * 0.03; // 3% للمستشار القانوني عند استخدامه
    // صافي المصمم = إجمالي المشروع - عمولة بيتلي - أتعاب المستشار - أتعاب المستشار القانوني (إن وُجد)
    const engineerPayment = Math.max(0, totalAmount - platformCommission - technicalConsultantFee - legalConsultantFee);

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

  const handleTapPayment = async () => {
    alert('الدفع بالبطاقة عبر Tap القديم متوقف حتى يكتمل ربط Moyasar التجريبي. لم يتم خصم مبلغ أو تسجيل ضمان.');
    setProcessing(false);
  };

  const handleWalletPayment = async () => {
    setProcessing(true);
    try {
      const { data: authResult, error: authError } = await supabase.auth.getUser();
      const user = authResult && authResult.user;
      if (authError || !user) throw new Error('يجب تسجيل الدخول أولاً.');
      if (!project || project.client_user_id !== user.id) throw new Error('غير مصرح لك بالدفع لهذا المشروع.');
      if (!proposal || !proposal.engineer_id || proposal.engineer_id === user.id) throw new Error('مقدم الخدمة غير صالح.');
      const fees = calculateFees();
      if (useMilestones && milestones.reduce((sum, m) => sum + Number(m.percentage), 0) !== 100) throw new Error('يجب أن يكون مجموع نسب المراحل 100%.');
      const stages = useMilestones ? milestones : [{ title: 'دفعة المشروع', percentage: 100, description: '' }];
      const { data: wallet, error: walletError } = await supabase.from('clients').select('wallet_balance').eq('user_id', user.id).maybeSingle();
      if (walletError) throw walletError;
      const required = stages.reduce((sum, stage) => { const amount = Math.round((fees.totalAmount * Number(stage.percentage) / 100) * 100) / 100; return sum + amount + Math.round(amount * 15) / 100; }, 0);
      if (Number((wallet && wallet.wallet_balance) || 0) < required) throw new Error('رصيد المحفظة غير كافٍ للمبلغ شاملاً ضريبة القيمة المضافة.');
      const { error: assignmentError } = await supabase.from('projects').update({ assigned_engineer_id: proposal.engineer_id }).eq('id', projectId).eq('client_user_id', user.id);
      if (assignmentError) throw assignmentError;
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const amount = Math.round((fees.totalAmount * Number(stage.percentage) / 100) * 100) / 100;
        if (!String(stage.title || '').trim() || amount <= 0) throw new Error('عنوان المرحلة أو مبلغها غير صالح.');
        const { data: milestone, error: milestoneError } = await supabase.from('project_milestones').insert({ project_id: projectId, title: String(stage.title).trim(), description: stage.description || '', sequence_no: i + 1, status: 'pending', amount: amount, provider_user_id: proposal.engineer_id, provider_type: 'engineer', stage_weight: Number(stage.percentage) }).select('id').single();
        if (milestoneError) throw milestoneError;
        const { data: funded, error: fundError } = await supabase.rpc('fund_project_milestone_from_wallet', { p_project_id: projectId, p_milestone_id: milestone.id });
        if (fundError || !funded || !funded.ok) throw new Error((fundError && fundError.message) || 'تعذر حجز المرحلة في الضمان.');
      }
      const { error: offerError } = await supabase.from('project_offers').update({ status: 'accepted' }).eq('id', proposalId).eq('project_id', projectId);
      if (offerError) throw offerError;
      const { error: statusError } = await supabase.from('projects').update({ status: 'in_progress', escrow_status: 'held' }).eq('id', projectId).eq('client_user_id', user.id);
      if (statusError) throw statusError;
      alert('تم حجز المبلغ في الضمان بنجاح.');
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error('Supabase wallet payment error:', error);
      alert((error && error.message) || 'تعذر إكمال الدفع. لم يتم تأكيد العملية.');
    } finally {
      setProcessing(false);
    }
  };
  const handleCardPayment = async () => { alert("الدفع بالبطاقة في هذه الصفحة غير متاح حتى يكتمل ربط Moyasar التجريبي. لم يتم خصم أي مبلغ."); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#C9A66B]" />
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
                  onClick={() => setPaymentMethod("card")}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === "card" 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === "card" ? "border-blue-500" : "border-slate-300"
                    }`}>
                      {paymentMethod === "card" && (
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">بطاقة ائتمان</p>
                      <p className="text-sm text-slate-600">Visa, Mastercard, مدى</p>
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

        {/* Payment Forms */}
        {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4"
          >
            <Button
              onClick={paymentMethod === "wallet" ? handleWalletPayment : handleCardPayment}
              disabled={processing || (paymentMethod === "wallet" && (client?.wallet_balance || 0) < fees.totalAmount)}
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
                  {paymentMethod === "wallet" 
                    ? `الدفع من المحفظة (${fees.totalAmount.toLocaleString('ar-SA')} ريال)`
                    : "الدفع بالبطاقة غير متاح حالياً"
                  }
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
      </div>
    </div>
  );
}