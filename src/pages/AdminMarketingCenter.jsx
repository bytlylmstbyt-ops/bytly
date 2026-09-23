import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Megaphone, Plus, TrendingUp, FileText, AlertCircle, RefreshCw, Search, Linkedin, Twitter, Facebook, Instagram, CalendarClock, BarChart3, Gauge } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarketingPlatformCard from "@/components/admin/marketing/MarketingPlatformCard";
import MarketingPostComposer from "@/components/admin/marketing/MarketingPostComposer";
import MarketingPostsList from "@/components/admin/marketing/MarketingPostsList";
import PostScheduler from "@/components/admin/marketing/PostScheduler";
import CampaignReports from "@/components/admin/marketing/CampaignReports";
import GoogleAnalyticsPanel from "@/components/admin/marketing/GoogleAnalyticsPanel";
import AdminSearchGeoAnalytics from "@/pages/AdminSearchGeoAnalytics";
import AddPlatformDialog from "@/components/admin/marketing/AddPlatformDialog";
import MarketingCharts from "@/components/admin/marketing/MarketingCharts";
import { listSyncStates, listSocialPosts, testMarketingConnection, getMarketingAnalytics } from "@/lib/marketingService";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0077B5", type: "connector", accountName: "bytly-sa", profileUrl: "https://www.linkedin.com/in/bytly-sa" },
  { id: "twitter", label: "X / Twitter", icon: Twitter, color: "#000000", type: "secret", accountName: "@bytlylmstbyt", profileUrl: "https://x.com/bytlylmstbyt" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "#1877F2", type: "secret", accountName: "Bytly", profileUrl: "https://www.facebook.com/profile.php?id=61587162083581" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#E1306C", type: "connector", accountName: "@bytlylmstbyt", profileUrl: "https://www.instagram.com/bytlylmstbyt" },
];
const AVAILABLE_PLATFORMS = [{ id: "tiktok", label: "TikTok", icon: Plus, color: "#000000", type: "connector" }];

