import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Image as ImageIcon, Trash2, Maximize2, Copy, Check, Code2, ShieldCheck, Loader2, Save, X } from "lucide-react";

export default function AdminPlatformSettings() {
  const { toast } = useToast();
  const appId = appParams.appId || "—";

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSocial, setUploadingSocial] = useState(false);
  const [copied, setCopied] = useState("");
  const [activeTab, setActiveTab] = useState("app");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.PlatformSettings.list();
      if (list.length > 0) {
        setSettings(list[0]);
      } else {
        const created = await base44.entities.PlatformSettings.create({
          app_name: "BYTLY - بيتلي",
          description: "بيتلي - المنظومة الهندسية المتكاملة توفر نظامًا ذكيًا لإدارة المشاريع الهندسية بكفاءة، مع 5 أنواع بيانات متزامنة ووصول مباشر لـ 8 صفحات أساسية.",
          logo_url: "",
          social_image_url: "",
        });
        setSettings(created);
      }
    } catch (e) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateField = async (field, value) => {
    try {
      const updated = await base44.entities.PlatformSettings.update(settings.id, { [field]: value });
      setSettings(updated);
      toast({ title: "تم الحفظ", description: "تم تحديث الإعداد بنجاح" });
    } catch (e) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateField("logo_url", file_url);
    } catch (e) {
      toast({ title: "خطأ في الرفع", description: e.message, variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSocialUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSocial(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateField("social_image_url", file_url);
    } catch (e) {
      toast({ title: "خطأ في الرفع", description: e.message, variant: "destructive" });
    } finally {
      setUploadingSocial(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
      </div>
    );
  }

  const installCmd = "npm install @base44/sdk";
  const initCode = `import { createClient } from '@base44/sdk';

const base44 = createClient({
  appId: "${appId}",
  headers: {
    "api_key": "<YOUR_API_KEY>"
  }
});`;

  return (
    <div className="min-h-screen bg-[#F7F8FC] py-6 px-4 md:px-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#5142A4] to-[#6D5CE7] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#25213A]">إعدادات المنصة</h1>
            <p className="text-sm text-slate-500">إعدادات التطبيق ووثائق واجهة برمجة التطبيقات</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 rounded-lg p-1">
            <TabsTrigger value="app" className="data-[state=active]:bg-[#5142A4] data-[state=active]:text-white rounded-md gap-1.5">
              <ImageIcon className="w-4 h-4" />
              إعدادات التطبيق
            </TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-[#5142A4] data-[state=active]:text-white rounded-md gap-1.5">
              <Code2 className="w-4 h-4" />
              وثائق واجهة برمجة التطبيقات
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: App Settings ── */}
          <TabsContent value="app" className="space-y-4 mt-4">
            {/* App Logo */}
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {settings?.logo_url ? (
                    <img src={settings.logo_url} alt="شعار التطبيق" className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center">
                      <span className="text-white font-bold text-xl">B</span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-[#333]">شعار التطبيق</p>
                    <p className="text-xs text-slate-500 mt-0.5">الشعار المعروض للمنصة</p>
                  </div>
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm text-[#333] hover:bg-slate-50 transition-colors">
                    {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                    تعديل الشعار
                  </span>
                </label>
              </CardContent>
            </Card>

            {/* App Description */}
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-[#333]">وصف التطبيق</p>
                  {editingDesc ? (
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-[#5142A4] hover:bg-[#5142A4]/90 text-white gap-1 h-8" onClick={() => { updateField("description", descDraft); setEditingDesc(false); }}>
                        <Save className="w-3.5 h-3.5" /> حفظ
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => { setEditingDesc(false); setDescDraft(settings?.description || ""); }}>
                        <X className="w-3.5 h-3.5" /> إلغاء
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-[#5142A4] gap-1 h-8" onClick={() => { setDescDraft(settings?.description || ""); setEditingDesc(true); }}>
                      <Pencil className="w-3.5 h-3.5" /> تعديل
                    </Button>
                  )}
                </div>
                {editingDesc ? (
                  <Textarea value={descDraft} onChange={(e) => setDescDraft(e.target.value)} rows={3} className="resize-none" />
                ) : (
                  <p className="text-sm text-[#666] leading-relaxed">{settings?.description || "لا يوجد وصف"}</p>
                )}
              </CardContent>
            </Card>

            {/* Social Image */}
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-[#333]">الصورة الاجتماعية</p>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleSocialUpload} disabled={uploadingSocial} />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-[#333] hover:bg-slate-50 transition-colors">
                      {uploadingSocial ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
                      رفع صورة
                    </span>
                  </label>
                </div>
                <p className="text-xs text-slate-500 mb-4">الصورة المستخدمة عند مشاركة تطبيقك على منصات التواصل الاجتماعي. الحجم الموصى به: 1200 × 630</p>
                {settings?.social_image_url ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200">
                    <img src={settings.social_image_url} alt="الصورة الاجتماعية" className="w-full h-40 object-cover" />
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <a href={settings.social_image_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center hover:bg-white shadow-sm">
                        <Maximize2 className="w-4 h-4 text-[#333]" />
                      </a>
                      <button onClick={() => updateField("social_image_url", "")} className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center hover:bg-white shadow-sm">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center h-40 text-slate-400">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm">لا توجد صورة اجتماعية</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: API Documentation ── */}
          <TabsContent value="api" className="space-y-4 mt-4">
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <h3 className="font-bold text-[#333] mb-1">وثائق واجهة برمجة التطبيقات</h3>
                <p className="text-sm text-[#666] mb-5">مرجع كامل لواجهة برمجة التطبيقات (API) لتطبيقك. استخدم مواصفات OpenAPI مع أي عميل لواجهة برمجة التطبيقات أو أداة توثيق.</p>

                {/* App ID badge */}
                <div className="flex items-center gap-2 mb-5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-xs font-medium text-slate-500">معرّف التطبيق:</span>
                  <code className="text-xs text-[#5142A4] font-mono" dir="ltr">{appId}</code>
                  <button onClick={() => copyToClipboard(appId, "appid")} className="text-slate-400 hover:text-[#5142A4]">
                    {copied === "appid" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Install command */}
                <div className="mb-5">
                  <p className="text-sm font-medium text-[#333] mb-2">قم بتثبيت حزمة تطوير البرمجيات Base44 وقم بتهيئة العميل باستخدام معرّف تطبيقك. تتولى حزمة تطوير البرمجيات عملية المصادقة وتوفر طرقًا مُحددة النوع لجميع عمليات الكيانات ووظائف الواجهة الخلفية.</p>
                  <div className="relative rounded-lg bg-black overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
                      <span className="text-xs text-slate-400 font-mono">terminal</span>
                      <button onClick={() => copyToClipboard(installCmd, "install")} className="text-slate-400 hover:text-white">
                        {copied === "install" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        <span className="text-xs mr-1">نسخ</span>
                      </button>
                    </div>
                    <pre className="px-4 py-3 text-sm text-green-400 font-mono" dir="ltr">{installCmd}</pre>
                  </div>
                </div>

                {/* Init code */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-[#5142A4]" />
                      <span className="text-sm font-medium text-[#333]">تهيئة العميل</span>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => copyToClipboard(initCode, "init")}>
                      {copied === "init" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      انسخ الكل
                    </Button>
                  </div>
                  <div className="rounded-lg bg-black overflow-hidden">
                    <pre className="px-4 py-3 text-sm text-slate-200 font-mono overflow-x-auto" dir="ltr">{initCode}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}