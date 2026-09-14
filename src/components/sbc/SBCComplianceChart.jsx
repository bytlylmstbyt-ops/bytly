import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

const COLORS = {
  compliant: "#2E8B57",
  compliant_with_notes: "#C9A66B",
  non_compliant: "#DC2626",
  pending: "#94A3B8",
};

const LABELS = {
  compliant: "مطابق",
  compliant_with_notes: "مطابق بملاحظات",
  non_compliant: "غير مطابق",
  pending: "قيد المراجعة",
};

export default function SBCComplianceChart({ data }) {
  const chartData = Object.keys(LABELS).map((key) => ({
    name: LABELS[key],
    key,
    value: data[key] || 0,
  })).filter((d) => d.value > 0);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-[#1a1a2e]">
          <ShieldCheck className="w-5 h-5 text-[#C9A66B]" />
          توزيع مطابقة معايير SBC
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
            لا توجد بيانات مراجعة فنية بعد
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.key]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13, direction: "rtl" }}
                formatter={(value) => [`${value} مشروع`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}