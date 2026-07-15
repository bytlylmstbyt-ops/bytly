import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Loader2, Upload, Image as ImageIcon, Play, Shield,
  CheckCircle, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const CATEGORIES = [
  { value: "engineering", label: "هندسة" },
  { value: "contracting", label: "مقاولات" },
  { value: "decor", label: "ديكور" },
  { value: "building_materials", label: "مواد بناء" },
  { value: "furniture", label: "أثاث" },
  { value: "consulting_office", label: "مكتب استشاري" },
  { value: "concrete_supply", label: "توريد خرسانة" },
  { value: "electrical", label: "كهربائيات" },
  { value: "plumbing", label: "سباكة" },
  { value: "landscape", label: "تنسيق حدائق" },
];

const PLACEMENTS = [
  { value: "projects_feed", label: "سوق المشاريع" },
  { value: "project_details", label: "تفاصيل المشروع" },
  { value: "engineer_dashboard", label: "لوحة المهندس" },
  { value: "all", label: "جميع المواضع" },
];

const MEDIA_TYPES = [
  { value: "image", label: "صورة ثابتة" },
  { value: "video", label: "فيديو (MP4)" },
  { value: "gif", label: "صورة متحركة (GIF)" },
];

const EMPTY_FORM = {
  title: "", advertiser_name: "", image_url: "", video_url: "", media_type: "image",
  destination_url: "", category: "", placement: "all", target_tags: [],
  is_active: true, is_verified_advertiser: false,
  description: "", logo_url: "", start_date: "", end_date: ""
};

