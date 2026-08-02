import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Star, Save } from "lucide-react";

const STATUS_LABEL = { approved: "معتمد", pending: "معلق", rejected: "موقوف/مرفوض" };
const STATUS_BADGE = {
  approved: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const EDIT_FIELDS = [
  { key: "company_name", label: "اسم الشركة", type: "text" },
  { key: "full_name", label: "الاسم الكامل", type: "text" },
  { key: "email", label: "البريد الإلكتروني", type: "email" },
  { key: "phone", label: "الهاتف", type: "text" },
  { key: "city", label: "المدينة", type: "text" },
  { key: "country", label: "الدولة", type: "text" },
  { key: "bio", label: "نبذة", type: "textarea" },
  { key: "description", label: "الوصف", type: "textarea" },
  { key: "specialization", label: "التخصص", type: "text" },
  { key: "website", label: "الموقع الإلكتروني", type: "text" },
  { key: "years_experience", label: "سنوات الخبرة", type: "number" },
  { key: "wallet_balance", label: "رصيد المحفظة", type: "number" },
  { key: "available_balance", label: "الرصيد المتاح", type: "number" },
  { key: "pending_balance", label: "الرصيد المعلق", type: "number" },
  { key: "iban", label: "رقم الآيبان", type: "text" },
  { key: "bank_name", label: "اسم البنك", type: "text" },
  { key: "account_holder_name", label: "اسم صاحب الحساب", type: "text" },
  { key: "status", label: "الحالة", type: "select", options: ["pending", "approved", "rejected"] },
  { key: "is_verified", label: "موثّق", type: "checkbox" },
  { key: "is_available", label: "متاح لاستقبال جديد", type: "checkbox" },
];

const DISPLAY_FIELDS = [
  { key: "email", label: "البريد" },
  { key: "phone", label: "الهاتف" },
  { key: "city", label: "المدينة" },
  { key: "country", label: "الدولة" },
  { key: "specialization", label: "التخصص" },
  { key: "bio", label: "نبذة" },
  { key: "description", label: "الوصف" },
  { key: "years_experience", label: "سنوات الخبرة" },
  { key: "wallet_balance", label: "رصيد المحفظة", money: true },
  { key: "available_balance", label: "الرصيد المتاح", money: true },
  { key: "pending_balance", label: "الرصيد المعلق", money: true },
  { key: "iban", label: "الآيبان" },
  { key: "bank_name", label: "البنك" },
  { key: "rating", label: "التقييم" },
  { key: "total_reviews", label: "عدد التقييمات" },
  { key: "website", label: "الموقع" },
  { key: "commercial_registration", label: "السجل التجاري" },
  { key: "established_year", label: "سنة التأسيس" },
  { key: "team_size", label: "حجم الفريق" },
];

const fmtMoney = (v) => (v != null ? Number(v).toLocaleString("ar-SA") + " ريال" : "—");

export default function ProviderDetailsDialog({
  provider, providerKey, nameField, open, onOpenChange, editMode, onUpdated,
}) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) setForm({ ...provider });
  }, [open, provider]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const patch = {};
      EDIT_FIELDS.forEach(({ key, type }) => {
        if (key in provider) {
          let v = form[key];
          if (type === "number") v = v === "" || v == null ? null : Number(v);
          if (type === "checkbox") v = !!v;
          patch[key] = v;
        }
      });
      const updated = await base44.entities[providerKey].update(provider.id, patch);
      onUpdated?.({ ...provider, ...patch });
      toast({ title: "تم حفظ التعديلات" });
      onOpenChange(false);
    } catch (e) {
      toast({ variant: "destructive", title: "تعذّر الحفظ", description: e.message });
    } finally { setSaving(false); }
  };

  const name = provider[nameField] || "بدون اسم";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editMode ? "تعديل بيانات مقدم الخدمة" : "تفاصيل مقدم الخدمة"}</DialogTitle>
          <DialogDescription className="sr-only">{name}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <h3 className="text-lg font-bold text-[#4A3F35]">{name}</h3>
          {provider.status && (
            <Badge className={`${STATUS_BADGE[provider.status]} border`} variant="outline">
              {STATUS_LABEL[provider.status]}
            </Badge>
          )}
          {provider.is_verified && (
            <Badge className="bg-[#C9A66B]/10 text-[#C9A66B] border border-[#C9A66B]/20" variant="outline">
              <Star className="w-3 h-3 ml-1" /> موثّق
            </Badge>
          )}
        </div>

        {editMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
            {EDIT_FIELDS.map(({ key, label, type, options }) => {
              if (!(key in provider)) return null;
              const value = form[key];
              return (
                <div key={key} className={type === "textarea" ? "sm:col-span-2" : ""}>
                  <Label className="mb-1 block">{label}</Label>
                  {type === "text" && (
                    <Input value={value ?? ""} onChange={(e) => setField(key, e.target.value)} />
                  )}
                  {type === "email" && (
                    <Input type="email" value={value ?? ""} onChange={(e) => setField(key, e.target.value)} />
                  )}
                  {type === "number" && (
                    <Input type="number" value={value ?? ""} onChange={(e) => setField(key, e.target.value)} />
                  )}
                  {type === "textarea" && (
                    <Textarea value={value ?? ""} onChange={(e) => setField(key, e.target.value)} rows={3} />
                  )}
                  {type === "select" && (
                    <select
                      value={value ?? ""} onChange={(e) => setField(key, e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                    >
                      {options.map((o) => (
                        <option key={o} value={o}>{STATUS_LABEL[o] || o}</option>
                      ))}
                    </select>
                  )}
                  {type === "checkbox" && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
                      <Checkbox checked={!!value} onCheckedChange={(v) => setField(key, v)} />
                      {label}
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {DISPLAY_FIELDS.map(({ key, label, money }) => {
              if (!(key in provider) || provider[key] == null || provider[key] === "") return null;
              const val = Array.isArray(provider[key]) ? provider[key].join("، ") : provider[key];
              return (
                <div key={key} className="border-b border-slate-100 pb-2">
                  <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                  <p className="text-sm text-[#4A3F35] font-medium break-words">
                    {money ? fmtMoney(val) : String(val)}
                  </p>
                </div>
              );
            })}
            <div className="sm:col-span-2 border-b border-slate-100 pb-2">
              <p className="text-xs text-slate-400 mb-0.5">تاريخ التسجيل</p>
              <p className="text-sm text-[#4A3F35] font-medium">
                {provider.created_date ? new Date(provider.created_date).toLocaleDateString("ar-SA") : "—"}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {editMode ? "إلغاء" : "إغلاق"}
          </Button>
          {editMode && (
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <Save className="w-4 h-4 ml-1" />}
              حفظ التعديلات
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}