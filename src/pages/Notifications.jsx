import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Bell, CheckCircle, MessageSquare, Briefcase, 
  Star, DollarSign, Settings, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "message",
      title: "رسالة جديدة",
      description: "لديك رسالة جديدة من أحمد محمد",
      time: "منذ 5 دقائق",
      read: false
    },
    {
      id: 2,
      type: "project",
      title: "عرض جديد على مشروعك",
      description: "تلقيت عرضاً جديداً على مشروع تصميم الفيلا",
      time: "منذ ساعة",
      read: false
    },
    {
      id: 3,
      type: "payment",
      title: "تم استلام الدفع",
      description: "تم إيداع 5,000 ر.س في محفظتك",
      time: "منذ 3 ساعات",
      read: true
    },
    {
      id: 4,
      type: "review",
      title: "تقييم جديد",
      description: "حصلت على تقييم 5 نجوم من عميل",
      time: "أمس",
      read: true
    }
  ]);

  const getIcon = (type) => {
    switch (type) {
      case "message":
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case "project":
        return <Briefcase className="w-5 h-5 text-purple-500" />;
      case "payment":
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case "review":
        return <Star className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
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
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCircle className="w-4 h-4 ml-2" />
                تعليم الكل كمقروء
              </Button>
            )}
          </div>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              {notifications.length > 0 ? (
                <div className="divide-y">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors ${
                        !notification.read ? "bg-amber-50/50" : ""
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-[#1a1a2e]">
                              {notification.title}
                              {!notification.read && (
                                <Badge className="mr-2 bg-[#d4a574] text-white text-xs">جديد</Badge>
                              )}
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                              {notification.description}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 hover:bg-slate-200 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">{notification.time}</p>
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