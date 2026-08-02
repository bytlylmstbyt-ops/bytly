import React, { useState, useEffect, useMemo } from "react";
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
import { Building2, Scale, HardHat, Package, Megaphone, Loader2, Plus } from "lucide-react";

// الأنواع القابلة للإنشاء (كيانات موجودة فعلاً)
const TYPES = [
  { key: "EngineeringFirm", label: "شركة هندسية", icon: Building2 },
  { key: "Consultant", label: "استشاري", icon: Scale },
  { key: "Contractor", label: "مقاول", icon: HardHat },
  { key: "Supplier", label: "مورد", icon: Package },
  { key: "Advertiser", label: "معلن", icon: Megaphone },
];

const STATUS_OPTIONS = [
  { value: "approved", label: "معتمد" },
  { value: "pending", label: "معلق" },
  { value: "rejected", label: "مرفوض" },
];

// إعدادات الحقول لكل نوع
const FIELD_CONFIGS = {
  EngineeringFirm: [
    { name: "company_name", label: "اسم الشركة", required: true },
    { name: "email", label: "البريد الإلكتروني", required: true, type: "email" },
    { name: "commercial_registration", label: "السجل التجاري", required: true },
    { name: "phone", label: "رقم الهاتف" },
    { name: "city", label: "المدينة" },
    { name: "country", label: "الدولة", default: "السعودية" },
    { name: "website", label: "الموقع الإلكتروني" },
    { name: "established_year", label: "سنة التأسيس", type: "number" },
    { name: "team_size", label: "حجم الفريق", type: "number" },
    { name: "description", label: "نبذة", type: "textarea" },
  ],
  Consultant: [
    { name: "full_name", label: "الاسم الكامل", required: true },
    { name: "email", label: "البريد الإلكتروني", required: true, type: "email" },
    {
      name: "consultant_type", label: "نوع الاستشاري", required: true, type: "select",
      options: [
        { value: "architectural", label: "معماري" },
        { value: "structural", label: "إنشائي" },
        { value: "graphic", label: "جرافيك" },
      ],
    },
    { name: "engineers_society_membership_number", label: "رقم عضوية هيئة المهندسين", required: true },
    { name: "engineering_specialization", label: "التخصص الهندسي" },
    { name: "phone", label: "رقم الهاتف" },
    { name: "city", label: "المدينة" },
    { name: "country", label: "الدولة", default: "السعودية" },
    { name: "bio", label: "نبذة", type: "textarea" },
  ],
  Contractor: [
    { name: "company_name", label: "اسم الشركة / المقاول", required: true },
    { name: "email", label: "البريد الإلكتروني", required: true, type: "email" },
    { name: "specialization", label: "التخصص", required: true },
    { name: "phone", label: "رقم الهاتف" },
    { name: "city", label: "المدينة" },
    { name: "country", label: "الدولة", default: "السعودية" },
    {
      name: "contractor_type", label: "نوع المقاول", type: "select",
      options: [
        { value: "company", label: "شركة" },
        { value: "individual", label: "فرد" },
      ],
      default: "company",
    },
    { name: "commercial_registration", label: "السجل التجاري" },
    { name: "years_experience", label: "سنوات الخبرة", type: "number" },
    { name: "team_size", label: "حجم الفريق", type: "number" },
    { name: "bio", label: "نبذة", type: "textarea" },
  ],
  Supplier: [
    { name: "company_name", label: "اسم الشركة / المورد", required: true },
    { name: "email", label: "البريد الإلكتروني", required: true, type: "email" },
    { name: "specialization", label: "التخصص", required: true },
    { name: "phone", label: "رقم الهاتف" },
    { name: "city", label: "المدينة" },
    { name: "country", label: "الدولة", default: "السعودية" },
    {
      name: "supplier_type", label: "نوع المورد", type: "select",
      options: [
        { value: "company", label: "شركة" },
        { value: "individual", label: "فرد" },
      ],
      default: "company",
    },
    { name: "commercial_registration", label: "السجل التجاري" },
    { name: "years_experience", label: "سنوات الخبرة", type: "number" },
    { name: "bio", label: "نبذة", type: "textarea" },
  ],
  Advertiser: [
    { name: "company_name", label: "اسم الشركة المعلن", required: true },
    { name: "email", label: "البريد الإلكتروني", required: true, type: "email" },
    { name: "contact_name", label: "اسم الشخص المسؤول" },
    { name: "phone", label: "رقم الهاتف" },
    { name: "city", label: "المدينة" },
    { name: "country", label: "الدولة", default: "السعودية" },
    {
      name: "category", label: "قطاع الإعلان", type: "select",
      options: [
        { value: "engineering", label: "هندسة" },
        { value: "contracting", label: "مقاولات" },
        { value: "decor", label: "ديكور" },
        { value: "building_materials", label: "مواد بناء" },
        { value: "furniture", label: "أثاث" },
        { value: "consulting_office", label: "مكتب استشاري" },
        { value: "concrete_supply", label: "توريد خرسانة" },
        { value: "electrical", label: "كهرباء" },
        { value: "plumbing", label: "سباكة" },
        { value: "landscape", label: "تنسيق حدائق" },
      ],
    },
    {
      name: "subscription_type", label: "نوع الاشتراك", type: "select",
      options: [
        { value: "campaign", label: "حملة" },
        { value: "free_trial", label: "تجريبي" },
        { value: "monthly", label: "شهري" },
        { value: "yearly", label: "سنوي" },
      ],
      default: "campaign",
    },
    { name: "campaign_value", label: "قيمة الحملة", type: "number" },
    { name: "website", label: "الموقع الإلكتروني" },
    { name: "bio", label: "نبذة", type: "textarea" },
  ],
};

