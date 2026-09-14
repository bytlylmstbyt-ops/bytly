import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import moment from "moment";

export default function MarketingPlatformCard({ platform, connected, lastSync, onTest }) {
  const { t, isRTL } = useLanguage();
  const [testing, setTesting] = React.useState(false);
  const Icon = platform.icon;

  const handleTest = async () => {
    setTesting(true);
    await onTest?.();
    setTesting(false);
  };

  const formatLastSync = (iso) => {
    if (!iso) return isRTL ? "—" : "—";
    return moment(iso).fromNow();
  };

  return (
    <Card className={`border-2 ${connected ? "border-green-200" : "border-slate-200"} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: platform.color }}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-[#4A3F35] text-sm">{platform.label}</p>
              {platform.accountName && <p className="text-xs text-slate-400">{platform.accountName}</p>}
            </div>
          </div>
          <Badge className={connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
            {connected ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
            {connected ? t("integrations.adminMarketing.platform.connected") : t("integrations.adminMarketing.platform.notConnected")}
          </Badge>
        </div>

        {/* Last sync */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{t("integrations.adminMarketing.platform.lastSync")}</span>
          <span className="font-medium">{formatLastSync(lastSync)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-1 pt-1">
          <Button size="sm" variant="outline" className="h-8 text-xs flex-1" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {t("integrations.adminMarketing.platform.testConnection")}
          </Button>
          {platform.profileUrl && (
            <a href={platform.profileUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><ExternalLink className="w-3.5 h-3.5" /></Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}