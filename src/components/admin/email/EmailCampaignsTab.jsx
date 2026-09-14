import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, RefreshCw, Send, Clock, XCircle } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

const STATUS_CONFIG = {
  draft: { color: "bg-slate-100 text-slate-700", icon: Clock },
  scheduled: { color: "bg-blue-100 text-blue-700", icon: Calendar },
  sending: { color: "bg-amber-100 text-amber-700", icon: RefreshCw },
  sent: { color: "bg-green-100 text-green-700", icon: Send },
  failed: { color: "bg-red-100 text-red-700", icon: XCircle },
  cancelled: { color: "bg-slate-100 text-slate-500", icon: XCircle },
};

export default function EmailCampaignsTab({ onRefresh }) {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.EmailCampaign.list("-created_date", 100);
      setCampaigns(res || []);
    } catch (e) {
      toast({ title: isRTL ? "فشل التحميل" : "Failed to load", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (camp) => {
    if (!confirm(isRTL ? "هل تريد إلغاء هذه الحملة؟" : "Cancel this campaign?")) return;
    try {
      await base44.entities.EmailCampaign.update(camp.id, { status: "cancelled" });
      toast({ title: isRTL ? "تم الإلغاء" : "Cancelled" });
      load(); onRefresh?.();
    } catch (e) { toast({ title: isRTL ? "فشل" : "Failed", description: e.message, variant: "destructive" }); }
  };

  const handleResend = async (camp) => {
    try {
      const recipients = camp.recipients || [];
      let sent = 0, failed = 0;
      for (const email of recipients) {
        try {
          await base44.integrations.Core.SendEmail({ to: email, subject: camp.subject, body: camp.body, from_name: camp.from_name || "Bytly" });
          sent++;
        } catch { failed++; }
      }
      await base44.entities.EmailCampaign.update(camp.id, {
        status: "sent", sent_count: sent, failed_count: failed, sent_at: new Date().toISOString(),
      });
      toast({ title: isRTL ? "تم الإرسال" : "Sent", description: `${sent} ${isRTL ? "مرسل" : "sent"}` });
      load(); onRefresh?.();
    } catch (e) { toast({ title: isRTL ? "فشل" : "Failed", description: e.message, variant: "destructive" }); }
  };

  const filtered = filter === "all" ? campaigns : campaigns.filter(c => c.status === filter);
  const filters = ["all", "draft", "scheduled", "sent", "failed"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-[#4A3F35]">{t("integrations.adminEmail.campaigns.title")}</h3>
        <div className="flex gap-1">
          {filters.map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className={`h-8 text-xs ${filter === f ? "bg-[#4A3F35] text-white" : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? (isRTL ? "الكل" : "All") : t(`integrations.adminEmail.campaigns.${f}`)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border-slate-200"><CardContent className="text-center py-16 text-slate-400"><Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">{t("integrations.adminEmail.empty")}</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(camp => {
            const sc = STATUS_CONFIG[camp.status] || STATUS_CONFIG.draft;
            const SIcon = sc.icon;
            return (
              <Card key={camp.id} className="border-slate-200 hover:shadow-sm transition-shadow">
                <CardContent className="p-3 sm:p-4 flex items-center gap-3 flex-wrap">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${sc.color} shrink-0`}><SIcon className="w-4 h-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#4A3F35] text-sm truncate">{camp.subject || "(no subject)"}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                      <Badge className={`text-xs ${sc.color}`}>{t(`integrations.adminEmail.campaigns.${camp.status}`)}</Badge>
                      <span>{camp.total_recipients || camp.recipients?.length || 0} {isRTL ? "مستلم" : "recipients"}</span>
                      {camp.scheduled_at && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{moment(camp.scheduled_at).format("YYYY-MM-DD HH:mm")}</span>}
                      {camp.sent_at && <span className="flex items-center gap-1"><Send className="w-3 h-3" />{moment(camp.sent_at).format("YYYY-MM-DD HH:mm")}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(camp.status === "draft" || camp.status === "failed") && (
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleResend(camp)}><Send className="w-3 h-3 ml-1" />{t("integrations.adminEmail.campaigns.resend")}</Button>
                    )}
                    {(camp.status === "draft" || camp.status === "scheduled") && (
                      <Button size="sm" variant="outline" className="h-8 text-xs text-red-600" onClick={() => handleCancel(camp)}><XCircle className="w-3 h-3 ml-1" />{t("integrations.adminEmail.campaigns.cancel")}</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}