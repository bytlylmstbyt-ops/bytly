import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin, FileText } from "lucide-react";

export default function AppointmentDetailModal({ appointment, open, onOpenChange }) {
  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#1a1a2e] flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#C9A66B]" />
            تفاصيل الموعد
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">العميل</p>
                <p className="font-semibold">{appointment.client_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">التاريخ</p>
                <p className="font-semibold">{appointment.appointment_date}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">الوقت</p>
                <p className="font-semibold">{appointment.appointment_time}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">المدة</p>
                <p className="font-semibold">{appointment.duration_minutes || 60} دقيقة</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">الموضوع</p>
              <p className="font-semibold">{appointment.topic || 'غير محدد'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">نوع الموعد</p>
              <p className="font-semibold">
                {appointment.consultation_type === 'site_visit' ? '📍 معاينة موقع' : 
                 appointment.consultation_type === 'video_call' ? '📹 مكالمة فيديو' :
                 appointment.consultation_type === 'phone_call' ? '📞 مكالمة هاتفية' : '👤 شخصي'}
              </p>
            </div>
          </div>

          {appointment.location && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">الموقع</p>
                <p className="font-semibold">{appointment.location}</p>
              </div>
            </div>
          )}

          {appointment.notes && (
            <div>
              <p className="text-sm text-slate-500 mb-1">ملاحظات</p>
              <p className="text-sm bg-slate-50 p-3 rounded-lg">{appointment.notes}</p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t">
            <p className="text-sm text-slate-500">الحالة:</p>
            <Badge>
              {appointment.status === 'pending' ? '⏳ قيد الانتظار' :
               appointment.status === 'confirmed' ? '✅ مؤكد' :
               appointment.status === 'cancelled' ? '❌ ملغي' :
               appointment.status === 'completed' ? '✔️ مكتمل' : '🔄 تم التأجيل'}
            </Badge>
            {appointment.approval_status && (
              <Badge variant="outline">
                {appointment.approval_status === 'pending' ? '⏳ في انتظار الموافقة' :
                 appointment.approval_status === 'approved' ? '✅ تم الموافقة' :
                 '🔄 طلب تأجيل'}
              </Badge>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}