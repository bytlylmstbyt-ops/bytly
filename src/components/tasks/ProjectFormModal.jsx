import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";

const COLORS = ["#6B5D4F","#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4"];

export default function ProjectFormModal({ open, onClose, onSave, initial, loading }) {
  const [form, setForm] = useState({ name: "", description: "", color: COLORS[0], due_date: "", start_date: "", budget_total: 0, budget_spent: 0 });

  useEffect(() => {
    setForm(initial
      ? {
          name: initial.name || "",
          description: initial.description || "",
          color: initial.color || COLORS[0],
          due_date: initial.due_date || "",
          start_date: initial.start_date || "",
          budget_total: initial.budget_total || 0,
          budget_spent: initial.budget_spent || 0,
        }
      : { name: "", description: "", color: COLORS[0], due_date: "", start_date: "", budget_total: 0, budget_spent: 0 }
    );
  }, [initial, open]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader><DialogTitle>{initial ? "تعديل المشروع" : "مشروع جديد"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <Input placeholder="اسم المشروع *" value={form.name} onChange={e => set("name", e.target.value)} />
          <Textarea placeholder="وصف المشروع..." rows={2} value={form.description} onChange={e => set("description", e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">تاريخ البدء</label>
              <Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">الموعد النهائي</label>
              <Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">الميزانية الإجمالية (ر.س)</label>
              <Input type="number" value={form.budget_total} onChange={e => set("budget_total", Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">المصروف الحالي (ر.س)</label>
              <Input type="number" value={form.budget_spent} onChange={e => set("budget_spent", Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-2 block">لون المشروع</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => set("color", c)}
                  className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onSave(form)} disabled={loading || !form.name}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Save className="w-4 h-4 ml-1" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}