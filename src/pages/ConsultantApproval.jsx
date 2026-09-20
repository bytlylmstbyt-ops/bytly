import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { uploadScopedFile } from "@/lib/projectFileStorage";
import { createPageUrl } from "@/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Upload, Loader2, CheckCircle, XCircle, AlertCircle, FileText, ArrowRight } from "lucide-react";
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
  const [formData, setFormData] = useState({ compliance_status:"", saudi_code_notes:"", implementation_recommendations:"", consultant_notes:"", approved_report_file:"" });

  useEffect(() => { loadData(); }, [withdrawalId]);

  const loadData = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { navigate("/login"); return; }

      const { data: profile } = await supabase.from("profiles").select("role, full_name, email").eq("user_id", user.id).maybeSingle();
      let currentConsultant = null;

      if (profile?.role === "admin") {
        currentConsultant = { id:user.id, user_id:user.id, full_name:profile.full_name || "المدير العام", email:user.email, type:"admin" };
      } else {
        const { data: firm } = await supabase.from("engineering_firms").select("id, owner_user_id, company_name, email, wallet_balance, total_projects, status").eq("owner_user_id", user.id).maybeSingle();
        const { data: consultantProfile } = await supabase.from("consultants").select("id, user_id, full_name, email, status, consultant_kind, sce_professional_degree, sce_classification, engineers_society_membership_number, engineering_firm_id, verification_status").eq("user_id", user.id).maybeSingle();
        if (!firm && !consultantProfile) {
          alert("غير مصرح لك بالوصول لهذه الصفحة. يجب أن تكون استشاريًا فرديًا أو مكتبًا/شركة استشارية معتمدة.");
          navigate(-1); return;
        }
        currentConsultant = firm ? { ...firm, type:"engineering_firm", full_name:firm.company_name } : { ...consultantProfile, type:"consultant" };
      }
      setConsultant(currentConsultant);

      if (!withdrawalId) { navigate(createPageUrl("AllWithdrawalRequests")); return; }

      const { data: withdrawalData, error: withdrawalError } = await supabase.from("withdrawal_requests").select("*").eq("id", withdrawalId).maybeSingle();
      if (withdrawalError) throw withdrawalError;
      if (!withdrawalData) { alert("طلب السحب غير موجود"); navigate(-1); return; }
      setWithdrawal(withdrawalData);

      if (withdrawalData.engineer_id) {
        const { data: engineerData } = await supabase.from("engineers").select("id, full_name, email").eq("id", withdrawalData.engineer_id).maybeSingle();
        setEngineer(engineerData || null);
      }

      setFormData({
        compliance_status: withdrawalData.compliance_status || "",
        saudi_code_notes: withdrawalData.saudi_code_notes || "",
        implementation_recommendations: withdrawalData.implementation_recommendations || "",
        consultant_notes: withdrawalData.consultant_notes || "",
        approved_report_file: withdrawalData.approved_report_file || ""
      });
    } catch (error) {
      console.error("Error loading consultant approval data:", error);
      alert("حدث خطأ أثناء تحميل البيانات");
    } finally { setLoading(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { alert("يجب أن يكون الملف بصيغة PDF"); return; }
    try {
      const fileUrl = await uploadScopedFile("consultant-approvals", file);
      setFormData(current => ({ ...current, approved_report_file:fileUrl }));
    } catch (error) { console.error(error); alert("فشل رفع الملف"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.compliance_status) { alert("يجب اختيار حالة المطابقة"); return; }
    if (!formData.saudi_code_notes.trim()) { alert("يجب إدخال ملاحظات الكود السعودي"); return; }
    if (!formData.implementation_recommendations.trim()) { alert("يجب إدخال توصيات التنفيذ"); return; }
    if (!formData.approved_report_file) { alert("يجب رفع ملف التقرير المعتمد"); return; }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("approve_withdrawal_request", {
        p_withdrawal_id:withdrawal.id,
        p_compliance_status:formData.compliance_status,
        p_saudi_code_notes:formData.saudi_code_notes.trim(),
        p_implementation_recommendations:formData.implementation_recommendations.trim(),
        p_consultant_notes:formData.consultant_notes.trim(),
        p_approved_report_file:formData.approved_report_file
      });
      if (error) throw error;

      const fee = Number(data?.consultant_fee || 0).toLocaleString("ar-SA");
      const consultantLabel = data?.consultant_profile_type === "engineering_firm" ? "المكتب/الشركة الاستشارية" : "الاستشاري الفرد";
      alert(formData.compliance_status === "rejected"
        ? "تم رفض الطلب وإرسال التقرير للمهندس"
        : "تم اعتماد الطلب بنجاح وإضافة أتعاب المراجعة (" + fee + " ريال) لمحفظة " + consultantLabel);
      navigate(-1);
    } catch (error) {
      console.error("Error submitting approval:", error);
      const message = error?.message === "NOT_AUTHORIZED" ? "غير مصرح لك بتنفيذ اعتماد طلب السحب"
        : error?.message === "WITHDRAWAL_NOT_FOUND" ? "طلب السحب غير موجود"
        : error?.message === "WITHDRAWAL_ALREADY_FINAL" ? "هذا الطلب تم إنهاؤه مسبقًا ولا يمكن تعديله"
        : "حدث خطأ أثناء حفظ الاعتماد";
      alert(message);
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" /></div>;
  if (!withdrawal) return null;

  return (
    <div className="min-h-screen py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => { if (window.history.length > 1) navigate(-1); else navigate("/"); }} className="md:hidden flex items-center gap-1 text-slate-600 hover:text-slate-900 mb-4 transition-colors" aria-label="رجوع" style={{minHeight:44}}>
          <ArrowRight className="w-5 h-5" /><span className="text-sm">رجوع</span>
        </button>

        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="text-center">
          <h1 className="text-3xl font-bold gradient-text mb-2">اعتماد طلب السحب</h1>
          <p className="text-slate-600">مراجعة واعتماد الطلب من قبل استشاري فرد أو مكتب/شركة استشارية هندسية معتمدة</p>
        </motion.div>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-[#C9A66B]" />معلومات الطلب</CardTitle></CardHeader>
            <CardContent className="space-y-4"><div className="grid md:grid-cols-2 gap-4">
              <div><Label className="text-slate-500">اسم المهندس</Label><p className="font-medium">{engineer?.full_name || "غير متوفر"}</p></div>
              <div><Label className="text-slate-500">المبلغ المطلوب</Label><p className="font-bold text-xl text-[#1a1a2e]">{Number(withdrawal.amount||0).toLocaleString("ar-SA")} ريال</p></div>
              <div><Label className="text-slate-500">رقم الآيبان</Label><p className="font-mono text-sm">{withdrawal.iban || "غير متوفر"}</p></div>
              <div><Label className="text-slate-500">البنك</Label><p>{withdrawal.bank_name || "غير متوفر"}</p></div>
            </div><div className="pt-4 border-t"><Badge variant="outline" className="text-amber-600 border-amber-600">أتعاب المراجعة: {(Number(withdrawal.amount||0)*0.05).toLocaleString("ar-SA")} ريال (5%)</Badge></div></CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}}>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileCheck className="w-5 h-5 text-green-600" />نموذج تقرير الاعتماد</CardTitle></CardHeader>
            <CardContent><form onSubmit={handleSubmit} className="space-y-6">
              <div><Label>حالة المطابقة *</Label><Select value={formData.compliance_status} onValueChange={value=>setFormData({...formData,compliance_status:value})} required><SelectTrigger><SelectValue placeholder="اختر حالة المطابقة" /></SelectTrigger><SelectContent>
                <SelectItem value="compliant"><div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" />مطابق للمواصفات</div></SelectItem>
                <SelectItem value="compliant_with_notes"><div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-600" />مطابق مع ملاحظات</div></SelectItem>
                <SelectItem value="rejected"><div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-600" />مرفوض فنياً</div></SelectItem>
              </SelectContent></Select></div>
              <div><Label>ملاحظات الكود السعودي *</Label><Textarea value={formData.saudi_code_notes} onChange={e=>setFormData({...formData,saudi_code_notes:e.target.value})} placeholder="اكتب مدى التزام التصميم بالمعايير الوطنية والكود السعودي..." rows={4} required /></div>
              <div><Label>توصيات التنفيذ *</Label><Textarea value={formData.implementation_recommendations} onChange={e=>setFormData({...formData,implementation_recommendations:e.target.value})} placeholder="نصائح وتوصيات للعميل عند البدء في التنفيذ على أرض الواقع..." rows={4} required /></div>
              <div><Label>ملاحظات إضافية (اختياري)</Label><Textarea value={formData.consultant_notes} onChange={e=>setFormData({...formData,consultant_notes:e.target.value})} placeholder="أي ملاحظات إضافية تود إضافتها..." rows={3} /></div>
              <div><Label>ملف التقرير المعتمد (PDF) *</Label><p className="text-sm text-slate-500 mb-2">قم برفع المخططات بعد وضع ختم المستشار الإلكتروني عليها</p>
                <div className="flex items-center gap-3"><input type="file" id="report_file" accept=".pdf,application/pdf" onChange={handleFileUpload} className="hidden" />
                  <Button type="button" variant="outline" onClick={()=>document.getElementById("report_file")?.click()}><Upload className="w-4 h-4 ml-2" />رفع ملف PDF</Button>
                  {formData.approved_report_file && <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-4 h-4 ml-1" />تم رفع الملف</Badge>}
                </div>
              </div>
              <div className="flex gap-3 pt-4"><Button type="button" variant="outline" onClick={()=>navigate(-1)} className="flex-1">إلغاء</Button>
                <Button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                  {submitting ? <><Loader2 className="w-5 h-5 animate-spin ml-2" />جاري الحفظ...</> : <><CheckCircle className="w-5 h-5 ml-2" />اعتماد التقرير</>}
                </Button>
              </div>
            </form></CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
