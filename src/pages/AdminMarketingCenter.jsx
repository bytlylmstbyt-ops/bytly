import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Megaphone, Plus, TrendingUp, FileText, AlertCircle, RefreshCw, Linkedin, Twitter, Facebook, Instagram } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarketingPlatformCard from "@/components/admin/marketing/MarketingPlatformCard";
import MarketingPostComposer from "@/components/admin/marketing/MarketingPostComposer";
import MarketingPostsList from "@/components/admin/marketing/MarketingPostsList";
import AddPlatformDialog from "@/components/admin/marketing/AddPlatformDialog";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0077B5", type: "connector", accountName: "bytly-sa", profileUrl: "https://www.linkedin.com/in/bytly-sa" },
  { id: "twitter", label: "X / Twitter", icon: Twitter, color: "#000000", type: "secret", accountName: "@bytlylmstbyt", profileUrl: "https://x.com/bytlylmstbyt" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "#1877F2", type: "secret", accountName: "Bytly", profileUrl: "https://www.facebook.com/profile.php?id=61587162083581" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#E1306C", type: "connector", accountName: "@bytlylmstbyt", profileUrl: "https://www.instagram.com/bytlylmstbyt" },
];

// Platforms available to add (for extensibility)
const AVAILABLE_PLATFORMS = [
  { id: "tiktok", label: "TikTok", icon: Plus, color: "#000000", type: "connector" },
];

