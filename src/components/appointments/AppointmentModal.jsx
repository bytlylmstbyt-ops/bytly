import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Clock, Video, Phone, MapPin, Loader2 } from "lucide-react";
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
  { value: "in_person", label: "زيارة شخصية", icon: MapPin },
];

export default function AppointmentModal({ targetId, targetName, targetType, targetEmail, trigger }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    appointment_date: "",
    appointment_time: "",
    consultation_type: "video_call",
    topic: "",
    notes: "",
    client_phone: ""
  });

  const handleSubmit = async () => {
    if (!form.appointment_date || !form.appointment_time || !form.topic) return;
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const clientData = await base44.entities.Client.filter({ email: user.email });
      const client = clientData[0];

      await base44.entities.ConsultationAppointment.create({
        client_id: client?.id || user.email,
        client_name: client?.full_name || user.full_name,
        client_email: user.email,
        client_phone: form.client_phone,
        target_type: targetType,
        target_id: targetId,
        target_name: targetName,
        target_email: targetEmail || "",
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        consultation_type: form.consultation_type,
        topic: form.topic,
        notes: form.notes,
        status: "pending"
      });

      // Notify the engineer/firm
      await base44.entities.Notification.create({
        recipient_email: targetEmail,
        title: "طلب موعد استشارة جديد",
        message: `${client?.full_name || user.full_name} يطلب موعد استشارة بتاريخ ${form.appointment_date} الساعة ${form.appointment_time}. الموضوع: ${form.topic}`,
        type: "project_update",
        priority: "high"
      });

      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => { setSubmitted(false); setForm({ appointment_date: "", appointment_time: "", consultation_type: "video_call", topic: "", notes: "", client_phone: "" }); }, 300);
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
            حجز موعد استشارة مع {targetName}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-green-700 mb-2">تم إرسال طلب الموعد!</h3>
            <p className="text-slate-600 text-sm mb-6">سيتواصل معك {targetName} لتأكيد الموعد خلال 24 ساعة.</p>
            <Button onClick={handleClose} className="bg-[#d4a574] hover:bg-[#c49060] text-white">حسناً</Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Consultation Type */}
            <div>
              <Label className="mb-2 block">نوع الاستشارة</Label>
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
              <Label htmlFor="date">تاريخ الموعد</Label>
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
              <Label className="mb-2 block">الوقت المناسب</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {TIME_SLOTS.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, appointment_time: slot }))}
                    className={`py-1.5 rounded text-xs font-medium transition-all ${
                      form.appointment_time === slot
                        ? "bg-[#d4a574] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-amber-100"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div>
              <Label htmlFor="topic">موضوع الاستشارة</Label>
              <Input
                id="topic"
                placeholder="مثال: تصميم فيلا، مراجعة مخطط..."
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
                placeholder="أي تفاصيل إضافية..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !form.appointment_date || !form.appointment_time || !form.topic}
              className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Calendar className="w-4 h-4 ml-2" />}
              تأكيد طلب الموعد
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}