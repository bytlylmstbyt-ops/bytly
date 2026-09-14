import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";

const PriorityConfig = {
  urgent: {
    color: "bg-red-100 text-red-800 border-red-300",
    icon: AlertCircle,
    label: "عاجل",
    level: 4
  },
  high: {
    color: "bg-orange-100 text-orange-800 border-orange-300",
    icon: AlertTriangle,
    label: "مرتفع",
    level: 3
  },
  medium: {
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: Info,
    label: "متوسط",
    level: 2
  },
  low: {
    color: "bg-gray-100 text-gray-800 border-gray-300",
    icon: CheckCircle,
    label: "منخفض",
    level: 1
  }
};

export default function PriorityVisualizer({ priority, showLabel = true, size = "md" }) {
  const config = PriorityConfig[priority] || PriorityConfig.medium;
  const Icon = config.icon;

  const sizeClass = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  }[size];

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <Icon className={`${sizeClass} ${config.color.split(" ").slice(-1)[0]}`} />
        {/* Priority bar */}
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-50"></div>
      </div>
      {showLabel && (
        <Badge variant="outline" className={`text-xs border ${config.color}`}>
          {config.label}
        </Badge>
      )}
    </div>
  );
}

export function PriorityLegend() {
  return (
    <div className="space-y-2">
      {Object.entries(PriorityConfig).reverse().map(([key, config]) => {
        const Icon = config.icon;
        return (
          <div key={key} className="flex items-center gap-2 text-sm">
            <Icon className="w-4 h-4" style={{ color: config.color.split(" ")[2] }} />
            <span className="text-slate-600">{config.label}</span>
          </div>
        );
      })}
    </div>
  );
}