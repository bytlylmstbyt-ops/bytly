import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Award, Star } from "lucide-react";

const CRITERIA_KEYS = [
  { key: "quality_rating",        label: "الجودة" },
  { key: "delivery_rating",       label: "الوقت" },
  { key: "communication_rating",  label: "التواصل" },
  { key: "professionalism_rating",label: "الاحترافية" },
];

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-sm" dir="rtl">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value?.toFixed(1)}</p>
      ))}
    </div>
  );
};

export default function EngineerPerformanceCharts({ reviews }) {
  const avgCriteria = useMemo(() => {
    if (!reviews.length) return [];
    return CRITERIA_KEYS.map(c => ({
      subject: c.label,
      value: +(reviews.reduce((s, r) => s + (r[c.key] || r.rating || 0), 0) / reviews.length).toFixed(1),
      fullMark: 5,
    }));
  }, [reviews]);

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months = {};
    reviews.forEach(r => {
      const d = new Date(r.created_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!months[key]) months[key] = { month: key, ratings: [], quality: [], communication: [], delivery: [] };
      months[key].ratings.push(r.rating || 0);
      months[key].quality.push(r.quality_rating || 0);
      months[key].communication.push(r.communication_rating || 0);
      months[key].delivery.push(r.delivery_rating || 0);
    });
    const avg = arr => arr.length ? +(arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) : 0;
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, v]) => ({
        month: key.slice(5) + "/" + key.slice(0, 4),
        "التقييم العام": avg(v.ratings),
        "الجودة": avg(v.quality),
        "التواصل": avg(v.communication),
        "الوقت": avg(v.delivery),
      }));
  }, [reviews]);

  // Bar chart distribution 1-5
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach(r => { const i = Math.round(r.rating || 0); if (i >= 1 && i <= 5) counts[i - 1]++; });
    return counts.map((c, i) => ({ stars: `${i + 1} ★`, count: c, pct: reviews.length ? Math.round((c / reviews.length) * 100) : 0 }));
  }, [reviews]);

  const overallAvg = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : 0;

  if (!reviews.length) return (
    <div className="text-center py-12 text-slate-400">
      <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
      <p>لا توجد تقييمات بعد</p>
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-[#1a1a2e] to-[#2d2d4e] text-white">
          <CardContent className="p-4 text-center">
            <p className="text-white/60 text-xs mb-1">التقييم العام</p>
            <p className="text-3xl font-bold text-[#C9A66B]">{overallAvg}</p>
            <div className="flex justify-center gap-0.5 mt-1">
              {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= Math.round(overallAvg) ? "text-[#C9A66B] fill-[#C9A66B]" : "text-white/20"}`} />)}
            </div>
          </CardContent>
        </Card>
        {CRITERIA_KEYS.map((c, i) => (
          <Card key={c.key} style={{ borderTopColor: COLORS[i], borderTopWidth: 3 }}>
            <CardContent className="p-4 text-center">
              <p className="text-slate-400 text-xs mb-1">{c.label}</p>
              <p className="text-2xl font-bold" style={{ color: COLORS[i] }}>
                {avgCriteria[i]?.value || "—"}
              </p>
              <p className="text-xs text-slate-400">/ 5</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1a1a2e]">
            <Award className="w-5 h-5 text-[#C9A66B]" />
            مخطط الأداء المهني
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={avgCriteria}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13, fill: "#475569", fontFamily: "inherit" }} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} tickCount={6} />
              <Radar name="المهندس" dataKey="value" stroke="#C9A66B" fill="#C9A66B" fillOpacity={0.35} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Trend Line Chart */}
      {monthlyTrend.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1a1a2e]">
              <TrendingUp className="w-5 h-5 text-[#C9A66B]" />
              تطور الأداء عبر الزمن
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "#94a3b8" }} tickCount={6} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, direction: "rtl" }} />
                {["التقييم العام", "الجودة", "التواصل", "الوقت"].map((k, i) => (
                  <Line key={k} type="monotone" dataKey={k} stroke={["#C9A66B", "#10b981", "#8b5cf6", "#3b82f6"][i]}
                    strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Distribution Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#1a1a2e] flex items-center gap-2">
            <Star className="w-5 h-5 text-[#C9A66B]" />
            توزيع التقييمات ({reviews.length} تقييم)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...distribution].reverse().map((d, i) => (
              <div key={d.stars} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-8 text-left">{d.stars}</span>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${d.pct}%` }} transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="h-full rounded-full" style={{ backgroundColor: ["#ef4444","#f59e0b","#eab308","#10b981","#10b981"][4 - i] }} />
                </div>
                <span className="text-xs text-slate-400 w-10">{d.pct}%</span>
                <span className="text-xs text-slate-500 w-6">{d.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}