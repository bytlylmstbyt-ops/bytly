import React from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const DAYS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function getColor(count, max) {
  if (!count) return "bg-slate-100";
  const pct = count / max;
  if (pct < 0.25) return "bg-purple-200";
  if (pct < 0.5) return "bg-purple-400";
  if (pct < 0.75) return "bg-purple-600";
  return "bg-purple-800";
}

export default function HeatmapChart({ tasks }) {
  // Build a map of date -> count for the past 365 days
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 364);

  const countMap = {};
  tasks.forEach(t => {
    if (!t.created_date) return;
    const d = new Date(t.created_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    countMap[key] = (countMap[key] || 0) + 1;
  });

  const maxCount = Math.max(1, ...Object.values(countMap));

  // Build weeks array
  const weeks = [];
  let current = new Date(start);
  // align to Sunday
  current.setDate(current.getDate() - current.getDay());

  while (current <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
      const inRange = current >= start && current <= today;
      week.push({ date: new Date(current), key: dateKey, count: countMap[dateKey] || 0, inRange });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  // Month labels
  const monthLabels = [];
  weeks.forEach((week, wi) => {
    const firstDay = week.find(d => d.inRange);
    if (!firstDay) return;
    const d = firstDay.date;
    if (d.getDate() <= 7) {
      const prev = monthLabels[monthLabels.length - 1];
      if (!prev || prev.month !== d.getMonth()) {
        monthLabels.push({ week: wi, month: d.getMonth(), label: MONTHS[d.getMonth()] });
      }
    }
  });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-1 relative" style={{ marginRight: "28px" }}>
            {weeks.map((_, wi) => {
              const ml = monthLabels.find(m => m.week === wi);
              return (
                <div key={wi} className="w-3 mx-px flex-shrink-0 text-[9px] text-slate-400">
                  {ml ? ml.label : ""}
                </div>
              );
            })}
          </div>

          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col ml-1 gap-px">
              {DAYS.map((day, i) => (
                <div key={i} className="h-3 text-[9px] text-slate-400 flex items-center w-6 justify-end pr-1">
                  {i % 2 === 0 ? day.slice(0, 3) : ""}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="flex gap-px">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-px">
                  {week.map((day, di) => (
                    <Tooltip key={di}>
                      <TooltipTrigger asChild>
                        <div
                          className={`w-3 h-3 rounded-sm cursor-default ${
                            day.inRange ? getColor(day.count, maxCount) : "bg-transparent"
                          }`}
                        />
                      </TooltipTrigger>
                      {day.inRange && (
                        <TooltipContent side="top" className="text-xs">
                          <p>{day.date.toLocaleDateString("ar-SA")} — {day.count} مهمة</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-2 justify-end text-xs text-slate-400">
            <span>أقل</span>
            {["bg-slate-100", "bg-purple-200", "bg-purple-400", "bg-purple-600", "bg-purple-800"].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span>أكثر</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}