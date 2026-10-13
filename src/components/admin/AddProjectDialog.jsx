import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { uploadProjectFile } from "@/lib/projectFileStorage";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Upload, X, FileText, Paperclip, ShieldCheck } from "lucide-react";
import { logProjectChange } from "@/components/admin/logProjectChange";

const STATUS_OPTIONS = [
  { value: "open", label: "مفتوح" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "awaiting_technical_review", label: "بانتظار المراجعة الفنية" },
  { value: "technical_approved", label: "معتمد فنيًا" },
  { value: "pending_client_approval", label: "بانتظار موافقة العميل" },
  { value: "completed", label: "مكتمل" },
  { value: "cancelled", label: "ملغي" },
  { value: "disputed", label: "نزاع" },
];

const CATEGORY_OPTIONS = [
  { value: "interior", label: "تصميم داخلي" },
  { value: "architecture", label: "عمارة" },
  { value: "painting", label: "دهانات" },
  { value: "landscape", label: "تنسيق حدائق" },
  { value: "furniture", label: "أثاث" },
  { value: "lighting", label: "إضاءة" },
];

const TYPE_OPTIONS = [
  { value: "express_service", label: "خدمة سريعة" },
  { value: "full_construction", label: "بناء كامل" },
];

const EMPTY = {
  title: "", client_id: "", project_type: "express_service", category: "",
  location: "", address: "", budget_min: "", budget_max: "",
  start_date: "", deadline: "", status: "open",
  assigned_engineer_id: "", technical_consultant_id: "", description: "",
  attachments: [],
};

