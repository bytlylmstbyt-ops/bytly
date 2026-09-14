import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Clock, Rocket } from "lucide-react";
import LaunchOverviewStats from "@/components/dashboard/LaunchOverviewStats";
import moment from "moment";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function LaunchDashboard() {
  const { t, isRTL } = useLanguage();
  const [engineers, setEngineers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [surveyResponses, setSurveyResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadData = async () => {
    setLoading(true);
    try {
      const [eng, proj, survey] = await Promise.all([
        base44.entities.Engineer.list("-created_date", 500),
        base44.entities.Project.list("-created_date", 500),
        base44.entities.SurveyResponse.list("-created_date", 500),
      ]);
      setEngineers(eng || []);
      setProjects(proj || []);
      setSurveyResponses(survey || []);
    } catch (error) {
      console.error("Error loading launch data:", error);
    }
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="min-h-screen bg-slate-50" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center shrink-0">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#4A3F35]">{t('launchDashboard.title')}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{t('launchDashboard.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t('launchDashboard.lastUpdate')}: {moment(lastRefresh).format("HH:mm:ss")}
            </span>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A66B] text-white text-xs rounded-lg hover:bg-[#b8955a] disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              {t('launchDashboard.refresh')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <LaunchOverviewStats
          engineers={engineers}
          projects={projects}
          surveyResponses={surveyResponses}
          loading={loading}
        />

        {/* Recent Engineers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#4A3F35]">{t('launchDashboard.recentEngineers')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading
              ? <div className="h-32 bg-slate-100 rounded animate-pulse mx-4 mb-4" />
              : engineers.length === 0
                ? <p className="text-slate-400 text-sm text-center py-8">{t('launchDashboard.noEngineers')}</p>
                : (
                  <div className="divide-y">
                    {engineers.slice(0, 5).map((e) => (
                      <div key={e.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#4A3F35] truncate">{e.full_name || "—"} · {e.specialization || e.user_type || "—"}</p>
                          <p className="text-xs text-slate-400">{moment(e.created_date).fromNow()}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          e.status === "approved" ? "bg-green-100 text-green-700"
                          : e.status === "pending" ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                        }`}>
                          {e.status === "approved" ? t('launchDashboard.statusApproved')
                           : e.status === "pending" ? t('launchDashboard.statusPending')
                           : e.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )
            }
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#4A3F35]">{t('launchDashboard.recentProjects')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading
              ? <div className="h-32 bg-slate-100 rounded animate-pulse mx-4 mb-4" />
              : projects.length === 0
                ? <p className="text-slate-400 text-sm text-center py-8">{t('launchDashboard.noProjects')}</p>
                : (
                  <div className="divide-y">
                    {projects.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#4A3F35] truncate">{p.title || "—"}</p>
                          <p className="text-xs text-slate-400">{moment(p.created_date).fromNow()}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )
            }
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-300 pb-4">
          {t('launchDashboard.footerNote')} — {moment(lastRefresh).format("DD/MM/YYYY HH:mm")}
        </p>
      </div>
    </div>
  );
}