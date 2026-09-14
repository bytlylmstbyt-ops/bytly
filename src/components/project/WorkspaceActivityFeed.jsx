import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity, RefreshCw, FileUp, FileMinus, Flag, CheckCircle2,
  Send, Scale, FileSignature, CreditCard, Shield, Video,
  MessageSquare, Star, CalendarPlus, FolderPlus, Trash2,
  Edit3, Loader2, Filter, ChevronDown
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ACTIVITY_META = {
  project_created:          { icon: FolderPlus,   color: "text-blue-600 bg-blue-50",     label: "إنشاء مشروع" },
  project_status_changed:  { icon: Activity,     color: "text-slate-600 bg-slate-100",  label: "تغيير حالة" },
  file_uploaded:           { icon: FileUp,       color: "text-cyan-600 bg-cyan-50",    label: "رفع ملف" },
  file_deleted:            { icon: FileMinus,    color: "text-red-600 bg-red-50",      label: "حذف ملف" },
  milestone_created:       { icon: Flag,         color: "text-purple-600 bg-purple-50", label: "مرحلة جديدة" },
  milestone_status_changed:{ icon: Flag,         color: "text-purple-600 bg-purple-50", label: "تغيير حالة المرحلة" },
  milestone_submitted:     { icon: CheckCircle2, color: "text-amber-600 bg-amber-50",  label: "تسليم مرحلة" },
  milestone_approved:      { icon: CheckCircle2, color: "text-green-600 bg-green-50",  label: "اعتماد مرحلة" },
  task_created:            { icon: CheckCircle2, color: "text-amber-600 bg-amber-50",  label: "مهمة جديدة" },
  task_updated:            { icon: Edit3,       color: "text-slate-600 bg-slate-100",  label: "تعديل مهمة" },
  task_status_changed:     { icon: Activity,     color: "text-indigo-600 bg-indigo-50", label: "تغيير حالة مهمة" },
  task_deleted:            { icon: Trash2,      color: "text-red-600 bg-red-50",      label: "حذف مهمة" },
  proposal_submitted:      { icon: Send,        color: "text-blue-600 bg-blue-50",    label: "عرض جديد" },
  proposal_accepted:       { icon: CheckCircle2, color: "text-green-600 bg-green-50", label: "قبول عرض" },
  proposal_rejected:       { icon: Activity,    color: "text-red-600 bg-red-50",      label: "رفض عرض" },
  contract_created:        { icon: Scale,       color: "text-purple-600 bg-purple-50", label: "عقد جديد" },
  contract_signed:         { icon: FileSignature, color: "text-indigo-600 bg-indigo-50", label: "توقيع عقد" },
  contract_updated:        { icon: Edit3,       color: "text-slate-600 bg-slate-100", label: "تعديل عقد" },
  payment_made:            { icon: CreditCard,  color: "text-green-600 bg-green-50",  label: "دفعة" },
  escrow_held:             { icon: Shield,      color: "text-amber-600 bg-amber-50",  label: "حجز ضمان" },
  escrow_released:         { icon: Shield,      color: "text-green-600 bg-green-50",  label: "تحرير ضمان" },
  meeting_scheduled:       { icon: Video,       color: "text-blue-600 bg-blue-50",   label: "اجتماع" },
  message_sent:            { icon: MessageSquare, color: "text-slate-600 bg-slate-100", label: "رسالة" },
  review_submitted:        { icon: Star,        color: "text-amber-600 bg-amber-50",  label: "تقييم" },
  appointment_booked:      { icon: CalendarPlus, color: "text-blue-600 bg-blue-50",  label: "حجز موعد" },
};

const FILTER_GROUPS = [
  { key: "all", label: "الكل", types: null },
  { key: "files", label: "الملفات", types: ["file_uploaded", "file_deleted"] },
  { key: "milestones", label: "المراحل", types: ["milestone_created", "milestone_status_changed", "milestone_submitted", "milestone_approved"] },
  { key: "tasks", label: "المهام", types: ["task_created", "task_updated", "task_status_changed", "task_deleted"] },
  { key: "contracts", label: "العقود", types: ["contract_created", "contract_signed", "contract_updated"] },
  { key: "payments", label: "المدفوعات", types: ["payment_made", "escrow_held", "escrow_released"] },
  { key: "proposals", label: "العروض", types: ["proposal_submitted", "proposal_accepted", "proposal_rejected"] },
];

