import React, { useState, useEffect, useCallback } from "react";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Bell, CheckCircle, Briefcase, Star, DollarSign, Trash2, Loader2, AlertCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import moment from "moment";
import "moment/locale/ar";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function Notifications() {
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState("all");
  const [loadError, setLoadError] = useState("");

  useEffect(() => { moment.locale(language); }, [language]);

  const loadNotifications = useCallback(async () => {
    setLoadError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const currentUser = authData?.user;
      if (!currentUser?.id) {
        setUser(null); setIsAdmin(false); setNotifications([]); return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles").select("role").eq("user_id", currentUser.id).maybeSingle();
      if (profileError) throw profileError;
      const admin = ["admin", "super_admin"].includes(String(profile?.role || "").toLowerCase());
      setUser({ id: currentUser.id, email: currentUser.email || "" });
      setIsAdmin(admin);

      let query = supabase.from("notifications")
        .select("id,user_id,type,title,body,entity_type,entity_id,read_at,created_at")
        .order("created_at", { ascending: false }).limit(100);
      // Head office can review platform-wide notifications. Regular accounts only see
      // their own user-targeted notifications, and internal system notices are admin-only.
      if (admin) query = query;
      else query = query.eq("user_id", currentUser.id).neq("type", "system");

      const { data, error } = await query;
      if (error) throw error;
      setNotifications((data || []).map(row => ({
        ...row,
        message: row.body || "",
        is_read: Boolean(row.read_at),
        created_date: row.created_at,
        related_project_id: row.entity_type === "project" ? row.entity_id : null,
        priority: "medium",
      })));
    } catch (error) {
      console.error("Error loading scoped notifications:", error);
      setLoadError(error?.message || "تعذر تحميل الإشعارات.");
      setNotifications([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    let channel = null;
    const start = async () => {
      await loadNotifications();
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (!active || !authUser?.id) return;
      const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", authUser.id).maybeSingle();
      const admin = ["admin", "super_admin"].includes(String(profile?.role || "").toLowerCase());
      if (!active) return;
      let subscription = supabase.channel("notifications-page-" + authUser.id).on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", ...(admin ? {} : { filter: "user_id=eq." + authUser.id }) },
        () => { if (active) loadNotifications(); }
      );
      channel = subscription.subscribe();
    };
    start();
    return () => { active = false; if (channel) supabase.removeChannel(channel); };
  }, [loadNotifications]);

  const getIcon = type => {
    switch (type) {
      case "project_update": return <Briefcase className="w-5 h-5 text-purple-500" />;
      case "payment": return <DollarSign className="w-5 h-5 text-green-500" />;
      case "review": return <Star className="w-5 h-5 text-amber-500" />;
      case "complaint": return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "approval": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "system": return <ShieldCheck className="w-5 h-5 text-blue-600" />;
      case "admin_notice": return <Bell className="w-5 h-5 text-amber-600" />;
      case "dispute_update": return <ShieldAlert className="w-5 h-5 text-orange-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!user?.id) return;
      let query = supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
      if (!isAdmin) query = query.eq("user_id", user.id).neq("type", "system");
      const { error } = await query;
      if (error) throw error;
      await loadNotifications();
    } catch (error) { setLoadError(error?.message || "تعذر تحديث الإشعارات."); }
  };

  const markAsRead = async notification => {
    if (notification.is_read || !user?.id) return;
    try {
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() })
        .eq("id", notification.id).eq("user_id", notification.user_id);
      if (error) throw error;
      setNotifications(prev => prev.map(item => item.id === notification.id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item));
    } catch (error) { setLoadError(error?.message || "تعذر تحديث الإشعار."); }
  };

  const deleteNotification = async notification => {
    try {
      let query = supabase.from("notifications").delete().eq("id", notification.id);
      if (!isAdmin) query = query.eq("user_id", user?.id).neq("type", "system");
      const { error } = await query;
      if (error) throw error;
      setNotifications(prev => prev.filter(item => item.id !== notification.id));
    } catch (error) { setLoadError(error?.message || "تعذر حذف الإشعار."); }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filteredNotifications = notifications.filter(n => filter === "unread" ? !n.is_read : filter === "read" ? n.is_read : true);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-[#C9A66B]" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {loadError && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{loadError}</div>}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8 gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e]">{t("notifications.title")}</h1>
              {isAdmin && <p className="text-xs text-blue-700 mt-1">عرض الإدارة: إشعارات المنصة والمستخدمين</p>}
              {unreadCount > 0 && <p className="text-slate-500">{t("notifications.unreadCount").replace("{count}", unreadCount)}</p>}
            </div>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("notifications.filters.all")}</SelectItem>
                  <SelectItem value="unread">{t("notifications.filters.unread")}</SelectItem>
                  <SelectItem value="read">{t("notifications.filters.read")}</SelectItem>
                </SelectContent>
              </Select>
              {unreadCount > 0 && <Button variant="outline" onClick={markAllAsRead}><CheckCircle className="w-4 h-4 ml-2" />{t("notifications.markAllRead")}</Button>}
            </div>
          </div>
          <Card className="border-0 shadow-lg"><CardContent className="p-0">
            {filteredNotifications.length ? <div className="divide-y">
              {filteredNotifications.map((notification, index) => <motion.div key={notification.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notification.is_read ? "bg-amber-50/50" : ""}`} onClick={() => { markAsRead(notification); if (notification.link) window.location.href = notification.link; else if (notification.related_project_id) window.location.href = createPageUrl("ProjectDetails") + `?id=${notification.related_project_id}`; }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2"><div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[#1a1a2e] flex items-center gap-2 flex-wrap">{notification.title}{!notification.is_read && <Badge className="bg-[#C9A66B] text-white text-xs">{t("notifications.new")}</Badge>}</h3>
                      <p className="text-sm text-slate-600 mt-1 break-words">{notification.message}</p>
                    </div><button onClick={e => { e.stopPropagation(); deleteNotification(notification); }} className="p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0" aria-label="حذف الإشعار"><Trash2 className="w-4 h-4 text-slate-400" /></button></div>
                    {isAdmin && <p className="text-xs text-slate-400 mt-1">المستلم: {notification.user_id}</p>}
                    <p className="text-xs text-slate-400 mt-2">{moment(notification.created_date).fromNow()}</p>
                  </div>
                </div>
              </motion.div>)}
            </div> : <div className="text-center py-16"><Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" /><h3 className="text-lg font-semibold text-slate-700 mb-2">{t("notifications.noNotifications")}</h3><p className="text-slate-500">{t("notifications.noNotificationsMessage")}</p></div>}
          </CardContent></Card>
        </motion.div>
      </div>
    </div>
  );
}
