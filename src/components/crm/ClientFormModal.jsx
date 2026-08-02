import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export default function ClientFormModal({ open, onOpenChange, onSaved, editingClient }) {
  const [form, setForm] = useState({
    full_name: editingClient?.full_name || "",
    email: editingClient?.email || "",
    phone: editingClient?.phone || "",
    city: editingClient?.city || "",
    country: editingClient?.country || "السعودية",
    client_type: editingClient?.client_type || "individual",
    company_name: editingClient?.company_name || "",
    description: editingClient?.description || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    setForm({
      full_name: editingClient?.full_name || "",
      email: editingClient?.email || "",
      phone: editingClient?.phone || "",
      city: editingClient?.city || "",
      country: editingClient?.country || "السعودية",
      client_type: editingClient?.client_type || "individual",
      company_name: editingClient?.company_name || "",
      description: editingClient?.description || "",
    });
  }, [editingClient, open]);

  const handleSubmit = async () => {
    if (!form.full_name || !form.email) {
      setError("الاسم والبريد الإلكتروني مطلوبان");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editingClient) {
        await base44.entities.Client.update(editingClient.id, form);
      } else {
        await base44.entities.Client.create(form);
      }
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
          <DialogTitle>{editingClient ? "تعديل بيانات العميل" : "عميل جديد"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
          <div className="space-y-1.5">
            <Label>الاسم الكامل *</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>البريد الإلكتروني *</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>الهاتف</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>المدينة</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>نوع العميل</Label>
              <select
                value={form.client_type}
                onChange={(e) => setForm({ ...form, client_type: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white cursor-pointer"
              >
                <option value="individual">فرد (صاحب منزل)</option>
                <option value="investor">مستثمر / مطور</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>الشركة (للمستثمرين)</Label>
              <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>ملاحظات</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[#4A3F35] hover:bg-[#3a322a]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}