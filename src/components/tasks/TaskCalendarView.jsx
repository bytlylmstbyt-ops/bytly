import React, { useState } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isToday, addMonths, subMonths, parseISO, isPast,
  startOfWeek, endOfWeek, addDays, addWeeks, subWeeks
} from "date-fns";
import { ar } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PRIORITY_DOT = {
  urgent: "bg-red-500",
  high:   "bg-amber-500",
  medium: "bg-blue-500",
  low:    "bg-slate-400",
};

const STATUS_LABELS = { todo: "انتظار", in_progress: "تنفيذ", on_hold: "معلقة", completed: "مكتملة" };

function TaskPill({ task, project, onClick }) {
  const overdue = task.status !== "completed" && task.due_date && isPast(parseISO(task.due_date));
  const bg = overdue ? "#FEE2E2" : (project?.color + "22" || "#EFF6FF");
  const color = overdue ? "#DC2626" : (project?.color || "#3B82F6");
  const border = overdue ? "#FECACA" : (project?.color + "44" || "#BFDBFE");
  return (
    <div
      onClick={() => onClick && onClick(task)}
      className="text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 flex items-center gap-1"
      style={{ backgroundColor: bg, color, border: `1px solid ${border}` }}
      title={`${task.title}${task.due_time ? " • " + task.due_time : ""}${project ? " • " + project.name : ""}`}
    >
      {task.due_time && <Clock className="w-2.5 h-2.5 shrink-0" style={{ color }} />}
      <span className="truncate">{task.title}</span>
    </div>
  );
}

