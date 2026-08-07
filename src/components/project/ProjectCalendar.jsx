import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  Calendar as CalendarIcon, Clock, DollarSign, CheckCircle2,
  AlertTriangle, Video, Flag, ChevronRight, ChevronLeft,
  Loader2, CalendarDays, Plus, Trash2, X, Link2,
  LayoutDashboard, Kanban, CreditCard, Scale
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import MeetCallButton from "@/components/project/MeetCallButton";
import AppointmentModal from "@/components/appointments/AppointmentModal";
import ProjectTimeline from "@/components/project/ProjectTimeline";
import { sendNotification } from "@/components/notifications/NotificationHelper";

const TYPE_META = {
  meeting:   { label: "اجتماع",       icon: Video,         color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200",   dot: "bg-blue-500" },
  deadline:  { label: "موعد نهائي",   icon: Flag,          color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",    dot: "bg-red-500" },
  payment:   { label: "دفعة",         icon: DollarSign,    color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200",  dot: "bg-green-500" },
  task:      { label: "مهمة",         icon: CheckCircle2,  color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200",  dot: "bg-amber-500" },
  milestone: { label: "مرحلة",        icon: Flag,          color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500" },
  start:     { label: "بداية المشروع", icon: CalendarDays,  color: "text-[#C9A66B]", bg: "bg-[#FEF9EE]", border: "border-[#C9A66B]/30", dot: "bg-[#C9A66B]" },
};

const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

const EVENT_TYPE_TAB_MAP = {
  milestone: "tasks",
  task: "tasks",
  payment: "payments",
  meeting: "chat",
  deadline: "tasks",
  start: "overview",
};

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

export default function ProjectCalendar({ project, user, userEngineer, engineers, isClient, isEngineer, onNavigate }) {
  const [appointments, setAppointments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("month"); // month | day
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [viewMonth, setViewMonth] = useState(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createDate, setCreateDate] = useState(toDateString(new Date()));
  const [newEvent, setNewEvent] = useState({ title: "", description: "", priority: "medium" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [project.id]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const [appts, taskData, msData, txData] = await Promise.all([
        base44.entities.ConsultationAppointment.filter({ target_id: project.id }).catch(() => []),
        base44.entities.ProjectTask.filter({ project_id: project.id }).catch(() => []),
        base44.entities.ProjectMilestone.filter({ project_id: project.id }).catch(() => []),
        base44.entities.Transaction.filter({ project_id: project.id }).catch(() => []),
      ]);
      setAppointments(appts);
      setTasks(taskData);
      setMilestones(msData);
      setTransactions(txData);
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
      list.push({ id: "project-start", date: toDateString(project.start_date), type: "start",
        title: `بداية مشروع: ${project.title}`, meta: project.location || "", linkTab: "overview" });
    }

    // Project deadline
    if (project.deadline) {
      list.push({ id: "project-deadline", date: toDateString(project.deadline), type: "deadline",
        title: "الموعد النهائي للتسليم", meta: project.title, linkTab: "overview" });
    }

    // Appointments
    appointments.forEach((appt) => {
      if (appt.appointment_date) {
        list.push({
          id: `appt-${appt.id}`, date: toDateString(appt.appointment_date), type: "meeting",
          title: appt.topic || appt.appointment_type || "اجتماع",
          meta: `${appt.appointment_time || ""} • ${appt.consultation_type === "video_call" ? "مكالمة فيديو" : appt.consultation_type === "site_visit" ? "زيارة موقع" : "مباشر"}`,
          meetLink: appt.meet_link, status: appt.status, linkTab: "chat",
        });
      }
    });

    // Tasks
    tasks.forEach((task) => {
      if (task.due_date) {
        list.push({
          id: `task-${task.id}`, date: toDateString(task.due_date), type: "task",
          title: task.title, meta: task.assigned_to ? `مسند إلى: ${task.assigned_to.split("@")[0]}` : "",
          status: task.status, priority: task.priority, linkTab: "tasks",
          entityId: task.id,
        });
      }
    });

    // Milestones
    milestones.forEach((ms) => {
      const dueDate = ms.due_date || ms.deadline;
      if (dueDate) {
        list.push({
          id: `ms-${ms.id}`, date: toDateString(dueDate), type: "milestone",
          title: `مرحلة: ${ms.title}`,
          meta: ms.amount ? `${Number(ms.amount).toLocaleString("ar-SA")} ر.س${ms.percentage ? ` • ${ms.percentage}%` : ""}` : "",
          status: ms.status, linkTab: "tasks", entityId: ms.id,
        });
      }
    });

    // Transactions (payments)
    transactions.forEach((tx) => {
      if (tx.created_date) {
        const isPayment = tx.type === "escrow_release" || tx.type === "payment" || tx.type === "deposit";
        if (isPayment) {
          list.push({
            id: `tx-${tx.id}`, date: toDateString(tx.created_date), type: "payment",
            title: tx.description || "معاملة مالية", meta: `${Number(tx.amount || 0).toLocaleString("ar-SA")} ر.س`,
            status: tx.status, linkTab: "payments",
          });
        }
      }
    });

    // Contract milestones
    if (project.milestones && Array.isArray(project.milestones)) {
      project.milestones.forEach((m, i) => {
        if (m.due_date || m.date) {
          list.push({
            id: `cms-${i}`, date: toDateString(m.due_date || m.date), type: "milestone",
            title: `مرحلة: ${m.title || m.name || `المرحلة ${i + 1}`}`,
            meta: m.amount ? `${Number(m.amount).toLocaleString()} ر.س` : "", linkTab: "contract",
          });
        }
      });
    }

    return list.filter(e => e.date).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [project, appointments, tasks, milestones, transactions]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const days = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEvents = events.filter(e => e.date === dateStr);
      days.push({ day: d, dateStr, events: dayEvents });
    }
    return days;
  }, [viewMonth, events]);

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach(e => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e); });
    return map;
  }, [events]);

  const today = toDateString(new Date());

  // Day view events
  const dayEvents = eventsByDate[selectedDate] || [];

  // List view grouped
  const grouped = useMemo(() => {
    const map = {};
    events.forEach(e => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e); });
    return Object.entries(map).sort(([a], [b]) => new Date(a) - new Date(b));
  }, [events]);

  const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
  const upcoming = grouped.filter(([d]) => new Date(d + "T00:00:00") >= todayDate);
  const past = grouped.filter(([d]) => new Date(d + "T00:00:00") < todayDate).reverse();

  const assignedEngineer = engineers?.[project.assigned_engineer_id];
  const target = isClient
    ? { id: assignedEngineer?.id, name: assignedEngineer?.full_name, email: assignedEngineer?.email, type: "engineer" }
    : isEngineer
      ? { id: project.client_id, name: project.created_by, email: project.created_by, type: "engineer" }
      : null;

  const canManage = isClient || isEngineer || user?.role === "admin";

  // Create a new task event
  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !createDate) return;
    setCreating(true);
    try {
      const taskData = {
        project_id: project.id,
        title: newEvent.title.trim(),
        description: newEvent.description || "",
        assigned_to: isEngineer ? userEngineer?.email : assignedEngineer?.email || user?.email,
        assigned_by: user?.email,
        status: "todo",
        priority: newEvent.priority,
        due_date: createDate,
      };
      await base44.entities.ProjectTask.create(taskData);

      // Notify the other party
      const notifyEmail = isClient ? assignedEngineer?.email : project.created_by;
      if (notifyEmail) {
        await sendNotification({
          recipientEmail: notifyEmail,
          title: "موعد جديد في تقويم المشروع",
          message: `تمت إضافة "${newEvent.title}" بتاريخ ${new Date(createDate).toLocaleDateString("ar-SA")} في مشروع ${project.title}`,
          type: "project_update",
          projectId: project.id,
          priority: "medium",
        });
      }

      setShowCreateDialog(false);
      setNewEvent({ title: "", description: "", priority: "medium" });
      await loadEvents();
    } catch (err) {
      console.error("Error creating event:", err);
      alert("حدث خطأ في إنشاء الحدث");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الحدث؟")) return;
    try {
      await base44.entities.ProjectTask.delete(taskId);
      await loadEvents();
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("لا يمكن حذف هذا الحدث");
    }
  };

  const handleEventClick = (event) => {
    if (event.linkTab && onNavigate) {
      onNavigate(event.linkTab);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <ProjectTimeline project={project} milestones={milestones} />

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "إجمالي الأحداث", value: events.length, icon: CalendarIcon, color: "text-[#4A3F35]", bg: "bg-[#F5F0E8]" },
          { label: "اجتماعات", value: events.filter(e => e.type === "meeting").length, icon: Video, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "مراحل", value: events.filter(e => e.type === "milestone").length, icon: Flag, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "مهام", value: events.filter(e => e.type === "task").length, icon: CheckCircle2, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "دفعات", value: events.filter(e => e.type === "payment").length, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
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

      {/* Schedule actions */}
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
                  <p className="text-xs text-slate-500">{target.name}</p>
                </div>
              </div>
              <AppointmentModal
                targetId={target.id} targetName={target.name} targetType={target.type} targetEmail={target.email}
                trigger={<Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white gap-2"><CalendarIcon className="w-4 h-4" /> حجز موعد</Button>}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Toggle + Create */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button onClick={() => setView("month")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === "month" ? "bg-white text-[#1a1a2e] shadow-sm" : "text-slate-500"}`}>
            عرض شهري
          </button>
          <button onClick={() => setView("day")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === "day" ? "bg-white text-[#1a1a2e] shadow-sm" : "text-slate-500"}`}>
            عرض يومي
          </button>
        </div>
        {canManage && (
          <Button onClick={() => { setCreateDate(view === "day" ? selectedDate : today); setShowCreateDialog(true); }} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2">
            <Plus className="w-4 h-4" /> إضافة حدث
          </Button>
        )}
      </div>

      {/* Month View */}
      {view === "month" && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 md:p-6" dir="rtl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#1a1a2e] text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#C9A66B]" />
                {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} className="h-8 w-8"><ChevronRight className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => { setViewMonth(new Date()); setSelectedDate(today); }} className="text-xs">اليوم</Button>
                <Button variant="ghost" size="icon" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} className="h-8 w-8"><ChevronLeft className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((d) => <div key={d} className="text-center text-[10px] md:text-xs font-medium text-slate-400 py-1">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell, idx) => {
                if (!cell) return <div key={`blank-${idx}`} className="aspect-square" />;
                const isToday = cell.dateStr === today;
                const isSelected = cell.dateStr === selectedDate;
                const hasEvents = cell.events.length > 0;
                return (
                  <button key={cell.dateStr} onClick={() => { setSelectedDate(cell.dateStr); setView("day"); }}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-start p-1 transition-all relative ${
                      isSelected ? "bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white shadow-md"
                      : isToday ? "bg-[#C9A66B]/10 ring-1 ring-[#C9A66B]/30"
                      : hasEvents ? "bg-slate-50 hover:bg-slate-100" : "hover:bg-slate-50"
                    }`}>
                    <span className={`text-xs md:text-sm font-medium ${isSelected ? "text-white" : isToday ? "text-[#C9A66B] font-bold" : "text-slate-600"}`}>{cell.day}</span>
                    {hasEvents && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-[90%]">
                        {cell.events.slice(0, 4).map((e) => {
                          const meta = TYPE_META[e.type] || TYPE_META.task;
                          return <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/80" : meta.dot}`} />;
                        })}
                        {cell.events.length > 4 && <span className={`text-[8px] ${isSelected ? "text-white/80" : "text-slate-400"}`}>+{cell.events.length - 4}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day View */}
      {view === "day" && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 md:p-6" dir="rtl">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-bold text-[#1a1a2e] text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#C9A66B]" />
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(toDateString(d)); }} className="text-xs gap-1"><ChevronRight className="w-4 h-4" /> السابق</Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate(today)} className="text-xs">اليوم</Button>
                <Button variant="ghost" size="sm" onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(toDateString(d)); }} className="text-xs gap-1">التالي <ChevronLeft className="w-4 h-4" /></Button>
              </div>
            </div>

            {dayEvents.length > 0 ? (
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <EventCard key={event.id} event={event} onClick={() => handleEventClick(event)} canDelete={event.type === "task" && canManage} onDelete={() => handleDeleteTask(event.entityId)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium mb-1">لا توجد أحداث في هذا اليوم</p>
                {canManage && <Button onClick={() => { setCreateDate(selectedDate); setShowCreateDialog(true); }} variant="outline" className="gap-2 mt-2"><Plus className="w-4 h-4" /> إضافة حدث لهذا اليوم</Button>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upcoming events list */}
      {upcoming.length > 0 ? (
        <div>
          <h3 className="font-bold text-[#1a1a2e] mb-3 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#C9A66B]" /> القادم
          </h3>
          <div className="space-y-4">
            {upcoming.map(([date, items]) => (
              <EventGroup key={date} date={date} items={items} formatDateLabel={formatDateLabel} onEventClick={handleEventClick} canManage={canManage} onDelete={handleDeleteTask} />
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium mb-1">لا توجد أحداث قادمة</p>
          </CardContent>
        </Card>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-500 mb-3 flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" /> سابق ({past.length})
          </h3>
          <div className="space-y-3 opacity-60">
            {past.slice(0, 10).map(([date, items]) => (
              <EventGroup key={date} date={date} items={items} formatDateLabel={formatDateLabel} past onEventClick={handleEventClick} canManage={canManage} onDelete={handleDeleteTask} />
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

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#C9A66B]" /> إضافة حدث جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>العنوان *</Label>
              <Input value={newEvent.title} onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))} placeholder="مثال: اجتماع مراجعة المخططات" />
            </div>
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input type="date" value={createDate} onChange={(e) => setCreateDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>الأولوية</Label>
              <select value={newEvent.priority} onChange={(e) => setNewEvent(prev => ({ ...prev, priority: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="urgent">عاجلة</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={newEvent.description} onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))} placeholder="تفاصيل إضافية..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>إلغاء</Button>
            <Button onClick={handleCreateEvent} disabled={creating || !newEvent.title.trim()} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2">
              {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإنشاء</> : <><Plus className="w-4 h-4" /> إنشاء</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventCard({ event, compact, past, onClick, canDelete, onDelete }) {
  const meta = TYPE_META[event.type] || TYPE_META.task;
  const Icon = meta.icon;
  const isOverdue = event.type === "task" && event.status !== "done" && !past;

  return (
    <div className={`border ${meta.border} ${meta.bg} rounded-xl p-3 flex items-start gap-3 ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`} onClick={onClick}>
      <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shrink-0">
        <Icon className={`w-4 h-4 ${meta.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${past ? "text-slate-500" : "text-[#1a1a2e]"} flex items-center gap-1`}>
          {event.title}
          {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
          {event.linkTab && <Link2 className="w-3 h-3 text-slate-400" />}
        </p>
        {event.meta && <p className="text-xs text-slate-500 mt-0.5">{event.meta}</p>}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge variant="outline" className={`text-[10px] ${meta.color}`}>{meta.label}</Badge>
          {event.status && event.status !== "pending" && (
            <Badge variant="outline" className="text-[10px]">
              {event.status === "done" ? "مكتمل" : event.status === "confirmed" ? "مؤكد" : event.status === "approved" ? "معتمد" : event.status === "completed" ? "مكتمل" : event.status}
            </Badge>
          )}
          {event.meetLink && (
            <a href={event.meetLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Video className="w-3 h-3" /> انضم
            </a>
          )}
        </div>
      </div>
      {canDelete && event.type === "task" && onDelete && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-slate-300 hover:text-red-500 transition-colors p-1">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function EventGroup({ date, items, formatDateLabel, past, onEventClick, canManage, onDelete }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 flex flex-col items-center justify-center w-16">
        <div className={`w-14 h-14 rounded-xl ${past ? "bg-slate-100" : "bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B]"} flex flex-col items-center justify-center text-white shadow-sm`}>
          <span className="text-lg font-bold leading-none">{new Date(date + "T00:00:00").getDate()}</span>
          <span className="text-[10px] mt-0.5">{new Date(date + "T00:00:00").toLocaleDateString("ar-SA", { month: "short" })}</span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-xs font-medium text-slate-400 mb-1">{formatDateLabel(date)}</p>
        {items.map((event) => (
          <EventCard key={event.id} event={event} past={past} onClick={onEventClick ? () => onEventClick(event) : undefined} canDelete={canManage} onDelete={event.entityId ? () => onDelete(event.entityId) : undefined} />
        ))}
      </div>
    </div>
  );
}