import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, parseISO, isPast } from "date-fns";
import { ar } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TaskCalendarView({ tasks, projects, onTaskClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const projectMap = Object.fromEntries((projects || []).map(p => [p.id, p]));
  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstOffset = startOfMonth(currentMonth).getDay();

  const tasksOnDay = (day) => tasks.filter(t => t.due_date && isSameDay(parseISO(t.due_date), day));

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <h3 className="font-semibold text-slate-800">{format(currentMonth, 'MMMM yyyy', { locale: ar })}</h3>
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 border-b">
        {['أح','إث','ثل','أر','خم','جم','سب'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-slate-500">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {Array.from({ length: firstOffset }).map((_, i) => <div key={`gap-${i}`} className="min-h-[80px] border-b border-l border-slate-100" />)}
        {days.map(day => {
          const dayTasks = tasksOnDay(day);
          const today = isToday(day);
          return (
            <div key={day.toISOString()} className={`min-h-[80px] p-1 border-b border-l border-slate-100 ${today ? 'bg-blue-50' : ''}`}>
              <p className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${today ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>
                {format(day, 'd')}
              </p>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map(task => {
                  const project = projectMap[task.project_id];
                  const overdue = task.status !== 'completed' && isPast(parseISO(task.due_date));
                  return (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick && onTaskClick(task)}
                      className="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: overdue ? '#FEE2E2' : (project?.color + '22' || '#EFF6FF'), color: overdue ? '#DC2626' : (project?.color || '#3B82F6'), border: `1px solid ${overdue ? '#FECACA' : (project?.color + '44' || '#BFDBFE')}` }}
                    >
                      {task.title}
                    </div>
                  );
                })}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-slate-400 pr-1">+{dayTasks.length - 3} أخرى</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}