function formatRelative(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `قبل ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 604800) return `قبل ${Math.floor(diff / 86400)} يوم`;
  return date.toLocaleDateString("ar-SA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatFullDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ar-SA", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

export default function WorkspaceActivityFeed({ project, proposals, contracts, transactions, engineers, user, isClient, isEngineer }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFullDate, setShowFullDate] = useState(false);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const [wsLogs, taskLogs] = await Promise.all([
        base44.entities.WorkspaceActivity.filter({ project_id: project.id }).catch(() => []),
        base44.entities.TaskActivityLog.filter({ project_id: project.id }).catch(() => []),
      ]);

      // Normalize WorkspaceActivity records
      const wsEvents = (wsLogs || []).map((log) => {
        const meta = ACTIVITY_META[log.activity_type] || ACTIVITY_META.project_status_changed;
        return {
          id: `ws-${log.id}`,
          time: log.created_date,
          icon: meta.icon,
          color: meta.color,
          label: meta.label,
          title: log.summary,
          actor: log.actor_name,
          actorEmail: log.actor_email,
          actorRole: log.actor_role,
          entityTitle: log.entity_title,
          oldValue: log.old_value,
          newValue: log.new_value,
          metadata: log.metadata,
          sortTime: log.created_date ? new Date(log.created_date).getTime() : 0,
        };
      });

      // Normalize TaskActivityLog records
      const taskEvents = (taskLogs || []).map((log) => {
        const isStatusChange = log.action_type === "status_changed";
        const meta = isStatusChange ? ACTIVITY_META.task_status_changed
          : log.action_type === "created" ? ACTIVITY_META.task_created
          : log.action_type === "deleted" ? ACTIVITY_META.task_deleted
          : ACTIVITY_META.task_updated;
        return {
          id: `tl-${log.id}`,
          time: log.created_date,
          icon: meta.icon,
          color: meta.color,
          label: meta.label,
          title: log.summary || log.description || `تعديل على "${log.task_title}"`,
          actor: log.actor_name,
          actorEmail: log.actor_email,
          entityTitle: log.task_title,
          oldValue: log.old_value,
          newValue: log.new_value,
          sortTime: log.created_date ? new Date(log.created_date).getTime() : 0,
        };
      });

      // Merge and sort
      const all = [...wsEvents, ...taskEvents].sort((a, b) => b.sortTime - a.sortTime);
      setActivities(all);
    } catch (err) {
      console.error("Error loading workspace activity:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
    // Real-time subscription
    const unsubscribe = base44.entities.WorkspaceActivity.subscribe(() => {
      loadActivities();
    });
    return unsubscribe;
  }, [project.id]);

  // Filtered activities
  const filtered = useMemo(() => {
    if (activeFilter === "all") return activities;
    const filterTypes = FILTER_GROUPS.find(g => g.key === activeFilter)?.types;
    if (!filterTypes) return activities;
    return activities.filter((a) => {
      const typeKey = Object.entries(ACTIVITY_META).find(([_, meta]) => meta.label === a.label)?.[0];
      return typeKey && filterTypes.includes(typeKey);
    });
  }, [activities, activeFilter]);

  const getActorInitial = (name) => {
    if (!name) return "?";
    return name.charAt(0);
  };

  const getActorColor = (email) => {
    if (!email) return "bg-slate-400";
    const hash = email.charCodeAt(0) + (email.charCodeAt(1) || 0);
    const colors = [
      "bg-gradient-to-br from-blue-500 to-blue-600",
      "bg-gradient-to-br from-purple-500 to-purple-600",
      "bg-gradient-to-br from-green-500 to-green-600",
      "bg-gradient-to-br from-amber-500 to-amber-600",
      "bg-gradient-to-br from-indigo-500 to-indigo-600",
      "bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B]",
    ];
    return colors[hash % colors.length];
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#C9A66B]" />
            سجل نشاط مساحة العمل
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowFullDate(!showFullDate)} className="text-slate-400 text-xs">
              {showFullDate ? "وقت نسبي" : "وقت كامل"}
            </Button>
            <Button variant="ghost" size="sm" onClick={loadActivities} className="text-slate-400">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {FILTER_GROUPS.map((group) => (
            <button
              key={group.key}
              onClick={() => setActiveFilter(group.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeFilter === group.key
                  ? "bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">لا يوجد نشاط مسجل في هذا التصنيف</p>
            <p className="text-slate-300 text-xs mt-1">ستظهر هنا جميع التغييرات التي تتم في مساحة العمل</p>
          </div>
        ) : (
          <div className="relative pr-6 max-h-[600px] overflow-y-auto">
            {/* Vertical line */}
            <div className="absolute right-[19px] top-2 bottom-2 w-0.5 bg-slate-100" />

            {filtered.map((log, i) => {
              const Icon = log.icon;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="relative flex items-start gap-3 pb-5 last:pb-0"
                >
                  {/* Icon node */}
                  <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${log.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    {/* Actor + time */}
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className={`text-white text-[10px] ${getActorColor(log.actorEmail)}`}>
                            {getActorInitial(log.actor)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-slate-600 truncate">{log.actor || "النظام"}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0" title={formatFullDate(log.time)}>
                        {showFullDate ? formatFullDate(log.time) : formatRelative(log.time)}
                      </span>
                    </div>

                    {/* Title */}
                    <p className="text-sm font-medium text-slate-800 leading-snug">{log.title}</p>

                    {/* Entity + change */}
                    {log.entityTitle && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">📄 {log.entityTitle}</p>
                    )}
                    {log.oldValue && log.newValue && (
                      <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                        <Badge variant="outline" className="text-slate-400 line-through bg-slate-50">{log.oldValue}</Badge>
                        <ChevronDown className="w-3 h-3 text-slate-300 rotate-[-90deg]" />
                        <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">{log.newValue}</Badge>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}