import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Loader2, Copy, Check, ExternalLink, CalendarPlus, Users, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function CreateProjectMeetLink({ projectId = "", onCreated, onCancel }) {
  const [topic, setTopic] = useState("");
  const [emails, setEmails] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [durationMinutes] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    const attendee_emails = emails
      .split(/[\s,]+/)
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    if (!attendee_emails.length) {
      toast.error("أضيفي بريدًا إلكترونيًا واحدًا على الأقل للمدعوين.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const currentUser = await base44.auth.me();
      const participants = Array.from(new Set([currentUser.email, ...attendee_emails].filter(Boolean)));
      const meetingTopic = topic.trim() || "مناقشة مشروع عبر Google Meet";

      const payload = {
        topic: meetingTopic,
        attendee_emails: participants,
        duration_minutes: durationMinutes,
      };
      if (projectId) payload.project_id = projectId;
      if (scheduledTime) payload.scheduled_time = scheduledTime;

      const res = await base44.functions.invoke("createMeetCall", payload);
      const meetResult = res?.data || res;
      if (!meetResult?.meet_link) {
        throw new Error("لم يتم إرجاع رابط Google Meet.");
      }

      const conversation = await base44.entities.Conversation.create({
        name: meetingTopic,
        type: "group",
        project_id: projectId || undefined,
        participants,
        participant_roles: {},
        is_archived: false,
        is_main_room: false,
      });

      const systemContent = `📅 دعوة اجتماع Google Meet\n\n${meetingTopic}\n\nانضم للاجتماع عبر الرابط:\n${meetResult.meet_link}`;
      await base44.entities.Message.create({
        conversation_id: conversation.id,
        project_id: projectId || undefined,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || "Bytly",
        sender_role: "system",
        content: systemContent,
        original_content: systemContent,
        is_system_message: true,
        is_read: false,
      });

      await base44.entities.Conversation.update(conversation.id, {
        last_message: `📅 ${meetingTopic}`,
        last_message_date: new Date().toISOString(),
      });

      setResult({ ...meetResult, conversation_id: conversation.id, topic: meetingTopic });
      toast.success("تم إنشاء رابط Google Meet ومحادثة المشروع بنجاح");
    } catch (error) {
      console.error("Create project meeting error:", error);
      toast.error(error?.message || "تعذر إنشاء رابط Google Meet");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.meet_link) return;
    await navigator.clipboard.writeText(result.meet_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (result) {
    return (
      <div className="space-y-5" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#4A3F35]">تم إنشاء الرابط بنجاح</h2>
            <p className="text-sm text-slate-500">تم إنشاء محادثة المشروع وإضافة رابط الاجتماع داخلها.</p>
          </div>
        </div>

        <Card className="border-green-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-green-700 flex items-center gap-2">
              <Check className="w-5 h-5" /> رابط Google Meet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <Label className="text-xs text-slate-500 mb-1.5 block">رابط الاجتماع</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-[#6B5D4F] truncate" dir="ltr">{result.meet_link}</code>
                <Button size="icon" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 border p-3">
                <span className="text-xs text-slate-500 block">المدة</span>
                <span className="font-medium">{durationMinutes} دقيقة</span>
              </div>
              {result.start_time && (
                <div className="rounded-lg bg-slate-50 border p-3">
                  <span className="text-xs text-slate-500 block">وقت البدء</span>
                  <span className="font-medium">{new Date(result.start_time).toLocaleString("ar-SA")}</span>
                </div>
              )}
              {result.end_time && (
                <div className="rounded-lg bg-slate-50 border p-3">
                  <span className="text-xs text-slate-500 block">وقت الانتهاء</span>
                  <span className="font-medium">{new Date(result.end_time).toLocaleString("ar-SA")}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <a href={result.meet_link} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full bg-[#6B5D4F] text-white h-11">
                  <ExternalLink className="w-4 h-4" /> دخول الاجتماع
                </Button>
              </a>
              {result.event_link && (
                <a href={result.event_link} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full h-11">
                    <CalendarPlus className="w-4 h-4" /> عرض في التقويم
                  </Button>
                </a>
              )}
            </div>

            <Button variant="outline" className="w-full" onClick={() => onCreated?.({ id: result.conversation_id }, result)}>
              <MessageSquare className="w-4 h-4" /> فتح محادثة المشروع
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
      <div className="text-center space-y-2">
        <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white">
          <Video className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-[#4A3F35]">إنشاء رابط مناقشة فيديو</h2>
        <p className="text-sm text-slate-500">أنشئ رابط جوجل ميت لمناقشة مع عميل وشاركه فورًا.</p>
      </div>

      <Card className="border-[#C9A66B]/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-[#4A3F35]">تفاصيل الاجتماع</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="project-meet-topic">موضوع المناقشة</Label>
            <Input
              id="project-meet-topic"
              placeholder="اكتب موضوع المناقشة"
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-meet-emails" className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" /> المدعوون
            </Label>
            <Textarea
              id="project-meet-emails"
              placeholder="أدخل البريد الإلكتروني لكل مدعو، وافصل بين العناوين بفاصلة"
              value={emails}
              onChange={e => setEmails(e.target.value)}
              rows={3}
              dir="ltr"
              className="text-left"
            />
            <p className="text-xs text-slate-400">مثال: client@example.com, engineer@example.com</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-meet-time" className="flex items-center gap-1.5">
              <CalendarPlus className="w-4 h-4 text-slate-400" /> موعد الاجتماع (اختياري)
            </Label>
            <Input
              id="project-meet-time"
              type="datetime-local"
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
            />
            <p className="text-xs text-slate-400">إذا لم تختَر موعدًا، يكون الاجتماع افتراضيًا بعد 30 دقيقة.</p>
          </div>

          <div className="rounded-lg border border-[#C9A66B]/20 bg-[#C9A66B]/5 p-3 text-sm">
            <span className="text-slate-500">مدة الاجتماع: </span>
            <span className="font-semibold text-[#4A3F35]">30 دقيقة</span>
          </div>

          <div className="flex gap-3">
            {onCancel && (
              <Button variant="outline" className="flex-1 h-11" onClick={onCancel}>إلغاء</Button>
            )}
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white h-11"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جاري إنشاء الرابط...</>
              ) : (
                <><Video className="w-4 h-4" /> إنشاء رابط جوجل ميت</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
