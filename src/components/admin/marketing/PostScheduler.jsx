import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Facebook, Instagram, Calendar, Send, Loader2, Clock, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

const SCHEDULABLE_PLATFORMS = [
  { id: "facebook", label: "Facebook", icon: Facebook, color: "#1877F2", fn: "facebookService" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#E1306C", fn: "instagramService" },
];

export default function PostScheduler({ onPublished }) {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [platform, setPlatform] = useState(SCHEDULABLE_PLATFORMS[0]);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState([]);

  const loadScheduled = async () => {
    try {
      const posts = await base44.entities.SocialPost.filter(
        { status: "scheduled", platform: platform.id },
        "-scheduled_at", 50
      );
      setScheduledPosts(posts || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadScheduled(); }, [platform.id]);

  const handleSchedule = async () => {
    if (!content.trim()) {
      toast({ title: isRTL ? "اكتب محتوى المنشور" : "Write content first", variant: "destructive" });
      return;
    }
    if (!scheduledAt) {
      toast({ title: isRTL ? "حدد وقت النشر" : "Select schedule time", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await base44.entities.SocialPost.create({
        platform: platform.id,
        content: content.trim(),
        status: "scheduled",
        scheduled_at: new Date(scheduledAt).toISOString(),
        media_urls: imageUrl ? [imageUrl] : [],
        post_type: imageUrl ? "image" : "text",
      });
      toast({ title: isRTL ? "تمت جدولة المنشور بنجاح" : "Post scheduled successfully" });
      setContent("");
      setImageUrl("");
      setScheduledAt("");
      loadScheduled();
      onPublished?.();
    } catch (e) {
      toast({ title: isRTL ? "فشلت الجدولة" : "Schedule failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishNow = async (post) => {
    setLoading(true);
    try {
      const payload = { action: "shareDesignWork", ...JSON.parse(post.content || "{}") };
      if (post.media_urls?.length) payload.imageUrl = post.media_urls[0];
      const res = await base44.functions.invoke(platform.fn, payload);
      const d = res.data;
      const success = d?.success;
      if (success) {
        await base44.entities.SocialPost.update(post.id, {
          status: "published",
          published_at: new Date().toISOString(),
          post_url: d?.post_url || d?.tweet_url || null,
          post_id: d?.postId || null,
        });
        toast({ title: isRTL ? "تم النشر" : "Published" });
      } else {
        await base44.entities.SocialPost.update(post.id, {
          status: "failed",
          error_message: d?.error || d?.note || "Unknown error",
        });
        toast({ title: isRTL ? "فشل النشر" : "Publish failed", description: d?.error || d?.note, variant: "destructive" });
      }
      loadScheduled();
      onPublished?.();
    } catch (e) {
      toast({ title: isRTL ? "فشل النشر" : "Publish failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await base44.entities.SocialPost.delete(postId);
      loadScheduled();
      toast({ title: isRTL ? "تم الحذف" : "Deleted" });
    } catch (e) {
      toast({ title: isRTL ? "فشل الحذف" : "Failed", variant: "destructive" });
    }
  };

  const PlatformIcon = platform.icon;

  return (
    <div className="space-y-4">
      {/* Composer */}
      <Card className="border-slate-200">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#C9A66B]" />
            {isRTL ? "جدولة منشورات فيسبوك وإنستغرام" : "Schedule Facebook & Instagram Posts"}
          </h3>

          {/* Platform selector */}
          <div className="flex gap-2">
            {SCHEDULABLE_PLATFORMS.map(p => {
              const Icon = p.icon;
              const isActive = platform.id === p.id;
              return (
                <button key={p.id} onClick={() => setPlatform(p)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${isActive ? "border-transparent text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                  style={isActive ? { backgroundColor: p.color } : {}}>
                  <Icon className="w-4 h-4" />{p.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">{isRTL ? "محتوى المنشور" : "Post Content"}</label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
              placeholder={isRTL ? "اكتب نص المنشور هنا..." : "Write your post content here..."} className="text-sm" />
          </div>

          {/* Image URL */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">{isRTL ? "رابط الصورة (اختياري)" : "Image URL (optional)"}</label>
            <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="text-sm" />
            {imageUrl && <img src={imageUrl} alt="preview" className="mt-2 w-full max-h-48 object-cover rounded-lg" onError={(e) => e.target.style.display = "none"} />}
          </div>

          {/* Schedule datetime */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1"><Clock className="w-3 h-3" />{isRTL ? "وقت النشر المجدول" : "Scheduled Publish Time"}</label>
            <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="text-sm" />
          </div>

          <Button onClick={handleSchedule} disabled={loading} className="text-white" style={{ backgroundColor: platform.color }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            {isRTL ? "جدولة المنشور" : "Schedule Post"}
          </Button>
        </CardContent>
      </Card>

      {/* Scheduled posts list */}
      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-3">
          <h4 className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
            <PlatformIcon className="w-4 h-4" style={{ color: platform.color }} />
            {isRTL ? `المنشورات المجدولة (${scheduledPosts.length})` : `Scheduled Posts (${scheduledPosts.length})`}
          </h4>
          {scheduledPosts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">{isRTL ? "لا توجد منشورات مجدولة" : "No scheduled posts"}</p>
          ) : (
            <div className="space-y-2">
              {scheduledPosts.map(post => (
                <div key={post.id} className="border border-slate-200 rounded-lg p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${platform.color}15` }}>
                    <PlatformIcon className="w-4 h-4" style={{ color: platform.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge className="bg-blue-100 text-blue-700 text-xs"><Clock className="w-3 h-3 mr-1" />{moment(post.scheduled_at).format("YYYY-MM-DD HH:mm")}</Badge>
                      {post.media_urls?.length > 0 && <Badge variant="outline" className="text-xs">{isRTL ? "مع صورة" : "With image"}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => handlePublishNow(post)} disabled={loading}>
                      <Send className="w-3.5 h-3.5" />
                      {isRTL ? "نشر الآن" : "Publish"}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}