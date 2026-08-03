import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
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
import { Loader2, Plus, Upload, X, FileText, Paperclip, ShieldCheck, Calendar } from "lucide-react";

const EMPTY = { project_id: "", engineer_id: "", price: "", delivery_days: "", cover_letter: "", attachments: [] };

export default function AddProposalDialog({ open, onOpenChange, onCreated, preselectedProjectId }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [engineers, setEngineers] = useState([]);

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY, project_id: preselectedProjectId || "" });
    Promise.all([
      base44.entities.Project.list("-created_date", 200).catch(() => []),
      base44.entities.Engineer.filter({ status: "approved" }).catch(() => []),
    ]).then(([p, e]) => { setProjects(p); setEngineers(e); });
  }, [open]);

  const setField = (n, v) => setForm((p) => ({ ...p, [n]: v }));

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        if (file_url) urls.push(file_url);
      }
      setForm((p) => ({ ...p, attachments: [...(p.attachments || []), ...urls] }));
    } catch (err) {
      toast({ variant: "destructive", title: "فشل رفع الملف" });
    } finally { setUploading(false); }
  };

  const removeAtt = (i) => setForm((p) => ({ ...p, attachments: (p.attachments || []).filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project_id) return toast({ variant: "destructive", title: "المشروع مطلوب" });
    if (!form.engineer_id) return toast({ variant: "destructive", title: "مقدم الخدمة مطلوب" });
    if (!form.price) return toast({ variant: "destructive", title: "قيمة العرض مطلوبة" });

    setSaving(true);
    try {
      let actor = null;
      try { actor = await base44.auth.me(); } catch {}
      const projectTitle = projects.find((p) => p.id === form.project_id)?.title || "";

      const created = await base44.entities.Proposal.create({
        project_id: form.project_id,
        provider_type: "engineer",
        engineer_id: form.engineer_id,
        price: Number(form.price),
        delivery_days: form.delivery_days ? Number(form.delivery_days) : undefined,
        cover_letter: form.cover_letter,
        attachments: form.attachments,
        status: "pending",
      });

      await base44.entities.TaskActivityLog.create({
        project_id: form.project_id,
        task_id: created.id,
        task_title: `عرض على «${projectTitle}»`,
        actor_email: actor?.email || "",
        actor_name: actor?.full_name || actor?.email || "",
        action_type: "created",
        field_name: "proposal",
        old_value: "",
        new_value: `${form.price} ر.س / ${form.delivery_days || "—"} يوم`,
        summary: `تم إنشاء عرض جديد بقيمة ${form.price} ر.س لمشروع «${projectTitle}»`,
      }).catch(() => {});

      toast({ title: "تم إنشاء العرض", description: "أُضيف العرض وحدّثت الإحصائيات تلقائياً." });
      onCreated?.(created);
      onOpenChange?.(false);
    } catch (err) {
      toast({ variant: "destructive", title: "فشل إنشاء العرض", description: String(err?.message || err).slice(0, 140) });
    } finally { setSaving(false); }
  };

  const today = new Date().toLocaleDateString("ar-SA");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#C9A66B]" />
            إضافة عرض جديد
          </DialogTitle>
          <DialogDescription className="text-right flex items-center gap-1.5 justify-end">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C9A66B]" />
            هذه العملية متاحة للأدمن فقط وتُسجّل في سجل النشاط باسمك والتاريخ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>المشروع المرتبط <span className="text-red-500">*</span></Label>
              <Select value={form.project_id} onValueChange={(v) => setField("project_id", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>مقدم الخدمة <span className="text-red-500">*</span></Label>
              <Select value={form.engineer_id} onValueChange={(v) => setField("engineer_id", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="اختر المهندس" /></SelectTrigger>
                <SelectContent>
                  {engineers.map((en) => <SelectItem key={en.id} value={en.id}>{en.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>قيمة العرض (ر.س) <span className="text-red-500">*</span></Label>
              <Input type="number" value={form.price} onChange={(e) => setField("price", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>مدة التنفيذ (أيام)</Label>
              <Input type="number" value={form.delivery_days} onChange={(e) => setField("delivery_days", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>تاريخ التقديم</Label>
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-[#C9A66B]" />
                {today}
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>وصف العرض / رسالة العرض</Label>
              <Textarea rows={3} value={form.cover_letter} onChange={(e) => setField("cover_letter", e.target.value)} placeholder="تفاصيل العرض ومزاياه" className="resize-none" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>إرفاق ملفات</Label>
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-lg py-3 text-slate-500 hover:border-[#C9A66B] hover:text-[#C9A66B] transition-colors text-sm">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "جارٍ الرفع..." : "اختر الملفات"}
                </div>
                <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} disabled={uploading} />
              </label>
              {form.attachments?.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {form.attachments.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-xs">
                      <Paperclip className="w-3.5 h-3.5 text-[#C9A66B] shrink-0" />
                      <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-[#4A3F35]">
                        <FileText className="w-3.5 h-3.5 inline ml-1" />
                        {url.split("/").pop() || `مرفق ${idx + 1}`}
                      </a>
                      <button type="button" onClick={() => removeAtt(idx)} className="text-red-500 hover:bg-red-50 rounded p-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} disabled={saving}>إلغاء</Button>
            <Button type="submit" disabled={saving || uploading} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Plus className="w-4 h-4 ml-1" />}
              حفظ العرض
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}