import React, { useState, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, TrendingUp, Eye, MousePointerClick, Heart, MessageCircle, Share2 } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

export default function CampaignReports({ posts }) {
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef(null);

  const publishedPosts = useMemo(() => {
    return (posts || []).filter(p => p.status === "published");
  }, [posts]);

  const report = useMemo(() => {
    const totalReach = publishedPosts.reduce((s, p) => s + (p.metrics?.reach || 0), 0);
    const totalClicks = publishedPosts.reduce((s, p) => s + (p.metrics?.clicks || 0), 0);
    const totalLikes = publishedPosts.reduce((s, p) => s + (p.metrics?.likes || 0), 0);
    const totalComments = publishedPosts.reduce((s, p) => s + (p.metrics?.comments || 0), 0);
    const totalShares = publishedPosts.reduce((s, p) => s + (p.metrics?.shares || 0), 0);
    const totalImpressions = publishedPosts.reduce((s, p) => s + (p.metrics?.impressions || 0), 0);
    const totalEngagement = totalLikes + totalComments + totalShares;
    const avgEngagementRate = totalImpressions > 0 ? ((totalEngagement / totalImpressions) * 100).toFixed(2) : "0";
    const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";

    // Per platform breakdown
    const platformMap = {};
    publishedPosts.forEach(p => {
      const key = p.platform || "other";
      if (!platformMap[key]) {
        platformMap[key] = { platform: key, posts: 0, reach: 0, clicks: 0, likes: 0, comments: 0, shares: 0, impressions: 0 };
      }
      const m = platformMap[key];
      m.posts += 1;
      m.reach += p.metrics?.reach || 0;
      m.clicks += p.metrics?.clicks || 0;
      m.likes += p.metrics?.likes || 0;
      m.comments += p.metrics?.comments || 0;
      m.shares += p.metrics?.shares || 0;
      m.impressions += p.metrics?.impressions || 0;
    });

    // Top performing posts by engagement
    const topPosts = [...publishedPosts]
      .map(p => ({
        ...p,
        engagement: (p.metrics?.likes || 0) + (p.metrics?.comments || 0) + (p.metrics?.shares || 0),
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);

    return {
      totalPosts: publishedPosts.length,
      totalReach, totalClicks, totalLikes, totalComments, totalShares,
      totalImpressions, totalEngagement, avgEngagementRate, avgCTR,
      platforms: Object.values(platformMap),
      topPosts,
    };
  }, [publishedPosts]);

  const handleDownload = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `marketing-report-${moment().format("YYYY-MM-DD")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: isRTL ? "تم تحميل التقرير" : "Report downloaded" });
    } catch (e) {
      toast({ title: isRTL ? "فشل التحميل" : "Download failed", description: e.message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const kpiCards = [
    { icon: FileText, label: isRTL ? "إجمالي المنشورات" : "Total Posts", value: report.totalPosts, color: "text-[#C9A66B]", bg: "bg-[#FEF9EE]" },
    { icon: Eye, label: isRTL ? "إجمالي الوصول" : "Total Reach", value: report.totalReach.toLocaleString(), color: "text-blue-600", bg: "bg-blue-50" },
    { icon: MousePointerClick, label: isRTL ? "إجمالي النقرات" : "Total Clicks", value: report.totalClicks.toLocaleString(), color: "text-[#C9A66B]", bg: "bg-[#FEF9EE]" },
    { icon: Heart, label: isRTL ? "إجمالي التفاعل" : "Total Engagement", value: report.totalEngagement.toLocaleString(), color: "text-pink-600", bg: "bg-pink-50" },
    { icon: TrendingUp, label: isRTL ? "معدل النقر %" : "Click Rate %", value: `${report.avgCTR}%`, color: "text-green-600", bg: "bg-green-50" },
    { icon: TrendingUp, label: isRTL ? "معدل التفاعل %" : "Engagement Rate %", value: `${report.avgEngagementRate}%`, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#C9A66B]" />
          {isRTL ? "تقرير أداء الحملات" : "Campaign Performance Report"}
        </h3>
        <Button size="sm" variant="outline" onClick={handleDownload} disabled={downloading || report.totalPosts === 0}>
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isRTL ? "تحميل التقرير" : "Download Report"}
        </Button>
      </div>

      {report.totalPosts === 0 ? (
        <Card className="border-slate-200"><CardContent className="text-center py-16 text-slate-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{isRTL ? "لا توجد منشورات منشورة لإنشاء تقرير" : "No published posts to report"}</p>
        </CardContent></Card>
      ) : (
        <div ref={reportRef} className="space-y-4 p-4 bg-white rounded-xl border border-slate-200">
          {/* Report header */}
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-lg font-bold text-[#4A3F35]">{isRTL ? "تقرير أداء الحملات التسويقية" : "Marketing Campaign Performance Report"}</h2>
            <p className="text-xs text-slate-500">{isRTL ? "تاريخ الإصدار" : "Generated"}: {moment().format("YYYY-MM-DD HH:mm")}</p>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {kpiCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <Card key={idx} className="border-slate-200">
                  <CardContent className="flex items-center gap-2 p-3">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${card.bg} shrink-0`}>
                      <Icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#4A3F35] text-lg truncate">{card.value}</p>
                      <p className="text-xs text-slate-500 truncate">{card.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Platform breakdown table */}
          <Card className="border-slate-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr className={`text-xs text-slate-500 ${isRTL ? "text-right" : "text-left"}`}>
                      <th className="p-3 font-medium">{isRTL ? "المنصة" : "Platform"}</th>
                      <th className="p-3 font-medium">{isRTL ? "المنشورات" : "Posts"}</th>
                      <th className="p-3 font-medium">{isRTL ? "الوصول" : "Reach"}</th>
                      <th className="p-3 font-medium">{isRTL ? "النقرات" : "Clicks"}</th>
                      <th className="p-3 font-medium">{isRTL ? "إعجابات" : "Likes"}</th>
                      <th className="p-3 font-medium hidden sm:table-cell">{isRTL ? "تعليقات" : "Comments"}</th>
                      <th className="p-3 font-medium hidden sm:table-cell">{isRTL ? "مشاركات" : "Shares"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.platforms.map(p => (
                      <tr key={p.platform} className="border-b last:border-0">
                        <td className="p-3"><Badge variant="outline" className="text-xs capitalize">{p.platform}</Badge></td>
                        <td className="p-3 font-medium text-slate-700">{p.posts}</td>
                        <td className="p-3 text-slate-600">{p.reach.toLocaleString()}</td>
                        <td className="p-3 text-slate-600">{p.clicks.toLocaleString()}</td>
                        <td className="p-3 text-slate-600">{p.likes.toLocaleString()}</td>
                        <td className="p-3 text-slate-600 hidden sm:table-cell">{p.comments.toLocaleString()}</td>
                        <td className="p-3 text-slate-600 hidden sm:table-cell">{p.shares.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Top performing posts */}
          {report.topPosts.length > 0 && (
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-[#4A3F35] mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#C9A66B]" />
                  {isRTL ? "أفضل المنشورات أداءً" : "Top Performing Posts"}
                </h4>
                <div className="space-y-2">
                  {report.topPosts.map((post, idx) => (
                    <div key={post.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
                      <div className="w-6 h-6 rounded-full bg-[#C9A66B] text-white flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-700 line-clamp-1">{post.content?.substring(0, 120)}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span className="capitalize">{post.platform}</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.metrics?.likes || 0}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.metrics?.comments || 0}</span>
                          <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{post.metrics?.shares || 0}</span>
                        </div>
                      </div>
                      <Badge className="bg-[#FEF9EE] text-[#C9A66B] text-xs">{post.engagement}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}