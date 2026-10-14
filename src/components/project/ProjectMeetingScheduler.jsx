import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Calendar, Clock, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppointmentModal from "@/components/appointments/AppointmentModal";
import MeetCallButton from "@/components/project/MeetCallButton";

/**
 * مكوّن موحّد لحجز الاجتماعات بين المهندس والعميل مباشرة من صفحة المشروع.
 * يتيح كلا الطرفين حجز موعد مراجعة مجدول أو إنشاء اجتماع فوري عبر Google Meet،
 * مع إرسال دعوات تقويم جوجل تلقائياً لكلا الطرفين.
 */
export default function ProjectMeetingScheduler({ project, user, userEngineer, userClient, assignedEngineer, isClient, isEngineer, onUpdated }) {
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  // تحديد الطرف الآخر بناءً على دور المستخدم الحالي
  const target = isClient
    ? { id: assignedEngineer?.id, name: assignedEngineer?.full_name, email: assignedEngineer?.email, type: "engineer" }
    : isEngineer
      ? { id: userClient?.id || project.client_id, name: userClient?.full_name || project.created_by, email: project.created_by, type: "client" }
      : null;

  const loadAppointments = useCallback(async () => {
    if (!project?.id) return;
    setLoadingAppts(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData?.user) throw new Error("يجب تسجيل الدخول لعرض الاجتماعات.");
      const { data, error } = await supabase.from("consultation_appointments")
        .select("id,project_id,created_by,client_user_id,provider_user_id,appointment_date,appointment_time,topic,notes,status,meet_link,calendar_link,google_event_id")
        .eq("project_id", project.id)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });
      if (error) throw error;
      setAppointments(data || []);
    } catch (e) {
      console.error("Error loading appointments:", e);
    } finally {
      setLoadingAppts(false);
    }
  }, [project?.id]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // فقط للعميل أو المهندس المعيّن
  if (!isClient && !isEngineer) return null;
  if (!target || !target.email) return null;

  // التحقق من وجود اجتماعات قادمة
  const now = new Date();
  const upcomingAppts = appointments
    .filter(a => a.status !== "cancelled" && new Date(`${a.appointment_date}T${a.appointment_time}`) >= now)
    .sort((a, b) => new Date(`${a.appointment_date}T${a.appointment_time}`) - new Date(`${b.appointment_date}T${b.appointment_time}`));

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#C9A66B]" />
            جدولة اجتماعات المشروع
          </span>
          <Button variant="ghost" size="icon" onClick={loadAppointments} disabled={loadingAppts} className="h-8 w-8">
            <RefreshCw className={`w-4 h-4 ${loadingAppts ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* معلومات الطرف الآخر */}
        <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center text-white font-bold">
            {target.name?.charAt(0) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1a1a2e] truncate">{target.name || "الطرف الآخر"}</p>
            <p className="text-xs text-slate-500 truncate">{target.email}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {isClient ? "المهندس" : "العميل"}
          </Badge>
        </div>

        {/* خيارات الحجز */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* حجز موعد مجدول */}
          <AppointmentModal
            targetId={target.id}
            projectId={project.id}
            currentUser={user}
            targetName={target.name}
            targetType={target.type}
            targetEmail={target.email}
            trigger={
              <Button className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2 h-auto py-3 flex-col">
                <Calendar className="w-5 h-5" />
                <span>حجز موعد مراجعة</span>
                <span className="text-xs opacity-80">اختر التاريخ والوقت المناسب</span>
              </Button>
            }
          />

          {/* اجتماع فوري عبر Google Meet */}
          <MeetCallButton
            project={project}
            currentUser={user}
            assignedEngineerEmail={assignedEngineer?.email}
            isEngineer={isEngineer}
          />
        </div>

        {/* الاجتماعات القادمة */}
        {loadingAppts ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        ) : upcomingAppts.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#C9A66B]" />
              الاجتماعات القادمة ({upcomingAppts.length})
            </p>
            {upcomingAppts.map(apt => (
              <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-[#C9A66B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a2e] truncate">{apt.topic}</p>
                  <p className="text-xs text-slate-500">
                    {apt.appointment_date} • {apt.appointment_time}
                  </p>
                </div>
                {apt.calendar_link && (
                  <a
                    href={apt.google_calendar_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline shrink-0"
                  >
                    التقويم
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">لا توجد اجتماعات مجدولة بعد</p>
          </div>
        )}

        {/* معلومات المزامنة */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
          <Calendar className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            يُحفظ الموعد في قاعدة بيانات بيتلي. رابط Google Meet ومزامنة تقويم Google يظهران فقط عند تفعيل التكامل وإنشاء الرابط فعلياً.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}