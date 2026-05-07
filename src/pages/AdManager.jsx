import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  Plus, Pencil, Trash2, CheckCircle, XCircle, Eye, MousePointerClick,
  Upload, Loader2, BarChart2, Shield, X, Play, Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
  { value: "project_details", label: "تفاصيل المشروع" },
  { value: "engineer_dashboard", label: "لوحة المهندس" },
  { value: "both", label: "كلاهما" },
]; // kept for backward compatibility

const PLACEMENTS_EXTENDED = [
  { value: "projects_feed", label: "سوق المشاريع (In-feed)" },
  { value: "project_details", label: "تفاصيل المشروع" },
  { value: "engineer_dashboard", label: "لوحة المهندس" },
  { value: "all", label: "جميع المواضع" },
  { value: "both", label: "تفاصيل المشروع + لوحة المهندس" },
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

export default function AdManager() {
  const [user, setUser] = useState(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const u = await base44.auth.me();
    setUser(u);
    if (u?.role !== "admin") { setLoading(false); return; }
    loadAds();
  };

  const loadAds = async () => {
    setLoading(true);
    const data = await base44.entities.Advertisement.list("-created_date", 100);
    setAds(data);
    setLoading(false);
  };

  const openCreate = () => {
    setEditingAd(null);
    setForm(EMPTY_FORM);
    setTagsInput("");
    setShowForm(true);
  };

  const openEdit = (ad) => {
    setEditingAd(ad);
    setForm({ ...EMPTY_FORM, ...ad });
    setTagsInput((ad.target_tags || []).join("، "));
    setShowForm(true);
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    if (field === "image_url") setUploading(true);
    else if (field === "video_url") setUploadingVideo(true);
    else setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, [field]: file_url }));
    if (field === "image_url") setUploading(false);
    else if (field === "video_url") setUploadingVideo(false);
    else setUploadingLogo(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.advertiser_name || !form.image_url || !form.destination_url || !form.category) return;
    setSaving(true);
    const tags = tagsInput ? tagsInput.split(/[،,]/).map(t => t.trim()).filter(Boolean) : [];
    const payload = { ...form, target_tags: tags };

    if (editingAd) {
      await base44.entities.Advertisement.update(editingAd.id, payload);
    } else {
      await base44.entities.Advertisement.create(payload);
    }
    setSaving(false);
    setShowForm(false);
    loadAds();
  };

  const handleDelete = async (id) => {
    if (!confirm("هل تريد حذف هذا الإعلان؟")) return;
    await base44.entities.Advertisement.delete(id);
    loadAds();
  };

  const toggleActive = async (ad) => {
    await base44.entities.Advertisement.update(ad.id, { is_active: !ad.is_active });
    loadAds();
  };

  const toggleVerified = async (ad) => {
    await base44.entities.Advertisement.update(ad.id, { is_verified_advertiser: !ad.is_verified_advertiser });
    loadAds();
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">هذه الصفحة للمسؤولين فقط.</p>
      </div>
    );
  }

  const totalImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((s, a) => s + (a.clicks || 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen bg-slate-50 py-8" dir="rtl">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a2e]">مدير الإعلانات</h1>
            <p className="text-slate-500 text-sm mt-1">إدارة الإعلانات السياقية للمنصة</p>
          </div>
          <Button onClick={openCreate} className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white gap-2">
            <Plus className="w-4 h-4" />
            إعلان جديد
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "إجمالي الإعلانات", value: ads.length, icon: BarChart2, color: "text-blue-600" },
            { label: "إعلانات نشطة", value: ads.filter(a => a.is_active).length, icon: CheckCircle, color: "text-green-600" },
            { label: "مجموع الظهور", value: totalImpressions.toLocaleString(), icon: Eye, color: "text-purple-600" },
            { label: "نسبة النقر CTR", value: ctr + "%", icon: MousePointerClick, color: "text-amber-600" },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`w-8 h-8 ${s.color}`} />
                <div>
                  <p className="text-xl font-bold text-slate-800">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ads Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>قائمة الإعلانات</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : ads.length === 0 ? (
              <p className="text-center text-slate-400 py-8">لا توجد إعلانات بعد</p>
            ) : (
              <div className="space-y-3">
                {ads.map(ad => (
                  <motion.div
                    key={ad.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:shadow-sm transition-all"
                  >
                    <div className="relative flex-shrink-0">
                      {ad.media_type === "video" && ad.video_url ? (
                        <video src={ad.video_url} poster={ad.image_url} className="w-16 h-12 object-cover rounded-lg" muted />
                      ) : (
                        <img src={ad.image_url} alt={ad.title} className="w-16 h-12 object-cover rounded-lg" />
                      )}
                      {(ad.media_type === "video" || ad.media_type === "gif") && (
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded">
                          {ad.media_type === "video" ? "▶ VIDEO" : "GIF"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-800 truncate">{ad.advertiser_name}</span>
                        {ad.is_verified_advertiser && (
                          <div className="flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full border border-blue-200">
                            <CheckCircle className="w-3 h-3" />
                            معلن معتمد
                          </div>
                        )}
                        <Badge variant={ad.is_active ? "default" : "secondary"} className="text-[10px]">
                          {ad.is_active ? "نشط" : "متوقف"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{ad.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                          {CATEGORIES.find(c => c.value === ad.category)?.label || ad.category}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          <Eye className="w-2.5 h-2.5 inline mr-0.5" />{ad.impressions || 0}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          <MousePointerClick className="w-2.5 h-2.5 inline mr-0.5" />{ad.clicks || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleVerified(ad)}
                        title={ad.is_verified_advertiser ? "إلغاء الاعتماد" : "اعتماد المعلن"}
                        className={`p-1.5 rounded-lg transition-colors ${ad.is_verified_advertiser ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-400'}`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleActive(ad)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-green-50 text-slate-500 hover:text-green-600 transition-colors">
                        {ad.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => openEdit(ad)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-600 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(ad.id)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingAd ? "تعديل الإعلان" : "إعلان جديد"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
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
                <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="جملة تعريفية قصيرة" />
              </div>

              <div>
                <Label className="text-xs">رابط الوجهة (URL) *</Label>
                <Input value={form.destination_url} onChange={e => setForm(p => ({ ...p, destination_url: e.target.value }))} placeholder="https://..." dir="ltr" />
              </div>

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
                      {PLACEMENTS_EXTENDED.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">الوسوم المستهدفة (مفصولة بفاصلة)</Label>
                <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="تصميم معماري، مدني، ديكور" />
              </div>

              {/* Media Type */}
              <div>
                <Label className="text-xs">نوع المحتوى الإعلاني</Label>
                <Select value={form.media_type} onValueChange={v => setForm(p => ({ ...p, media_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEDIA_TYPES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Cover Image */}
              <div>
                <Label className="text-xs">صورة الغلاف {form.media_type !== "image" ? "(تُعرض قبل تشغيل الفيديو)" : "*"}</Label>
                <div className="flex gap-2 items-center mt-1">
                  <label className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg cursor-pointer hover:border-[#d4a574] transition-colors text-sm text-slate-500">
                    <input type="file" accept="image/*" onChange={e => handleFileUpload(e, "image_url")} className="hidden" />
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                    رفع صورة
                  </label>
                  {form.image_url && <img src={form.image_url} alt="" className="w-16 h-12 object-cover rounded-lg" />}
                </div>
              </div>

              {/* Video / GIF Upload */}
              {(form.media_type === "video" || form.media_type === "gif") && (
                <div>
                  <Label className="text-xs">{form.media_type === "video" ? "ملف الفيديو (MP4)" : "ملف GIF"} *</Label>
                  <div className="flex gap-2 items-center mt-1">
                    <label className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg cursor-pointer hover:border-[#d4a574] transition-colors text-sm text-slate-500">
                      <input type="file" accept={form.media_type === "video" ? "video/mp4,video/*" : "image/gif"} onChange={e => handleFileUpload(e, "video_url")} className="hidden" />
                      {uploadingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      {uploadingVideo ? "جارٍ الرفع..." : `رفع ${form.media_type === "video" ? "فيديو" : "GIF"}`}
                    </label>
                    {form.video_url && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> تم الرفع
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">يُشغَّل تلقائياً بدون صوت عند التمرير (Autoplay Muted)</p>
                </div>
              )}

              {/* Logo Upload */}
              <div>
                <Label className="text-xs">شعار المعلن (اختياري)</Label>
                <div className="flex gap-2 items-center mt-1">
                  <label className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg cursor-pointer hover:border-[#d4a574] transition-colors text-sm text-slate-500">
                    <input type="file" accept="image/*" onChange={e => handleFileUpload(e, "logo_url")} className="hidden" />
                    {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    رفع الشعار
                  </label>
                  {form.logo_url && <img src={form.logo_url} alt="" className="w-8 h-8 rounded-full object-cover" />}
                </div>
              </div>

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

              {/* Verified toggle */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <Shield className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800">معلن معتمد</p>
                  <p className="text-xs text-blue-600">يظهر شارة الثقة الزرقاء بجانب اسم المعلن</p>
                </div>
                <button
                  onClick={() => setForm(p => ({ ...p, is_verified_advertiser: !p.is_verified_advertiser }))}
                  className={`w-10 h-6 rounded-full transition-colors ${form.is_verified_advertiser ? 'bg-blue-500' : 'bg-slate-200'}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white mx-1 transition-transform ${form.is_verified_advertiser ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">الإعلان نشط</p>
                </div>
                <button
                  onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                  className={`w-10 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-slate-200'}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white mx-1 transition-transform ${form.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving || !form.title || !form.advertiser_name || !form.image_url || !form.destination_url || !form.category}
                  className="flex-1 bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingAd ? "حفظ التعديلات" : "إنشاء الإعلان")}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">إلغاء</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}