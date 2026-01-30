import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ar } from "date-fns/locale";

export default function TaskCalendarView({ projectId, onTaskSelect }) {
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    try {
      setLoading(false);
      const data = await base44.entities.ProjectTask.filter({ project_id: projectId });
      setTasks(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700";
      case "high":
        return "bg-orange-100 text-orange-700";
      case "medium":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      return isSameDay(new Date(task.due_date), date);
    });
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const monthName = format(currentDate, "MMMM yyyy", { locale: ar });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>تقويم المهام</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <p className="text-sm font-medium min-w-32 text-center">{monthName}</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((date) => {
            const dayTasks = getTasksForDate(date);
            const isCurrentMonth = isSameMonth(date, currentDate);

            return (
              <div
                key={date.toString()}
                className={`min-h-24 p-1 border rounded-lg ${
                  isCurrentMonth ? "bg-white" : "bg-slate-50"
                } ${isSameDay(date, new Date()) ? "border-blue-400" : "border-slate-200"}`}
              >
                <p className={`text-xs font-medium mb-1 ${isCurrentMonth ? "text-slate-900" : "text-slate-400"}`}>
                  {format(date, "d")}
                </p>
                <div className="space-y-0.5">
                  {dayTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onTaskSelect(task)}
                      className="w-full text-left"
                      title={task.title}
                    >
                      <Badge
                        className={`text-xs truncate max-w-full ${getPriorityColor(task.priority)} cursor-pointer hover:opacity-80 block`}
                      >
                        {task.title}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
            <span>عاجل</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300"></div>
            <span>مرتفع</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
            <span>متوسط</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300"></div>
            <span>منخفض</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}