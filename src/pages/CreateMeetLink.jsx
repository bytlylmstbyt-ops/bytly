import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Loader2, Copy, Check, ExternalLink, CalendarPlus, Users } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function CreateMeetLink() {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [emails, setEmails] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!user) {
      toast({ title: "يجب تسجيل الدخول أولاً", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const attendee_emails = emails
        .split(/[\s,]+/)
        .map((e) => e.trim())
        .filter(Boolean);

      const payload = {
        topic: topic || "مناقشة عميل — بيتلي",
        attendee_emails,
      };
      if (scheduledTime) payload.scheduled_time = scheduledTime;

      const res = await base44.functions.invoke("createMeetCall", payload);
      setResult(res);
      toast({ title: "✅ تم إنشاء رابط Google Meet بنجاح" });
    } catch (err) {
      toast({
        title: "تعذّر إنشاء الرابط",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.meet_link) {
      navigator.clipboard.writeText(result.meet_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white">
          <Video className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#4A3F35]">إنشاء رابط مناقشة فيديو</h1>
          <p className="text-sm text-slate-500">
            أنشئ رابط Google Meet لمناقشة مع العميل وشاركه فوراً
          </p>
        </div>
      </div>

      {!result ? (
        <Card className="border-[#C9A66B]/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#4A3F35]">تفاصيل الاجتماع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="topic">موضوع المناقشة</Label>
              <Input
                id="topic"
                placeholder="مثال: مراجعة تصميم الصالة، استلام المرحلة الأولى..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emails" className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                المدعوون (بريد إلكتروني — افصل بفاصلة)
              </Label>
              <Textarea
                id="emails"
                placeholder="client@example.com, engineer@example.com"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-1.5">
                <CalendarPlus className="w-4 h-4 text-slate-400" />
                وقت الاجتماع (اختياري — افتراضياً بعد 30 دقيقة)
              </Label>
              <Input
                id="time"
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90 h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  إنشاء رابط Google Meet
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-green-700 flex items-center gap-2">
              <Check className="w-5 h-5" />
              تم إنشاء الاجتماع بنجاح
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <Label className="text-xs text-slate-500 mb-1.5 block">رابط الاجتماع</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-[#6B5D4F] truncate" dir="ltr">
                  {result.meet_link}
                </code>
                <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {result.start_time && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <span className="text-xs text-slate-500 block">وقت البدء</span>
                  <span className="text-[#4A3F35] font-medium">
                    {new Date(result.start_time).toLocaleString("ar-SA")}
                  </span>
                </div>
              )}
              {result.end_time && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <span className="text-xs text-slate-500 block">وقت الانتهاء</span>
                  <span className="text-[#4A3F35] font-medium">
                    {new Date(result.end_time).toLocaleString("ar-SA")}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <a href={result.meet_link} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full bg-[#6B5D4F] text-white hover:bg-[#4A3F35] h-11">
                  <ExternalLink className="w-4 h-4" />
                  دخول الاجتماع
                </Button>
              </a>
              {result.event_link && (
                <a href={result.event_link} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full h-11">
                    <CalendarPlus className="w-4 h-4" />
                    عرض في التقويم
                  </Button>
                </a>
              )}
            </div>

            <Button
              variant="ghost"
              className="w-full text-[#C9A66B]"
              onClick={() => {
                setResult(null);
                setTopic("");
                setEmails("");
                setScheduledTime("");
              }}
            >
              إنشاء اجتماع آخر
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}