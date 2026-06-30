import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, Calendar, X } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function AppointmentResponseModal({ appointment, open, onOpenChange, onSuccess }) {
  const { t, isRTL } = useLanguage();
  const [action, setAction] = useState(null); // 'approve' | 'reschedule'
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke("handleAppointmentResponse", {
        action: "approve",
        appointment_id: appointment.id
      });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error approving appointment:', error);
      alert('حدث خطأ أثناء الموافقة على الموعد');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleReason || !rescheduleDate || !rescheduleTime) {
      alert('يرجى تعبئة جميع الحقول');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke("handleAppointmentResponse", {
        action: "reschedule",
        appointment_id: appointment.id,
        reschedule_reason: rescheduleReason,
        reschedule_date: rescheduleDate,
        reschedule_time: rescheduleTime
      });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      alert('حدث خطأ أثناء تأجيل الموعد');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setAction(null);
    setRescheduleReason("");
    setRescheduleDate("");
    setRescheduleTime("");
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetState();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#1a1a2e]">
            {action === 'approve' ? '✅ تأكيد الموعد' : 
             action === 'reschedule' ? '📅 تأجيل الموعد' : 
             'الرد على الموعد'}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {appointment && `موعد مع ${appointment.client_name} يوم ${appointment.appointment_date} الساعة ${appointment.appointment_time}`}
          </DialogDescription>
        </DialogHeader>

        {!action ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600 text-center mb-4">
              هل تريد الموافقة على الموعد أم تأجيله؟
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setAction('approve')}
                className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white h-16 text-lg"
              >
                <CheckCircle className="w-6 h-6 ml-2" />
                موافق
              </Button>
              <Button
                onClick={() => setAction('reschedule')}
                variant="outline"
                className="border-amber-500 text-amber-700 hover:bg-amber-50 h-16 text-lg"
              >
                <Clock className="w-6 h-6 ml-2" />
                تأجيل
              </Button>
            </div>
          </div>
        ) : action === 'approve' ? (
          <div className="space-y-4 py-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-semibold">هل أنت متأكد من الموافقة على هذا الموعد؟</p>
              <p className="text-green-600 text-sm mt-1">سيتم إشعار العميل بالموافقة</p>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setAction(null)}
                disabled={loading}
              >
                رجوع
              </Button>
              <Button
                onClick={handleApprove}
                className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"
                disabled={loading}
              >
                {loading ? (
                  <><Clock className="w-4 h-4 animate-spin ml-2" /> جارٍ المعالجة...</>
                ) : (
                  <><CheckCircle className="w-4 h-4 ml-2" /> تأكيد الموافقة</>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-semibold text-[#4A3F35]">
                  سبب التأجيل <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="اشرح سبب التأجيل..."
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold text-[#4A3F35]">
                    التاريخ المقترح <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="mt-1"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[#4A3F35]">
                    الوقت المقترح <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setAction(null)}
                disabled={loading}
              >
                رجوع
              </Button>
              <Button
                onClick={handleReschedule}
                className="bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                disabled={loading}
              >
                {loading ? (
                  <><Clock className="w-4 h-4 animate-spin ml-2" /> جارٍ الإرسال...</>
                ) : (
                  <><Calendar className="w-4 h-4 ml-2" /> إرسال الطلب</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}