import React from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar as RadarIcon } from "lucide-react";

const STAGE_LABELS = {
  design: "التصميم",
  permits: "التراخيص",
  foundation: "الأساسات",
  structure: "الهيكل",
  finishing: "التشطيب",
  handover: "التسليم",
};

export default function SBCPhaseRadarChart({ data }) {
  const radarData = Object.keys(STAGE_LABELS).map((stage) => ({
    stage: STAGE_LABELS[stage],
    progress: data[stage] || 0,
  }));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-[#1a1a2e]">
          <RadarIcon className="w-5 h-5 text-[#C9A66B]" />
          متوسط الإنجاز لكل مرحلة هندسية
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="stage" tick={{ fontSize: 12, fill: "#64748b" }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} angle={90} />
            <Radar
              name="متوسط الإنجاز"
              dataKey="progress"
              stroke="#C9A66B"
              fill="#C9A66B"
              fillOpacity={0.5}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13, direction: "rtl" }}
              formatter={(value) => [`${value.toFixed(0)}%`, "الإنجاز"]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}