import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, User, Clock, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACTION_META = {
  status_changed: { label: "تغيير حالة", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  updated: { label: "تعديل مالي", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  created: { label: "إنشاء", cls: "bg-green-100 text-green-700 border-green-200" },
  deleted: { label: "حذف", cls: "bg-red-100 text-red-700 border-red-200" },
};

const PROJECT_TITLE_CACHE = {};

export default function ProjectActivityFeed({ refreshKey = 0 }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logData, projData] = await Promise.all([
        base44.entities.TaskActivityLog.list("-created_date", 40).catch(() => []),
        base44.entities.Project.list("-created_date", 500).catch(() => []),
      ]);
      setLogs(logData);
      setProjects(projData);
      projData.forEach((p) => { PROJECT_TITLE_CACHE[p.id] = p.title; });
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  // Realtime: subscribe to new TaskActivityLog entries
  useEffect(() => {
    const unsub = base44.entities.TaskActivityLog.subscribe((event) => {
      if (event.type === "create") {
        setLogs((prev) => [event.data, ...prev].slice(0, 40));
      }
    });
    return unsub;
  }, []);

  const projTitle = (id) => {
    if (PROJECT_TITLE_CACHE[id]) return PROJECT_TITLE_CACHE[id];
    const p = projects.find((x) => x.id === id);
    if (p) { PROJECT_TITLE_CACHE[id] = p.title; return p.title; }
    return `#${String(id || "").slice(-6)}`;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#C9A66B]/15 flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#C9A66B]" />
            </div>
            <div>
              <h3 className="font-bold text-[#4A3F35] text-sm sm:text-base">سجل نشاط المشاريع المباشر</h3>
              <p className="text-xs text-slate-400">توثيق فوري لأي تغيير في الحالة أو المبالغ المالية</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={load} className="text-slate-500 h-8">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="max-h-[420px] overflow-y-auto space-y-2 pl-1">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#C9A66B]" /></div>
          ) : logs.length === 0 ? (
            <p className="text-center text-slate-400 py-10 text-sm">لا يوجد نشاط مسجل بعد</p>
          ) : (
            logs.map((log) => {
              const meta = ACTION_META[log.action_type] || { label: log.action_type, cls: "bg-slate-100 text-slate-600 border-slate-200" };
              const isFinancial = log.action_type === "updated" && log.field_name !== "title/description";
              return (
                <div key={log.id} className="flex gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isFinancial ? "bg-blue-100" : "bg-[#C9A66B]/15"}`}>
                    {isFinancial ? <TrendingUp className="w-4 h-4 text-blue-600" /> : <Clock className="w-4 h-4 text-[#C9A66B]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>{meta.label}</Badge>
                      <span className="text-xs font-medium text-[#4A3F35] truncate max-w-[180px]">{projTitle(log.project_id)}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.created_date).toLocaleString("ar-SA")}</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{log.summary || "—"}</p>
                    {log.old_value && log.new_value && log.field_name !== "title/description" && (
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        <span className="line-through">{log.old_value}</span> ← <span className="text-[#6B5D4F] font-medium">{log.new_value}</span>
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3" /> {log.actor_name || log.actor_email || "—"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}