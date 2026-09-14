import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, CheckCircle, Clock, TrendingUp, UserCheck, FileText, Star } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";
import moment from "moment";

const fmt = (n) => (n || 0).toLocaleString("ar-SA");

function KpiCard({ title, value, sub, icon: Icon, color = "#C9A66B", loading }) {
  return (
    <Card className="border-r-4 hover:shadow-md transition-shadow" style={{ borderColor: color }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 mb-1 truncate">{title}</p>
            {loading
              ? <div className="h-7 w-20 bg-slate-100 rounded animate-pulse" />
              : <p className="text-2xl font-bold text-[#4A3F35] leading-tight">{value}</p>
            }
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: color + "15" }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LaunchOverviewStats({ engineers, projects, surveyResponses, loading }) {
  const stats = useMemo(() => {
    const totalEngineers = engineers.length;
    const approvedEngineers = engineers.filter(e => e.status === "approved").length;
    const pendingEngineers = engineers.filter(e => e.status === "pending").length;
    const verifiedEngineers = engineers.filter(e => e.is_verified).length;

    const totalProjects = projects.length;
    const openProjects = projects.filter(p => p.status === "open").length;
    const inProgressProjects = projects.filter(p => p.status === "in_progress").length;
    const completedProjects = projects.filter(p => p.status === "completed").length;

    const totalSurveys = surveyResponses.length;
    const veryInterested = surveyResponses.filter(s => s.platform_interest === "very_interested").length;
    const avgRating = totalSurveys > 0
      ? (surveyResponses.reduce((sum, s) => sum + (s.concept_rating || 0), 0) / totalSurveys).toFixed(1)
      : "–";

    // Growth over last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = moment().subtract(i, "days");
      const dayEngineers = engineers.filter(e => moment(e.created_date).isSame(day, "day")).length;
      const dayProjects = projects.filter(p => moment(p.created_date).isSame(day, "day")).length;
      last7Days.push({
        name: day.format("dddd"),
        مهندسون: dayEngineers,
        مشاريع: dayProjects,
      });
    }

    // Engineer by type
    const typeLabels = {
      engineer: "مهندس تصميم",
      architect: "معماري",
      painter: "رسام",
      civil: "مهندس مدني"
    };
    const typeCounts = {};
    engineers.forEach(e => {
      const key = typeLabels[e.user_type] || e.user_type || "أخرى";
      typeCounts[key] = (typeCounts[key] || 0) + 1;
    });
    const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

    // Project by category
    const catLabels = {
      interior: "تصميم داخلي",
      architecture: "عمارة",
      painting: "دهانات",
      landscape: "تنسيق",
      furniture: "أثاث",
      lighting: "إضاءة"
    };
    const catCounts = {};
    projects.forEach(p => {
      const key = catLabels[p.category] || p.category || "أخرى";
      catCounts[key] = (catCounts[key] || 0) + 1;
    });
    const catData = Object.entries(catCounts).map(([name, value]) => ({ name, value }));

    return {
      totalEngineers, approvedEngineers, pendingEngineers, verifiedEngineers,
      totalProjects, openProjects, inProgressProjects, completedProjects,
      totalSurveys, veryInterested, avgRating,
      last7Days, typeData, catData,
    };
  }, [engineers, projects, surveyResponses]);

  return (
    <div className="space-y-6">
      {/* KPI Cards – Engineers */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-[#C9A66B] rounded-full" />
          <h2 className="text-base font-bold text-[#4A3F35]">المهندسون المسجلون</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard title="إجمالي المهندسين" value={fmt(stats.totalEngineers)} sub="مسجلون في المنصة" icon={Users} color="#8B5CF6" loading={loading} />
          <KpiCard title="مهندسون معتمدون" value={fmt(stats.approvedEngineers)} sub="تمت الموافقة عليهم" icon={CheckCircle} color="#22C55E" loading={loading} />
          <KpiCard title="بانتظار المراجعة" value={fmt(stats.pendingEngineers)} sub="طلبات جديدة" icon={Clock} color="#F59E0B" loading={loading} />
          <KpiCard title="مهندسون موثقون" value={fmt(stats.verifiedEngineers)} sub="تم التحقق من وثائقهم" icon={UserCheck} color="#3B82F6" loading={loading} />
        </div>
      </div>

      {/* KPI Cards – Projects */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-[#C9A66B] rounded-full" />
          <h2 className="text-base font-bold text-[#4A3F35]">المشاريع المطروحة</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard title="إجمالي المشاريع" value={fmt(stats.totalProjects)} sub="منذ الإطلاق" icon={Briefcase} color="#C9A66B" loading={loading} />
          <KpiCard title="مشاريع مفتوحة" value={fmt(stats.openProjects)} sub="بانتظار عروض" icon={FileText} color="#3B82F6" loading={loading} />
          <KpiCard title="قيد التنفيذ" value={fmt(stats.inProgressProjects)} sub="مشاريع نشطة" icon={TrendingUp} color="#8B5CF6" loading={loading} />
          <KpiCard title="مكتملة" value={fmt(stats.completedProjects)} sub="تم تسليمها" icon={CheckCircle} color="#22C55E" loading={loading} />
        </div>
      </div>

      {/* KPI Cards – Survey Feedback */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-[#C9A66B] rounded-full" />
          <h2 className="text-base font-bold text-[#4A3F35]">ردود استطلاع الإطلاق</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiCard title="إجمالي الردود" value={fmt(stats.totalSurveys)} sub="مشاركون في الاستطلاع" icon={FileText} color="#C9A66B" loading={loading} />
          <KpiCard title="مهتمون جداً" value={fmt(stats.veryInterested)} sub="بانتظار الإطلاق" icon={Star} color="#22C55E" loading={loading} />
          <KpiCard title="متوسط تقييم الفكرة" value={`${stats.avgRating} / 5`} sub="تقييم مفهوم المنصة" icon={Star} color="#F59E0B" loading={loading} />
        </div>
      </div>

      {/* Growth Chart – 7 Days */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#4A3F35]">نمو التسجيلات (آخر 7 أيام)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading
            ? <div className="h-48 bg-slate-100 rounded animate-pulse" />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.last7Days} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A66B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C9A66B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="مهندسون" stroke="#8B5CF6" fill="url(#engGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="مشاريع" stroke="#C9A66B" fill="url(#projGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </CardContent>
      </Card>

      {/* Two bar charts side by side */}
      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#4A3F35]">توزيع المهندسين حسب التخصص</CardTitle>
          </CardHeader>
          <CardContent>
            {loading
              ? <div className="h-40 bg-slate-100 rounded animate-pulse" />
              : stats.typeData.length === 0
                ? <div className="h-40 flex items-center justify-center text-slate-400 text-sm">لا توجد بيانات</div>
                : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={stats.typeData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#4A3F35]">توزيع المشاريع حسب التصنيف</CardTitle>
          </CardHeader>
          <CardContent>
            {loading
              ? <div className="h-40 bg-slate-100 rounded animate-pulse" />
              : stats.catData.length === 0
                ? <div className="h-40 flex items-center justify-center text-slate-400 text-sm">لا توجد بيانات</div>
                : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={stats.catData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#C9A66B" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}