import React from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

function MetricGauge({ label, value, unit = "%", max = 100, invert = false }) {
  const pct = Math.min(Math.max(value || 0, 0), max);
  const normalized = (pct / max) * 100;
  const isGood = invert ? normalized < 40 : normalized > 60;
  const isWarn = invert ? (normalized >= 40 && normalized < 70) : (normalized >= 30 && normalized <= 60);
  const color = isGood ? "bg-emerald-500" : isWarn ? "bg-orange-400" : "bg-red-500";
  const textColor = isGood ? "text-emerald-600" : isWarn ? "text-orange-500" : "text-red-600";

  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <span className={`text-sm font-bold ${textColor}`}>
          {typeof value === "number" ? value.toFixed(1) : value}{unit}
        </span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${normalized}%` }} />
      </div>
    </div>
  );
}

export default function RiskMetricsChart({ metrics }) {
  const radarData = [
    { subject: "الإنجاز", value: metrics.completion_rate || 0, fullMark: 100 },
    { subject: "الجدول الزمني", value: Math.max(metrics.schedule_health || 0, 0), fullMark: 100 },
    { subject: "الميزانية", value: 100 - Math.min(metrics.budget_utilization || 0, 100), fullMark: 100 },
    { subject: "المراحل", value: metrics.days_scheduled > 0 ? ((metrics.days_scheduled - metrics.days_elapsed) / metrics.days_scheduled) * 100 : 50, fullMark: 100 },
  ];

  const barData = [
    { name: "المهام المتأخرة", value: metrics.overdue_tasks || 0, fill: "#ef4444" },
    { name: "المراحل في الموعد", value: metrics.milestones_on_time || 0, fill: "#22c55e" },
    { name: "الأيام المتبقية", value: Math.max((metrics.days_scheduled || 0) - (metrics.days_elapsed || 0), 0), fill: "#3b82f6" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <MetricGauge label="نسبة الإنجاز" value={metrics.completion_rate} />
        <MetricGauge label="استخدام الميزانية" value={metrics.budget_utilization} invert />
        <MetricGauge label="صحة الجدول الزمني" value={Math.max(metrics.schedule_health || 0, 0)} />
        <MetricGauge
          label="تقدم الأيام"
          value={metrics.days_elapsed}
          unit={` / ${metrics.days_scheduled} يوم`}
          max={metrics.days_scheduled || 1}
          invert
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-xl border p-4">
          <p className="text-xs font-semibold text-slate-600 mb-3">مخطط الأداء العام</p>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#64748b" }} />
              <Radar name="المشروع" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-50 rounded-xl border p-4">
          <p className="text-xs font-semibold text-slate-600 mb-3">مؤشرات تفصيلية</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barSize={24}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v) => [v, "القيمة"]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}