import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Plus, Pencil, Trash2, Loader2, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";

export default function EmailTemplatesTab({ onRefresh }) {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "", body: "", category: "other", variables: [], is_active: true });
  const [seeding, setSeeding] = useState(false);

  const brandedBody = (title, message, ctaText = "فتح حسابي", ctaUrl = "https://mybaytly.com") => `<!doctype html><html lang="ar" dir="rtl"><body style="margin:0;background:#f5f0e8;font-family:Arial,Tahoma,sans-serif;color:#1a1a2e"><div style="max-width:640px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #e5d4b8"><div style="padding:28px;text-align:center;background:linear-gradient(135deg,#4a3f35,#c9a66b);color:#fff"><div style="font-size:34px;font-weight:800">بيتلي</div><div style="font-size:12px;opacity:.9;margin-top:4px">المنظومة الهندسية المتكاملة</div></div><div style="padding:36px 30px;text-align:right"><h1 style="margin:0 0 18px;color:#4a3f35;font-size:24px">${title}</h1><div style="font-size:15px;line-height:1.9;color:#4b5563">${message}</div><div style="text-align:center;margin:30px 0"><a href="${ctaUrl}" style="display:inline-block;background:#6b5d4f;color:#fff;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:700">${ctaText}</a></div></div><div style="padding:18px 24px;background:#faf8f4;border-top:1px solid #eee;text-align:center;color:#8a8178;font-size:11px">بيتلي — المنظومة الهندسية المتكاملة<br>للتواصل: info@mybaytly.com</div></div></body></html>`;

  const readyTemplates = [
    { name:"ترحيب مستخدم جديد — بيتلي", subject:"مرحباً بك في بيتلي", category:"welcome", body:brandedBody("مرحباً بك في بيتلي 👋","يسعدنا انضمامك إلى بيتلي. حسابك أصبح جاهزًا، ويمكنك الآن استكشاف الخدمات الهندسية وإدارة مشاريعك من مكان واحد.") , variables:["name"]},
    { name:"ترحيب مهندس جديد — بيتلي", subject:"مرحباً بك كمهندس في بيتلي", category:"welcome", body:brandedBody("مرحباً بك في منظومة بيتلي الهندسية","شكرًا لتسجيلك معنا. سنراجع بياناتك ومستنداتك، وبعد الاعتماد يمكنك البدء في استقبال المشاريع والعملاء عبر المنصة.","الدخول إلى حسابي"), variables:["name"]},
    { name:"تنبيه تحديث المشروع — بيتلي", subject:"تحديث جديد على مشروعك", category:"notification", body:brandedBody("هناك تحديث جديد على مشروعك","تم تحديث حالة مشروعك في بيتلي. سجّل الدخول للاطلاع على المرحلة الحالية والتفاصيل الجديدة.","عرض المشروع"), variables:["name","project_name","project_status"]},
    { name:"إشعار عرض/قبول مشروع — بيتلي", subject:"لديك تحديث مهم بشأن المشروع", category:"transactional", body:brandedBody("تحديث مهم بشأن مشروعك","هناك إجراء جديد متعلق بعرض أو اتفاق مشروعك. يمكنك مراجعة التفاصيل واتخاذ الإجراء المطلوب من حسابك.","مراجعة المشروع"), variables:["name","project_name"]},
  ];

  const addReadyTemplates = async () => {
    setSeeding(true);
    try {
      const existing = await base44.entities.EmailTemplate.list("-created_date", 200);
      let added = 0;
      for (const tmpl of readyTemplates) {
        if (!(existing || []).some(e => e.name === tmpl.name)) { await base44.entities.EmailTemplate.create({ ...tmpl, is_active:true }); added++; }
      }
      toast({ title: isRTL ? `تمت إضافة ${added} قوالب جاهزة بهوية بيتلي` : `${added} branded templates added` });
      load(); onRefresh?.();
    } catch (e) { toast({ title:isRTL?"فشل إضافة القوالب":"Failed", description:e.message, variant:"destructive" }); }
    finally { setSeeding(false); }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.EmailTemplate.list("-created_date", 100);
      setTemplates(res || []);
    } catch (e) {
      toast({ title: isRTL ? "فشل التحميل" : "Failed to load", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: "", subject: "", body: "", category: "other", variables: [], is_active: true }); setDialogOpen(true); };
  const openEdit = (tmpl) => { setEditing(tmpl); setForm({ name: tmpl.name, subject: tmpl.subject, body: tmpl.body, category: tmpl.category || "other", variables: tmpl.variables || [], is_active: tmpl.is_active !== false }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.subject || !form.body) {
      toast({ title: isRTL ? "يرجى ملء الحقول المطلوبة" : "Please fill required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.EmailTemplate.update(editing.id, form);
      } else {
        await base44.entities.EmailTemplate.create(form);
      }
      toast({ title: t("integrations.adminEmail.templates.saveSuccess") });
      setDialogOpen(false);
      load();
      onRefresh?.();
    } catch (e) {
      toast({ title: isRTL ? "فشل الحفظ" : "Failed to save", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (tmpl) => {
    if (!confirm(t("integrations.adminEmail.templates.deleteConfirm"))) return;
    try {
      await base44.entities.EmailTemplate.delete(tmpl.id);
      toast({ title: t("integrations.adminEmail.templates.deleteSuccess") });
      load();
      onRefresh?.();
    } catch (e) {
      toast({ title: isRTL ? "فشل الحذف" : "Failed to delete", description: e.message, variant: "destructive" });
    }
  };

  const categoryColors = {
    welcome: "bg-blue-100 text-blue-700", notification: "bg-amber-100 text-amber-700",
    marketing: "bg-purple-100 text-purple-700", transactional: "bg-green-100 text-green-700",
    reminder: "bg-orange-100 text-orange-700", system: "bg-slate-100 text-slate-700", other: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#4A3F35]">{t("integrations.adminEmail.templates.title")}</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-9" onClick={addReadyTemplates} disabled={seeding}>
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}قوالب بيتلي الجاهزة
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90 h-9" onClick={openNew}>
            <Plus className="w-4 h-4" />{t("integrations.adminEmail.templates.addNew")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : templates.length === 0 ? (
        <Card className="border-slate-200"><CardContent className="text-center py-16 text-slate-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">{t("integrations.adminEmail.empty")}</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map(tmpl => (
            <Card key={tmpl.id} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><p className="font-semibold text-[#4A3F35] text-sm truncate">{tmpl.name}</p></div>
                  <Badge className={`text-xs ${tmpl.is_active === false ? "bg-slate-100 text-slate-500" : "bg-green-100 text-green-700"}`}>
                    {tmpl.is_active === false ? <XCircle className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                    {tmpl.is_active === false ? t("integrations.adminEmail.templates.inactive") : t("integrations.adminEmail.templates.active")}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 truncate">{tmpl.subject}</p>
                <div className="flex items-center justify-between">
                  <Badge className={`text-xs ${categoryColors[tmpl.category] || categoryColors.other}`}>{tmpl.category || "other"}</Badge>
                  <span className="text-xs text-slate-400">{t("integrations.adminEmail.templates.usageCount")}: {tmpl.usage_count || 0}</span>
                </div>
                <div className="flex gap-1 pt-1">
                  <Button size="sm" variant="outline" className="h-8 text-xs flex-1" onClick={() => openEdit(tmpl)}><Pencil className="w-3 h-3 ml-1" />{isRTL ? "تعديل" : "Edit"}</Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs text-red-600 hover:text-red-700" onClick={() => handleDelete(tmpl)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-[#C9A66B]" />{editing ? t("integrations.adminEmail.templates.editTemplate") : t("integrations.adminEmail.templates.addNew")}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div><label className="text-xs text-slate-500 mb-1 block">{t("integrations.adminEmail.templates.name")} *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">{t("integrations.adminEmail.templates.subject")} *</label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t("integrations.adminEmail.templates.category")}</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                {["welcome", "notification", "marketing", "transactional", "reminder", "system", "other"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-slate-500 mb-1 block">{t("integrations.adminEmail.templates.body")} *</label><Textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={8} className="font-mono text-xs" /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="tmpl-active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="tmpl-active" className="text-sm text-slate-600">{t("integrations.adminEmail.templates.active")}</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{isRTL ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{isRTL ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}