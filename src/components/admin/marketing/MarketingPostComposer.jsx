import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Calendar, FileText, Linkedin, Twitter, Facebook, Instagram, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0077B5", function: "linkedinService" },
  { id: "twitter", label: "X / Twitter", icon: Twitter, color: "#000000", function: "twitterService" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "#1877F2", function: "facebookService" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#E1306C", function: "instagramService" },
];

const ACTIONS = [
  { id: "shareDesignWork", label: { ar: "مشاركة عمل تصميمي", en: "Share Design Work" }, fields: [
    { key: "title", label: { ar: "عنوان العمل", en: "Title" } },
    { key: "description", label: { ar: "الوصف", en: "Description" }, multiline: true },
    { key: "designCategory", label: { ar: "التصنيف", en: "Category" } },
    { key: "engineerName", label: { ar: "اسم المهندس", en: "Engineer Name" } },
  ]},
  { id: "searchAndOutreachClients", label: { ar: "جذب عملاء محتملين", en: "Attract Clients" }, fields: [
    { key: "industry", label: { ar: "القطاع", en: "Industry" } },
    { key: "location", label: { ar: "المنطقة", en: "Location" } },
    { key: "projectType", label: { ar: "نوع المشروع", en: "Project Type" } },
  ]},
  { id: "outreachToEngineers", label: { ar: "استقطاب مهندسين", en: "Recruit Engineers" }, fields: [
    { key: "engineerSpecialization", label: { ar: "التخصص", en: "Specialization" } },
    { key: "engineerCity", label: { ar: "المدينة", en: "City" } },
  ]},
  { id: "draftOutreachMessage", label: { ar: "صياغة رسالة", en: "Draft Message" }, fields: [
    { key: "recipientName", label: { ar: "اسم المستلم", en: "Recipient Name" } },
    { key: "purpose", label: { ar: "الهدف", en: "Purpose" } },
  ]},
];

export default function MarketingPostComposer({ onPublished }) {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0]);
  const [selectedAction, setSelectedAction] = useState(ACTIONS[0]);
  const [formData, setFormData] = useState({});
  const [imageUrl, setImageUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (action) => {
    if (action === "publish" && !formData.description && !formData.title && !formData.purpose) {
      toast({ title: isRTL ? "يرجى ملء الحقول" : "Fill fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (action === "draft") {
        await base44.entities.SocialPost.create({
          platform: selectedPlatform.id,
          content: JSON.stringify(formData),
          status: "draft",
          action_type: selectedAction.id,
        });
        toast({ title: t("integrations.adminMarketing.compose.draftSaved") });
      } else if (action === "schedule") {
        if (!scheduledAt) { toast({ title: isRTL ? "حدد وقت الجدولة" : "Select schedule time", variant: "destructive" }); setLoading(false); return; }
        await base44.entities.SocialPost.create({
          platform: selectedPlatform.id,
          content: JSON.stringify(formData),
          status: "scheduled",
          scheduled_at: new Date(scheduledAt).toISOString(),
          action_type: selectedAction.id,
        });
        toast({ title: t("integrations.adminMarketing.compose.scheduleSuccess") });
      } else {
        // Publish now via existing backend functions
        let response;
        const platformFn = selectedPlatform.function;
        if (selectedPlatform.id === "linkedin") {
          response = await base44.functions.invoke(platformFn, { action: selectedAction.id, data: formData });
        } else {
          response = await base44.functions.invoke(platformFn, { action: selectedAction.id, ...formData, ...(imageUrl ? { imageUrl } : {}) });
        }
        const d = response.data;
        const success = d?.success;
        await base44.entities.SocialPost.create({
          platform: selectedPlatform.id,
          content: d?.content || d?.caption || d?.searchPost || d?.recruitPost || JSON.stringify(formData),
          status: success ? "published" : "failed",
          published_at: success ? new Date().toISOString() : null,
          post_url: d?.post_url || d?.tweet_url || null,
          post_id: d?.postId || null,
          error_message: success ? null : (d?.error || d?.note),
          action_type: selectedAction.id,
          media_urls: imageUrl ? [imageUrl] : [],
        });
        toast({
          title: success ? t("integrations.adminMarketing.compose.publishSuccess") : t("integrations.adminMarketing.compose.publishFailed"),
          description: success ? undefined : (d?.error || d?.note),
          variant: success ? "default" : "destructive",
        });
      }
      setFormData({}); setImageUrl(""); setScheduledAt("");
      onPublished?.();
    } catch (e) {
      toast({ title: t("integrations.adminMarketing.compose.publishFailed"), description: e.message, variant: "destructive" });
      // Log as failed
      try {
        await base44.entities.SocialPost.create({
          platform: selectedPlatform.id, content: JSON.stringify(formData), status: "failed",
          error_message: e.message, action_type: selectedAction.id,
        });
      } catch {}
    } finally { setLoading(false); }
  };

  const platformColor = selectedPlatform.color;
  const PlatformIcon = selectedPlatform.icon;

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#C9A66B]" />{t("integrations.adminMarketing.compose.title")}</h3>

        {/* Platform selector */}
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">{t("integrations.adminMarketing.compose.platform")}</label>
          <div className="flex gap-2 flex-wrap">
            {PLATFORMS.map(p => {
              const Icon = p.icon;
              const isActive = selectedPlatform.id === p.id;
              return (
                <button key={p.id} onClick={() => setSelectedPlatform(p)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${isActive ? "border-transparent text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                  style={isActive ? { backgroundColor: p.color } : {}}>
                  <Icon className="w-4 h-4" />{p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action selector */}
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">{t("integrations.adminMarketing.compose.selectAction")}</label>
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map(a => (
              <button key={a.id} onClick={() => { setSelectedAction(a); setFormData({}); }}
                className={`text-right p-2.5 rounded-lg border text-xs font-medium transition-all ${selectedAction.id === a.id ? "shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
                style={selectedAction.id === a.id ? { borderColor: platformColor, backgroundColor: `${platformColor}0d` } : {}}>
                {a.label[isRTL ? "ar" : "en"]}
              </button>
            ))}
          </div>
        </div>

        {/* Form fields */}
        {selectedAction.fields.map(field => (
          <div key={field.key}>
            <label className="text-xs text-slate-500 mb-1 block">{field.label[isRTL ? "ar" : "en"]}</label>
            {field.multiline ? (
              <Textarea value={formData[field.key] || ""} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} rows={3} className="text-sm" />
            ) : (
              <Input value={formData[field.key] || ""} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} className="text-sm" />
            )}
          </div>
        ))}

        {/* Image URL for Instagram */}
        {selectedPlatform.id === "instagram" && (
          <div>
            <label className="text-xs text-slate-500 mb-1 block">{t("integrations.adminMarketing.compose.mediaUrls")}</label>
            <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="text-sm" />
          </div>
        )}

        {/* Schedule */}
        <div>
          <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1"><Calendar className="w-3 h-3" />{t("integrations.adminMarketing.compose.schedule")}</label>
          <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="text-sm" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap pt-2">
          <Button onClick={() => handleSubmit("publish")} disabled={loading} className="text-white" style={{ backgroundColor: platformColor }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t("integrations.adminMarketing.compose.publishNow")}
          </Button>
          <Button onClick={() => handleSubmit("schedule")} disabled={loading} variant="outline"><Calendar className="w-4 h-4" />{t("integrations.adminMarketing.compose.schedule")}</Button>
          <Button onClick={() => handleSubmit("draft")} disabled={loading} variant="outline"><FileText className="w-4 h-4" />{t("integrations.adminMarketing.compose.saveDraft")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}