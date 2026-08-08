import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Calendar, FileText, Users } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

export default function EmailComposeTab({ onSent }) {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    subject: "", body: "", recipient_type: "individual", recipients: [],
    role_filter: "", from_name: "Bytly", scheduled_at: "",
  });
  const [recipientInput, setRecipientInput] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [tmpls, usrs] = await Promise.all([
          base44.entities.EmailTemplate.list("-created_date", 50),
          base44.entities.User.list(),
        ]);
        setTemplates(tmpls || []);
        setUsers(usrs || []);
      } catch (e) { console.error("Failed to load:", e); }
    })();
  }, []);

  const handleTemplateSelect = (tmplId) => {
    if (!tmplId) { setForm(f => ({ ...f, subject: "", body: "" })); return; }
    const tmpl = templates.find(t => t.id === tmplId);
    if (tmpl) setForm(f => ({ ...f, subject: tmpl.subject, body: tmpl.body }));
  };

  const addRecipient = () => {
    if (recipientInput && !form.recipients.includes(recipientInput)) {
      setForm(f => ({ ...f, recipients: [...f.recipients, recipientInput] }));
      setRecipientInput("");
    }
  };

  const removeRecipient = (email) => {
    setForm(f => ({ ...f, recipients: f.recipients.filter(r => r !== email) }));
  };

  const getRecipients = () => {
    if (form.recipient_type === "individual") return form.recipients;
    if (form.recipient_type === "bulk") return form.recipients;
    if (form.recipient_type === "role_based") {
      return users.filter(u => u.role === form.role_filter).map(u => u.email).filter(Boolean);
    }
    if (form.recipient_type === "all_users") {
      return users.map(u => u.email).filter(Boolean);
    }
    return form.recipients;
  };

  const handleSend = async (schedule = false) => {
    const recipients = getRecipients();
    if (recipients.length === 0) {
      toast({ title: isRTL ? "لا يوجد مستلمون" : "No recipients", variant: "destructive" });
      return;
    }
    if (!form.subject || !form.body) {
      toast({ title: isRTL ? "يرجى ملء الموضوع والمحتوى" : "Subject and body required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (schedule) {
        if (!form.scheduled_at) {
          toast({ title: isRTL ? "يرجى تحديد وقت الجدولة" : "Select schedule time", variant: "destructive" });
          setSaving(false);
          return;
        }
        await base44.entities.EmailCampaign.create({
          ...form,
          status: "scheduled",
          total_recipients: recipients.length,
          recipients: recipients.slice(0, 100),
        });
        toast({ title: t("integrations.adminEmail.compose.scheduleSuccess") });
      } else {
        // Send now — send to each recipient via SendEmail integration
        let sent = 0, failed = 0;
        for (const email of recipients) {
          try {
            await base44.integrations.Core.SendEmail({
              to: email, subject: form.subject, body: sanitizeHtml(form.body), from_name: form.from_name,
            });
            sent++;
          } catch { failed++; }
        }
        // Log campaign
        await base44.entities.EmailCampaign.create({
          ...form,
          status: failed === recipients.length ? "failed" : "sent",
          total_recipients: recipients.length,
          sent_count: sent,
          failed_count: failed,
          sent_at: new Date().toISOString(),
          recipients: recipients.slice(0, 100),
        });
        toast({ title: t("integrations.adminEmail.compose.sendSuccess"), description: `${sent} ${isRTL ? "مرسل" : "sent"}, ${failed} ${isRTL ? "فاشل" : "failed"}` });
      }
      setForm({ subject: "", body: "", recipient_type: "individual", recipients: [], role_filter: "", from_name: "Bytly", scheduled_at: "" });
      onSent?.();
    } catch (e) {
      toast({ title: t("integrations.adminEmail.compose.sendFailed"), description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleSaveDraft = async () => {
    if (!form.subject) {
      toast({ title: isRTL ? "أدخل الموضوع على الأقل" : "Enter subject at least", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.EmailCampaign.create({
        ...form, status: "draft", total_recipients: getRecipients().length,
        recipients: getRecipients().slice(0, 100),
      });
      toast({ title: t("integrations.adminEmail.compose.draftSaved") });
      setForm({ subject: "", body: "", recipient_type: "individual", recipients: [], role_filter: "", from_name: "Bytly", scheduled_at: "" });
      onSent?.();
    } catch (e) {
      toast({ title: isRTL ? "فشل الحفظ" : "Failed to save", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2"><Send className="w-4 h-4 text-[#C9A66B]" />{t("integrations.adminEmail.compose.title")}</h3>

        {/* Template selector */}
        <div>
          <label className="text-xs text-slate-500 mb-1 block">{t("integrations.adminEmail.compose.selectTemplate")}</label>
          <select onChange={e => handleTemplateSelect(e.target.value)} defaultValue="" className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">{t("integrations.adminEmail.compose.noTemplate")}</option>
            {templates.map(tmpl => <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>)}
          </select>
        </div>

        {/* From name */}
        <div><label className="text-xs text-slate-500 mb-1 block">{t("integrations.adminEmail.compose.fromName")}</label><Input value={form.from_name} onChange={e => setForm({ ...form, from_name: e.target.value })} /></div>

        {/* Subject */}
        <div><label className="text-xs text-slate-500 mb-1 block">{t("integrations.adminEmail.compose.subject")} *</label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>

        {/* Body */}
        <div><label className="text-xs text-slate-500 mb-1 block">{t("integrations.adminEmail.compose.body")} *</label><Textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={8} className="font-mono text-xs" /></div>

        {/* Recipient type */}
        <div>
          <label className="text-xs text-slate-500 mb-1 block">{t("integrations.adminEmail.compose.recipientType")}</label>
          <div className="flex gap-2 flex-wrap">
            {["individual", "bulk", "role_based", "all_users"].map(rt => (
              <Button key={rt} size="sm" variant={form.recipient_type === rt ? "default" : "outline"} className={`h-8 text-xs ${form.recipient_type === rt ? "bg-[#4A3F35] text-white" : ""}`} onClick={() => setForm({ ...form, recipient_type: rt, recipients: [] })}>
                {t(`integrations.adminEmail.compose.${rt}`)}
              </Button>
            ))}
          </div>
        </div>

        {/* Recipients input for individual/bulk */}
        {(form.recipient_type === "individual" || form.recipient_type === "bulk") && (
          <div>
            <label className="text-xs text-slate-500 mb-1 block">{t("integrations.adminEmail.compose.recipients")}</label>
            <div className="flex gap-2">
              <Input value={recipientInput} onChange={e => setRecipientInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addRecipient(); } }} placeholder={isRTL ? "أدخل البريد ثم اضغط Enter" : "Enter email then press Enter"} className="text-sm" />
              <Button size="sm" variant="outline" onClick={addRecipient} className="h-9 shrink-0"><Users className="w-3.5 h-3.5 ml-1" />{isRTL ? "إضافة" : "Add"}</Button>
            </div>
            {form.recipients.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.recipients.map(r => <Badge key={r} className="bg-slate-100 text-slate-700 cursor-pointer" onClick={() => removeRecipient(r)}>{r} ✕</Badge>)}
              </div>
            )}
          </div>
        )}

        {/* Role selector */}
        {form.recipient_type === "role_based" && (
          <div>
            <label className="text-xs text-slate-500 mb-1 block">{isRTL ? "الدور" : "Role"}</label>
            <select value={form.role_filter} onChange={e => setForm({ ...form, role_filter: e.target.value })} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="">{isRTL ? "اختر الدور" : "Select role"}</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            {form.role_filter && <p className="text-xs text-slate-400 mt-1">{users.filter(u => u.role === form.role_filter).length} {isRTL ? "مستخدم" : "users"}</p>}
          </div>
        )}

        {/* All users info */}
        {form.recipient_type === "all_users" && (
          <p className="text-xs text-blue-600 bg-blue-50 rounded-md p-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{users.length} {isRTL ? "مستخدم مسجل سيستلم الرسالة" : "registered users will receive this"}</p>
        )}

        {/* Schedule datetime */}
        <div><label className="text-xs text-slate-500 mb-1 block flex items-center gap-1"><Calendar className="w-3 h-3" />{t("integrations.adminEmail.compose.schedule")}</label><Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} className="text-sm" /></div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap pt-2">
          <Button onClick={() => handleSend(false)} disabled={saving} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}{t("integrations.adminEmail.compose.sendNow")}
          </Button>
          <Button onClick={() => handleSend(true)} disabled={saving} variant="outline"><Calendar className="w-4 h-4" />{t("integrations.adminEmail.compose.schedule")}</Button>
          <Button onClick={handleSaveDraft} disabled={saving} variant="outline"><FileText className="w-4 h-4" />{t("integrations.adminEmail.compose.saveDraft")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}