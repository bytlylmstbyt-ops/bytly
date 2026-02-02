import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  FileCheck, Upload, Loader2, CheckCircle, 
  XCircle, AlertCircle, FileText, ArrowRight 
} from "lucide-react";
import { motion } from "framer-motion";

export default function ConsultantApprovalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const withdrawalId = searchParams.get("id");
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawal, setWithdrawal] = useState(null);
  const [engineer, setEngineer] = useState(null);
  const [consultant, setConsultant] = useState(null);
  
  const [formData, setFormData] = useState({
    compliance_status: "",
    saudi_code_notes: "",
    implementation_recommendations: "",
    consultant_notes: "",
    approved_report_file: ""
  });

  useEffect(() => {
    loadData();
  }, [withdrawalId]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      
      // Allow full admin access OR Engineering Consulting Firm
      if (user.role === "admin") {
        // Admin has full access - create admin consultant profile
        setConsultant({
          id: "admin",
          full_name: user.full_name || "المدير العام",
          email: user.email,
          wallet_balance: 0,
          total_reviews: 0
        });
      } else {
        // Load Engineering Firm profile
        const firms = await base44.entities.EngineeringFirm.filter({ 
          email: user.email 
        });
        
        // Fallback to old Consultant entity for backward compatibility
        const consultants = await base44.entities.Consultant.filter({ 
          email: user.email 
        });
        
        if (firms.length === 0 && consultants.length === 0) {
          alert("غير مصرح لك بالوصول لهذه الصفحة. يجب أن تكون شركة هندسية استشارية معتمدة.");
          navigate(-1);
          return;
        }
        
        setConsultant(firms[0] || consultants[0]);
      }
      
      // Load withdrawal request - if no ID, show all requests for admin
      if (!withdrawalId) {
        // No specific request, redirect to all requests page
        navigate(createPageUrl("AllWithdrawalRequests"));
        return;
      }
      
      const withdrawalData = await base44.entities.WithdrawalRequest.filter({ 
        id: withdrawalId 
      });
      
      if (withdrawalData.length === 0) {
        alert("طلب السحب غير موجود");
        navigate(-1);
        return;
      }
      
      setWithdrawal(withdrawalData[0]);
      
      // Load engineer data
      const engineerData = await base44.entities.Engineer.filter({ 
        id: withdrawalData[0].engineer_id 
      });
      
      if (engineerData.length > 0) {
        setEngineer(engineerData[0]);
      }
      
    } catch (error) {
      console.error("Error loading data:", error);
      alert("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("يجب أن يكون الملف بصيغة PDF");
      return;
    }

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, approved_report_file: file_url });
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("فشل رفع الملف");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.compliance_status) {
      alert("يجب اختيار حالة المطابقة");
      return;
    }
    if (!formData.saudi_code_notes) {
      alert("يجب إدخال ملاحظات الكود السعودي");
      return;
    }
    if (!formData.implementation_recommendations) {
      alert("يجب إدخال توصيات التنفيذ");
      return;
    }
    if (!formData.approved_report_file) {
      alert("يجب رفع ملف التقرير المعتمد");
      return;
    }

    setSubmitting(true);

    try {
      // Update withdrawal request with consultant approval
      await base44.entities.WithdrawalRequest.update(withdrawal.id, {
        consultant_approval: formData.compliance_status !== "rejected",
        consultant_id: consultant.id,
        consultant_approval_date: new Date().toISOString(),
        consultant_notes: formData.consultant_notes,
        compliance_status: formData.compliance_status,
        saudi_code_notes: formData.saudi_code_notes,
        implementation_recommendations: formData.implementation_recommendations,
        approved_report_file: formData.approved_report_file,
        status: formData.compliance_status === "rejected" ? "rejected" : "processing"
      });

      // Create transaction for consultant fee (if approved)
      if (formData.compliance_status !== "rejected") {
        const consultantFee = withdrawal.amount * 0.05; // 5% من المبلغ كأتعاب المستشار
        
        await base44.entities.Transaction.create({
          user_id: consultant.id,
          type: "commission",
          amount: consultantFee,
          status: "completed",
          description: `أتعاب استشارية - مراجعة طلب سحب رقم ${withdrawal.id}`
        });

        // Update firm wallet (if it's an engineering firm)
        const isFirm = consultant.company_name !== undefined;
        if (isFirm) {
          await base44.entities.EngineeringFirm.update(consultant.id, {
            wallet_balance: (consultant.wallet_balance || 0) + consultantFee,
            total_projects: (consultant.total_projects || 0) + 1
          });
        } else {
          // Fallback for old consultant entity
          await base44.entities.Consultant.update(consultant.id, {
            wallet_balance: (consultant.wallet_balance || 0) + consultantFee,
            total_reviews: (consultant.total_reviews || 0) + 1
          });
        }
      }

      alert(
        formData.compliance_status === "rejected" 
          ? "تم رفض الطلب وإرسال التقرير للمهندس" 
          : "تم اعتماد الطلب بنجاح وإضافة الأتعاب لمحفظتك"
      );
      
      navigate(-1);
    } catch (error) {
      console.error("Error submitting approval:", error);
      alert("حدث خطأ أثناء حفظ الاعتماد");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  if (!withdrawal) {
    return null;
  }

  return (
    <div className="min-h-screen py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold gradient-text mb-2">
            اعتماد طلب السحب
          </h1>
          <p className="text-slate-600">
            مراجعة واعتماد الطلب من قبل الشركة الهندسية الاستشارية المعتمدة
          </p>
        </motion.div>

        {/* Request Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#d4a574]" />
                معلومات الطلب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">اسم المهندس</Label>
                  <p className="font-medium">{engineer?.full_name}</p>
                </div>
                <div>
                  <Label className="text-slate-500">المبلغ المطلوب</Label>
                  <p className="font-bold text-xl text-[#1a1a2e]">
                    {withdrawal.amount.toLocaleString('ar-SA')} ريال
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500">رقم الآيبان</Label>
                  <p className="font-mono text-sm">{withdrawal.iban}</p>
                </div>
                <div>
                  <Label className="text-slate-500">البنك</Label>
                  <p>{withdrawal.bank_name}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  أتعاب المراجعة: {(withdrawal.amount * 0.05).toLocaleString('ar-SA')} ريال (5%)
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Approval Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-green-600" />
                نموذج تقرير الاعتماد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Compliance Status */}
                <div>
                  <Label htmlFor="compliance_status">
                    حالة المطابقة *
                  </Label>
                  <Select
                    value={formData.compliance_status}
                    onValueChange={(value) => setFormData({ ...formData, compliance_status: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر حالة المطابقة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compliant">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          مطابق للمواصفات
                        </div>
                      </SelectItem>
                      <SelectItem value="compliant_with_notes">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          مطابق مع ملاحظات
                        </div>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          مرفوض فنياً
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Saudi Code Notes */}
                <div>
                  <Label htmlFor="saudi_code_notes">
                    ملاحظات الكود السعودي *
                  </Label>
                  <Textarea
                    id="saudi_code_notes"
                    value={formData.saudi_code_notes}
                    onChange={(e) => setFormData({ ...formData, saudi_code_notes: e.target.value })}
                    placeholder="اكتب مدى التزام التصميم بالمعايير الوطنية والكود السعودي..."
                    rows={4}
                    required
                  />
                </div>

                {/* Implementation Recommendations */}
                <div>
                  <Label htmlFor="implementation_recommendations">
                    توصيات التنفيذ *
                  </Label>
                  <Textarea
                    id="implementation_recommendations"
                    value={formData.implementation_recommendations}
                    onChange={(e) => setFormData({ ...formData, implementation_recommendations: e.target.value })}
                    placeholder="نصائح وتوصيات للعميل عند البدء في التنفيذ على أرض الواقع..."
                    rows={4}
                    required
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <Label htmlFor="consultant_notes">
                    ملاحظات إضافية (اختياري)
                  </Label>
                  <Textarea
                    id="consultant_notes"
                    value={formData.consultant_notes}
                    onChange={(e) => setFormData({ ...formData, consultant_notes: e.target.value })}
                    placeholder="أي ملاحظات إضافية تود إضافتها..."
                    rows={3}
                  />
                </div>

                {/* Approved Report File */}
                <div>
                  <Label>
                    ملف التقرير المعتمد (PDF) *
                  </Label>
                  <p className="text-sm text-slate-500 mb-2">
                    قم برفع المخططات بعد وضع ختم المستشار الإلكتروني عليها
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id="report_file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('report_file').click()}
                    >
                      <Upload className="w-4 h-4 ml-2" />
                      رفع ملف PDF
                    </Button>
                    {formData.approved_report_file && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 ml-1" />
                        تم رفع الملف
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin ml-2" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 ml-2" />
                        اعتماد التقرير
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}