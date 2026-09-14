import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Flag, CheckCircle2, Circle, Clock, Pause } from "lucide-react";
import { format, isPast, isToday, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

const STATUS_CONFIG = {
  todo:        { label: "قيد الانتظار",   icon: Circle,       color: "bg-slate-100 text-slate-600" },
  in_progress: { label: "قيد التنفيذ",    icon: Clock,        color: "bg-blue-100 text-blue-700" },
  completed:   { label: "مكتملة",          icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  on_hold:     { label: "معلقة",           icon: Pause,        color: "bg-amber-100 text-amber-700" },
};

const PRIORITY_CONFIG = {
  low:    { label: "منخفضة",  color: "text-slate-400" },
  medium: { label: "متوسطة",  color: "text-blue-500" },
  high:   { label: "مرتفعة",  color: "text-orange-500" },
  urgent: { label: "عاجلة",   color: "text-red-500" },
};

export default function TaskCard({ task, projectColor = "#6B5D4F", onClick, onStatusChange }) {
  // Optimistic local status — updates instantly before server responds
  const [localStatus, setLocalStatus] = useState(task.status);

  // Keep in sync if parent passes updated task prop
  useEffect(() => { setLocalStatus(task.status); }, [task.status]);

  const status = STATUS_CONFIG[localStatus] || STATUS_CONFIG.todo;
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const StatusIcon = status.icon;

  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && localStatus !== "completed";
  const isDueToday = task.due_date && isToday(parseISO(task.due_date));

  const nextStatus = { todo: "in_progress", in_progress: "completed", completed: "todo", on_hold: "in_progress" };

  const handleStatusClick = (e) => {
    e.stopPropagation();
    if (!onStatusChange) return;
    const next = nextStatus[localStatus];
    setLocalStatus(next); // optimistic
    onStatusChange(task, next);
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all group"
      style={{ borderRight: `3px solid ${projectColor}` }}
    >
      <div className="flex items-start gap-3">
        {/* Status toggle */}
        <button
          onClick={handleStatusClick}
          className="mt-0.5 shrink-0 hover:opacity-70 transition-opacity"
          title="تغيير الحالة"
        >
          <StatusIcon className={`w-5 h-5 ${localStatus === 'completed' ? 'text-green-500' : localStatus === 'in_progress' ? 'text-blue-500' : 'text-slate-300'}`} />
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${localStatus === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge className={`text-xs ${status.color}`}>{STATUS_CONFIG[localStatus]?.label || status.label}</Badge>
            <span className={`text-xs font-medium flex items-center gap-0.5 ${priority.color}`}>
              <Flag className="w-3 h-3" />{priority.label}
            </span>

            {task.assigned_to && (
              <span className="text-xs text-slate-500 flex items-center gap-0.5">
                <User className="w-3 h-3" />
                {task.assigned_to.split('@')[0]}
              </span>
            )}

            {task.due_date && (
              <span className={`text-xs flex items-center gap-0.5 ${isOverdue ? 'text-red-600 font-semibold' : isDueToday ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>
                <Calendar className="w-3 h-3" />
                {isOverdue ? '⚠️ متأخرة' : isDueToday ? '⏰ اليوم' : format(parseISO(task.due_date), 'd MMM', { locale: ar })}
              </span>
            )}
          </div>

          {task.progress > 0 && localStatus !== 'completed' && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
              </div>
              <span className="text-xs text-slate-500">{task.progress}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}