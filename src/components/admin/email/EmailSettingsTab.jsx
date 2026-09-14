import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Loader2, CheckCircle, AlertCircle, Settings } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";

export default function EmailSettingsTab() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await base44.functions.invoke("testIntegration", { integration_type: "gmail" });
      setConnectionStatus(res.ok ? "connected" : "disconnected");
      toast({ title: res.ok ? t("integrations.adminEmail.settings.connected") : t("integrations.adminEmail.settings.notConnected"), variant: res.ok ? "default" : "destructive" });
    } catch (e) {
      setConnectionStatus("disconnected");
      toast({ title: t("integrations.adminEmail.settings.notConnected"), description: e.message, variant: "destructive" });
    } finally { setTesting(false); }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast({ title: isRTL ? "أدخل بريد الاختبار" : "Enter test email", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: testEmail,
        subject: isRTL ? "رسالة اختبار من بيتلي" : "Test Email from Bytly",
        body: `<div style="font-family: Arial; padding: 20px;"><h2>${isRTL ? "اختبار البريد" : "Email Test"}</h2><p>${isRTL ? "هذه رسالة اختبار من نظام البريد في بيتلي." : "This is a test email from Bytly email system."}</p><p>${isRTL ? "الوقت" : "Time"}: ${new Date().toLocaleString(isRTL ? "ar-SA" : "en-US")}</p></div>`,
        from_name: "Bytly",
      });
      toast({ title: t("integrations.adminEmail.settings.testSent") });
      setTestEmail("");
    } catch (e) {
      toast({ title: isRTL ? "فشل الإرسال" : "Failed to send", description: e.message, variant: "destructive" });
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-4">
      {/* Provider info */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2"><Settings className="w-4 h-4 text-[#C9A66B]" />{t("integrations.adminEmail.settings.title")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-slate-200"><Mail className="w-5 h-5 text-red-500" /></div>
              <div>
                <p className="font-medium text-[#4A3F35] text-sm">Gmail</p>
                <p className="text-xs text-slate-500">{t("integrations.adminEmail.settings.provider")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connectionStatus && (
                <Badge className={connectionStatus === "connected" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                  {connectionStatus === "connected" ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                  {connectionStatus === "connected" ? t("integrations.adminEmail.settings.connected") : t("integrations.adminEmail.settings.notConnected")}
                </Badge>
              )}
              <Button size="sm" variant="outline" onClick={handleTestConnection} disabled={testing} className="h-8 text-xs">
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {t("integrations.adminEmail.platform.testConnection")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 mb-1 block">{t("integrations.adminEmail.settings.senderName")}</label><Input defaultValue="Bytly" readOnly className="bg-slate-50 text-sm" /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">{t("integrations.adminEmail.settings.senderEmail")}</label><Input defaultValue="noreply@bytly.com" readOnly className="bg-slate-50 text-sm" /></div>
          </div>
        </CardContent>
      </Card>

      {/* Send test email */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#4A3F35]">{t("integrations.adminEmail.settings.sendTest")}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder={t("integrations.adminEmail.settings.testEmail")} className="text-sm" />
            <Button onClick={handleSendTest} disabled={sending} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t("integrations.adminEmail.settings.sendTest")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}