export default function AdForm({ editingAd, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...(editingAd || {}) });
  const [tagsInput, setTagsInput] = useState((editingAd?.target_tags || []).join("، "));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ image: false, video: false, logo: false });

  const handleUpload = async (e, field, key) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(prev => ({ ...prev, [key]: true }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, [field]: file_url }));
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.advertiser_name || !form.image_url || !form.destination_url || !form.category) return;
    setSaving(true);
    const tags = tagsInput ? tagsInput.split(/[،,]/).map(t => t.trim()).filter(Boolean) : [];
    try {
      await onSave({ ...form, target_tags: tags });
    } finally {
      setSaving(false);
    }
  };

  const isValid = form.title && form.advertiser_name && form.image_url && form.destination_url && form.category;

  return (
    <div className="space-y-5">
      {/* Advertiser Info */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#6B5D4F] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#6B5D4F] text-white text-xs flex items-center justify-center">1</span>
          معلومات المعلن
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">اسم المعلن *</Label>
            <Input value={form.advertiser_name} onChange={e => setForm(p => ({ ...p, advertiser_name: e.target.value }))} placeholder="اسم الشركة" />
          </div>
          <div>
            <Label className="text-xs">عنوان الإعلان *</Label>
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="عنوان موجز" />
          </div>
        </div>
        <div>
          <Label className="text-xs">وصف مختصر</Label>
          <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="جملة تعريفية قصيرة" rows={2} />
        </div>
        <div>
          <Label className="text-xs">رابط الوجهة (URL) *</Label>
          <Input value={form.destination_url} onChange={e => setForm(p => ({ ...p, destination_url: e.target.value }))} placeholder="https://..." dir="ltr" />
        </div>
      </div>

      {/* Targeting */}
      <div className="space-y-3 pt-2 border-t">
        <h3 className="text-sm font-semibold text-[#6B5D4F] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#6B5D4F] text-white text-xs flex items-center justify-center">2</span>
          الاستهداف
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">القطاع *</Label>
            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
              <SelectTrigger><SelectValue placeholder="اختر القطاع" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">موضع الظهور</Label>
            <Select value={form.placement} onValueChange={v => setForm(p => ({ ...p, placement: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLACEMENTS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs">الوسوم المستهدفة (مفصولة بفاصلة)</Label>
          <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="تصميم معماري، مدني، ديكور" />
        </div>
      </div>

      {/* Media */}
      <div className="space-y-3 pt-2 border-t">
        <h3 className="text-sm font-semibold text-[#6B5D4F] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#6B5D4F] text-white text-xs flex items-center justify-center">3</span>
          المحتوى الإعلاني
        </h3>
        <div>
          <Label className="text-xs">نوع المحتوى</Label>
          <div className="flex gap-2 mt-1">
            {MEDIA_TYPES.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => setForm(p => ({ ...p, media_type: m.value }))}
                className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  form.media_type === m.value
                    ? "border-[#C9A66B] bg-amber-50 text-[#6B5D4F]"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Cover image */}
          <div>
            <Label className="text-xs">صورة الغلاف {form.media_type !== "image" ? "(غلاف)" : "*"}</Label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer hover:border-[#C9A66B] hover:bg-amber-50/50 transition-colors mt-1">
              {uploading.image ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              ) : form.image_url ? (
                <img src={form.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-xs">رفع صورة</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={e => handleUpload(e, "image_url", "image")} className="hidden" />
            </label>
          </div>

          {/* Logo */}
          <div>
            <Label className="text-xs">شعار المعلن (اختياري)</Label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer hover:border-[#C9A66B] hover:bg-amber-50/50 transition-colors mt-1">
              {uploading.logo ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              ) : form.logo_url ? (
                <img src={form.logo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-xs">رفع الشعار</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={e => handleUpload(e, "logo_url", "logo")} className="hidden" />
            </label>
          </div>
        </div>

        {(form.media_type === "video" || form.media_type === "gif") && (
          <div>
            <Label className="text-xs">{form.media_type === "video" ? "ملف الفيديو (MP4)" : "ملف GIF"} *</Label>
            <label className="flex items-center justify-center w-full h-20 border-2 border-dashed rounded-xl cursor-pointer hover:border-[#C9A66B] hover:bg-amber-50/50 transition-colors mt-1">
              {uploading.video ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              ) : form.video_url ? (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> تم رفع {form.media_type === "video" ? "الفيديو" : "الـ GIF"}
                </span>
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <Play className="w-6 h-6 mb-1" />
                  <span className="text-xs">رفع {form.media_type === "video" ? "فيديو" : "GIF"}</span>
                </div>
              )}
              <input type="file" accept={form.media_type === "video" ? "video/mp4,video/*" : "image/gif"} onChange={e => handleUpload(e, "video_url", "video")} className="hidden" />
            </label>
          </div>
        )}
      </div>

      {/* Schedule & Status */}
      <div className="space-y-3 pt-2 border-t">
        <h3 className="text-sm font-semibold text-[#6B5D4F] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#6B5D4F] text-white text-xs flex items-center justify-center">4</span>
          الجدولة والحالة
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">تاريخ البداية</Label>
            <Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">تاريخ الانتهاء</Label>
            <Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${form.is_verified_advertiser ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"}`}
            onClick={() => setForm(p => ({ ...p, is_verified_advertiser: !p.is_verified_advertiser }))}>
            <Shield className={`w-4 h-4 ${form.is_verified_advertiser ? "text-blue-500" : "text-slate-400"}`} />
            <span className="text-xs font-medium text-slate-700">معلن معتمد</span>
            <span className={`mr-auto w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.is_verified_advertiser ? "bg-blue-500 justify-end" : "bg-slate-300 justify-start"}`}>
              <span className="w-4 h-4 rounded-full bg-white" />
            </span>
          </div>
          <div className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${form.is_active ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}
            onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}>
            <CheckCircle className={`w-4 h-4 ${form.is_active ? "text-green-500" : "text-slate-400"}`} />
            <span className="text-xs font-medium text-slate-700">الإعلان نشط</span>
            <span className={`mr-auto w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.is_active ? "bg-green-500 justify-end" : "bg-slate-300 justify-start"}`}>
              <span className="w-4 h-4 rounded-full bg-white" />
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t">
        <Button onClick={handleSave} disabled={saving || !isValid}
          className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingAd ? "حفظ التعديلات" : "إنشاء الإعلان")}
        </Button>
        <Button variant="outline" onClick={onCancel} className="gap-1">
          <X className="w-4 h-4" />
          إلغاء
        </Button>
      </div>
    </div>
  );
}