export default function AdminMarketingCenter() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [syncStates, setSyncStates] = useState({});
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [extraPlatforms, setExtraPlatforms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const allPlatforms = [...PLATFORMS, ...extraPlatforms];

  const loadData = useCallback(async () => {
    try {
      const [syncs, socialPosts, linkedinCheck] = await Promise.all([
        listSyncStates(),
        listSocialPosts(100),
        testMarketingConnection("linkedin").catch((error) => ({
          ok: false,
          connected: false,
          platform: "linkedin",
          message: error?.message || "تعذر فحص LinkedIn.",
        })),
      ]);
      const syncMap = {};
      (syncs || []).forEach((s) => { syncMap[s.service] = s; });
      if (linkedinCheck?.ok && linkedinCheck?.connected) {
        syncMap.linkedin = {
          ...(syncMap.linkedin || {}),
          service: "linkedin",
          sync_token: "server-managed",
          connection_status: "connected",
          last_sync: new Date().toISOString(),
          description: linkedinCheck.message,
        };
      } else if (!syncMap.linkedin?.sync_token) {
        syncMap.linkedin = {
          ...(syncMap.linkedin || {}),
          service: "linkedin",
          sync_token: null,
          last_sync: null,
          description: linkedinCheck?.message || "LinkedIn غير متصل",
        };
      }
      setSyncStates(syncMap);
      setPosts(socialPosts || []);
    } catch (e) {
      console.error("Failed to load marketing data:", e);
      toast({ title: isRTL ? "تعذر تحميل بيانات التسويق" : "Failed to load marketing data", description: e.message, variant: "destructive" });
    } finally { setLoading(false); setRefreshing(false); }
  }, [isRTL, toast]);

  useEffect(() => { loadData(); }, [loadData]);
  const handleRefresh = () => { setRefreshing(true); loadData(); };
  const getConnectionStatus = (platform) => {
    if (platform.id === "linkedin") {
      return Boolean(syncStates.linkedin?.connection_status === "connected" || syncStates.linkedin?.sync_token);
    }
    return Boolean(syncStates[platform.id]?.sync_token);
  };
  const getLastSync = (platformId) => syncStates[platformId]?.last_sync || null;
  const handleAddPlatform = (platform) => { setExtraPlatforms((prev) => [...prev, platform]); setShowAddDialog(false); toast({ title: isRTL ? `تمت إضافة ${platform.label}` : `${platform.label} added` }); };
  const handleTestConnection = async (platformId) => {
    try {
      const res = await testMarketingConnection(platformId);
      toast({ title: res.ok ? (isRTL ? "الاتصال مسجل" : "Connection recorded") : (isRTL ? "المنصة غير متصلة" : "Platform not connected"), description: res.message, variant: res.ok ? "default" : "destructive" });
      return res.ok;
    } catch (e) {
      console.error("Marketing connection check failed:", e);
      toast({
        title: isRTL ? "فشل فحص الاتصال" : "Connection check failed",
        description: isRTL ? "تعذر إكمال فحص الاتصال. تحقق من إعدادات التكامل ثم أعد المحاولة." : "The connection check could not be completed. Check the integration settings and try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  if (loading) return <div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" /></div>;
  const connectedCount = allPlatforms.filter((p) => getConnectionStatus(p)).length;
  const failedPosts = posts.filter((p) => p.status === "failed");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white"><Megaphone className="w-6 h-6" /></div><div><h1 className="text-2xl font-bold text-[#4A3F35]">{t("integrations.adminMarketing.title")}</h1><p className="text-sm text-slate-500">{t("integrations.adminMarketing.description")}</p></div></div>
        <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="h-9">{refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}{isRTL ? "تحديث" : "Refresh"}</Button><Button size="sm" className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90 h-9" onClick={() => setShowAddDialog(true)}><Plus className="w-4 h-4" />{t("integrations.adminMarketing.platform.addPlatform")}</Button></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="border-[#C9A66B]/20"><CardContent className="flex items-center gap-2 p-3"><div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#FEF9EE] shrink-0"><Megaphone className="w-4 h-4 text-[#C9A66B]" /></div><div><p className="font-bold text-[#4A3F35] text-xl">{allPlatforms.length}</p><p className="text-xs text-slate-500">{isRTL ? "المنصات" : "Platforms"}</p></div></CardContent></Card>
        <Card className="border-[#C9A66B]/20"><CardContent className="flex items-center gap-2 p-3"><div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-50 shrink-0"><TrendingUp className="w-4 h-4 text-green-600" /></div><div><p className="font-bold text-[#4A3F35] text-xl">{connectedCount}</p><p className="text-xs text-slate-500">{t("integrations.adminMarketing.platform.connected")}</p></div></CardContent></Card>
        <Card className="border-[#C9A66B]/20"><CardContent className="flex items-center gap-2 p-3"><div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 shrink-0"><FileText className="w-4 h-4 text-blue-600" /></div><div><p className="font-bold text-[#4A3F35] text-xl">{posts.length}</p><p className="text-xs text-slate-500">{isRTL ? "المنشورات" : "Posts"}</p></div></CardContent></Card>
        <Card className="border-[#C9A66B]/20"><CardContent className="flex items-center gap-2 p-3"><div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 shrink-0"><AlertCircle className="w-4 h-4 text-red-500" /></div><div><p className="font-bold text-[#4A3F35] text-xl">{failedPosts.length}</p><p className="text-xs text-slate-500">{isRTL ? "أخطاء" : "Errors"}</p></div></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">{allPlatforms.map((platform) => <MarketingPlatformCard key={platform.id} platform={platform} connected={getConnectionStatus(platform)} lastSync={getLastSync(platform.id)} onTest={() => handleTestConnection(platform.id)} />)}</div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-4 bg-transparent p-1 border border-slate-200 rounded-lg">
          <TabsTrigger value="posts" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white"><FileText className="w-3.5 h-3.5 ml-1.5" />{t("integrations.adminMarketing.tabs.posts")}</TabsTrigger>
          <TabsTrigger value="compose" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white"><Plus className="w-3.5 h-3.5 ml-1.5" />{t("integrations.adminMarketing.tabs.compose")}</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white"><TrendingUp className="w-3.5 h-3.5 ml-1.5" />{t("integrations.adminMarketing.tabs.analytics")}</TabsTrigger>
          <TabsTrigger value="scheduler" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white"><CalendarClock className="w-3.5 h-3.5 ml-1.5" />{isRTL ? "جدولة المنشورات" : "Post Scheduler"}</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white"><BarChart3 className="w-3.5 h-3.5 ml-1.5" />{isRTL ? "تقارير الأداء" : "Reports"}</TabsTrigger>
          <TabsTrigger value="ga" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white"><Gauge className="w-3.5 h-3.5 ml-1.5" />Google Analytics</TabsTrigger>
          <TabsTrigger value="searchGeo" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white"><Search className="w-3.5 h-3.5 ml-1.5" />{isRTL ? "محركات البحث والتحليل الجغرافي" : "Search & Geo Analytics"}</TabsTrigger>
          <TabsTrigger value="errors" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white"><AlertCircle className="w-3.5 h-3.5 ml-1.5" />{t("integrations.adminMarketing.tabs.errors")}</TabsTrigger>
        </TabsList>
        <TabsContent value="posts"><MarketingPostsList posts={posts} onRefresh={handleRefresh} /></TabsContent>
        <TabsContent value="compose"><MarketingPostComposer onPublished={handleRefresh} /></TabsContent>
        <TabsContent value="analytics"><MarketingAnalyticsTab posts={posts} /></TabsContent>
        <TabsContent value="scheduler"><PostScheduler onPublished={handleRefresh} /></TabsContent>
        <TabsContent value="reports"><CampaignReports posts={posts} /></TabsContent>
        <TabsContent value="ga"><GoogleAnalyticsPanel /></TabsContent>
        <TabsContent value="searchGeo"><AdminSearchGeoAnalytics /></TabsContent>
        <TabsContent value="errors"><MarketingErrorsTab posts={posts} /></TabsContent>
      </Tabs>
      <AddPlatformDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAdd={handleAddPlatform} availablePlatforms={AVAILABLE_PLATFORMS} existingIds={allPlatforms.map((p) => p.id)} />
    </div>
  );
}

function MarketingAnalyticsTab({ posts }) {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { setData(await getMarketingAnalytics(posts)); } catch (e) { console.error(e); } finally { setLoading(false); } })(); }, [posts]);
  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  const publishedWithMetrics = (posts || []).filter((p) => p.status === "published" && p.metrics);
  if (!data && publishedWithMetrics.length === 0) return <Card className="border-slate-200"><CardContent className="text-center py-16 text-slate-400"><TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">{t("integrations.adminMarketing.empty")}</p></CardContent></Card>;
  return <MarketingCharts data={data} posts={posts} />;
}

function MarketingErrorsTab({ posts }) {
  const { isRTL } = useLanguage();
  const failed = (posts || []).filter((p) => p.status === "failed");
  if (!failed.length) return <Card><CardContent className="py-16 text-center text-slate-400">{isRTL ? "لا توجد أخطاء منشورة مسجلة" : "No failed posts recorded"}</CardContent></Card>;
  return <div className="space-y-3">{failed.map((p) => <Card key={p.id}><CardContent className="p-4"><div className="flex justify-between gap-3"><div><p className="font-semibold">{p.content?.slice(0, 120)}</p><p className="text-xs text-slate-500 mt-1">{p.platform} · {p.error_message || ""}</p></div><Badge variant="destructive">{p.status}</Badge></div></CardContent></Card>)}</div>;
}