import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Plug, CheckCircle2, AlertTriangle, Link2, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useLanguage } from "@/components/i18n/LanguageContext";
import IntegrationCard from "@/components/admin/IntegrationCard";

export default function AdminIntegrations() {
  const { t, isRTL } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatuses = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const res = await base44.functions.invoke("getIntegrationStatuses", {});
      setData(res);
    } catch (err) {
      toast({ title: t("integrations.messages.loadFailed"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const handleTested = (type, result) => {
    // Update local state with test result
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        integrations: prev.integrations.map((i) =>
          i.type === type
            ? {
                ...i,
                connected: result.ok,
                needs_reauth: result.status === "needs_reauth",
                error: result.ok ? null : result.error,
              }
            : i
        ),
        connected_count: prev.integrations.filter((i) =>
          i.type === type ? result.ok : i.connected
        ).length,
        action_needed_count: prev.integrations.filter((i) =>
          i.type === type ? !result.ok : !i.connected || i.needs_reauth
        ).length,
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
      </div>
    );
  }

  const integrations = data?.integrations || [];
  const total = data?.total || integrations.length;
  const connectedCount = data?.connected_count ?? integrations.filter((i) => i.connected && !i.needs_reauth).length;
  const actionNeeded = data?.action_needed_count ?? integrations.filter((i) => !i.connected || i.needs_reauth).length;

  // Find the most recent sync time
  const lastSyncTimes = integrations
    .map((i) => i.last_sync)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a));
  const lastSync = lastSyncTimes[0] || null;

  const formatLastSync = (iso) => {
    if (!iso) return t("integrations.summary.never");
    const d = new Date(iso);
    return d.toLocaleString(isRTL ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const summaryCards = [
    {
      label: t("integrations.summary.total"),
      value: total,
      icon: Plug,
      color: "text-[#C9A66B]",
      bg: "bg-[#FEF9EE]",
    },
    {
      label: t("integrations.summary.connected"),
      value: connectedCount,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: t("integrations.summary.needsAction"),
      value: actionNeeded,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: t("integrations.summary.lastSync"),
      value: formatLastSync(lastSync),
      icon: RefreshCw,
      color: "text-blue-600",
      bg: "bg-blue-50",
      isText: true,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#4A3F35]">{t("integrations.title")}</h1>
            <p className="text-sm text-slate-500">{t("integrations.description")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchStatuses()} disabled={refreshing} className="h-9">
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isRTL ? "تحديث" : "Refresh"}
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90 h-9">
            <Plus className="w-4 h-4" />
            {t("integrations.addIntegration")}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="border-[#C9A66B]/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${card.bg} shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <p className={`font-bold text-[#4A3F35] ${card.isText ? "text-sm" : "text-2xl"}`}>
                    {card.value}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integration cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integ) => (
          <IntegrationCard key={integ.type} integration={integ} onTested={handleTested} />
        ))}
      </div>
    </div>
  );
}