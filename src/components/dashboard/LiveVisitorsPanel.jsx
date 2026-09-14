import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Radio, Users, Globe, MapPin, FileText, Mail,
  RefreshCw, Activity, Clock
} from "lucide-react";
import moment from "moment";

export default function LiveVisitorsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("fetchRealtimeVisitors", {});
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const ga = data?.ga || { active_users: 0, pages: [], sources: [], cities: [] };
  const loggedIn = data?.logged_in_users || [];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-green-500 rounded-full animate-pulse" />
          <h2 className="text-base font-bold text-[#4A3F35]">الزوار المباشرون الآن</h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            مباشر
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {moment(lastUpdate).format("HH:mm:ss")}
          </span>
          <Button onClick={fetchData} disabled={loading} variant="outline" size="sm" className="text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-xs rounded-lg px-3 py-2 border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="border-r-4 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">زوار مباشرون (GA)</p>
                {loading && !data
                  ? <div className="h-7 w-16 bg-slate-100 rounded animate-pulse" />
                  : <p className="text-2xl font-bold text-green-600">{(ga.active_users || 0).toLocaleString("ar-SA")}</p>}
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <Radio className="w-5 h-5 text-green-500 animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">من Google Analytics</p>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-[#C9A66B]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">مستخدمون مسجلون نشطون</p>
                {loading && !data
                  ? <div className="h-7 w-16 bg-slate-100 rounded animate-pulse" />
                  : <p className="text-2xl font-bold text-[#4A3F35]">{(data?.logged_in_count || 0).toLocaleString("ar-SA")}</p>}
              </div>
              <div className="p-2 rounded-lg bg-[#FEF9EE]">
                <Users className="w-5 h-5 text-[#C9A66B]" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">آخر 3 دقائق</p>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-blue-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">إجمالي الزوار</p>
                {loading && !data
                  ? <div className="h-7 w-16 bg-slate-100 rounded animate-pulse" />
                  : <p className="text-2xl font-bold text-[#4A3F35]">{((ga.active_users || 0) + (data?.logged_in_count || 0)).toLocaleString("ar-SA")}</p>}
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">مباشر + مسجل</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* المستخدمون المسجلون النشطون مع الإيميلات */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#C9A66B]" />
              المستخدمون المسجلون النشطون ({loggedIn.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loggedIn.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                لا يوجد مستخدمون مسجلون نشطون الآن
              </div>
            ) : (
              <div className="divide-y max-h-72 overflow-y-auto">
                {loggedIn.map((u, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {u.name?.charAt(0) || u.email?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#4A3F35] truncate">{u.name || "بدون اسم"}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-[10px] text-slate-400">{moment(u.last_active_at).fromNow()}</p>
                      {u.current_page && (
                        <p className="text-[10px] text-[#C9A66B] truncate max-w-[100px]">{u.current_page}</p>
                      )}
                    </div>
                    <span className="w-2 h-2 bg-green-500 rounded-full shrink-0 animate-pulse" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* الصفحات المُشاهَدة الآن */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#C9A66B]" />
              الصفحات المُشاهَدة الآن
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ga.pages.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">لا توجد بيانات</div>
            ) : (
              <div className="divide-y max-h-72 overflow-y-auto">
                {ga.pages.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50">
                    <span className="text-sm text-slate-600 truncate flex-1">{p.page}</span>
                    <Badge className="bg-green-100 text-green-700 ml-2">{p.users}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* مصادر الزيارة والمدن */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#C9A66B]" />
              مصادر الزيارة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ga.sources.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">لا توجد بيانات</div>
            ) : (
              <div className="divide-y">
                {ga.sources.map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50">
                    <span className="text-sm text-slate-600">{s.source}</span>
                    <Badge className="bg-blue-100 text-blue-700">{s.users}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#C9A66B]" />
              المدن
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ga.cities.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">لا توجد بيانات</div>
            ) : (
              <div className="divide-y">
                {ga.cities.map((c, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50">
                    <span className="text-sm text-slate-600">{c.city}</span>
                    <Badge className="bg-purple-100 text-purple-700">{c.users}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}