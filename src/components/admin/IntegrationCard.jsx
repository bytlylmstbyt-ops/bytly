import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Plug, ZapOff, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  Unplug, Zap,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useLanguage } from "@/components/i18n/LanguageContext";

// Brand logo / icon per service
const SERVICE_ICONS = {
  stripe: "💳",
  google_analytics: "📊",
  instagram: "📸",
  tiktok: "🎵",
  googlecalendar: "📅",
  gmail: "✉️",
  linkedin: "💼",
  googledrive: "📁",
  googlesheets: "📈",
  googlemeet: "🎥",
};

function formatRelative(isoString, t) {
  if (!isoString) return t("integrations.summary.never");
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return t("integrations.summary.lastSync") + ": الآن";
  if (diffMin < 60) return `${diffMin} دقيقة مضت`;
  if (diffHr < 24) return `${diffHr} ساعة مضت`;
  if (diffDay < 7) return `${diffDay} يوم مضى`;
  return date.toLocaleDateString();
}

export default function IntegrationCard({ integration, onTested }) {
  const { t, isRTL } = useLanguage();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const serviceName = t(`integrations.services.${integration.type}`) || integration.type;
  const icon = SERVICE_ICONS[integration.type] || "🔌";

  const isNeedsReauth = integration.needs_reauth;
  const isDisconnected = !integration.connected;
  const statusKey = isNeedsReauth
    ? "needsReauth"
    : isDisconnected
    ? "disconnected"
    : "connected";

  const statusConfig = {
    connected: {
      label: t("integrations.status.connected"),
      badgeClass: "bg-green-100 text-green-700",
      icon: CheckCircle2,
      iconClass: "text-green-600",
    },
    disconnected: {
      label: t("integrations.status.disconnected"),
      badgeClass: "bg-slate-100 text-slate-500",
      icon: XCircle,
      iconClass: "text-slate-400",
    },
    needsReauth: {
      label: t("integrations.status.needsReauth"),
      badgeClass: "bg-amber-100 text-amber-700",
      icon: AlertTriangle,
      iconClass: "text-amber-600",
    },
  };

  const cfg = statusConfig[statusKey];
  const StatusIcon = cfg.icon;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke("testIntegration", {
        integration_type: integration.type,
      });
      if (res.ok) {
        setTestResult({ ok: true, message: t("integrations.messages.testSuccess") });
        toast({ title: `✅ ${t("integrations.messages.testSuccess")}` });
      } else {
        setTestResult({ ok: false, message: res.error || t("integrations.messages.testFailed") });
        toast({ title: `⚠️ ${t("integrations.messages.testFailed")}`, description: res.error, variant: "destructive" });
      }
      onTested?.(integration.type, res);
    } catch (err) {
      setTestResult({ ok: false, message: err.message });
      toast({ title: t("integrations.messages.testFailed"), description: err.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const handleReconnect = () => {
    toast({
      title: t("integrations.actions.reconnect"),
      description: t("integrations.messages.reconnectHint"),
    });
  };

  const handleDisconnect = () => {
    toast({
      title: t("integrations.actions.disconnect"),
      description: t("integrations.messages.disconnectHint"),
    });
  };

  return (
    <Card
      className={`border-r-4 transition-shadow hover:shadow-md ${
        statusKey === "connected" ? "border-green-400" : statusKey === "needsReauth" ? "border-amber-400" : "border-slate-300"
      }`}
    >
      <CardContent className="p-4">
        {/* Header: icon + name + status badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#FEF9EE] border border-[#C9A66B]/20 text-xl shrink-0">
              {icon}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[#4A3F35] text-sm truncate">{serviceName}</p>
              <p className="text-xs text-slate-400 capitalize">{integration.type}</p>
            </div>
          </div>
          <Badge className={cfg.badgeClass + " shrink-0"}>
            <StatusIcon className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} />
            {cfg.label}
          </Badge>
        </div>

        {/* Last sync */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <RefreshCw className="w-3 h-3" />
          <span>{formatRelative(integration.last_sync, t)}</span>
        </div>

        {/* Error / alert */}
        {integration.error && (
          <div className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-md p-2 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="break-words">{integration.error}</span>
          </div>
        )}

        {/* Test result */}
        {testResult && (
          <div
            className={`flex items-start gap-1.5 text-xs rounded-md p-2 mb-3 ${
              testResult.ok ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"
            }`}
          >
            {testResult.ok ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            )}
            <span className="break-words">{testResult.message}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleTest}
            disabled={testing}
            className="h-8 text-xs"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {testing ? t("integrations.actions.testing") : t("integrations.actions.test")}
          </Button>

          {(isNeedsReauth || isDisconnected) && (
            <Button size="sm" variant="outline" onClick={handleReconnect} className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50">
              <RefreshCw className="w-3.5 h-3.5" />
              {t("integrations.actions.reconnect")}
            </Button>
          )}

          {statusKey === "connected" && (
            <Button size="sm" variant="ghost" onClick={handleDisconnect} className="h-8 text-xs text-red-600 hover:bg-red-50">
              <Unplug className="w-3.5 h-3.5" />
              {t("integrations.actions.disconnect")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}