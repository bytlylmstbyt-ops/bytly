import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Users, CheckCircle, XCircle, Loader2, Rocket } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function LaunchInvitations() {
  const { t, isRTL } = useLanguage();
  const [surveyRespondents, setSurveyRespondents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [manualEmails, setManualEmails] = useState("");
  const [subject, setSubject] = useState("🚀 انطلقت منصة بيتلي – كن من أوائل المستخدمين!");
  const [body, setBody] = useState(
    `مرحباً بك،\n\nنحن متحمسون لإخبارك بأن منصة بيتلي – لمسة بيت قد أطلقت رسمياً في مرحلتها التجريبية!\n\nبيتلي هي أول منصة هندسية ذكية في المملكة العربية السعودية تربطك مباشرة بالمهندسين والمعماريين والرسامين المؤهلين لتحويل رؤيتك إلى واقع.\n\n✨ لماذا تنضم الآن؟\n- أسعار خاصة للمستخدمين الأوائل\n- وصول مبكر للميزات الجديدة\n- دعم مباشر من فريقنا\n\nسجّل الآن مجاناً وكن جزءاً من رحلتنا:\nhttps://mybytly.com\n\nنتطلع لرؤيتك ضمن عائلة بيتلي!\n\nفريق بيتلي – لمسة بيت`
  );
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const loadRespondents = async () => {
      try {
        const responses = await base44.entities.SurveyResponse.list("-created_date", 500);
        const withEmail = (responses || []).filter(r => r.respondent_email);
        setSurveyRespondents(withEmail);
      } catch (e) {
        console.error("Error loading survey responses:", e);
      }
      setLoading(false);
    };
    loadRespondents();
  }, []);

  const toggleEmail = (email) => {
    setSelectedEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const selectAllInterested = () => {
    const interested = surveyRespondents
      .filter(r => r.platform_interest === "very_interested" || r.platform_interest === "interested")
      .map(r => r.respondent_email);
    setSelectedEmails(interested);
  };

  const allRecipients = () => {
    const manual = manualEmails
      .split(/[\n,;]/)
      .map(e => e.trim())
      .filter(e => e && e.includes("@"));
    return [...new Set([...selectedEmails, ...manual])];
  };

  const handleSend = async () => {
    const recipients = allRecipients();
    if (recipients.length === 0) {
      alert("يرجى اختيار مستلم واحد على الأقل");
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("sendLaunchInvitation", {
        recipients,
        subject,
        body,
        from_name: "بيتلي - لمسة بيت"
      });
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.message });
    }
    setSending(false);
  };

  const recipients = allRecipients();

  return (
    <div className="min-h-screen bg-slate-50" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center shrink-0">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#4A3F35]">دعوات الإطلاق التجريبي</h1>
            <p className="text-sm text-slate-500 mt-0.5">أرسل دعوات بريد إلكتروني لاستقطاب أوائل المستخدمين</p>
          </div>
        </div>

        {/* Recipients from Survey */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
                <Users className="w-4 h-4" />
                المستجيبون للاستطلاع ({surveyRespondents.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={selectAllInterested} disabled={loading}>
                اختيار المهتمين
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading
              ? <div className="h-24 bg-slate-100 rounded animate-pulse" />
              : surveyRespondents.length === 0
                ? <p className="text-slate-400 text-sm text-center py-6">لا يوجد مستجيبون ببريد إلكتروني بعد</p>
                : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {surveyRespondents.map((r) => (
                      <label key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEmails.includes(r.respondent_email)}
                          onChange={() => toggleEmail(r.respondent_email)}
                          className="w-4 h-4 accent-[#C9A66B]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#4A3F35] truncate">
                            {r.respondent_name || r.respondent_email}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{r.respondent_email}</p>
                        </div>
                        {r.platform_interest && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {r.platform_interest === "very_interested" ? "مهتم جداً"
                             : r.platform_interest === "interested" ? "مهتم"
                             : r.platform_interest === "maybe" ? "ربما"
                             : "غير مهتم"}
                          </Badge>
                        )}
                      </label>
                    ))}
                  </div>
                )
            }
          </CardContent>
        </Card>

        {/* Manual Emails */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#4A3F35]">إضافة بريد إلكتروني يدوياً</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="أدخل البريد الإلكتروني، افصل بينها بفاصلة أو سطر جديد"
              value={manualEmails}
              onChange={(e) => setManualEmails(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Email Composition */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
              <Mail className="w-4 h-4" />
              محتوى الرسالة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">عنوان الرسالة</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">نص الرسالة</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className="mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Send Bar */}
        <div className="sticky bottom-4 bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-semibold text-[#4A3F35]">{recipients.length}</span>
            <span className="text-slate-500"> مستلم محدد</span>
          </div>
          <Button
            onClick={handleSend}
            disabled={sending || recipients.length === 0}
            className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"
          >
            {sending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الإرسال...</>
              : <><Send className="w-4 h-4" /> إرسال الدعوات</>
            }
          </Button>
        </div>

        {/* Results */}
        {result && (
          <Card className={result.error ? "border-red-300" : "border-green-300"}>
            <CardContent className="p-4">
              {result.error ? (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm">خطأ: {result.error}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">تم الإرسال بنجاح</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">✓ تم إرسال: {result.sent}</span>
                    {result.failed > 0 && <span className="text-red-500">✗ فشل: {result.failed}</span>}
                  </div>
                  {result.results?.filter(r => !r.success).length > 0 && (
                    <div className="text-xs text-red-500 mt-2">
                      {result.results.filter(r => !r.success).map(r => `${r.email}: ${r.error}`).join("، ")}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}