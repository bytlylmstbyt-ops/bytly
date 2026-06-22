import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Activity, RefreshCw, Users, TrendingUp } from "lucide-react";
import moment from "moment";

export default function DailyActiveUsersPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await base44.entities.AnalyticsDailyActiveUser.list("-date", 90);
      const sorted = (records || []).sort((a, b) => new Date(a.date) - new Date(b.date));
      setData(sorted);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await base44.functions.invoke("fetchDailyActiveUsers", { days: 30 });
      setSyncResult(res.data);
      await fetchData();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setSyncing(false);
  };

  const chartData = data.map(d => ({
    name: moment(d.date).format("DD/MM"),
    active: d.active_users || 0,
    new: d.new_users || 0,
    sessions: d.sessions || 0
  }));

  const today = data.length > 0 ? data[data.length - 1] : null;
  const yesterday = data.length > 1 ? data[data.length - 2] : null;
  const avgActive = data.length > 0 ? Math.round(data.reduce((s, d) => s + (d.active_users || 0), 0) / data.length) : 0;
  const totalNew = data.reduce((s, d) => s + (d.new_users || 0), 0);
  const trend = today && yesterday ? Math.round(((today.active_users - yesterday.active_users) / Math.max(yesterday.active_users, 1)) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-[#C9A66B] rounded-full" />
          <h2 className="text-base font-bold text-[#4A3F35]">المستخدمون النشطون يومياً (Google Analytics)</h2>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncing}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          مزامنة من Google Analytics
        </Button>
      </div>

      {syncResult && (
        <div className="bg-green-50 text-green-700 text-xs rounded-lg px-3 py-2 border border-green-200">
          ✅ تمت المزامنة: {syncResult.new_records} سجل جديد، {syncResult.updated_records} سجل محدّث
          {syncResult.property_name && ` — ${syncResult.property_name}`}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 text-xs rounded-lg px-3 py-2 border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-r-4 border-[#C9A66B]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">مستخدمو اليوم</p>
                {loading
                  ? <div className="h-7 w-16 bg-slate-100 rounded animate-pulse" />
                  : <p className="text-2xl font-bold text-[#4A3F35]">{(today?.active_users || 0).toLocaleString("ar-SA")}</p>}
              </div>
              <div className="p-2 rounded-lg bg-[#FEF9EE]">
                <Users className="w-5 h-5 text-[#C9A66B]" />
              </div>
            </div>
            {today && yesterday && (
              <span className={`text-xs font-semibold flex items-center gap-0.5 mt-1 ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
                <TrendingUp className={`w-3 h-3 ${trend < 0 ? "rotate-180" : ""}`} />
                {Math.abs(trend)}% عن الأمس
              </span>
            )}
          </CardContent>
        </Card>

        <Card className="border-r-4 border-blue-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">المتوسط اليومي</p>
                {loading
                  ? <div className="h-7 w-16 bg-slate-100 rounded animate-pulse" />
                  : <p className="text-2xl font-bold text-[#4A3F35]">{avgActive.toLocaleString("ar-SA")}</p>}
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">آخر {data.length} يوم</p>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-green-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">مستخدمون جدد</p>
                {loading
                  ? <div className="h-7 w-16 bg-slate-100 rounded animate-pulse" />
                  : <p className="text-2xl font-bold text-[#4A3F35]">{totalNew.toLocaleString("ar-SA")}</p>}
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">إجمالي الفترة</p>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-purple-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">جلسات اليوم</p>
                {loading
                  ? <div className="h-7 w-16 bg-slate-100 rounded animate-pulse" />
                  : <p className="text-2xl font-bold text-[#4A3F35]">{(today?.sessions || 0).toLocaleString("ar-SA")}</p>}
              </div>
              <div className="p-2 rounded-lg bg-purple-50">
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">{today?.page_views || 0} مشاهدة صفحة</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#4A3F35]">المستخدمون النشطون والجدد (آخر {data.length} يوم)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading
            ? <div className="h-56 bg-slate-100 rounded animate-pulse" />
            : data.length === 0
              ? <div className="h-56 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
                  <p>لا توجد بيانات بعد — اضغط "مزامنة من Google Analytics" لجلب البيانات</p>
                </div>
              : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C9A66B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#C9A66B" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="active" name="نشطون" stroke="#C9A66B" fill="url(#activeGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="new" name="جدد" stroke="#3B82F6" fill="url(#newGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )
          }
        </CardContent>
      </Card>
    </div>
  );
}