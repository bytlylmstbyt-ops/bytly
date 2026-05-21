import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "new", label: "جديد", color: "text-blue-600" },
  { value: "contacted", label: "تم التواصل", color: "text-yellow-600" },
  { value: "interested", label: "مهتم", color: "text-orange-600" },
  { value: "contracted", label: "تعاقد", color: "text-green-600" },
  { value: "lost", label: "خسارة", color: "text-red-500" },
];

const SOURCE_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter / X" },
  { value: "facebook", label: "Facebook" },
  { value: "other", label: "أخرى" },
];

export default function LeadFormModal({ open, onClose, lead, onSave }) {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", source: "other",
    status: "new", notes: "", project_type: "", budget: "", follow_up_date: ""
  });

  useEffect(() => {
    if (lead) setForm({ ...form, ...lead });
    else setForm({ name: "", phone: "", email: "", source: "other", status: "new", notes: "", project_type: "", budget: "", follow_up_date: "" });
  }, [lead, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>{lead ? "تعديل العميل المحتمل" : "إضافة عميل محتمل"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>الاسم *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>رقم الهاتف</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>المصدر</Label>
              <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>نوع المشروع</Label>
              <Input value={form.project_type} onChange={e => setForm({ ...form, project_type: e.target.value })} placeholder="فيلا، شقة، مكتب..." />
            </div>
            <div>
              <Label>الميزانية</Label>
              <Input value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="مثال: 500,000 ريال" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>تاريخ المتابعة</Label>
              <Input type="date" value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>ملاحظات</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="أي ملاحظات شخصية عن هذا العميل..." />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            <Button type="submit" className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">حفظ</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}