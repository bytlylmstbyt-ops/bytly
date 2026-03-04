import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";

const COLORS = ["#6B5D4F","#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4"];

export default function ClientFormModal({ open, onClose, onSave, initial, loading }) {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", company: "", job_title: "",
    crm_status: "lead", notes: "", color: COLORS[0],
  });

  useEffect(() => {
    if (initial) {
      setForm({
        full_name: initial.full_name || initial.name || "",
        email: initial.email || "",
        phone: initial.phone || "",
        company: initial.company || "",
        job_title: initial.job_title || "",
        crm_status: initial.crm_status || "lead",
        notes: initial.notes || "",
        color: initial.color || COLORS[0],
      });
    } else {
      setForm({ full_name: "", email: "", phone: "", company: "", job_title: "", crm_status: "lead", notes: "", color: COLORS[0] });
    }
  }, [initial, open]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader><DialogTitle>{initial ? "تعديل العميل" : "عميل جديد"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">الاسم الكامل *</label>
              <Input value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="الاسم الكامل" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">البريد الإلكتروني *</label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@company.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">الهاتف</label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+966 5X XXX XXXX" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">الشركة</label>
              <Input value={form.company} onChange={e => set("company", e.target.value)} placeholder="اسم الشركة" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">المسمى الوظيفي</label>
              <Input value={form.job_title} onChange={e => set("job_title", e.target.value)} placeholder="مدير مشاريع..." />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">الحالة</label>
              <Select value={form.crm_status} onValueChange={v => set("crm_status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">عميل محتمل</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="churned">منسحب</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">اللون</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => set("color", c)}
                  className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">ملاحظات</label>
            <Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="ملاحظات عن العميل..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onSave(form)} disabled={loading || !form.full_name || !form.email}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Save className="w-4 h-4 ml-1" />}حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}