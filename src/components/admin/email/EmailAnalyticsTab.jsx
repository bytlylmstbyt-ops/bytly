import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, MailOpen, MousePointerClick, CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function EmailAnalyticsTab() {
  const { t, isRTL } = useLanguage();
  const [emails, setEmails] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sent, camps] = await Promise.all([
          base44.entities.SentEmail.list("-created_date", 500),
          base44.entities.EmailCampaign.list("-created_date", 100),
        ]);
        setEmails(sent || []);
        setCampaigns(camps || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const stats = useMemo(() => {
    const total = emails.length;
    const delivered = emails.filter(e => e.status === "sent").length;
    const failed = emails.filter(e => e.status === "failed").length;
    const deliveryRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : 0;
    const failureRate = total > 0 ? ((failed / total) * 100).toFixed(1) : 0;

    // Campaign stats
    const totalCampaigns = campaigns.length;
    const openCount = campaigns.reduce((sum, c) => sum + (c.open_count || 0), 0);
    const clickCount = campaigns.reduce((sum, c) => sum + (c.click_count || 0), 0);
    const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
    const openRate = totalSent > 0 ? ((openCount / totalSent) * 100).toFixed(1) : 0;
    const clickRate = totalSent > 0 ? ((clickCount / totalSent) * 100).toFixed(1) : 0;

    // By source
    const sourceMap = {};
    emails.forEach(e => {
      const src = e.source || "unknown";
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    });
    const bySource = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));

    return { total, delivered, failed, deliveryRate, failureRate, totalCampaigns, openCount, clickCount, openRate, clickRate, bySource };
  }, [emails, campaigns]);

  const cards = [
    { label: t("integrations.adminEmail.stats.totalSent"), value: stats.total, icon: TrendingUp, color: "text-[#C9A66B]", bg: "bg-[#FEF9EE]" },
    { label: t("integrations.adminEmail.analytics.deliveryRate"), value: `${stats.deliveryRate}%`, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: t("integrations.adminEmail.analytics.failureRate"), value: `${stats.failureRate}%`, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
    { label: t("integrations.adminEmail.analytics.openRate"), value: `${stats.openRate}%`, icon: MailOpen, color: "text-blue-600", bg: "bg-blue-50" },
    { label: t("integrations.adminEmail.analytics.clickRate"), value: `${stats.clickRate}%`, icon: MousePointerClick, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="border-[#C9A66B]/20">
              <CardContent className="flex items-center gap-2 p-3">
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${card.bg} shrink-0`}><Icon className={`w-4 h-4 ${card.color}`} /></div>
                <div className="min-w-0"><p className="font-bold text-[#4A3F35] text-lg">{card.value}</p><p className="text-xs text-slate-500 truncate">{card.label}</p></div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* By Source chart */}
      {stats.bySource.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#4A3F35]">{t("integrations.adminEmail.analytics.bySource")}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.bySource} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name={isRTL ? "عدد" : "Count"} fill="#C9A66B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}