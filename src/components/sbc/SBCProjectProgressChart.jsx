import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const STAGE_COLORS = {
  design: "#6B5D4F",
  permits: "#C9A66B",
  foundation: "#E5D4B8",
  structure: "#4A3F35",
  finishing: "#8B7355",
  handover: "#2E8B57",
};

export default function SBCProjectProgressChart({ data }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-[#1a1a2e]">
          <BarChart3 className="w-5 h-5 text-[#C9A66B]" />
          التقدم الفعلي لكل مشروع حسب المرحلة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="name"
              angle={-35}
              textAnchor="end"
              interval={0}
              tick={{ fontSize: 11, fill: "#64748b" }}
              height={70}
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} unit="%" />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 13,
                direction: "rtl",
              }}
              formatter={(value, name) => [`${value}%`, name]}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            {["design", "permits", "foundation", "structure", "finishing", "handover"].map((stage) => (
              <Bar
                key={stage}
                dataKey={stage}
                name={STAGE_LABELS[stage]}
                stackId="progress"
                fill={STAGE_COLORS[stage]}
                radius={stage === "handover" ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const STAGE_LABELS = {
  design: "التصميم",
  permits: "التراخيص",
  foundation: "الأساسات",
  structure: "الهيكل",
  finishing: "التشطيب",
  handover: "التسليم",
};