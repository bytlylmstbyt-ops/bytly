import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Calendar, Video, Phone, MapPin, Loader2, CheckCircle, ExternalLink, AlertCircle } from "lucide-react";
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

export default function AppointmentModal({ targetId, projectId, currentUser, targetName, targetType, targetEmail, trigger }) {
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
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData?.user) throw new Error("يجب تسجيل الدخول.");
      const { data: profile, error: profileError } = await supabase.from("profiles").select("id,user_id").ilike("email", targetEmail).maybeSingle();
      if (profileError) throw profileError;
      const targetUserId = profile?.user_id || profile?.id;
      if (!targetUserId) { setAvailableSlots(TIME_SLOTS); setBookedSlots([]); return; }
      const { data, error } = await supabase.from("consultation_appointments").select("appointment_time,status").eq("appointment_date", date).or("provider_user_id.eq." + targetUserId + ",client_user_id.eq." + targetUserId).neq("status", "cancelled");
      if (error) throw error;
      const booked = (data || []).map(a => String(a.appointment_time).slice(0, 5));
      setBookedSlots(booked);
      setAvailableSlots(TIME_SLOTS.filter(slot => !booked.includes(slot)));
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
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const authUser = authData?.user;
      if (!authUser) throw new Error("يجب تسجيل الدخول قبل حجز الموعد.");
      const { data: profile, error: profileError } = await supabase.from("profiles").select("id,user_id").ilike("email", targetEmail).maybeSingle();
      if (profileError) throw profileError;
      const resolvedTargetId = profile?.user_id || profile?.id || targetId;
      if (!resolvedTargetId) throw new Error("تعذر تحديد حساب الطرف الآخر.");
      const isBookingEngineer = targetType === "client";
      const payload = {
        project_id: projectId || null, created_by: authUser.id,
        client_user_id: isBookingEngineer ? resolvedTargetId : authUser.id,
        provider_user_id: isBookingEngineer ? authUser.id : resolvedTargetId,
        target_id: resolvedTargetId, target_name: targetName || null, target_email: targetEmail || null,
        appointment_date: form.appointment_date, appointment_time: form.appointment_time,
        duration_minutes: 60, consultation_type: form.consultation_type, appointment_type: "project_review",
        topic: form.topic, notes: form.notes || null, client_phone: form.client_phone || null,
        client_name: isBookingEngineer ? targetName || null : currentUser?.full_name || authUser.email,
        client_email: isBookingEngineer ? targetEmail || null : authUser.email,
        location: form.consultation_type === "in_person" ? "سيتم تحديد الموقع لاحقاً" : null,
        status: "scheduled"
      };
      const { data, error } = await supabase.from("consultation_appointments").insert(payload).select("id,appointment_date,appointment_time,meet_link,calendar_link,status").single();
      if (error) throw error;
      setResult({ ...data, google_calendar_link: data.calendar_link || null });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      window.alert(e?.message || "تعذر حجز الموعد.");
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
            <Calendar className="w-5 h-5 text-[#C9A66B]" />
            حجز اجتماع مراجعة المخططات مع {targetName}
          </DialogTitle>
        </DialogHeader>

        {submitted && result ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-green-700 mb-2">✅ تم إرسال طلب الموعد بنجاح!</h3>
            <p className="text-slate-600 text-sm mb-4">
              تم حفظ الموعد في بيتلي. سيظهر رابط الاجتماع أو التقويم إذا تم إنشاؤه فعلياً.
            </p>
            <p className="text-slate-500 text-xs mb-4">
              التاريخ: {form.appointment_date} | الوقت: {form.appointment_time}
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

            <Button onClick={handleClose} className="bg-[#C9A66B] hover:bg-[#c49060] text-white">حسناً</Button>
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
                        ? "border-[#C9A66B] bg-amber-50 text-[#C9A66B]"
                        : "border-slate-200 text-slate-600 hover:border-[#C9A66B]"
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
                              ? "bg-[#C9A66B] text-white"
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
                يتم حفظ الحجز في بيتلي. إنشاء رابط Google Meet أو مزامنة تقويم Google يتطلب تكاملاً فعّالاً.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !form.appointment_date || !form.appointment_time || !form.topic}
              className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Calendar className="w-4 h-4 ml-2" />}
              تأكيد حجز الموعد
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}