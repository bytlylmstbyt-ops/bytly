import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, ExternalLink, Trash2, Linkedin, Twitter, Facebook, Instagram, Send, Clock, XCircle, CheckCircle } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

const PLATFORM_ICONS = { linkedin: Linkedin, twitter: Twitter, facebook: Facebook, instagram: Instagram };
const STATUS_CONFIG = {
  draft: { color: "bg-slate-100 text-slate-700", icon: Clock },
  scheduled: { color: "bg-blue-100 text-blue-700", icon: Clock },
  publishing: { color: "bg-amber-100 text-amber-700", icon: Loader2 },
  published: { color: "bg-green-100 text-green-700", icon: CheckCircle },
  failed: { color: "bg-red-100 text-red-700", icon: XCircle },
  cancelled: { color: "bg-slate-100 text-slate-500", icon: XCircle },
};

export default function MarketingPostsList({ posts, onRefresh }) {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [deleting, setDeleting] = useState(null);

  const filtered = useMemo(() => {
    return filter === "all" ? posts : posts.filter(p => p.status === filter);
  }, [posts, filter]);

  const handleDelete = async (post) => {
    setDeleting(post.id);
    try {
      await base44.entities.SocialPost.delete(post.id);
      toast({ title: isRTL ? "تم الحذف" : "Deleted" });
      onRefresh?.();
    } catch (e) {
      toast({ title: isRTL ? "فشل الحذف" : "Failed", description: e.message, variant: "destructive" });
    } finally { setDeleting(null); }
  };

  const filters = ["all", "draft", "scheduled", "published", "failed"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-[#4A3F35]">{t("integrations.adminMarketing.posts.title")}</h3>
        <div className="flex gap-1">
          {filters.map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className={`h-8 text-xs ${filter === f ? "bg-[#4A3F35] text-white" : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? (isRTL ? "الكل" : "All") : t(`integrations.adminMarketing.posts.${f}`)}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-slate-200"><CardContent className="text-center py-16 text-slate-400"><FileText className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">{t("integrations.adminMarketing.empty")}</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(post => {
            const PIcon = PLATFORM_ICONS[post.platform] || FileText;
            const sc = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
            const SIcon = sc.icon;
            return (
              <Card key={post.id} className="border-slate-200 hover:shadow-sm transition-shadow">
                <CardContent className="p-3 sm:p-4 flex items-start gap-3 flex-wrap">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100"><PIcon className="w-4 h-4 text-slate-600" /></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs ${sc.color}`}><SIcon className="w-3 h-3 mr-1" />{t(`integrations.adminMarketing.posts.${post.status}`)}</Badge>
                      <span className="text-xs text-slate-400">{post.platform}</span>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">{post.content?.substring(0, 200) || "—"}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                      {post.scheduled_at && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{moment(post.scheduled_at).format("YYYY-MM-DD HH:mm")}</span>}
                      {post.published_at && <span className="flex items-center gap-1"><Send className="w-3 h-3" />{moment(post.published_at).format("YYYY-MM-DD HH:mm")}</span>}
                      {post.error_message && <span className="text-red-500 truncate max-w-[200px]">⚠ {post.error_message}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {post.post_url && (
                      <a href={post.post_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><ExternalLink className="w-3.5 h-3.5" /></Button>
                      </a>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(post)} disabled={deleting === post.id}>
                      {deleting === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>
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