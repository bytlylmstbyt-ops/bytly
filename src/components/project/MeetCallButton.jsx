import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Loader2, Copy, ExternalLink, CheckCircle } from "lucide-react";

export default function MeetCallButton({ project, currentUser, assignedEngineerEmail, isEngineer }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [meetResult, setMeetResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");

  const handleCreate = async () => {
    setLoading(true);
    try {
      const attendees = [project.created_by, assignedEngineerEmail].filter(Boolean);
      const res = await base44.functions.invoke("createMeetCall", {
        project_id: project.id,
        project_title: project.title,
        attendee_emails: attendees,
        scheduled_time: scheduledTime || undefined
      });
      setMeetResult(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(meetResult.meet_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setMeetResult(null);
    setScheduledTime("");
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-[#1a73e8] to-[#34a853] text-white gap-2 w-full h-auto py-3 flex-col"
      >
        <Video className="w-5 h-5" />
        <span>إنشاء اجتماع فوري</span>
        <span className="text-xs opacity-80">عبر Google Meet</span>
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-[#1a73e8]" />
              مكالمة تحديث المشروع عبر Google Meet
            </DialogTitle>
          </DialogHeader>

          {!meetResult ? (
            <div className="space-y-5 mt-2">
              <p className="text-sm text-slate-600">
                سيتم إنشاء اجتماع Google Meet وإرسال الدعوة تلقائياً لجميع المشاركين في المشروع.
              </p>

              <div className="space-y-2">
                <Label>وقت الاجتماع (اختياري — الآفتراضي: بعد 30 دقيقة)</Label>
                <Input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                />
              </div>

              <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 space-y-1">
                <p className="font-medium text-[#1a1a2e]">المشاركون:</p>
                {[project.created_by, assignedEngineerEmail].filter(Boolean).map(email => (
                  <p key={email} className="text-xs">• {email}</p>
                ))}
              </div>

              <Button
                onClick={handleCreate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#1a73e8] to-[#34a853] text-white gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />جاري الإنشاء...</>
                ) : (
                  <><Video className="w-4 h-4" />إنشاء الاجتماع</>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">تم إنشاء الاجتماع بنجاح!</span>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                <p className="text-xs text-slate-500">رابط Google Meet:</p>
                <p className="font-mono text-sm text-[#1a73e8] break-all">{meetResult.meet_link}</p>
                {meetResult.start_time && (
                  <p className="text-xs text-slate-500 mt-1">
                    🕐 {new Date(meetResult.start_time).toLocaleString("ar", { timeZone: "Asia/Riyadh" })}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2" onClick={handleCopy}>
                  {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? "تم النسخ" : "نسخ الرابط"}
                </Button>
                <a href={meetResult.meet_link} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button className="w-full gap-2 bg-[#1a73e8] text-white">
                    <ExternalLink className="w-4 h-4" />
                    الانضمام الآن
                  </Button>
                </a>
              </div>

              {meetResult.event_link && (
                <a href={meetResult.event_link} target="_blank" rel="noopener noreferrer"
                   className="text-xs text-center block text-[#1a73e8] hover:underline">
                  عرض الحدث في Google Calendar
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}