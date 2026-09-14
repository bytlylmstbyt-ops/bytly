import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, TrendingUp, ShieldCheck, ClipboardCheck } from "lucide-react";

export default function SBCOverviewStats({ stats }) {
  const cards = [
    {
      label: "إجمالي المشاريع",
      value: stats.totalProjects,
      icon: Building2,
      color: "from-[#6B5D4F] to-[#C9A66B]",
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "متوسط الإنجاز",
      value: `${stats.avgProgress.toFixed(0)}%`,
      icon: TrendingUp,
      color: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "مطابقة SBC",
      value: `${stats.complianceRate.toFixed(0)}%`,
      icon: ShieldCheck,
      color: "from-amber-500 to-amber-600",
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "مراجعات معلّقة",
      value: stats.pendingReviews,
      icon: ClipboardCheck,
      color: "from-rose-500 to-rose-600",
      bg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">{c.label}</p>
                <p className="text-2xl font-bold text-[#1a1a2e]">{c.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center`}>
                <c.icon className={`w-6 h-6 ${c.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}