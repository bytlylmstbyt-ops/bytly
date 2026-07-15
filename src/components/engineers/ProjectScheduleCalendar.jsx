import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, CalendarDays, Flag, Rocket, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const WEEK_DAYS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

function toDateStr(date) {
  return date.toISOString().split("T")[0];
}

function daysBetween(d1, d2) {
  const diff = new Date(d2).getTime() - new Date(d1).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ProjectScheduleCalendar({ engineerId, clientId }) {
  const [projects, setProjects] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!engineerId && !clientId) return;
    loadData();
  }, [engineerId, clientId]);

  const loadData = async () => {
    try {
      const filter = engineerId
        ? { assigned_engineer_id: engineerId }
        : { client_id: clientId };
      const projectsData = await base44.entities.Project.filter(filter);
      setProjects(projectsData);

      // Fetch contracts for these projects to get start_date and delivery_date
      if (projectsData.length > 0) {
        const contractPromises = projectsData.map(p =>
          base44.entities.Contract.filter({ project_id: p.id }).catch(() => [])
        );
        const contractResults = await Promise.all(contractPromises);
        const allContracts = contractResults.flat();
        setContracts(allContracts);
      }
    } catch (e) {
      console.error("Error loading project schedule:", e);
    } finally {
      setLoading(false);
    }
  };

  // Build a map of date → events
  const eventMap = useMemo(() => {
    const map = {};
    const addEvent = (dateStr, event) => {
      if (!dateStr) return;
      const key = dateStr;
      if (!map[key]) map[key] = [];
      map[key].push(event);
    };

    projects.forEach(p => {
      // Find the contract for this project (for start/delivery dates)
      const contract = contracts.find(c => c.project_id === p.id);
      const startDate = contract?.start_date || null;
      const deliveryDate = contract?.delivery_date || p.deadline || null;

      if (startDate) {
        addEvent(startDate, {
          type: "start",
          projectTitle: p.title,
          projectId: p.id,
          status: p.status,
          date: startDate
        });
      }
      if (deliveryDate) {
        addEvent(deliveryDate, {
          type: "delivery",
          projectTitle: p.title,
          projectId: p.id,
          status: p.status,
          date: deliveryDate
        });
      }
    });

    return map;
  }, [projects, contracts]);

  // Upcoming deadlines (sorted, next 30 days)
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const items = [];

    projects.forEach(p => {
      const contract = contracts.find(c => c.project_id === p.id);
      const startDate = contract?.start_date || null;
      const deliveryDate = contract?.delivery_date || p.deadline || null;

      if (deliveryDate && p.status !== "completed" && p.status !== "cancelled") {
        const days = daysBetween(now, deliveryDate);
        if (days >= -7 && days <= 60) {
          items.push({
            projectTitle: p.title,
            projectId: p.id,
            status: p.status,
            startDate,
            deliveryDate,
            daysRemaining: days
          });
        }
      }
    });

    return items.sort((a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate));
  }, [projects, contracts]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];
    // Leading blanks
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    // Trailing blanks to complete the grid
    while (days.length % 7 !== 0) days.push(null);

    return days;
  }, [currentMonth]);

  const todayStr = toDateStr(new Date());

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getDaysLabel = (days) => {
    if (days < 0) return `متأخر ${Math.abs(days)} يوم`;
    if (days === 0) return "اليوم";
    if (days === 1) return "غداً";
    return `باقي ${days} يوم`;
  };

  const getDeadlineColor = (days) => {
    if (days < 0) return "text-red-600 bg-red-50 border-red-200";
    if (days <= 3) return "text-orange-600 bg-orange-50 border-orange-200";
    if (days <= 7) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-slate-600 bg-slate-50 border-slate-200";
  };

  if (loading) {
    return (
      <Card className="border-[#C9A66B]/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#C9A66B]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Card */}
      <Card className="border-[#C9A66B]/20 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg text-[#4A3F35]">
              <CalendarDays className="w-5 h-5 text-[#C9A66B]" />
              تقويم المشاريع
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-sm font-semibold text-slate-700 min-w-[100px] text-center">
                {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              بدء المشروع
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              موعد التسليم
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEK_DAYS.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-slate-400 py-1">
                {day}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, idx) => {
              if (!date) return <div key={idx} className="min-h-[64px]" />;
              const dateStr = toDateStr(date);
              const events = eventMap[dateStr] || [];
              const isToday = dateStr === todayStr;

              return (
                <div
                  key={idx}
                  className={`min-h-[64px] p-1 rounded-lg border transition-colors ${
                    isToday ? "border-[#C9A66B] bg-[#C9A66B]/5" : "border-slate-100"
                  } ${events.length > 0 ? "bg-slate-50" : ""}`}
                >
                  <span className={`text-xs ${isToday ? "font-bold text-[#C9A66B]" : "text-slate-400"}`}>
                    {date.getDate()}
                  </span>
                  <div className="space-y-0.5 mt-0.5">
                    {events.slice(0, 2).map((ev, i) => (
                      <Link
                        key={i}
                        to={`/ProjectDetails?id=${ev.projectId}`}
                        className={`block text-[10px] leading-tight px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${
                          ev.type === "start"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                        title={`${ev.type === "start" ? "بدء" : "تسليم"}: ${ev.projectTitle}`}
                      >
                        {ev.type === "start" ? "▶" : "🏁"} {ev.projectTitle}
                      </Link>
                    ))}
                    {events.length > 2 && (
                      <span className="text-[10px] text-slate-400 px-1">
                        +{events.length - 2} أخرى
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card className="border-[#C9A66B]/20 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-[#4A3F35]">
            <Flag className="w-5 h-5 text-[#C9A66B]" />
            المواعيد القادمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingDeadlines.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              لا توجد مشاريع بمواعيد قريبة
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingDeadlines.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Link
                    to={`/ProjectDetails?id=${item.projectId}`}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${getDeadlineColor(item.daysRemaining)} hover:shadow-sm transition-all`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                        item.daysRemaining < 0 ? "bg-red-100" : item.daysRemaining <= 3 ? "bg-orange-100" : "bg-amber-100"
                      }`}>
                        {item.daysRemaining < 0 ? (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        ) : (
                          <Rocket className="w-4 h-4 text-[#C9A66B]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {item.projectTitle}
                        </p>
                        <p className="text-xs text-slate-500">
                          التسليم: {new Date(item.deliveryDate).toLocaleDateString("ar-SA", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`shrink-0 ${getDeadlineColor(item.daysRemaining)}`}>
                      {getDaysLabel(item.daysRemaining)}
                    </Badge>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}