export default function AddProjectDialog({ open, onOpenChange, onCreated, onUpdated, project }) {
  const { toast } = useToast();
  const editing = !!project;
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [clients, setClients] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [firms, setFirms] = useState([]);

  // تحميل قوائم العملاء والمهندسين والمكاتب الاستشارية عند الفتح
  useEffect(() => {
    if (!open) return;
    setPendingFiles([]);
    if (project) {
      setForm({
        ...EMPTY,
        ...project,
        budget_min: project.budget_min ?? "",
        budget_max: project.budget_max ?? "",
        start_date: project.start_date || "",
        deadline: project.deadline || "",
        attachments: project.attachments || [],
      });
    } else {
      setForm(EMPTY);
    }
    Promise.all([
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("engineers").select("*").eq("status", "approved").order("created_at", { ascending: false }),
      supabase.from("engineering_firms").select("*").eq("status", "approved").order("created_at", { ascending: false }),
    ]).then(([c, e, f]) => {
      setClients(c.data || []);
      setEngineers(e.data || []);
      setFirms(f.data || []);
    });
  }, [open]);

  const setField = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  // رفع المرفقات
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      // For a new project, wait until the row exists so files use a valid project scope.
      if (!editing || !project?.id) {
        setPendingFiles((current) => [...current, ...Array.from(files)]);
        return;
      }
      const urls = [];
      for (const file of Array.from(files)) {
        const fileUrl = await uploadProjectFile(project.id, file);
        if (fileUrl) urls.push(fileUrl);
      }
      setForm((p) => ({ ...p, attachments: [...(p.attachments || []), ...urls] }));
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "فشل رفع الملف", description: String(err?.message || err).slice(0, 140) });
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (idx) => {
    setForm((p) => ({ ...p, attachments: (p.attachments || []).filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast({ variant: "destructive", title: "اسم المشروع مطلوب" });
    if (!form.client_id) return toast({ variant: "destructive", title: "العميل مطلوب" });
    if (!form.description.trim()) return toast({ variant: "destructive", title: "وصف المشروع مطلوب" });

    setSaving(true);
    try {
      const { data: { user: actor } } = await supabase.auth.getUser();

      const payload = {
        ...form,
        budget_min: form.budget_min === "" ? undefined : Number(form.budget_min),
        budget_max: form.budget_max === "" ? undefined : Number(form.budget_max),
        is_direct_hire: form.is_direct_hire ?? false,
      };

      const selectedClient = clients.find((c) => c.id === form.client_id);
      let clientUserId = selectedClient?.user_id || null;

      // Older client records may not have user_id populated. Resolve it through
      // the profile email before attempting to write the NOT NULL project owner.
      if (!clientUserId && selectedClient?.email) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("user_id")
          .ilike("email", selectedClient.email.trim())
          .maybeSingle();
        if (profileError) throw profileError;
        clientUserId = profile?.user_id || null;
      }

      if (!editing && !clientUserId) {
        toast({
          variant: "destructive",
          title: "تعذر ربط المشروع بحساب العميل",
          description: "ملف العميل المختار غير مرتبط بحساب دخول. حدّث ملف العميل واربطه بحسابه ثم أعد المحاولة.",
        });
        return;
      }

      const supabasePayload = {
        ...payload,
        client_id: selectedClient?.id || form.client_id,
        assigned_engineer_id: form.assigned_engineer_id || null,
        technical_consultant_id: form.technical_consultant_id || null,
      };
      // Never overwrite an existing owner UUID with null when editing legacy rows.
      if (clientUserId) supabasePayload.client_user_id = clientUserId;
      delete supabasePayload.id;
      delete supabasePayload.created_at;
      delete supabasePayload.updated_at;
      if (editing) {
        const { data: updated, error } = await supabase.from("projects").update(supabasePayload).eq("id", project.id).select().single();
        if (error) throw error;
        await logProjectChange(updated, supabasePayload, actor);
        toast({ title: "تم تحديث المشروع", description: "حُدّثت بيانات المشروع وحدّثت الإحصائيات تلقائياً." });
        onUpdated?.(updated);
        onCreated?.(updated);
        onOpenChange?.(false);
      } else {
        const { data: created, error } = await supabase.from("projects").insert(supabasePayload).select().single();
        if (error) throw error;
        let finalProject = created;
        let attachmentUploadFailed = false;
        if (pendingFiles.length) {
          try {
            const uploadedUrls = [];
            for (const file of pendingFiles) {
              const fileUrl = await uploadProjectFile(created.id, file);
              if (fileUrl) uploadedUrls.push(fileUrl);
            }
            if (uploadedUrls.length) {
              const { data: updatedWithFiles, error: filesUpdateError } = await supabase
                .from("projects")
                .update({ attachments: [...(created.attachments || []), ...uploadedUrls] })
                .eq("id", created.id)
                .select()
                .single();
              if (filesUpdateError) throw filesUpdateError;
              finalProject = updatedWithFiles;
            }
          } catch (uploadError) {
            attachmentUploadFailed = true;
            console.error("Project created but attachment upload failed", uploadError);
          }
        }
        setPendingFiles([]);
        toast(attachmentUploadFailed
          ? { variant: "destructive", title: "تم إنشاء المشروع، لكن تعذر رفع بعض المرفقات", description: "افتح المشروع وأعد رفع الملفات بعد التحقق من صلاحيات التخزين." }
          : { title: pendingFiles.length ? "تم إنشاء المشروع ورفع المرفقات" : "تم إنشاء المشروع", description: "حُفظ المشروع في Supabase." });
        onCreated?.(finalProject);
        onOpenChange?.(false);
      }
    } catch (err) {
      console.error("create project failed", err);
      toast({ variant: "destructive", title: "فشل إنشاء المشروع", description: String(err?.message || err).slice(0, 180) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#C9A66B]" />
            {editing ? "تعديل المشروع" : "إضافة مشروع جديد"}
          </DialogTitle>
          <DialogDescription className="text-right flex items-center gap-1.5 justify-end">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C9A66B]" />
            هذه العملية متاحة للأدمن فقط وتُسجّل في سجل النشاط باسمك والتاريخ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* اسم المشروع */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="block">اسم المشروع <span className="text-red-500">*</span></Label>
              <Input value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="مثال: تصميم فيلا سكنية" />
            </div>

            {/* العميل */}
            <div className="space-y-1.5">
              <Label className="block">العميل <span className="text-red-500">*</span></Label>
              <Select value={form.client_id} onValueChange={(v) => setField("client_id", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clients.length === 0 && <p className="text-[10px] text-amber-600">لا يوجد عملاء مسجلون بعد.</p>}
            </div>

            {/* حالة المشروع */}
            <div className="space-y-1.5">
              <Label className="block">حالة المشروع</Label>
              <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* نوع المشروع */}
            <div className="space-y-1.5">
              <Label className="block">نوع المشروع</Label>
              <Select value={form.project_type} onValueChange={(v) => setField("project_type", v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* تصنيف المشروع */}
            <div className="space-y-1.5">
              <Label className="block">تصنيف المشروع</Label>
              <Select value={form.category} onValueChange={(v) => setField("category", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* المدينة */}
            <div className="space-y-1.5">
              <Label className="block">المدينة</Label>
              <Input value={form.location} onChange={(e) => setField("location", e.target.value)} placeholder="مثال: الرياض" />
            </div>

            {/* عنوان المشروع */}
            <div className="space-y-1.5">
              <Label className="block">عنوان المشروع</Label>
              <Input value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="الحي / الشارع / التفاصيل" />
            </div>

            {/* الميزانية الأدنى */}
            <div className="space-y-1.5">
              <Label className="block">الميزانية التقديرية (الأدنى) ر.س</Label>
              <Input type="number" value={form.budget_min} onChange={(e) => setField("budget_min", e.target.value)} placeholder="0" />
            </div>

            {/* الميزانية الأقصى */}
            <div className="space-y-1.5">
              <Label className="block">الميزانية التقديرية (الأقصى) ر.س</Label>
              <Input type="number" value={form.budget_max} onChange={(e) => setField("budget_max", e.target.value)} placeholder="0" />
            </div>

            {/* تاريخ البداية */}
            <div className="space-y-1.5">
              <Label className="block">تاريخ البداية</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setField("start_date", e.target.value)} />
            </div>

            {/* تاريخ الانتهاء المتوقع */}
            <div className="space-y-1.5">
              <Label className="block">تاريخ الانتهاء المتوقع</Label>
              <Input type="date" value={form.deadline} onChange={(e) => setField("deadline", e.target.value)} />
            </div>

            {/* تعيين مهندس */}
            <div className="space-y-1.5">
              <Label className="block">تعيين مهندس</Label>
              <Select value={form.assigned_engineer_id} onValueChange={(v) => setField("assigned_engineer_id", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="بدون تعيين" /></SelectTrigger>
                <SelectContent>
                  {engineers.map((en) => (
                    <SelectItem key={en.id} value={en.id}>{en.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* تعيين مكتب استشاري */}
            <div className="space-y-1.5">
              <Label className="block">تعيين مكتب استشاري</Label>
              <Select value={form.technical_consultant_id} onValueChange={(v) => setField("technical_consultant_id", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="بدون تعيين" /></SelectTrigger>
                <SelectContent>
                  {firms.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* وصف المشروع */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="block">وصف المشروع <span className="text-red-500">*</span></Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="تفاصيل المشروع ومتطلباته" className="resize-none" />
            </div>

            {/* المرفقات */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="block">إرفاق الملفات والمخططات</Label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-lg py-3 text-slate-500 hover:border-[#C9A66B] hover:text-[#C9A66B] transition-colors text-sm">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "جارٍ الرفع..." : "اختر الملفات"}
                  </div>
                  <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} disabled={uploading} />
                </label>
              </div>
              {pendingFiles.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {pendingFiles.map((file, idx) => (
                    <div key={`${file.name}-${idx}`} className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs">
                      <Paperclip className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <button type="button" onClick={() => setPendingFiles((current) => current.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 rounded p-1" aria-label="إزالة المرفق المعلق">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <p className="text-[11px] text-amber-700">سيتم رفع هذه الملفات بعد إنشاء المشروع.</p>
                </div>
              )}
              {(form.attachments?.length > 0) && (
                <div className="space-y-1.5 mt-2">
                  {form.attachments.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-xs">
                      <Paperclip className="w-3.5 h-3.5 text-[#C9A66B] shrink-0" />
                      <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-[#4A3F35] hover:text-[#C9A66B]">
                        <FileText className="w-3.5 h-3.5 inline ml-1" />
                        {url.split("/").pop() || `مرفق ${idx + 1}`}
                      </a>
                      <button type="button" onClick={() => removeAttachment(idx)} className="text-red-500 hover:bg-red-50 rounded p-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button type="submit" disabled={saving || uploading} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Plus className="w-4 h-4 ml-1" />}
              حفظ المشروع
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}