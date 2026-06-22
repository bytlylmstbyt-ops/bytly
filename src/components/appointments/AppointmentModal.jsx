import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Clock, Video, Phone, MapPin, Loader2, CheckCircle, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00"
];

const CONSULTATION_TYPES = [
  { value: "video_call", label: "مكالمة فيديو", icon: Video },
  { value: "phone_call", label: "مكالمة هاتفية", icon: Phone },
  { value: "in_person", label: "لقاء شخصي", icon: MapPin },
];

export default function AppointmentModal({ targetId, targetName, targetType, targetEmail, trigger }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [form, setForm] = useState({
    appointment_date: "",
    appointment_time: "",
    consultation_type: "video_call",
    topic: "",
    notes: "",
    client_phone: ""
  });

  // Fetch available slots when date changes
  useEffect(() => {
    if (form.appointment_date && targetEmail) {
      fetchAvailableSlots(form.appointment_date);
    } else {
      setAvailableSlots([]);
      setBookedSlots([]);
    }
  }, [form.appointment_date]);

  const fetchAvailableSlots = async (date) => {
    setLoadingSlots(true);
    try {
      const res = await base44.functions.invoke("bookReviewMeeting", {
        action: "available",
        engineer_email: targetEmail,
        date
      });
      setAvailableSlots(res.data.available_slots || []);
      setBookedSlots(res.data.booked_slots || []);
    } catch (e) {
      // If fetch fails, show all slots
      setAvailableSlots(TIME_SLOTS);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.appointment_date || !form.appointment_time || !form.topic) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("bookReviewMeeting", {
        action: "book",
        target_type: targetType,
        target_id: targetId,
        target_name: targetName,
        target_email: targetEmail || "",
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        duration_minutes: 60,
        consultation_type: form.consultation_type,
        topic: form.topic,
        notes: form.notes,
        client_phone: form.client_phone,
        location: form.consultation_type === "in_person" ? "سيتم تحديد الموقع لاحقاً" : ""
      });
      setResult(res.data);
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setSubmitted(false);
      setResult(null);
      setForm({ appointment_date: "", appointment_time: "", consultation_type: "video_call", topic: "", notes: "", client_phone: "" });
      setAvailableSlots([]);
      setBookedSlots([]);
    }, 300);
  };

  // Min date = tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <Calendar className="w-5 h-5 text-[#d4a574]" />
            حجز اجتماع مراجعة المخططات مع {targetName}
          </DialogTitle>
        </DialogHeader>

        {submitted && result ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-green-700 mb-2">تم حجز الاجتماع بنجاح!</h3>
            <p className="text-slate-600 text-sm mb-4">
              تم تأكيد موعدك مع {targetName} يوم {form.appointment_date} الساعة {form.appointment_time}.
            </p>

            {result.google_calendar_link && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 text-right">
                <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-1">
                  <Calendar className="w-4 h-4" />
                  تمت الإضافة إلى تقويم جوجل
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  تم إرسال دعوة التقويم إلى بريدك وبريد {targetName} تلقائياً.
                </p>
                <a
                  href={result.google_calendar_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  عرض في تقويم جوجل
                </a>
              </div>
            )}

            {result.meet_link && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-right">
                <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
                  <Video className="w-4 h-4" />
                  رابط Google Meet
                </div>
                <a
                  href={result.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline break-all"
                >
                  {result.meet_link}
                </a>
              </div>
            )}

            {result.calendar_error && !result.google_calendar_link && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 flex items-start gap-2 text-right">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  تم حجز الموعد ولكن تعذرت المزامنة مع تقويم جوجل. سيتم إرسال الدعوة عبر البريد الإلكتروني.
                </p>
              </div>
            )}

            <Button onClick={handleClose} className="bg-[#d4a574] hover:bg-[#c49060] text-white">حسناً</Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Consultation Type */}
            <div>
              <Label className="mb-2 block">نوع الاجتماع</Label>
              <div className="grid grid-cols-3 gap-2">
                {CONSULTATION_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, consultation_type: value }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-xs transition-all ${
                      form.consultation_type === value
                        ? "border-[#d4a574] bg-amber-50 text-[#d4a574]"
                        : "border-slate-200 text-slate-600 hover:border-[#d4a574]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <Label htmlFor="date">تاريخ الاجتماع</Label>
              <Input
                id="date"
                type="date"
                min={minDateStr}
                value={form.appointment_date}
                onChange={e => setForm(f => ({ ...f, appointment_date: e.target.value }))}
                className="mt-1"
              />
            </div>

            {/* Time Slots */}
            <div>
              <Label className="mb-2 block">
                {loadingSlots ? "جاري تحميل الأوقات المتاحة..." : "الوقت المناسب"}
              </Label>
              {form.appointment_date ? (
                <div className="grid grid-cols-5 gap-1.5">
                  {TIME_SLOTS.map(slot => {
                    const isBooked = bookedSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isBooked}
                        onClick={() => setForm(f => ({ ...f, appointment_time: slot }))}
                        className={`py-1.5 rounded text-xs font-medium transition-all ${
                          isBooked
                            ? "bg-slate-100 text-slate-300 line-through cursor-not-allowed"
                            : form.appointment_time === slot
                              ? "bg-[#d4a574] text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-amber-100"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-3 bg-slate-50 rounded-lg">
                  اختر التاريخ أولاً لعرض الأوقات المتاحة
                </p>
              )}
            </div>

            {/* Topic */}
            <div>
              <Label htmlFor="topic">موضوع المراجعة</Label>
              <Input
                id="topic"
                placeholder="مثال: مراجعة مخطط أرضي، تصميم واجهة..."
                value={form.topic}
                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                className="mt-1"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">رقم هاتفك للتواصل</Label>
              <Input
                id="phone"
                placeholder="05XXXXXXXX"
                value={form.client_phone}
                onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))}
                className="mt-1"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">ملاحظات إضافية (اختياري)</Label>
              <Textarea
                id="notes"
                placeholder="أي تفاصيل إضافية حول المخطط..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="mt-1"
              />
            </div>

            {/* Calendar sync info */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 flex items-start gap-2">
              <Calendar className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                سيتم إنشاء حدث في تقويم جوجل تلقائياً وإرسال دعوة لك وللمهندس، مع رابط Google Meet للاجتماعات المرئية.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !form.appointment_date || !form.appointment_time || !form.topic}
              className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Calendar className="w-4 h-4 ml-2" />}
              تأكيد الحجز وإضافة للتقويم
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}