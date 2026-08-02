import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const INTERACTION_TYPES = [
  { value: "call", label: "مكالمة" },
  { value: "email", label: "بريد إلكتروني" },
  { value: "meeting", label: "اجتماع" },
  { value: "message", label: "رسالة" },
  { value: "note", label: "ملاحظة" },
];

export default function InteractionFormModal({ open, onOpenChange, onSaved, clients, preselectEmail }) {
  const [form, setForm] = useState({
    client_email: preselectEmail || "",
    interaction_type: "call",
    title: "",
    content: "",
    priority: "medium",
    follow_up_required: false,
    follow_up_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      client_email: preselectEmail || "",
      interaction_type: "call",
      title: "",
      content: "",
      priority: "medium",
      follow_up_required: false,
      follow_up_date: "",
    });
  }, [preselectEmail, open]);

  const handleSubmit = async () => {
    if (!form.client_email || !form.title || !form.content) {
      setError("العميل والعنوان والمحتوى مطلوبة");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await base44.entities.ClientInteraction.create({
        ...form,
        interaction_date: new Date().toISOString(),
        status: "open",
      });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تفاعل جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
          <div className="space-y-1.5">
            <Label>العميل *</Label>
            <select
              value={form.client_email}
              onChange={(e) => setForm({ ...form, client_email: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white cursor-pointer"
            >
              <option value="">اختر العميل...</option>
              {clients.map(c => (
                <option key={c.id} value={c.email}>{c.full_name} — {c.email}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>نوع التفاعل</Label>
              <select
                value={form.interaction_type}
                onChange={(e) => setForm({ ...form, interaction_type: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white cursor-pointer"
              >
                {INTERACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>الأولوية</Label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white cursor-pointer"
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="urgent">عاجلة</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>العنوان *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>المحتوى *</Label>
            <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.follow_up_required}
                onChange={(e) => setForm({ ...form, follow_up_required: e.target.checked })}
                className="w-4 h-4"
              />
              تتطلب متابعة
            </label>
            {form.follow_up_required && (
            <Input
              type="date"
              value={form.follow_up_date}
              onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
              className="w-auto"
            />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[#4A3F35] hover:bg-[#3a322a]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ التفاعل"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}