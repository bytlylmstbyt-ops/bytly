import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar as CalendarIcon, Clock, Video, Phone, MapPin, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { Calendar } from "@/components/ui/calendar";
import { arSA } from "date-fns/locale";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  rescheduled: "bg-orange-100 text-orange-800 border-orange-200"
};

const STATUS_LABELS = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  cancelled: "ملغى",
  completed: "مكتمل",
  rescheduled: "مؤجل"
};

const TYPE_ICONS = {
  video_call: Video,
  phone_call: Phone,
  in_person: Users,
  site_visit: MapPin
};

const TYPE_LABELS = {
  video_call: "مكالمة فيديو",
  phone_call: "مكالمة هاتفية",
  in_person: "لقاء شخصي",
  site_visit: "معاينة موقع"
};

export default function EngineerCalendar() {
  const { t, isRTL } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [engineerData, setEngineerData] = useState(null);

  useEffect(() => {
    loadEngineerData();
    loadAppointments();
  }, []);

  const loadEngineerData = async () => {
    try {
      const user = await base44.auth.me();
      const engineers = await base44.entities.Engineer.filter({ email: user.email });
      if (engineers.length > 0) {
        setEngineerData(engineers[0]);
      }
    } catch (e) {
      console.error("Error loading engineer data:", e);
    }
  };

  const loadAppointments = async () => {
    try {
      const user = await base44.auth.me();
      const appointments = await base44.entities.ConsultationAppointment.filter(
        { target_email: user.email },
        "-appointment_date"
      );
      setAppointments(appointments);
    } catch (e) {
      console.error("Error loading appointments:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appointmentId) => {
    try {
      await base44.functions.invoke("handleAppointmentResponse", {
        action: "approve",
        appointment_id: appointmentId
      });
      await loadAppointments();
      setSelectedAppointment(null);
    } catch (e) {
      console.error("Error approving:", e);
    }
  };

  const handleReschedule = async (appointmentId, newDate, newTime, reason) => {
    try {
      await base44.functions.invoke("handleAppointmentResponse", {
        action: "reschedule",
        appointment_id: appointmentId,
        reschedule_date: newDate,
        reschedule_time: newTime,
        reason
      });
      await loadAppointments();
      setSelectedAppointment(null);
    } catch (e) {
      console.error("Error rescheduling:", e);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = [];
    
    for (let i = 1; i <= new Date(year, month + 1, 0).getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getAppointmentsForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return appointments.filter(apt => apt.appointment_date === dateStr);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      case "pending": return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const upcomingAppointments = appointments
    .filter(apt => new Date(apt.appointment_date) >= new Date() && apt.status !== "cancelled")
    .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
    .slice(0, 5);

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.approval_status === "pending").length,
    confirmed: appointments.filter(a => a.status === "confirmed").length,
    today: appointments.filter(a => a.appointment_date === new Date().toISOString().split("T")[0]).length
  };

  // Get appointments with upcoming reminders
  const upcomingReminders = appointments
    .filter(apt => {
      const aptDate = new Date(`${apt.appointment_date}T${apt.appointment_time}:00+03:00`);
      const now = new Date();
      const hoursUntil = (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return apt.status === 'confirmed' && hoursUntil > 0 && hoursUntil <= 24;
    })
    .sort((a, b) => new Date(`${a.appointment_date}T${a.appointment_time}`) - new Date(`${b.appointment_date}T${b.appointment_time}`));

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">📅 تقويم المواعيد</h1>
          <p className="text-slate-600">تابع جدول أعمالك اليومي بدقة</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">إجمالي المواعيد</p>
                <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
              </div>
              <CalendarIcon className="w-10 h-10 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">في الانتظار</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">مؤكد</p>
                <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">اليوم</p>
                <p className="text-3xl font-bold text-blue-600">{stats.today}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={viewMode} onValueChange={setViewMode} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="month">شهري</TabsTrigger>
          <TabsTrigger value="week">أسبوعي</TabsTrigger>
          <TabsTrigger value="list">قائمة</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{selectedDate.toLocaleDateString("ar-SA", { month: "long", year: "numeric" })}</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={arSA}
                className="rounded-md border"
              />
              
              {/* Appointments for selected date */}
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-slate-700">
                  مواعيد {selectedDate.toLocaleDateString("ar-SA", { day: "numeric", month: "long" })}
                </h3>
                {getAppointmentsForDate(selectedDate).length === 0 ? (
                  <p className="text-slate-500 text-sm">لا توجد مواعيد في هذا اليوم</p>
                ) : (
                  getAppointmentsForDate(selectedDate).map((apt) => (
                    <Card key={apt.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedAppointment(apt)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${STATUS_COLORS[apt.status]}`}>
                              {React.createElement(TYPE_ICONS[apt.consultation_type] || Video, { className: "w-5 h-5" })}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-slate-800">{apt.topic}</h4>
                                <Badge className={STATUS_COLORS[apt.status]}>
                                  {getStatusIcon(apt.status)}
                                  <span className="mr-1">{STATUS_LABELS[apt.status]}</span>
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 mb-1">
                                <Clock className="w-4 h-4 inline ml-1" />
                                {apt.appointment_time} - {apt.client_name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {TYPE_LABELS[apt.consultation_type]}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(apt);
                            }}
                          >
                            التفاصيل
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-slate-500 text-center py-8">عرض الأسبوع قيد التطوير</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {/* Upcoming Reminders Banner */}
          {upcomingReminders.length > 0 && (
            <Card className="border-amber-300 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                  ⏰ تذكيرات قريبة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingReminders.map(apt => (
                    <div key={apt.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div>
                        <p className="font-medium text-slate-800">{apt.topic}</p>
                        <p className="text-sm text-slate-600">
                          {apt.appointment_date} {apt.appointment_time} - {apt.client_name}
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700">قريباً</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📅 المواعيد القادمة</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length === 0 ? (
                  <p className="text-slate-500 text-sm">لا توجد مواعيد قادمة</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                        onClick={() => setSelectedAppointment(apt)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-800">{apt.topic}</h4>
                          <Badge className={STATUS_COLORS[apt.status]}>{STATUS_LABELS[apt.status]}</Badge>
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                          <p>📅 {apt.appointment_date} | ⏰ {apt.appointment_time}</p>
                          <p>👤 {apt.client_name}</p>
                          <p>{TYPE_LABELS[apt.consultation_type]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Approval */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">⏳ في انتظار الموافقة</CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.filter(a => a.approval_status === "pending").length === 0 ? (
                  <p className="text-slate-500 text-sm">لا توجد مواعيد في الانتظار</p>
                ) : (
                  <div className="space-y-3">
                    {appointments.filter(a => a.approval_status === "pending").map((apt) => (
                      <div
                        key={apt.id}
                        className="p-3 border border-yellow-200 rounded-lg hover:bg-yellow-50 cursor-pointer"
                        onClick={() => setSelectedAppointment(apt)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-800">{apt.topic}</h4>
                          <Badge className={STATUS_COLORS.pending}>في الانتظار</Badge>
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                          <p>📅 {apt.appointment_date} | ⏰ {apt.appointment_time}</p>
                          <p>👤 {apt.client_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">تفاصيل الموعد</DialogTitle>
            <DialogDescription>معلومات الموعد والإجراءات المتاحة</DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">الموضوع</p>
                  <p className="font-semibold">{selectedAppointment.topic}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">الحالة</p>
                  <Badge className={STATUS_COLORS[selectedAppointment.status]}>
                    {STATUS_LABELS[selectedAppointment.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">التاريخ</p>
                  <p className="font-semibold">{selectedAppointment.appointment_date}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">الوقت</p>
                  <p className="font-semibold">{selectedAppointment.appointment_time}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">العميل</p>
                  <p className="font-semibold">{selectedAppointment.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">نوع الموعد</p>
                  <p className="font-semibold">{TYPE_LABELS[selectedAppointment.consultation_type]}</p>
                </div>
                {selectedAppointment.notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600 mb-1">ملاحظات</p>
                    <p className="text-slate-700">{selectedAppointment.notes}</p>
                  </div>
                )}
                {selectedAppointment.reminder_24h && (
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600 mb-1">التذكيرات</p>
                    <Badge className="bg-green-100 text-green-700">✓ تم إرسال تذكير 24 ساعة</Badge>
                    {selectedAppointment.reminder_1h && (
                      <Badge className="bg-green-100 text-green-700 mr-2">✓ تم إرسال تذكير 1 ساعة</Badge>
                    )}
                  </div>
                )}
              </div>

              {selectedAppointment.approval_status === "pending" && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(selectedAppointment.id)}
                  >
                    <CheckCircle className="w-4 h-4 ml-2" />
                    موافق
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      // TODO: Open reschedule dialog
                    }}
                  >
                    <Clock className="w-4 h-4 ml-2" />
                    اقتراح تأجيل
                  </Button>
                </div>
              )}

              {selectedAppointment.google_calendar_link && (
                <div className="pt-4 border-t space-y-2">
                  <a
                    href={selectedAppointment.google_calendar_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    فتح في Google Calendar
                  </a>
                  {selectedAppointment.meet_link && (
                    <a
                      href={selectedAppointment.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:underline flex items-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      رابط لقاء الفيديو (Google Meet)
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}