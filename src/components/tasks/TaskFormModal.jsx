import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Link2, X, Paperclip } from "lucide-react";
import DocumentsPanel from "./DocumentsPanel";

export default function TaskFormModal({ open, onClose, onSave, initial, projects, allTasks = [], loading }) {
  const [form, setForm] = useState({
    title: "", description: "", project_id: "", status: "todo",
    priority: "medium", assigned_to: "", due_date: "", start_date: "",
    due_time: "", start_time: "",
    progress: 0, cost: 0, dependencies: [],
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
        due_time: initial.due_time || "",
        start_time: initial.start_time || "",
        progress: initial.progress || 0,
        cost: initial.cost || 0,
        dependencies: initial.dependencies || [],
      });
    } else {
      setForm({ title: "", description: "", project_id: projects?.[0]?.id || "", status: "todo", priority: "medium", assigned_to: "", due_date: "", start_date: "", due_time: "", start_time: "", progress: 0, cost: 0, dependencies: [] });
    }
  }, [initial, open]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Tasks in the same project (excluding current)
  const siblingTasks = allTasks.filter(t => t.project_id === form.project_id && t.id !== initial?.id);

  const toggleDep = (taskId) => {
    setForm(p => ({
      ...p,
      dependencies: p.dependencies.includes(taskId)
        ? p.dependencies.filter(d => d !== taskId)
        : [...p.dependencies, taskId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{initial ? "تعديل المهمة" : "مهمة جديدة"}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="details">
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="details" className="text-xs">التفاصيل</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs flex items-center gap-1" disabled={!initial?.id}>
              <Paperclip className="w-3 h-3" />
              المستندات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            {initial?.id && <DocumentsPanel linkedTo="task" linkedId={initial.id} />}
          </TabsContent>

          <TabsContent value="details">
            <div className="space-y-3 py-2">
              <Input placeholder="عنوان المهمة *" value={form.title} onChange={e => set("title", e.target.value)} />
              <Textarea placeholder="وصف المهمة..." rows={2} value={form.description} onChange={e => set("description", e.target.value)} />

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

              <div>
                <label className="text-xs text-slate-500 mb-1 block">التكلفة (ر.س)</label>
                <Input type="number" value={form.cost} onChange={e => set("cost", Number(e.target.value))} placeholder="0" />
              </div>

              {initial && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">نسبة الإنجاز: {form.progress}%</label>
                  <input type="range" min="0" max="100" step="5" value={form.progress}
                    onChange={e => set("progress", Number(e.target.value))}
                    className="w-full accent-blue-600" />
                </div>
              )}

              {siblingTasks.length > 0 && (
                <div>
                  <label className="text-xs text-slate-500 mb-2 block">
                    التبعيات (مهام يجب اكتمالها أولاً)
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-lg border">
                    {siblingTasks.map(t => (
                      <button key={t.id} type="button" onClick={() => toggleDep(t.id)}
                        className={`text-xs px-2 py-1 rounded-full border transition-all ${form.dependencies.includes(t.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                        {t.title}
                      </button>
                    ))}
                  </div>
                  {form.dependencies.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">{form.dependencies.length} تبعية محددة</p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

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