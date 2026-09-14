import React from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle, Bell } from "lucide-react";

const stats = (total, analyzed, highRisk, alerts) => [
  {
    label: "إجمالي المشاريع النشطة",
    value: total,
    icon: ShieldCheck,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    label: "مشاريع محللة",
    value: `${analyzed}/${total}`,
    icon: ShieldAlert,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    label: "مخاطر عالية",
    value: highRisk,
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  {
    label: "تنبيهات حرجة",
    value: alerts,
    icon: Bell,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
];

export default function RiskOverviewStats({ totalProjects, analyzedCount, highRiskCount, criticalAlerts }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats(totalProjects, analyzedCount, highRiskCount, criticalAlerts).map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`bg-white rounded-xl p-4 border ${stat.border} flex items-center gap-3 shadow-sm`}
          >
            <div className={`p-2.5 rounded-lg ${stat.bg}`}>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}