const AUTHORIZED_CONNECTORS = ["instagram", "linkedin", "tiktok"];

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
      const [syncs, socialPosts] = await Promise.all([
        base44.entities.SyncState.list(),
        base44.entities.SocialPost.list("-created_date", 100),
      ]);
      const syncMap = {};
      (syncs || []).forEach(s => { syncMap[s.service] = s; });
      setSyncStates(syncMap);
      setPosts(socialPosts || []);
    } catch (e) {
      console.error("Failed to load marketing data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = () => { setRefreshing(true); loadData(); };

  const getConnectionStatus = (platform) => {
    if (platform.type === "connector") {
      return AUTHORIZED_CONNECTORS.includes(platform.id);
    }
    // Secret-based: Twitter and Facebook have API keys configured
    if (platform.id === "twitter") return true; // TWITTER_API_KEY exists
    if (platform.id === "facebook") return true; // FACEBOOK_PAGE_ID exists
    return false;
  };

  const getLastSync = (platformId) => {
    const sync = syncStates[platformId];
    return sync?.last_sync || null;
  };

  const handleAddPlatform = (platform) => {
    setExtraPlatforms(prev => [...prev, platform]);
    setShowAddDialog(false);
    toast({ title: isRTL ? `تمت إضافة ${platform.label}` : `${platform.label} added` });
  };

  const handleTestConnection = async (platformId) => {
    try {
      const res = await base44.functions.invoke("testIntegration", { integration_type: platformId });
      toast({
        title: res.ok ? (isRTL ? "الاتصال ناجح" : "Connection OK") : (isRTL ? "فشل الاتصال" : "Connection failed"),
        variant: res.ok ? "default" : "destructive",
      });
      return res.ok;
    } catch (e) {
      toast({ title: isRTL ? "فشل الاتصال" : "Connection failed", description: e.message, variant: "destructive" });
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
      </div>
    );
  }

  const connectedCount = allPlatforms.filter(p => getConnectionStatus(p)).length;
  const failedPosts = posts.filter(p => p.status === "failed");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#4A3F35]">{t("integrations.adminMarketing.title")}</h1>
            <p className="text-sm text-slate-500">{t("integrations.adminMarketing.description")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="h-9">
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isRTL ? "تحديث" : "Refresh"}
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90 h-9" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4" />
            {t("integrations.adminMarketing.platform.addPlatform")}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="border-[#C9A66B]/20">
          <CardContent className="flex items-center gap-2 p-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#FEF9EE] shrink-0"><Megaphone className="w-4 h-4 text-[#C9A66B]" /></div>
            <div><p className="font-bold text-[#4A3F35] text-xl">{allPlatforms.length}</p><p className="text-xs text-slate-500">{isRTL ? "المنصات" : "Platforms"}</p></div>
          </CardContent>
        </Card>
        <Card className="border-[#C9A66B]/20">
          <CardContent className="flex items-center gap-2 p-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-50 shrink-0"><TrendingUp className="w-4 h-4 text-green-600" /></div>
            <div><p className="font-bold text-[#4A3F35] text-xl">{connectedCount}</p><p className="text-xs text-slate-500">{t("integrations.adminMarketing.platform.connected")}</p></div>
          </CardContent>
        </Card>
        <Card className="border-[#C9A66B]/20">
          <CardContent className="flex items-center gap-2 p-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 shrink-0"><FileText className="w-4 h-4 text-blue-600" /></div>
            <div><p className="font-bold text-[#4A3F35] text-xl">{posts.length}</p><p className="text-xs text-slate-500">{isRTL ? "المنشورات" : "Posts"}</p></div>
          </CardContent>
        </Card>
        <Card className="border-[#C9A66B]/20">
          <CardContent className="flex items-center gap-2 p-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 shrink-0"><AlertCircle className="w-4 h-4 text-red-500" /></div>
            <div><p className="font-bold text-[#4A3F35] text-xl">{failedPosts.length}</p><p className="text-xs text-slate-500">{isRTL ? "أخطاء" : "Errors"}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {allPlatforms.map(platform => (
          <MarketingPlatformCard
            key={platform.id}
            platform={platform}
            connected={getConnectionStatus(platform)}
            lastSync={getLastSync(platform.id)}
            onTest={() => handleTestConnection(platform.id)}
          />
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-4 bg-transparent p-1 border border-slate-200 rounded-lg">
          <TabsTrigger value="posts" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white">
            <FileText className="w-3.5 h-3.5 ml-1.5" />{t("integrations.adminMarketing.tabs.posts")}
          </TabsTrigger>
          <TabsTrigger value="compose" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white">
            <Plus className="w-3.5 h-3.5 ml-1.5" />{t("integrations.adminMarketing.tabs.compose")}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white">
            <TrendingUp className="w-3.5 h-3.5 ml-1.5" />{t("integrations.adminMarketing.tabs.analytics")}
          </TabsTrigger>
          <TabsTrigger value="errors" className="text-xs sm:text-sm data-[state=active]:bg-[#4A3F35] data-[state=active]:text-white">
            <AlertCircle className="w-3.5 h-3.5 ml-1.5" />{t("integrations.adminMarketing.tabs.errors")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts"><MarketingPostsList posts={posts} onRefresh={handleRefresh} /></TabsContent>
        <TabsContent value="compose"><MarketingPostComposer onPublished={handleRefresh} /></TabsContent>
        <TabsContent value="analytics"><MarketingAnalyticsTab /></TabsContent>
        <TabsContent value="errors"><MarketingErrorsTab posts={posts} /></TabsContent>
      </Tabs>

      <AddPlatformDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAdd={handleAddPlatform} availablePlatforms={AVAILABLE_PLATFORMS} existingIds={allPlatforms.map(p => p.id)} />
    </div>
  );
}

// Inline analytics and errors tabs (small enough to keep here)
function MarketingAnalyticsTab() {
  const { t, isRTL } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("socialAnalytics", {});
        if (res.data?.success) setData(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  if (!data) return <Card className="border-slate-200"><CardContent className="text-center py-16 text-slate-400"><TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">{t("integrations.adminMarketing.empty")}</p></CardContent></Card>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-[#C9A66B]/20"><CardContent className="flex items-center gap-2 p-3"><div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#FEF9EE]"><TrendingUp className="w-4 h-4 text-[#C9A66B]" /></div><div><p className="font-bold text-[#4A3F35] text-xl">{data.summary?.totalEngagement ?? 0}</p><p className="text-xs text-slate-500">{t("integrations.adminMarketing.analytics.totalEngagement")}</p></div></CardContent></Card>
        <Card className="border-[#C9A66B]/20"><CardContent className="flex items-center gap-2 p-3"><div className="flex items-center justify-center w-9 h-9 rounded-lg bg-pink-50"><Instagram className="w-4 h-4 text-[#E1306C]" /></div><div><p className="font-bold text-[#4A3F35] text-xl">{data.summary?.totalLikes ?? 0}</p><p className="text-xs text-slate-500">{t("integrations.adminMarketing.analytics.totalLikes")}</p></div></CardContent></Card>
        <Card className="border-[#C9A66B]/20"><CardContent className="flex items-center gap-2 p-3"><div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50"><Facebook className="w-4 h-4 text-[#1877F2]" /></div><div><p className="font-bold text-[#4A3F35] text-xl">{data.summary?.totalComments ?? 0}</p><p className="text-xs text-slate-500">{t("integrations.adminMarketing.analytics.totalComments")}</p></div></CardContent></Card>
        <Card className="border-[#C9A66B]/20"><CardContent className="flex items-center gap-2 p-3"><div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-50"><TrendingUp className="w-4 h-4 text-green-600" /></div><div><p className="font-bold text-[#4A3F35] text-xl">{data.platforms ? Object.values(data.platforms).filter(p => !p.error).length : 0}</p><p className="text-xs text-slate-500">{t("integrations.adminMarketing.analytics.activePlatforms")}</p></div></CardContent></Card>
      </div>
      {data.platforms && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(data.platforms).map(([key, pData]) => {
            const config = PLATFORMS.find(p => p.id === key) || PLATFORMS.find(p => p.id === "twitter");
            const Icon = config?.icon || Megaphone;
            const color = config?.color || "#6B5D4F";
            return (
              <Card key={key} className="border-slate-200">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color }}><Icon className="w-4 h-4 text-white" /></div><p className="font-medium text-[#4A3F35] text-sm">{config?.label || key}</p></div>
                  {pData.error ? <p className="text-xs text-red-500">{pData.error}</p> : (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><p className="font-bold text-slate-700">{pData.total_likes ?? 0}</p><p className="text-slate-500">{isRTL ? "إعجابات" : "Likes"}</p></div>
                      <div><p className="font-bold text-slate-700">{pData.total_comments ?? 0}</p><p className="text-slate-500">{isRTL ? "تعليقات" : "Comments"}</p></div>
                      <div><p className="font-bold text-slate-700">{pData.total_engagement ?? 0}</p><p className="text-slate-500">{isRTL ? "تفاعل" : "Engagement"}</p></div>
                      <div><p className="font-bold text-slate-700">{pData.posts_count ?? 0}</p><p className="text-slate-500">{isRTL ? "منشورات" : "Posts"}</p></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MarketingErrorsTab({ posts }) {
  const { t, isRTL } = useLanguage();
  const errors = posts.filter(p => p.status === "failed" && p.error_message);

  if (errors.length === 0) {
    return <Card className="border-slate-200"><CardContent className="text-center py-16 text-slate-400"><AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">{t("integrations.adminMarketing.errors.noErrors")}</p></CardContent></Card>;
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr className={`text-xs text-slate-500 ${isRTL ? "text-right" : "text-left"}`}>
              <th className="p-3 font-medium">{t("integrations.adminMarketing.errors.platform")}</th>
              <th className="p-3 font-medium">{t("integrations.adminMarketing.errors.error")}</th>
            </tr></thead>
            <tbody>
              {errors.map(post => (
                <tr key={post.id} className="border-b last:border-0">
                  <td className="p-3"><Badge className="bg-red-100 text-red-700 text-xs">{post.platform}</Badge></td>
                  <td className="p-3 text-xs text-slate-600">{post.error_message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}