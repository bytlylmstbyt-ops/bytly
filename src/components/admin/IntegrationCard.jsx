import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Unplug, Zap, Link2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { startIntegrationOAuth, isDirectOAuthSupported } from "@/lib/integrationOAuth";

const SERVICE_ICONS = {
  stripe: "💳", google_analytics: "📊", instagram: "📸", tiktok: "🎵", googlecalendar: "📅",
  gmail: "✉️", linkedin: "💼", googledrive: "📁", googlesheets: "📈", googlemeet: "🎥",
  square: "🔷", supabase: "🗄️", github: "🐙", notion: "📝", slack: "💬", discord: "🎮",
};

function formatRelative(isoString, t) {
  if (!isoString) return t("integrations.summary.never");
  const diffMin = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return `${diffMin} دقيقة مضت`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} ساعة مضت`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} يوم مضى`;
  return new Date(isoString).toLocaleDateString();
}

export default function IntegrationCard({ integration, onTested }) {
  const { t } = useLanguage();
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const serviceName = t(`integrations.services.${integration.type}`) || integration.type;
  const icon = SERVICE_ICONS[integration.type] || "🔌";
  const connected = integration.connected;
  const canOAuth = isDirectOAuthSupported(integration.type);

  const handleTest = async () => {
    setTesting(true);
    try {
      const ok = Boolean(integration.connected);
      const result = ok ? { ok: true } : { ok: false, error: "الخدمة غير مرتبطة بعد. استخدم «ربط الخدمة» من إضافة تكامل جديد." };
      setTestResult({ ok, message: ok ? "تم التحقق من حالة الاتصال." : result.error });
      onTested?.(integration.type, result);
      toast({ title: ok ? "✅ الاتصال سليم" : "⚠️ الخدمة غير مرتبطة", variant: ok ? "default" : "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const handleReconnect = async () => {
    if (!canOAuth) {
      toast({ title: "OAuth المباشر غير مهيأ لهذه الخدمة بعد", variant: "destructive" });
      return;
    }
    setConnecting(true);
    try {
      await startIntegrationOAuth(integration.type);
    } catch (error) {
      toast({ title: "تعذر بدء المصادقة", description: error?.message, variant: "destructive" });
      setConnecting(false);
    }
  };

  return (
    <Card className={`border-r-4 transition-shadow hover:shadow-md ${connected ? "border-green-400" : "border-slate-300"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#FEF9EE] border border-[#C9A66B]/20 text-xl shrink-0">{icon}</div>
            <div className="min-w-0"><p className="font-semibold text-[#4A3F35] text-sm truncate">{serviceName}</p><p className="text-xs text-slate-400 capitalize">{integration.type}</p></div>
          </div>
          <Badge className={connected ? "bg-green-100 text-green-700 shrink-0" : "bg-slate-100 text-slate-500 shrink-0"}>
            {connected ? <CheckCircle2 className="w-3 h-3 ml-1" /> : <XCircle className="w-3 h-3 ml-1" />}
            {connected ? t("integrations.status.connected") : t("integrations.status.disconnected")}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2"><RefreshCw className="w-3 h-3" /><span>{formatRelative(integration.last_sync, t)}</span></div>

        {!connected && integration.type !== "stripe" && (
          <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-md p-2 mb-3"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{canOAuth ? "الخدمة جاهزة للربط المباشر عبر OAuth." : "هذا التكامل يحتاج إعداد OAuth/API مباشر قبل تفعيله."}</span></div>
        )}

        {testResult && <div className={`flex items-start gap-1.5 text-xs rounded-md p-2 mb-3 ${testResult.ok ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>{testResult.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}<span>{testResult.message}</span></div>}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handleTest} disabled={testing} className="h-8 text-xs">{testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}{testing ? "جاري الفحص" : "فحص الاتصال"}</Button>
          {(!connected && canOAuth) && <Button size="sm" variant="outline" onClick={handleReconnect} disabled={connecting} className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50">{connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}ربط الخدمة</Button>}
          {connected && canOAuth && <Button size="sm" variant="ghost" onClick={handleReconnect} disabled={connecting} className="h-8 text-xs text-blue-600">{connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}إعادة المصادقة</Button>}
          {connected && <Button size="sm" variant="ghost" onClick={() => toast({ title: "إدارة الفصل", description: "سيتم تفعيل فصل الحساب مباشرة من Bytly بعد إضافة إدارة الهوية." })} className="h-8 text-xs text-red-600"><Unplug className="w-3.5 h-3.5" />فصل</Button>}
        </div>
      </CardContent>
    </Card>
  );
}
