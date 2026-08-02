import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Zap, Star, Trophy, Loader2, Award, Gauge } from "lucide-react";

const avg = (arr) => arr.length ? arr.reduce((s, v) => s + Number(v || 0), 0) / arr.length : 0;
const fmt1 = (n) => Number(n || 0).toFixed(1);

export default function EngineerPerformancePanel() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ avgDelivery: 0, avgCustomer: 0, fastest: null, topRated: null });

  useEffect(() => {
    (async () => {
      try {
        const [engineers, reviews] = await Promise.all([
          base44.entities.Engineer.list("-created_date", 200),
          base44.entities.Review.list("-created_date", 200),
        ]);

        // Group reviews by engineer_id
        const reviewsByEng = {};
        reviews
          .filter((r) => r.target_type === "engineer" && r.engineer_id)
          .forEach((r) => {
            (reviewsByEng[r.engineer_id] ||= []).push(r);
          });

        const approved = engineers.filter((e) => e.status === "approved");

        const perf = approved.map((e) => {
          const engReviews = reviewsByEng[e.id] || [];
          const deliveryRatings = engReviews.map((r) => r.delivery_rating).filter((v) => v != null);
          const qualityRatings = engReviews.map((r) => r.quality_rating).filter((v) => v != null);
          const overallRatings = engReviews.map((r) => r.rating).filter((v) => v != null);

          const avgDelivery = avg(deliveryRatings);
          const avgQuality = avg(qualityRatings);
          const avgOverall = overallRatings.length ? avg(overallRatings) : Number(e.rating || 0);

          // Efficiency score: delivery (40%) + quality (30%) + customer overall (30%) — all /5
          const score = (avgDelivery * 0.4 + avgQuality * 0.3 + avgOverall * 0.3) * 20; // → /100

          return {
            id: e.id,
            name: e.full_name || "—",
            specialization: e.specialization || "",
            completed: Number(e.completed_projects || 0),
            totalReviews: overallRatings.length || Number(e.total_reviews || 0),
            avgDelivery,
            avgQuality,
            avgOverall,
            score: Number(score.toFixed(1)),
            hasReviews: engReviews.length > 0,
          };
        });

        // Only engineers with at least some signal (reviews or completed projects)
        const ranked = perf
          .filter((p) => p.hasReviews || p.completed > 0)
          .sort((a, b) => b.score - a.score);

        setRows(ranked);
        setChartData(ranked.slice(0, 8).map((p) => ({
          name: p.name.length > 14 ? p.name.slice(0, 12) + "…" : p.name,
          delivery: Number(fmt1(p.avgDelivery)),
          customer: Number(fmt1(p.avgOverall)),
          quality: Number(fmt1(p.avgQuality)),
        })));

        const withDelivery = ranked.filter((p) => p.avgDelivery > 0);
        const withCustomer = ranked.filter((p) => p.avgOverall > 0);
        const fastest = withDelivery.sort((a, b) => b.avgDelivery - a.avgDelivery)[0] || null;
        const topRated = withCustomer.sort((a, b) => b.avgOverall - a.avgOverall)[0] || null;

        setSummary({
          avgDelivery: avg(ranked.map((p) => p.avgDelivery)),
          avgCustomer: avg(ranked.map((p) => p.avgOverall)),
          fastest,
          topRated,
        });
      } catch (e) {
        console.error("EngineerPerformancePanel error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Card className="border-0 shadow-md mb-6">
        <CardContent className="p-8 flex items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">جارٍ تحليل أداء المهندسين...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md mb-6 overflow-hidden">
      <CardHeader className="bg-gradient-to-l from-[#2D2D4E] to-[#1A1A2E] text-white pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="w-5 h-5 text-[#C9A66B]" />
          أداء المهندسين — سرعة التسليم وتقييمات العملاء
        </CardTitle>
        <p className="text-xs text-slate-300 mt-1">ترتيب المهندسين حسب كفاءة التسليم وجودة العمل ورضا العملاء</p>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* ── Summary cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Gauge className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-[11px] font-medium text-slate-600">متوسط سرعة التسليم</span>
            </div>
            <p className="text-lg font-bold text-indigo-700">{fmt1(summary.avgDelivery)} <span className="text-[11px] font-normal">/5</span></p>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Star className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-[11px] font-medium text-slate-600">متوسط تقييم العملاء</span>
            </div>
            <p className="text-lg font-bold text-amber-700">{fmt1(summary.avgCustomer)} <span className="text-[11px] font-normal">/5</span></p>
          </div>

          <div className="bg-green-50 rounded-xl p-3 border border-green-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-[11px] font-medium text-slate-600">الأسرع تسليمًا</span>
            </div>
            <p className="text-sm font-bold text-green-700 truncate">{summary.fastest?.name || "—"}</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-[11px] font-medium text-slate-600">الأعلى تقييمًا</span>
            </div>
            <p className="text-sm font-bold text-purple-700 truncate">{summary.topRated?.name || "—"}</p>
          </div>
        </div>

        {/* ── Chart ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-100 p-3">
          <p className="text-xs font-semibold text-[#4A3F35] mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#C9A66B]" />
            أعلى المهندسين أداءً (من 5)
          </p>
          {chartData.length === 0 ? (
            <p className="text-center py-12 text-slate-400 text-sm">لا توجد بيانات كافية لعرض الأداء بعد</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #eee", fontSize: 12 }} formatter={(v) => `${v} / 5`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="delivery" name="سرعة التسليم" fill="#6366f1" radius={[0, 4, 4, 0]} />
                <Bar dataKey="customer" name="تقييم العملاء" fill="#C9A66B" radius={[0, 4, 4, 0]} />
                <Bar dataKey="quality" name="جودة العمل" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Ranked table ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-right p-2.5 font-semibold">#</th>
                  <th className="text-right p-2.5 font-semibold">المهندس</th>
                  <th className="text-center p-2.5 font-semibold">مكتمل</th>
                  <th className="text-center p-2.5 font-semibold">تقييمات</th>
                  <th className="text-center p-2.5 font-semibold">سرعة التسليم</th>
                  <th className="text-center p-2.5 font-semibold">جودة العمل</th>
                  <th className="text-center p-2.5 font-semibold">رضا العملاء</th>
                  <th className="text-center p-2.5 font-semibold">نقاط الكفاءة</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={8} className="text-center p-6 text-slate-400">لا يوجد مهندسون ببيانات أداء بعد</td></tr>
                ) : rows.slice(0, 10).map((r, i) => (
                  <tr key={r.id} className={i < 3 ? "bg-amber-50/40" : ""}>
                    <td className="p-2.5">
                      {i === 0 ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-white text-[10px] font-bold">1</span>
                       : i === 1 ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-300 text-white text-[10px] font-bold">2</span>
                       : i === 2 ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-300 text-white text-[10px] font-bold">3</span>
                       : <span className="text-slate-400">{i + 1}</span>}
                    </td>
                    <td className="p-2.5">
                      <p className="font-semibold text-[#4A3F35]">{r.name}</p>
                      {r.specialization && <p className="text-[10px] text-slate-400">{r.specialization}</p>}
                    </td>
                    <td className="p-2.5 text-center font-medium">{r.completed}</td>
                    <td className="p-2.5 text-center text-slate-500">{r.totalReviews}</td>
                    <td className="p-2.5 text-center">
                      {r.avgDelivery > 0 ? <span className="font-bold text-indigo-600">{fmt1(r.avgDelivery)}</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="p-2.5 text-center">
                      {r.avgQuality > 0 ? <span className="font-bold text-green-600">{fmt1(r.avgQuality)}</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="p-2.5 text-center">
                      {r.avgOverall > 0 ? <span className="font-bold text-amber-600">{fmt1(r.avgOverall)}</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="p-2.5 text-center">
                      <Badge className={r.score >= 80 ? "bg-green-100 text-green-700 border-0" : r.score >= 60 ? "bg-amber-100 text-amber-700 border-0" : "bg-slate-100 text-slate-600 border-0"}>
                        {r.score}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}