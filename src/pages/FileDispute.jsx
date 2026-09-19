import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { uploadScopedFile } from "@/lib/projectFileStorage";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Upload, FileText, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function FileDispute() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    project_id: "", milestone_id: "", dispute_type: "", title: "",
    description: "", priority: "medium", evidence_files: []
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) { navigate(createPageUrl("Login")); return; }
      setUser(currentUser);

      const { data, error } = await supabase.from("projects")
        .select("id,title,client_user_id,assigned_engineer_id,technical_consultant_id")
        .or(`client_user_id.eq.${currentUser.id},assigned_engineer_id.eq.${currentUser.id},technical_consultant_id.eq.${currentUser.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("FileDispute load error:", error);
      toast.error("تعذر تحميل المشاريع المرتبطة بحسابك");
    } finally { setIsLoading(false); }
  };

  const loadMilestones = async (projectId) => {
    setMilestones([]);
    setFormData(prev => ({ ...prev, project_id: projectId, milestone_id: "" }));
    if (!projectId) return;
    const { data, error } = await supabase.from("project_financial_milestones")
      .select("id,title,sequence_no,gross_amount,escrow_status,dispute_status")
      .eq("project_id", projectId).order("sequence_no");
    if (error) { toast.error("تعذر تحميل مراحل المشروع"); return; }
    setMilestones(data || []);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingFile(true);
    try {
      const uploadedUrls = [];
      for (const file of files) uploadedUrls.push(await uploadScopedFile("disputes", file));
      setFormData(prev => ({ ...prev, evidence_files: [...prev.evidence_files, ...uploadedUrls] }));
      toast.success(`تم رفع ${files.length} ملف`);
    } catch (error) {
      console.error(error);
      toast.error("تعذر رفع أحد الملفات");
    } finally { setUploadingFile(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.project_id || !formData.dispute_type || !formData.title.trim() || !formData.description.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة"); return;
    }
    setIsSubmitting(true);
    try {
      const project = projects.find(p => p.id === formData.project_id);
      if (!project) throw new Error("PROJECT_NOT_FOUND");
      const againstUserId = project.client_user_id === user.id ? project.assigned_engineer_id : project.client_user_id;

      if (formData.milestone_id) {
        const selected = milestones.find(m => m.id === formData.milestone_id);
        if (!selected) throw new Error("MILESTONE_NOT_FOUND");
        if (selected.dispute_status === "open") throw new Error("MILESTONE_ALREADY_IN_DISPUTE");
      }

      const { error } = await supabase.from("disputes").insert({
        project_id: project.id,
        milestone_id: formData.milestone_id || null,
        opened_by: user.id,
        against_user_id: againstUserId || null,
        raised_against: againstUserId || null,
        reason: formData.dispute_type,
        dispute_type: formData.dispute_type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        evidence_files: formData.evidence_files,
        messages: [],
        resolution_steps: [],
        admin_notes: [],
        status: "submitted"
      });
      if (error) throw error;

      if (formData.milestone_id) {
        const { error: milestoneError } = await supabase.from("project_financial_milestones")
          .update({ dispute_status: "open", release_status: "blocked", updated_at: new Date().toISOString() })
          .eq("id", formData.milestone_id).eq("project_id", project.id);
        if (milestoneError) throw milestoneError;
      }

      toast.success("تم تقديم النزاع بنجاح، وسيبقى مبلغ المرحلة محفوظًا حتى صدور قرار الإدارة.");
      navigate(createPageUrl("MyDisputes"));
    } catch (error) {
      console.error("FileDispute submit error:", error);
      toast.error(error.message === "MILESTONE_ALREADY_IN_DISPUTE" ? "هذه المرحلة لديها نزاع مفتوح بالفعل" : "تعذر تقديم النزاع");
    } finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8"><div className="flex items-center gap-3 mb-2"><ShieldAlert className="w-8 h-8 text-red-600" /><h1 className="text-3xl font-bold text-slate-900">تقديم النزاع</h1></div><p className="text-slate-600">نحن هنا لمساعدتك في حل أي مشكلة قد تواجهها</p></div>
        <Card className="border-0 shadow-lg"><CardHeader><CardTitle>معلومات النزاع</CardTitle><CardDescription>يرجى تقديم تفاصيل دقيقة لمساعدتنا في حل المشكلة</CardDescription></CardHeader>
          <CardContent><form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2"><Label>المشروع *</Label><Select value={formData.project_id} onValueChange={loadMilestones}><SelectTrigger><SelectValue placeholder="اختر المشروع المرتبط" /></SelectTrigger><SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select></div>
            {milestones.length > 0 && <div className="space-y-2"><Label>المرحلة المرتبطة بالنزاع (اختياري)</Label><Select value={formData.milestone_id} onValueChange={v => setFormData(p => ({...p,milestone_id:v}))}><SelectTrigger><SelectValue placeholder="اختر المرحلة" /></SelectTrigger><SelectContent>{milestones.map(m => <SelectItem key={m.id} value={m.id}>المرحلة {m.sequence_no}: {m.title} — {m.gross_amount} ر.س</SelectItem>)}</SelectContent></Select></div>}
            <div className="space-y-2"><Label>نوع النزاع *</Label><Select value={formData.dispute_type} onValueChange={v => setFormData(p => ({...p,dispute_type:v}))}><SelectTrigger><SelectValue placeholder="اختر نوع النزاع" /></SelectTrigger><SelectContent><SelectItem value="payment_issue">مشكلة دفع</SelectItem><SelectItem value="quality_issue">مشكلة جودة</SelectItem><SelectItem value="deadline_issue">مشكلة مواعيد</SelectItem><SelectItem value="contract_breach">خرق عقد</SelectItem><SelectItem value="communication_issue">مشكلة تواصل</SelectItem><SelectItem value="scope_change">تغيير في النطاق</SelectItem><SelectItem value="other">أخرى</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>الأولوية *</Label><Select value={formData.priority} onValueChange={v => setFormData(p => ({...p,priority:v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">منخفضة</SelectItem><SelectItem value="medium">متوسطة</SelectItem><SelectItem value="high">عالية</SelectItem><SelectItem value="urgent">عاجلة</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>عنوان النزاع *</Label><Input value={formData.title} onChange={e=>setFormData(p=>({...p,title:e.target.value}))} placeholder="مثال: تأخر في التسليم بدون مبرر" /></div>
            <div className="space-y-2"><Label>الوصف التفصيلي *</Label><Textarea value={formData.description} onChange={e=>setFormData(p=>({...p,description:e.target.value}))} placeholder="اشرح المشكلة بالتفصيل..." rows={6} /></div>
            <div className="space-y-2"><Label>الأدلة والمستندات</Label><div className="border-2 border-dashed rounded-lg p-6 text-center"><Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" /><p className="text-sm text-slate-600 mb-2">ارفع الصور أو المستندات الداعمة</p><input type="file" multiple onChange={handleFileUpload} className="hidden" id="file-upload" disabled={uploadingFile}/><label htmlFor="file-upload"><Button type="button" variant="outline" asChild disabled={uploadingFile}><span>{uploadingFile && <Loader2 className="w-4 h-4 animate-spin ml-2" />}اختر الملفات</span></Button></label></div>{formData.evidence_files.length>0&&<div className="mt-2 space-y-1">{formData.evidence_files.map((url,i)=><div key={i} className="flex items-center gap-2 text-sm text-slate-600"><FileText className="w-4 h-4"/><span>ملف {i+1}</span></div>)}</div>}</div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4"><div className="flex items-start gap-3"><AlertCircle className="w-5 h-5 text-amber-600 mt-0.5"/><div className="text-sm text-amber-800"><p className="font-medium mb-1">ملاحظة مهمة</p><p>سيتم مراجعة النزاع من قبل فريق الإدارة خلال 24 إلى 48 ساعة، وسيتم التواصل معك للوصول إلى حل عادل. فتح النزاع لا يعني استرداد المبلغ تلقائيًا؛ تبقى أموال المرحلة محفوظة حتى صدور قرار.</p></div></div></div>
            <div className="flex gap-3"><Button type="submit" disabled={isSubmitting||uploadingFile} className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">{isSubmitting&&<Loader2 className="w-5 h-5 animate-spin ml-2"/>}تقديم النزاع</Button><Button type="button" variant="outline" onClick={()=>navigate(-1)}>إلغاء</Button></div>
          </form></CardContent>
        </Card>
      </div>
    </div>
  );
}
