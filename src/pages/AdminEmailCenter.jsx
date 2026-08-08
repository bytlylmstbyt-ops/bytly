import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Mail, Send, FileText, Calendar, TrendingUp, Inbox, AlertCircle } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailComposeTab from "@/components/admin/email/EmailComposeTab";
import EmailTemplatesTab from "@/components/admin/email/EmailTemplatesTab";
import EmailCampaignsTab from "@/components/admin/email/EmailCampaignsTab";
import EmailSentLogTab from "@/components/admin/email/EmailSentLogTab";
import EmailAnalyticsTab from "@/components/admin/email/EmailAnalyticsTab";
import EmailSettingsTab from "@/components/admin/email/EmailSettingsTab";

export default function AdminEmailCenter() {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalSent: 0, delivered: 0, failed: 0, scheduled: 0, drafts: 0, templates: 0 });
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadStats = useCallback(async () => {
    try {
      const [sentEmails, campaigns, templates] = await Promise.all([
        base44.entities.SentEmail.list("-created_date", 500),
        base44.entities.EmailCampaign.list("-created_date", 100),
        base44.entities.EmailTemplate.list("-created_date", 100),
      ]);

      const sent = sentEmails || [];
      const camps = campaigns || [];
      const tmpls = templates || [];

      setStats({
        totalSent: sent.length,
        delivered: sent.filter(e => e.status === "sent").length,
        failed: sent.filter(e => e.status === "failed").length,
        scheduled: camps.filter(c => c.status === "scheduled").length,
        drafts: camps.filter(c => c.status === "draft").length,
        templates: tmpls.length,
      });
    } catch (err) {
      console.error("Failed to load email stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats, refreshKey]);

  const handleRefresh = () => setRefreshKey(k => k + 1);

  const statCards = [
    { key: "totalSent", icon: Send, color: "text-[#C9A66B]", bg: "bg-[#FEF9EE]" },
    { key: "delivered", icon: Mail, color: "text-green-600", bg: "bg-green-50" },
    { key: "failed", icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
    { key: "scheduled", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { key: "drafts", icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
    { key: "templates", icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white">
          <Mail className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#4A3F35]">{t("integrations.adminEmail.title")}</h1>
          <p className="text-sm text-slate-500">{t("integrations.adminEmail.description")}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key} className="border-[#C9A66B]/20">
              <CardContent className="flex items-center gap-2 p-3">
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${card.bg} shrink-0`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#4A3F35] text-xl">{stats[card.key]}</p>
                  <p className="text-xs text-slate-500 truncate">{t(`integrations.adminEmail.stats.${card.key}`)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-4 bg-transparent p-1 border border-slate-200 rounded-lg">
          <TabsTrigger value="overview" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white">
            <TrendingUp className="w-3.5 h-3.5 ml-1.5" />
            {t("integrations.adminEmail.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="sent" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white">
            <Inbox className="w-3.5 h-3.5 ml-1.5" />
            {t("integrations.adminEmail.tabs.sent")}
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white">
            <FileText className="w-3.5 h-3.5 ml-1.5" />
            {t("integrations.adminEmail.tabs.templates")}
          </TabsTrigger>
          <TabsTrigger value="compose" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white">
            <Send className="w-3.5 h-3.5 ml-1.5" />
            {t("integrations.adminEmail.tabs.compose")}
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white">
            <Calendar className="w-3.5 h-3.5 ml-1.5" />
            {t("integrations.adminEmail.tabs.campaigns")}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white">
            <TrendingUp className="w-3.5 h-3.5 ml-1.5" />
            {t("integrations.adminEmail.tabs.analytics")}
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white">
            <Mail className="w-3.5 h-3.5 ml-1.5" />
            {t("integrations.adminEmail.tabs.settings")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <EmailSentLogTab onRefresh={handleRefresh} limit={10} />
        </TabsContent>
        <TabsContent value="sent">
          <EmailSentLogTab onRefresh={handleRefresh} />
        </TabsContent>
        <TabsContent value="templates">
          <EmailTemplatesTab onRefresh={handleRefresh} />
        </TabsContent>
        <TabsContent value="compose">
          <EmailComposeTab onSent={handleRefresh} />
        </TabsContent>
        <TabsContent value="campaigns">
          <EmailCampaignsTab onRefresh={handleRefresh} />
        </TabsContent>
        <TabsContent value="analytics">
          <EmailAnalyticsTab />
        </TabsContent>
        <TabsContent value="settings">
          <EmailSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}