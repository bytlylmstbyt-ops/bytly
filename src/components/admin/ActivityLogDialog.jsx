import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, User, Clock } from "lucide-react";

const ACTION_LABELS = {
  created: "إنشاء", updated: "تعديل", status_changed: "تغيير حالة", deleted: "حذف",
};

export default function ActivityLogDialog({ project, open, onOpenChange }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !project?.id) return;
    setLoading(true);
    base44.entities.TaskActivityLog.filter({ project_id: project.id }, "-created_date", 50)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [open, project?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#C9A66B]" />
            سجل نشاط المشروع
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#C9A66B]" /></div>
          ) : logs.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">لا يوجد نشاط مسجل لهذا المشروع</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-full bg-[#C9A66B]/15 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-[#C9A66B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{ACTION_LABELS[log.action_type] || log.action_type}</Badge>
                      <span className="text-xs text-slate-400">{new Date(log.created_date).toLocaleString("ar-SA")}</span>
                    </div>
                    <p className="text-sm text-slate-700 mt-1">{log.summary || log.description || log.task_title || "—"}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3" /> {log.actor_name || log.actor_email || "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}