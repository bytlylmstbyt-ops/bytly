import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bell, CheckCircle, Clock, AlertCircle, DollarSign,
  MessageSquare, Briefcase, Search, Filter, Trash2, X, Calendar
} from "lucide-react";
import AppointmentResponseModal from "@/components/appointments/AppointmentResponseModal";
import AppointmentDetailModal from "@/components/appointments/AppointmentDetailModal";

const TYPE_CONFIG = {
  approval: { label: "قبول عرض", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", badge: "bg-green-100 text-green-700" },
  project_update: { label: "تحديث مشروع", icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50", badge: "bg-blue-100 text-blue-700" },
  payment: { label: "دفعة / سحب", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-700" },
  withdrawal: { label: "طلب سحب", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50", badge: "bg-amber-100 text-amber-700" },
  new_message: { label: "رسالة جديدة", icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50", badge: "bg-purple-100 text-purple-700" },
  review: { label: "مراجعة فنية", icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50", badge: "bg-orange-100 text-orange-700" },
  milestone: { label: "تحديث مرحلة", icon: Clock, color: "text-sky-600", bg: "bg-sky-50", badge: "bg-sky-100 text-sky-700" },
  default: { label: "عام", icon: Bell, color: "text-slate-500", bg: "bg-slate-50", badge: "bg-slate-100 text-slate-700" },
};

const PRIORITY_LABELS = { high: "عالية", medium: "متوسطة", low: "منخفضة", urgent: "عاجلة" };
const PRIORITY_COLORS = { high: "bg-red-100 text-red-700", medium: "bg-amber-100 text-amber-700", low: "bg-slate-100 text-slate-500", urgent: "bg-red-200 text-red-800" };

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [detailAppointment, setDetailAppointment] = useState(null);

  useEffect(() => {
    loadData();
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === "create") setNotifications((prev) => [event.data, ...prev]);
      else if (event.type === "update") setNotifications((prev) => prev.map((n) => n.id === event.id ? event.data : n));
      else if (event.type === "delete") setNotifications((prev) => prev.filter((n) => n.id !== event.id));
    });
    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const notifs = await base44.entities.Notification.filter({ recipient_email: user.email }, "-created_date", 100);
      setNotifications(notifs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id) => {
    await base44.entities.Notification.delete(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleAppointmentResponse = async (notification) => {
    if (!notification.related_entity_id) return;
    try {
      const [appointment] = await base44.entities.ConsultationAppointment.filter({ id: notification.related_entity_id });
      if (appointment) {
        setSelectedAppointment(appointment);
        setResponseModalOpen(true);
      }
    } catch (error) {
      console.error('Error loading appointment:', error);
    }
  };

  const handleViewAppointment = async (notification) => {
    if (!notification.related_entity_id) return;
    try {
      const [appointment] = await base44.entities.ConsultationAppointment.filter({ id: notification.related_entity_id });
      if (appointment) setDetailAppointment(appointment);
    } catch (error) {
      console.error('Error loading appointment:', error);
    }
  };

  const handleAppointmentResponseComplete = () => {
    loadData();
  };

  const filtered = notifications.filter((n) => {
    if (readFilter === "unread" && n.is_read) return false;
    if (readFilter === "read" && !n.is_read) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (priorityFilter !== "all" && n.priority !== priorityFilter) return false;
    if (search && !n.title?.toLowerCase().includes(search.toLowerCase()) && !n.message?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const allTypes = [...new Set(notifications.map((n) => n.type))].filter(Boolean);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1a1a2e] flex items-center gap-3">
                <Bell className="w-8 h-8 text-[#d4a574]" />
                مركز الإشعارات
              </h1>
              <p className="text-slate-500 mt-1">تتبع جميع تنبيهاتك ولحظاتك المهمة</p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Badge className="bg-red-100 text-red-700 text-base px-3 py-1.5">{unreadCount} غير مقروء</Badge>
              )}
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1">
                  <CheckCircle className="w-4 h-4" /> تحديد الكل كمقروء
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "الكل", value: notifications.length, color: "bg-slate-100 text-slate-700" },
            { label: "غير مقروء", value: unreadCount, color: "bg-blue-100 text-blue-700" },
            { label: "عالية الأولوية", value: notifications.filter(n => n.priority === "high" || n.priority === "urgent").length, color: "bg-red-100 text-red-700" },
            { label: "اليوم", value: notifications.filter(n => new Date(n.created_date).toDateString() === new Date().toDateString()).length, color: "bg-green-100 text-green-700" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="ابحث في الإشعارات..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1 ml-1"><Filter className="w-3 h-3" /> حالة:</span>
            {[{ v: "all", l: "الكل" }, { v: "unread", l: "غير مقروء" }, { v: "read", l: "مقروء" }].map((f) => (
              <button key={f.v} onClick={() => setReadFilter(f.v)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${readFilter === f.v ? "bg-[#1a1a2e] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {f.l}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1 ml-1"><Bell className="w-3 h-3" /> النوع:</span>
            <button onClick={() => setTypeFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${typeFilter === "all" ? "bg-[#d4a574] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              الكل
            </button>
            {allTypes.map((t) => {
              const cfg = TYPE_CONFIG[t] || TYPE_CONFIG.default;
              return (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${typeFilter === t ? "bg-[#d4a574] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1 ml-1"><AlertCircle className="w-3 h-3" /> الأولوية:</span>
            {[{ v: "all", l: "الكل" }, { v: "urgent", l: "عاجلة" }, { v: "high", l: "عالية" }, { v: "medium", l: "متوسطة" }].map((f) => (
              <button key={f.v} onClick={() => setPriorityFilter(f.v)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${priorityFilter === f.v ? "bg-[#1a1a2e] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {f.l}
              </button>
            ))}
          </div>
        </motion.div>

        <p className="text-sm text-slate-500 mb-4">{filtered.length} إشعار</p>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500">لا توجد إشعارات تطابق البحث</p>
            </div>
          ) : (
            filtered.map((n, idx) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
              const Icon = cfg.icon;
              return (
                <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                  <Card className={`transition-all hover:shadow-md ${!n.is_read ? "border-r-4 border-r-blue-500" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-5 h-5 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className={`text-sm ${!n.is_read ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>{n.title}</p>
                            <Badge className={`text-xs ${cfg.badge}`}>{cfg.label}</Badge>
                            {n.priority && n.priority !== "medium" && (
                              <Badge className={`text-xs ${PRIORITY_COLORS[n.priority] || ""}`}>{PRIORITY_LABELS[n.priority]}</Badge>
                            )}
                            {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                          </div>
                          <p className="text-sm text-slate-500">{n.message}</p>
                          {n.type === 'approval' && n.related_entity_id && (
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" onClick={() => handleAppointmentResponse(n)} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">
                                <CheckCircle className="w-4 h-4 ml-1" /> موافق
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleAppointmentResponse(n)} className="border-amber-500 text-amber-700 hover:bg-amber-50">
                                <Clock className="w-4 h-4 ml-1" /> تأجيل
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleViewAppointment(n)}>
                                <Calendar className="w-4 h-4 ml-1" /> عرض التفاصيل
                              </Button>
                            </div>
                          )}
                          <p className="text-xs text-slate-400 mt-1.5">
                            {new Date(n.created_date).toLocaleString("ar-SA", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {!n.is_read && (
                            <Button size="icon" variant="ghost" className="w-8 h-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => markAsRead(n.id)}>
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="w-8 h-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteNotification(n.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {selectedAppointment && (
        <AppointmentResponseModal
          appointment={selectedAppointment}
          open={responseModalOpen}
          onOpenChange={setResponseModalOpen}
          onSuccess={handleAppointmentResponseComplete}
        />
      )}

      {detailAppointment && (
        <AppointmentDetailModal
          appointment={detailAppointment}
          open={!!detailAppointment}
          onOpenChange={() => setDetailAppointment(null)}
        />
      )}
    </div>
  );
}