import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle, Briefcase, DollarSign, MessageSquare, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const typeIcons = {
  approval: <CheckCircle className="w-4 h-4 text-green-500" />,
  project_update: <Briefcase className="w-4 h-4 text-blue-500" />,
  project_status: <Briefcase className="w-4 h-4 text-blue-500" />,
  proposal: <DollarSign className="w-4 h-4 text-amber-500" />,
  contract: <CheckCircle className="w-4 h-4 text-indigo-500" />,
  milestone: <Briefcase className="w-4 h-4 text-purple-500" />,
  payment: <DollarSign className="w-4 h-4 text-emerald-500" />,
  new_message: <MessageSquare className="w-4 h-4 text-purple-500" />,
  withdrawal: <DollarSign className="w-4 h-4 text-amber-500" />,
  review: <AlertCircle className="w-4 h-4 text-orange-500" />,
  complaint: <AlertCircle className="w-4 h-4 text-red-500" />,
  default: <Bell className="w-4 h-4 text-slate-400" />,
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [toastNotif, setToastNotif] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    let unsubscribe;
    let cancelled = false;
    const init = async () => {
      try {
        const user = await base44.auth.me();
        if (cancelled) return;
        setUserEmail(user.email);
        const recent = await base44.entities.Notification.filter(
          { recipient_email: user.email },
          "-created_date",
          20
        );
        if (cancelled) return;
        setNotifications(recent);

        unsubscribe = base44.entities.Notification.subscribe((event) => {
          if (event.data?.recipient_email === user.email) {
            if (event.type === "create") {
              setNotifications((prev) => [event.data, ...prev].slice(0, 20));
              // Show instant toast popup for high/urgent priority
              if (event.data.priority === "high" || event.data.priority === "urgent") {
                setToastNotif(event.data);
              }
              if (Notification.permission === "granted") {
                new Notification(event.data.title || "إشعار جديد", {
                  body: event.data.message,
                  icon: "/favicon.ico",
                });
              }
            } else if (event.type === "update") {
              setNotifications((prev) =>
                prev.map((n) => (n.id === event.id ? event.data : n))
              );
            }
          }
        });
      } catch (e) {
        // 401/403 = not authenticated — expected, no log needed
        if (e?.status !== 401 && e?.status !== 403) {
          console.warn("[NotificationBell] init failed:", e?.message || e);
        }
      }
    };
    init();

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      cancelled = true;
      if (unsubscribe) {
        try { unsubscribe(); } catch (e) {}
      }
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!toastNotif) return;
    const timer = setTimeout(() => setToastNotif(null), 6000);
    return () => clearTimeout(timer);
  }, [toastNotif]);

  const unread = notifications.filter((n) => !n.is_read);

  const markAsRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  if (!userEmail) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-slate-100 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unread.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
          >
            {unread.length > 9 ? "9+" : unread.length}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1a1a2e] to-[#1a1a2e]/90">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#d4a574]" />
                <span className="text-white font-semibold text-sm">الإشعارات</span>
                {unread.length > 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0">{unread.length}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread.length > 0 && (
                  <button onClick={markAllRead} className="text-xs text-[#d4a574] hover:text-white transition-colors">
                    تحديد الكل كمقروء
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  لا توجد إشعارات
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${
                      !n.is_read ? "bg-blue-50/50" : ""
                    }`}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                  >
                    <div className="mt-0.5 shrink-0">
                      {typeIcons[n.type] || typeIcons.default}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.is_read ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(n.created_date).toLocaleString("ar-SA", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                      </p>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t text-center">
              <Link
                to="/NotificationCenter"
                onClick={() => setOpen(false)}
                className="text-sm text-[#d4a574] hover:text-[#1a1a2e] font-medium transition-colors"
              >
                عرض كل الإشعارات ←
              </Link>
                </div>
                </motion.div>
                )}
                </AnimatePresence>

                {/* Instant Toast Popup for high-priority notifications */}
                <AnimatePresence>
                {toastNotif && (
                <motion.div
                initial={{ opacity: 0, y: -50, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: -50, x: "-50%" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="fixed top-20 left-1/2 z-[200] w-[calc(100vw-2rem)] max-w-md"
                dir="rtl"
                >
                <div className="bg-white rounded-2xl shadow-2xl border-r-4 border-[#C9A66B] p-4 flex items-start gap-3 cursor-pointer hover:shadow-lg transition-shadow"
                 onClick={() => {
                   setOpen(true);
                   setToastNotif(null);
                 }}
                >
                 <div className="mt-0.5 shrink-0">
                   {typeIcons[toastNotif.type] || typeIcons.default}
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="font-semibold text-sm text-slate-900">{toastNotif.title}</p>
                   <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{toastNotif.message}</p>
                 </div>
                 <button
                   onClick={(e) => { e.stopPropagation(); setToastNotif(null); }}
                   className="shrink-0 text-slate-400 hover:text-slate-600"
                 >
                   <X className="w-4 h-4" />
                 </button>
                </div>
                </motion.div>
                )}
                </AnimatePresence>
                </div>
                );
                }