import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";

export default function TaskFormModal({ open, onClose, onSave, initial, projects, loading }) {
  const [form, setForm] = useState({
    title: "", description: "", project_id: "", status: "todo",
    priority: "medium", assigned_to: "", due_date: "", start_date: "", progress: 0,
  });

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title || "",
        description: initial.description || "",
        project_id: initial.project_id || "",
        status: initial.status || "todo",
        priority: initial.priority || "medium",
        assigned_to: initial.assigned_to || "",
        due_date: initial.due_date || "",
        start_date: initial.start_date || "",
        progress: initial.progress || 0,
      });
    } else {
      setForm({ title: "", description: "", project_id: projects?.[0]?.id || "", status: "todo", priority: "medium", assigned_to: "", due_date: "", start_date: "", progress: 0 });
    }
  }, [initial, open]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>{initial ? "تعديل المهمة" : "مهمة جديدة"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input placeholder="عنوان المهمة *" value={form.title} onChange={e => set("title", e.target.value)} />
          <Textarea placeholder="وصف المهمة..." rows={3} value={form.description} onChange={e => set("description", e.target.value)} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">المشروع *</label>
              <Select value={form.project_id} onValueChange={v => set("project_id", v)}>
                <SelectTrigger><SelectValue placeholder="اختر مشروعاً" /></SelectTrigger>
                <SelectContent>
                  {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">الحالة</label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">قيد الانتظار</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                  <SelectItem value="on_hold">معلقة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">الأولوية</label>
              <Select value={form.priority} onValueChange={v => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">مرتفعة</SelectItem>
                  <SelectItem value="urgent">عاجلة 🚨</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">مُكلَّف لـ (بريد)</label>
              <Input placeholder="user@email.com" value={form.assigned_to} onChange={e => set("assigned_to", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">تاريخ البدء</label>
              <Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">تاريخ الاستحقاق</label>
              <Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} />
            </div>
          </div>

          {initial && (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">نسبة الإنجاز: {form.progress}%</label>
              <input type="range" min="0" max="100" step="5" value={form.progress}
                onChange={e => set("progress", Number(e.target.value))}
                className="w-full accent-blue-600" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onSave(form)} disabled={loading || !form.title || !form.project_id}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Save className="w-4 h-4 ml-1" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}