function buildInitialForm(typeKey) {
  const form = { status: "approved" };
  (FIELD_CONFIGS[typeKey] || []).forEach((f) => {
    form[f.name] = f.default ?? (f.type === "number" ? 0 : "");
  });
  return form;
}

export default function AddProviderDialog({ open, onOpenChange, defaultType, onCreated }) {
  const { toast } = useToast();
  const [type, setType] = useState(defaultType || "EngineeringFirm");
  const [form, setForm] = useState(() => buildInitialForm(defaultType || "EngineeringFirm"));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const t = defaultType && TYPES.some((x) => x.key === defaultType) ? defaultType : "EngineeringFirm";
      setType(t);
      setForm(buildInitialForm(t));
    }
  }, [open, defaultType]);

  const fields = FIELD_CONFIGS[type] || [];

  const setField = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // تحقق من الحقول المطلوبة
    const missing = fields.filter((f) => f.required && !String(form[f.name] ?? "").trim());
    if (missing.length > 0) {
      toast({ variant: "destructive", title: "حقول ناقصة", description: missing.map((m) => m.label).join("، ") });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, status: form.status || "approved" };
      // تنظيف الحقول الرقمية الفارغة
      fields.forEach((f) => {
        if (f.type === "number" && payload[f.name] === "") payload[f.name] = 0;
      });
      await base44.entities[type].create(payload);
      toast({ title: "تم الإنشاء بنجاح", description: "تمت إضافة مقدم الخدمة وتحديث القائمة." });
      onCreated?.();
      onOpenChange?.(false);
    } catch (err) {
      console.error("create provider failed", err);
      toast({ variant: "destructive", title: "فشل الإنشاء", description: String(err?.message || err).slice(0, 180) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#C9A66B]" />
            إضافة مقدم خدمة
          </DialogTitle>
          <DialogDescription className="text-right">
            أنشئ حساباً جديداً لمقدم خدمة. ستظهر السجل فوراً في الجدول والإحصائيات.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* اختيار النوع */}
          <div className="space-y-1.5">
            <Label>نوع مقدم الخدمة</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {TYPES.map((t) => {
                const Icon = t.icon;
                const active = type === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => { setType(t.key); setForm(buildInitialForm(t.key)); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all ${
                      active
                        ? "border-[#C9A66B] bg-[#FEF9EE] text-[#4A3F35] shadow-sm"
                        : "border-slate-200 bg-white text-slate-500 hover:border-[#C9A66B]/40"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? "text-[#C9A66B]" : "text-slate-400"}`} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* الحقول الديناميكية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.name} className={`space-y-1.5 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                <Label className="text-right block">
                  {f.label}
                  {f.required && <span className="text-red-500 mr-1">*</span>}
                </Label>
                {f.type === "textarea" ? (
                  <Textarea
                    value={form[f.name] || ""}
                    onChange={(e) => setField(f.name, e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                ) : f.type === "select" ? (
                  <Select value={form[f.name] || ""} onValueChange={(v) => setField(f.name, v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder={`اختر ${f.label}`} /></SelectTrigger>
                    <SelectContent>
                      {f.options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
                    value={form[f.name] ?? ""}
                    onChange={(e) => setField(f.name, e.target.value)}
                  />
                )}
              </div>
            ))}

            {/* الحالة */}
            <div className="space-y-1.5">
              <Label className="text-right block">حالة الحساب</Label>
              <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Plus className="w-4 h-4 ml-1" />}
              حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}