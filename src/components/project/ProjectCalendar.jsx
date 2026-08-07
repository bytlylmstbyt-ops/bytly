import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Calendar as CalendarIcon, Clock, DollarSign, CheckCircle2,
  AlertTriangle, Video, Flag, ChevronRight, ChevronLeft,
  Loader2, CalendarDays, Users as UsersIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MeetCallButton from "@/components/project/MeetCallButton";
import AppointmentModal from "@/components/appointments/AppointmentModal";

const TYPE_META = {
  meeting: { label: "اجتماع", icon: Video, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
  deadline: { label: "موعد تسليم", icon: Flag, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
  payment: { label: "دفعة", icon: DollarSign, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500" },
  task: { label: "مهمة", icon: CheckCircle2, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  milestone: { label: "مرحلة", icon: Flag, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500" },
  start: { label: "بداية المشروع", icon: CalendarDays, color: "text-[#C9A66B]", bg: "bg-[#FEF9EE]", border: "border-[#C9A66B]/30", dot: "bg-[#C9A66B]" },
};

const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function toDateString(d) {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
}

function formatDateLabel(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((date - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "اليوم";
  if (diff === 1) return "غداً";
  if (diff === -1) return "أمس";
  if (diff < 0) return `متأخر ${Math.abs(diff)} يوم`;
  if (diff < 7) return `بعد ${diff} أيام`;
  return date.toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function ProjectCalendar({ project, user, userEngineer, engineers, isClient, isEngineer }) {
  const [appointments, setAppointments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMonth, setViewMonth] = useState(new Date());

  useEffect(() => {
    loadEvents();
  }, [project.id]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const [appts, taskData, msData] = await Promise.all([
        base44.entities.ConsultationAppointment.filter({ target_id: project.id }).catch(() => []),
        base44.entities.ProjectTask.filter({ project_id: project.id }).catch(() => []),
        base44.entities.ProjectMilestone.filter({ project_id: project.id }).catch(() => []),
      ]);
      setAppointments(appts);
      setTasks(taskData);
      setMilestones(msData);
    } catch (err) {
      console.error("Error loading calendar events:", err);
    } finally {
      setLoading(false);
    }
  };

  const events = useMemo(() => {
    const list = [];

    // Project start date
    if (project.start_date) {
      list.push({
        id: "project-start",
        date: toDateString(project.start_date),
        type: "start",
        title: `بداية مشروع: ${project.title}`,
        meta: project.location || "",
      });
    }

    // Project deadline
    if (project.deadline) {
      list.push({
        id: "project-deadline",
        date: toDateString(project.deadline),
        type: "deadline",
        title: "الموعد النهائي للتسليم",
        meta: project.title,
      });
    }

    // Appointments (meetings)
    appointments.forEach((appt) => {
      if (appt.appointment_date) {
        list.push({
          id: `appt-${appt.id}`,
          date: toDateString(appt.appointment_date),
          type: "meeting",
          title: appt.topic || appt.appointment_type || "اجتماع",
          meta: `${appt.appointment_time || ""} • ${appt.consultation_type === "video_call" ? "مكالمة فيديو" : appt.consultation_type === "site_visit" ? "زيارة موقع" : "مباشر"}`,
          meetLink: appt.meet_link,
          status: appt.status,
        });
      }
    });

    // Tasks with due dates
    tasks.forEach((task) => {
      if (task.due_date) {
        list.push({
          id: `task-${task.id}`,
          date: toDateString(task.due_date),
          type: "task",
          title: task.title,
          meta: task.assigned_to ? `مسند إلى: ${task.assigned_to.split("@")[0]}` : "",
          status: task.status,
          priority: task.priority,
        });
      }
    });

    // ProjectMilestone due dates
    milestones.forEach((ms) => {
      const dueDate = ms.due_date || ms.deadline;
      if (dueDate) {
        list.push({
          id: `milestone-${ms.id}`,
          date: toDateString(dueDate),
          type: "milestone",
          title: `مرحلة: ${ms.title}`,
          meta: ms.amount ? `${Number(ms.amount).toLocaleString("ar-SA")} ر.س • ${ms.percentage || ""}%` : "",
          status: ms.status,
        });
      }
    });

    // Contract milestones
    if (project.milestones && Array.isArray(project.milestones)) {
      project.milestones.forEach((m, i) => {
        if (m.due_date || m.date) {
          list.push({
            id: `contract-ms-${i}`,
            date: toDateString(m.due_date || m.date),
            type: "milestone",
            title: `مرحلة: ${m.title || m.name || `المرحلة ${i + 1}`}`,
            meta: m.amount ? `${Number(m.amount).toLocaleString()} ر.س` : "",
          });
        }
      });
    }

    return list.filter(e => e.date).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [project, appointments, tasks, milestones]);

  // Build calendar grid for current month
  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay(); // 0=Sunday
    const daysInMonth = lastDay.getDate();

    const days = [];
    // Leading blanks
    for (let i = 0; i < startWeekday; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEvents = events.filter(e => e.date === dateStr);
      days.push({ day: d, dateStr, events: dayEvents });
    }
    return days;
  }, [viewMonth, events]);

  // Events map for quick lookup
  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const today = toDateString(new Date());

  const handlePrevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));

  // Group events for the list view
  const grouped = useMemo(() => {
    const map = {};
    events.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return Object.entries(map).sort(([a], [b]) => new Date(a) - new Date(b));
  }, [events]);

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const upcoming = grouped.filter(([d]) => new Date(d + "T00:00:00") >= todayDate);
  const past = grouped.filter(([d]) => new Date(d + "T00:00:00") < todayDate).reverse();

  const assignedEngineer = engineers?.[project.assigned_engineer_id];
  const target = isClient
    ? { id: assignedEngineer?.id, name: assignedEngineer?.full_name, email: assignedEngineer?.email, type: "engineer" }
    : isEngineer
      ? { id: project.client_id, name: project.created_by, email: project.created_by, type: "engineer" }
      : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "إجمالي الأحداث", value: events.length, icon: CalendarIcon, color: "text-[#4A3F35]", bg: "bg-[#F5F0E8]" },
          { label: "اجتماعات", value: events.filter(e => e.type === "meeting").length, icon: Video, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "مراحل", value: events.filter(e => e.type === "milestone").length, icon: Flag, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "مهام مستحقة", value: events.filter(e => e.type === "task" && e.status !== "done").length, icon: CheckCircle2, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "مواعيد نهائية", value: events.filter(e => e.type === "deadline").length, icon: Clock, color: "text-red-600", bg: "bg-red-50" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-[#4A3F35]">{s.value}</p>
                  <p className="text-[10px] text-slate-500 truncate">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Schedule a meeting */}
      {project.status === "in_progress" && (isClient || isEngineer) && target?.email && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isClient && <MeetCallButton project={project} currentUser={user} />}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Video className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#1a1a2e] text-sm">حجز اجتماع مراجعة</h4>
                  <p className="text-xs text-slate-500">{target.name} — يُحفظ في تقويم المشروع</p>
                </div>
              </div>
              <AppointmentModal
                targetId={target.id}
                targetName={target.name}
                targetType={target.type}
                targetEmail={target.email}
                trigger={
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white gap-2">
                    <CalendarIcon className="w-4 h-4" /> حجز موعد
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interactive Month Calendar */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4 md:p-6" dir="rtl">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1a1a2e] text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#C9A66B]" />
              {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setViewMonth(new Date()); setSelectedDate(today); }} className="text-xs">
                اليوم
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[10px] md:text-xs font-medium text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              if (!cell) return <div key={`blank-${idx}`} className="aspect-square" />;
              const isToday = cell.dateStr === today;
              const isSelected = cell.dateStr === selectedDate;
              const hasEvents = cell.events.length > 0;

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : cell.dateStr)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-start p-1 transition-all relative ${
                    isSelected
                      ? "bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white shadow-md"
                      : isToday
                        ? "bg-[#C9A66B]/10 ring-1 ring-[#C9A66B]/30"
                        : hasEvents
                          ? "bg-slate-50 hover:bg-slate-100"
                          : "hover:bg-slate-50"
                  }`}
                >
                  <span className={`text-xs md:text-sm font-medium ${isSelected ? "text-white" : isToday ? "text-[#C9A66B] font-bold" : "text-slate-600"}`}>
                    {cell.day}
                  </span>
                  {/* Event dots */}
                  {hasEvents && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-[90%]">
                      {cell.events.slice(0, 4).map((e) => {
                        const meta = TYPE_META[e.type] || TYPE_META.task;
                        return (
                          <span
                            key={e.id}
                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/80" : meta.dot}`}
                          />
                        );
                      })}
                      {cell.events.length > 4 && (
                        <span className={`text-[8px] ${isSelected ? "text-white/80" : "text-slate-400"}`}>+{cell.events.length - 4}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day events */}
          {selectedDate && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[#1a1a2e]">
                  {formatDateLabel(selectedDate)}
                </h4>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)} className="text-xs h-7">إغلاق</Button>
              </div>
              {eventsByDate[selectedDate]?.length > 0 ? (
                <div className="space-y-2">
                  {eventsByDate[selectedDate].map((event) => (
                    <EventCard key={event.id} event={event} compact />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-3">لا توجد أحداث في هذا اليوم</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming events list */}
      {upcoming.length > 0 ? (
        <div>
          <h3 className="font-bold text-[#1a1a2e] mb-3 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#C9A66B]" />
            القادم
          </h3>
          <div className="space-y-4">
            {upcoming.map(([date, items]) => (
              <EventGroup key={date} date={date} items={items} formatDateLabel={formatDateLabel} />
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium mb-1">لا توجد أحداث قادمة</p>
            <p className="text-sm text-slate-400">سيظهر هنا أي اجتماع أو مهمة أو موعد تسليم أو دفعة مرتبطة بالمشروع</p>
          </CardContent>
        </Card>
      )}

      {/* Past events */}
      {past.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-500 mb-3 flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            سابق ({past.length})
          </h3>
          <div className="space-y-3 opacity-60">
            {past.slice(0, 10).map(([date, items]) => (
              <EventGroup key={date} date={date} items={items} formatDateLabel={formatDateLabel} past />
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {Object.entries(TYPE_META).map(([key, meta]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
            <span className="text-xs text-slate-500">{meta.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventCard({ event, compact }) {
  const meta = TYPE_META[event.type] || TYPE_META.task;
  const Icon = meta.icon;
  const isOverdue = event.type === "task" && event.status !== "done";

  return (
    <Card className={`border ${meta.border} ${meta.bg} shadow-sm`}>
      <CardContent className={`p-3 flex items-start gap-3 ${compact ? "" : ""}`}>
        <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shrink-0">
          <Icon className={`w-4 h-4 ${meta.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1a1a2e] flex items-center gap-1">
            {event.title}
            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
          </p>
          {event.meta && <p className="text-xs text-slate-500 mt-0.5">{event.meta}</p>}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className={`text-[10px] ${meta.color}`}>
              {meta.label}
            </Badge>
            {event.status && event.status !== "pending" && (
              <Badge variant="outline" className="text-[10px]">
                {event.status === "done" ? "مكتمل" : event.status === "confirmed" ? "مؤكد" : event.status === "approved" ? "معتمد" : event.status}
              </Badge>
            )}
            {event.meetLink && (
              <a href={event.meetLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Video className="w-3 h-3" /> انضم
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EventGroup({ date, items, formatDateLabel, past }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 flex flex-col items-center justify-center w-16">
        <div className={`w-14 h-14 rounded-xl ${past ? "bg-slate-100" : "bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B]"} flex flex-col items-center justify-center text-white shadow-sm`}>
          <span className="text-lg font-bold leading-none">
            {new Date(date + "T00:00:00").getDate()}
          </span>
          <span className="text-[10px] mt-0.5">
            {new Date(date + "T00:00:00").toLocaleDateString("ar-SA", { month: "short" })}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-xs font-medium text-slate-400 mb-1">{formatDateLabel(date)}</p>
        {items.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}