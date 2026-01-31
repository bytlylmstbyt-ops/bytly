import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Bell, CheckCircle, MessageSquare, Briefcase, 
  Star, DollarSign, Settings, Trash2, Loader2, AlertCircle, ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import moment from "moment";
import "moment/locale/ar";

moment.locale("ar");

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadNotifications();
    
    // Real-time subscription for new notifications
    const setupSubscription = async () => {
      const currentUser = await base44.auth.me();
      const unsubscribe = base44.entities.Notification.subscribe((event) => {
        if (event.type === 'create' && event.data.recipient_email === currentUser.email) {
          setNotifications(prev => [event.data, ...prev]);
        } else if (event.type === 'update') {
          setNotifications(prev => prev.map(n => n.id === event.id ? event.data : n));
        } else if (event.type === 'delete') {
          setNotifications(prev => prev.filter(n => n.id !== event.id));
        }
      });
      return unsubscribe;
    };

    const subscription = setupSubscription();

    return () => {
      subscription.then(unsub => unsub?.());
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const notificationsData = await base44.entities.Notification.filter({
        recipient_email: currentUser.email
      }, "-created_date", 50);

      setNotifications(notificationsData);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "project_update":
        return <Briefcase className="w-5 h-5 text-purple-500" />;
      case "payment":
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case "review":
        return <Star className="w-5 h-5 text-amber-500" />;
      case "complaint":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "approval":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "system":
        return <Bell className="w-5 h-5 text-blue-500" />;
      case "dispute_update":
        return <ShieldAlert className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700";
      case "high":
        return "bg-orange-100 text-orange-700";
      case "medium":
        return "bg-blue-100 text-blue-700";
      case "low":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter(n => !n.is_read)
          .map(n => base44.entities.Notification.update(n.id, { is_read: true }))
      );
      await loadNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAsRead = async (notification) => {
    if (!notification.is_read) {
      await base44.entities.Notification.update(notification.id, { is_read: true });
      await loadNotifications();
    }
  };

  const deleteNotification = async (id) => {
    try {
      await base44.entities.Notification.delete(id);
      await loadNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e]">الإشعارات</h1>
              {unreadCount > 0 && (
                <p className="text-slate-500">{unreadCount} إشعار جديد</p>
              )}
            </div>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="unread">غير مقروء</SelectItem>
                  <SelectItem value="read">مقروء</SelectItem>
                </SelectContent>
              </Select>
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  <CheckCircle className="w-4 h-4 ml-2" />
                  تعليم الكل كمقروء
                </Button>
              )}
            </div>
          </div>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              {filteredNotifications.length > 0 ? (
                <div className="divide-y">
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !notification.is_read ? "bg-amber-50/50" : ""
                      }`}
                      onClick={() => {
                        markAsRead(notification);
                        if (notification.link) {
                          window.location.href = notification.link;
                        } else if (notification.related_project_id) {
                          window.location.href = createPageUrl("ProjectDetails") + `?id=${notification.related_project_id}`;
                        }
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-[#1a1a2e] flex items-center gap-2 flex-wrap">
                                {notification.title}
                                {!notification.is_read && (
                                  <Badge className="bg-[#d4a574] text-white text-xs">جديد</Badge>
                                )}
                                {notification.priority && notification.priority !== "medium" && (
                                  <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                    {notification.priority === "urgent" ? "عاجل" :
                                     notification.priority === "high" ? "مهم" :
                                     notification.priority === "low" ? "منخفض" : ""}
                                  </Badge>
                                )}
                              </h3>
                              <p className="text-sm text-slate-600 mt-1 break-words">
                                {notification.message}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4 text-slate-400" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            {moment(notification.created_date).fromNow()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">لا توجد إشعارات</h3>
                  <p className="text-slate-500">ستظهر الإشعارات الجديدة هنا</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}