import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, BellRing, X, CheckCheck, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

const PRIORITY_STYLE = {
  urgent: "border-r-4 border-red-500 bg-red-50",
  high:   "border-r-4 border-amber-500 bg-amber-50",
  medium: "border-r-4 border-blue-400 bg-blue-50",
  low:    "border-r-4 border-slate-300 bg-slate-50",
};
const PRIORITY_BADGE = {
  urgent: "bg-red-100 text-red-700",
  high:   "bg-amber-100 text-amber-700",
  medium: "bg-blue-100 text-blue-700",
  low:    "bg-slate-100 text-slate-600",
};
const PRIORITY_LABEL = { urgent: "عاجل", high: "مرتفع", medium: "متوسط", low: "منخفض" };

export default function ProjectAlertsPanel({ userEmail, onClose }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => { loadAlerts(); }, [userEmail]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (authError || !authUser || (userEmail && authUser.email?.toLowerCase() !== userEmail.toLowerCase())) {
        setAlerts([]);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("id,user_id,type,title,body,entity_type,entity_id,read_at,created_at")
        .eq("user_id", authUser.id)
        .eq("type", "project_update")
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setAlerts((data || []).map(row => ({
        ...row,
        message: row.body || "",
        created_date: row.created_at,
        priority: "medium",
        is_read: Boolean(row.read_at),
      })));
    } catch (error) {
      console.error("Could not load project alerts from Supabase:", error);
      setAlerts([]);
      toast.error("تعذر تحميل إشعارات المشاريع");
    } finally {
      setLoading(false);
    }
  };

  const runCheck = async () => {
    setRunning(true);
    await loadAlerts();
    setRunning(false);
    toast.success("تم تحديث الإشعارات");
  };

  const markRead = async (id) => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      toast.error("يرجى تسجيل الدخول مجددًا");
      return;
    }
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", authData.user.id);
    if (error) {
      toast.error("تعذر تعليم الإشعار كمقروء");
      return;
    }
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const markAllRead = async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      toast.error("يرجى تسجيل الدخول مجددًا");
      return;
    }
    const ids = alerts.map(a => a.id);
    if (!ids.length) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", authData.user.id)
      .in("id", ids);
    if (error) {
      toast.error("تعذر تعليم الإشعارات كمقروءة");
      return;
    }
    setAlerts([]);
    toast.success("تم تعليم الكل كمقروء");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" dir="rtl">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-sm bg-white shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-l from-slate-50 to-white">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-slate-800">إشعارات المشاريع</h2>
            {alerts.length > 0 && (
              <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5">{alerts.length}</Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={runCheck} disabled={running} title="فحص الآن">
              <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            </Button>
            {alerts.length > 0 && (
              <Button size="sm" variant="ghost" onClick={markAllRead} title="تعليم الكل كمقروء">
                <CheckCheck className="w-4 h-4 text-green-600" />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          )}

          {!loading && alerts.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <BellRing className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">لا توجد إشعارات جديدة</p>
              <p className="text-xs mt-1">اضغط الزر أعلاه لتحديث الإشعارات</p>
            </div>
          )}

          {!loading && alerts.map(alert => (
            <div key={alert.id} className={`rounded-lg p-3 ${PRIORITY_STYLE[alert.priority] || PRIORITY_STYLE.medium}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge className={`text-xs px-1.5 py-0 ${PRIORITY_BADGE[alert.priority] || PRIORITY_BADGE.medium}`}>
                      {PRIORITY_LABEL[alert.priority] || alert.priority}
                    </Badge>
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{alert.title}</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{alert.message}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {format(parseISO(alert.created_date), 'd MMM • HH:mm', { locale: ar })}
                  </p>
                </div>
                <button onClick={() => markRead(alert.id)} className="p-1 hover:bg-white/60 rounded shrink-0">
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-3 bg-slate-50">
          <Button onClick={runCheck} disabled={running} className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="sm">
            {running ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <RefreshCw className="w-4 h-4 ml-1" />}
            تحديث الإشعارات
          </Button>
        </div>
      </div>
    </div>
  );
}