// ── Day Detail Popover ────────────────────────────────────────────────────────
function DayPopover({ day, tasks, projects, onTaskClick, onClose }) {
  const projectMap = Object.fromEntries((projects || []).map(p => [p.id, p]));
  const sorted = [...tasks].sort((a, b) => (a.due_time || "").localeCompare(b.due_time || ""));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-80 max-h-[70vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()} dir="rtl">
        <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-800">{format(day, "EEEE", { locale: ar })}</p>
            <p className="text-sm text-slate-500">{format(day, "d MMMM yyyy", { locale: ar })}</p>
          </div>
          <Badge className="bg-blue-100 text-blue-700">{tasks.length} مهمة</Badge>
        </div>
        <div className="overflow-y-auto p-3 space-y-2">
          {sorted.map(task => {
            const project = projectMap[task.project_id];
            const overdue = task.status !== "completed" && task.due_date && isPast(parseISO(task.due_date));
            return (
              <div
                key={task.id}
                onClick={() => { onTaskClick && onTaskClick(task); onClose(); }}
                className="p-2.5 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors"
                style={{ borderColor: project?.color + "44" || "#e2e8f0" }}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[task.priority] || "bg-slate-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === "completed" ? "line-through text-slate-400" : "text-slate-800"}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {task.due_time && (
                        <span className="text-xs text-slate-500 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />{task.due_time}
                        </span>
                      )}
                      {project && (
                        <span className="text-xs px-1.5 py-0 rounded-full" style={{ backgroundColor: project.color + "22", color: project.color }}>
                          {project.name}
                        </span>
                      )}
                      <Badge variant="outline" className={`text-xs py-0 ${overdue ? "border-red-300 text-red-600" : ""}`}>
                        {STATUS_LABELS[task.status] || task.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Week View ─────────────────────────────────────────────────────────────────
function WeekView({ currentDate, tasks, projects, onTaskClick }) {
  const projectMap = Object.fromEntries((projects || []).map(p => [p.id, p]));
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 17 }, (_, i) => i + 7); // 7am - 11pm

  const getTasksForDayHour = (day, hour) =>
    tasks.filter(t => {
      if (!t.due_date) return false;
      if (!isSameDay(parseISO(t.due_date), day)) return false;
      if (!t.due_time) return hour === 8; // default slot
      const taskHour = parseInt(t.due_time.split(":")[0]);
      return taskHour === hour;
    });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b bg-slate-50">
          <div className="p-2 text-xs text-slate-400 border-l" />
          {weekDays.map(day => (
            <div key={day.toISOString()} className={`p-2 text-center border-l ${isToday(day) ? "bg-blue-50" : ""}`}>
              <p className="text-xs text-slate-500">{format(day, "EEE", { locale: ar })}</p>
              <p className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mx-auto ${isToday(day) ? "bg-blue-600 text-white" : "text-slate-700"}`}>
                {format(day, "d")}
              </p>
            </div>
          ))}
        </div>
        {/* Hours grid */}
        <div className="max-h-[500px] overflow-y-auto">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b" style={{ minHeight: 48 }}>
              <div className="p-1 text-right text-xs text-slate-400 border-l shrink-0 pt-1.5">
                {hour}:00
              </div>
              {weekDays.map(day => {
                const cellTasks = getTasksForDayHour(day, hour);
                return (
                  <div key={day.toISOString()} className={`p-0.5 border-l relative ${isToday(day) ? "bg-blue-50/40" : ""}`}>
                    {cellTasks.map(task => (
                      <TaskPill key={task.id} task={task} project={projectMap[task.project_id]} onClick={onTaskClick} />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TaskCalendarView({ tasks, projects, onTaskClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calView, setCalView] = useState("month"); // month | week
  const [popover, setPopover] = useState(null); // { day, tasks }

  const projectMap = Object.fromEntries((projects || []).map(p => [p.id, p]));

  // ── Month View ──
  const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  const firstOffset = startOfMonth(currentDate).getDay();
  const tasksOnDay = (day) => tasks.filter(t => t.due_date && isSameDay(parseISO(t.due_date), day));

  const navLabel = calView === "month"
    ? format(currentDate, "MMMM yyyy", { locale: ar })
    : `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "d MMM", { locale: ar })} – ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "d MMM yyyy", { locale: ar })}`;

  const goBack = () => calView === "month" ? setCurrentDate(subMonths(currentDate, 1)) : setCurrentDate(subWeeks(currentDate, 1));
  const goNext = () => calView === "month" ? setCurrentDate(addMonths(currentDate, 1)) : setCurrentDate(addWeeks(currentDate, 1));

  // Tasks with time today
  const todayTasksWithTime = tasks.filter(t => t.due_date && isToday(parseISO(t.due_date)) && t.due_time);

  return (
    <div className="space-y-3">
      {/* Today's schedule banner */}
      {todayTasksWithTime.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />مواعيد اليوم ({todayTasksWithTime.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {todayTasksWithTime
              .sort((a, b) => a.due_time.localeCompare(b.due_time))
              .map(t => (
                <button
                  key={t.id}
                  onClick={() => onTaskClick && onTaskClick(t)}
                  className="flex items-center gap-1.5 bg-white border border-blue-200 rounded-lg px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  <Clock className="w-3 h-3" />
                  <span className="font-medium">{t.due_time}</span>
                  <span className="text-slate-600">{t.title}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Calendar container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
          <Button variant="ghost" size="sm" onClick={goBack}><ChevronRight className="w-4 h-4" /></Button>
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-800">{navLabel}</h3>
            <div className="flex gap-1 bg-white border rounded-lg p-0.5">
              <button
                onClick={() => setCalView("month")}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${calView === "month" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
              >
                شهري
              </button>
              <button
                onClick={() => setCalView("week")}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${calView === "week" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
              >
                أسبوعي
              </button>
            </div>
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setCurrentDate(new Date())}>
              اليوم
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={goNext}><ChevronLeft className="w-4 h-4" /></Button>
        </div>

        {calView === "week" ? (
          <WeekView currentDate={currentDate} tasks={tasks} projects={projects} onTaskClick={onTaskClick} />
        ) : (
          <>
            {/* Day names */}
            <div className="grid grid-cols-7 border-b">
              {["أحد","إثن","ثلث","أرب","خمس","جمع","سبت"].map(d => (
                <div key={d} className="py-2 text-center text-xs font-medium text-slate-500">{d}</div>
              ))}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstOffset }).map((_, i) => (
                <div key={`gap-${i}`} className="min-h-[90px] border-b border-l border-slate-100 bg-slate-50/40" />
              ))}
              {days.map(day => {
                const dayTasks = tasksOnDay(day);
                const today = isToday(day);
                const withTime = dayTasks.filter(t => t.due_time).sort((a, b) => a.due_time.localeCompare(b.due_time));
                const noTime = dayTasks.filter(t => !t.due_time);
                const allSorted = [...withTime, ...noTime];
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[90px] p-1 border-b border-l border-slate-100 cursor-pointer hover:bg-slate-50/60 transition-colors ${today ? "bg-blue-50" : ""}`}
                    onClick={() => dayTasks.length > 0 && setPopover({ day, tasks: dayTasks })}
                  >
                    <p className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${today ? "bg-blue-600 text-white" : "text-slate-600"}`}>
                      {format(day, "d")}
                    </p>
                    <div className="space-y-0.5">
                      {allSorted.slice(0, 3).map(task => (
                        <TaskPill
                          key={task.id}
                          task={task}
                          project={projectMap[task.project_id]}
                          onClick={e => { e.stopPropagation?.(); onTaskClick && onTaskClick(task); }}
                        />
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-[10px] text-slate-400 pr-1 font-medium">+{dayTasks.length - 3} أخرى</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Day popover */}
      {popover && (
        <DayPopover
          day={popover.day}
          tasks={popover.tasks}
          projects={projects}
          onTaskClick={onTaskClick}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
}