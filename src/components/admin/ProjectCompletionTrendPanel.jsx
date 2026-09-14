import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Activity, CheckCircle2, TrendingUp, Loader2, Gauge } from "lucide-react";

const MONTH_NAMES = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (key) => {
  const [y, m] = key.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y.slice(2)}`;
};

export default function ProjectCompletionTrendPanel() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState({ total: 0, completed: 0, completionRate: 0, completedThisMonth: 0, avgMonthly: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [projects, logs] = await Promise.all([
          base44.entities.Project.list(),
          base44.entities.TaskActivityLog.list("-created_date", 200),
        ]);

        // Monthly completion buckets (last 8 months)
        const now = new Date();
        const buckets = {};
        for (let i = 7; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const k = monthKey(d);
          buckets[k] = { key: k, label: monthLabel(k), completed: 0 };
        }

        // Count project status changes to "completed" per month (from activity logs)
        logs.forEach((l) => {
          if (l.action_type !== "status_changed") return;
          if (l.new_value !== "completed" && l.new_value !== "مكتمل") return;
          if (!l.project_id) return;
          const d = l.created_date ? new Date(l.created_date) : null;
          if (!d) return;
          const k = monthKey(d);
          if (buckets[k]) buckets[k].completed += 1;
        });

        const arr = Object.values(buckets);
        let cumulative = 0;
        const withCumulative = arr.map((b) => {
          cumulative += b.completed;
          const completionRate = projects.length > 0 ? (cumulative / projects.length) * 100 : 0;
          return { ...b, cumulative, completionRate: Number(completionRate.toFixed(1)) };
        });

        const total = projects.length;
        const completed = projects.filter((p) => p.status === "completed").length;
        const completionRate = total > 0 ? (completed / total) * 100 : 0;
        const nowKey = monthKey(now);
        const completedThisMonth = buckets[nowKey]?.completed || 0;
        const monthsWithData = arr.filter((b) => b.completed > 0).length || 1;
        const avgMonthly = arr.reduce((s, b) => s + b.completed, 0) / monthsWithData;

        setChartData(withCumulative);
        setSummary({ total, completed, completionRate, completedThisMonth, avgMonthly });
      } catch (e) {
        console.error("ProjectCompletionTrendPanel error:", e);
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
          <span className="text-sm">جارٍ تحميل وتيرة إنجاز المشاريع...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md mb-6 overflow-hidden">
      <CardHeader className="bg-gradient-to-l from-[#6B5D4F] to-[#4A3F35] text-white pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-5 h-5 text-[#C9A66B]" />
          وتيرة إنجاز المشاريع بمرور الوقت
        </CardTitle>
        <p className="text-xs text-slate-300 mt-1">عدد المشاريع المكتملة شهريًا ونسبة الإنجاز التراكمية لمراقبة سرعة العمل</p>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* ── Summary cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center">
                <Activity className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-[11px] font-medium text-slate-600">إجمالي المشاريع</span>
            </div>
            <p className="text-lg font-bold text-[#4A3F35]">{summary.total}</p>
          </div>

          <div className="bg-green-50 rounded-xl p-3 border border-green-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-[11px] font-medium text-slate-600">المشاريع المكتملة</span>
            </div>
            <p className="text-lg font-bold text-green-700">{summary.completed}</p>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Gauge className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-[11px] font-medium text-slate-600">نسبة الإنجاز الكلية</span>
            </div>
            <p className="text-lg font-bold text-amber-700">{summary.completionRate.toFixed(1)}%</p>
          </div>

          <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-[11px] font-medium text-slate-600">المتوسط الشهري للإكمال</span>
            </div>
            <p className="text-lg font-bold text-indigo-700">{summary.avgMonthly.toFixed(1)} <span className="text-[11px] font-normal">مشروع/شهر</span></p>
          </div>
        </div>

        {/* ── Trend chart ──────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-100 p-3">
          <p className="text-xs font-semibold text-[#4A3F35] mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#C9A66B]" />
            الإنجاز الشهري والنسبة التراكمية
          </p>
          {chartData.every((d) => d.completed === 0) ? (
            <p className="text-center py-12 text-slate-400 text-sm">لا توجد بيانات إنجاز مسجلة بعد</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #eee", fontSize: 12 }}
                  formatter={(v, name) => name === "نسبة الإنجاز التراكمية" ? `${v}%` : v}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="completed" name="مكتمل هذا الشهر" fill="#C9A66B" radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="cumulative" name="تراكمي مكتمل" stroke="#6B5D4F" strokeWidth={2} dot={{ fill: "#6B5D4F", r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="completionRate" name="نسبة الإنجاز التراكمية" stroke="#16a34a" strokeWidth={2} strokeDasharray="5 4" dot={{ fill: "#16a34a", r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Pace note ───────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5">
          <TrendingUp className="w-4 h-4 text-[#C9A66B] shrink-0" />
          {summary.completedThisMonth > 0 ? (
            <span>أُكمل <strong className="text-[#4A3F35]">{summary.completedThisMonth}</strong> مشروع هذا الشهر، بمتوسط <strong className="text-[#4A3F35]">{summary.avgMonthly.toFixed(1)}</strong> مشروع شهريًا خلال آخر 8 أشهر.</span>
          ) : (
            <span>لم يُسجَّل إنجاز مشاريع هذا الشهر بعد. المتوسط الشهري خلال آخر 8 أشهر: <strong className="text-[#4A3F35]">{summary.avgMonthly.toFixed(1)}</strong> مشروع.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}