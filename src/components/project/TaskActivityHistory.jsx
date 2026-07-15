import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Plus, Edit3, ArrowRightLeft, Trash2, Loader2 } from "lucide-react";

const ACTION_CONFIG = {
  created: { icon: Plus, color: "text-green-600", bg: "bg-green-100", label: "إنشاء" },
  updated: { icon: Edit3, color: "text-blue-600", bg: "bg-blue-100", label: "تعديل" },
  status_changed: { icon: ArrowRightLeft, color: "text-amber-600", bg: "bg-amber-100", label: "تغيير حالة" },
  deleted: { icon: Trash2, color: "text-red-600", bg: "bg-red-100", label: "حذف" }
};

export default function TaskActivityHistory({ projectId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    loadLogs();

    // Realtime: update list when new activity is logged
    const unsubscribe = base44.entities.TaskActivityLog.subscribe((event) => {
      if (event.type === "create" && event.data?.project_id === projectId) {
        setLogs((prev) => [event.data, ...prev]);
      }
    });
    return () => unsubscribe();
  }, [projectId]);

  const loadLogs = async () => {
    try {
      const data = await base44.entities.TaskActivityLog.filter(
        { project_id: projectId },
        "-created_date",
        100
      );
      setLogs(data);
    } catch (e) {
      console.error("Error loading task activity:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString("ar-SA", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  };

  return (
    <Card className="border-[#C9A66B]/20 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-[#4A3F35]">
          <History className="w-5 h-5 text-[#C9A66B]" />
          سجل تعديلات المهام
        </CardTitle>
        <p className="text-xs text-slate-500">
          تتبّع شفاف لكل تعديل على مهام المشروع بين المهندس والعميل
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#C9A66B]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            لا توجد تعديلات مسجّلة بعد
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-2">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute right-[19px] top-2 bottom-2 w-0.5 bg-[#C9A66B]/20" />

              <div className="space-y-1">
                {logs.map((log, index) => {
                  const config = ACTION_CONFIG[log.action_type] || ACTION_CONFIG.updated;
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex gap-3 py-3 relative"
                    >
                      {/* Icon node */}
                      <div className={`relative z-10 shrink-0 w-10 h-10 rounded-full ${config.bg} flex items-center justify-center border-2 border-white shadow-sm`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-2">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`text-xs ${config.color} border-current/30`}>
                              {config.label}
                            </Badge>
                            {log.task_title && (
                              <span className="text-sm font-medium text-slate-700 truncate">
                                {log.task_title}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 shrink-0">
                            {formatTime(log.created_date)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 leading-relaxed mb-2">
                          {log.summary}
                        </p>

                        {/* Actor */}
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-[10px] bg-[#C9A66B] text-white">
                              {log.actor_name?.charAt(0) || log.actor_email?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-slate-500">
                            {log.actor_name || log.actor_email}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}