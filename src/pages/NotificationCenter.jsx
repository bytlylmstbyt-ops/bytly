import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell, CheckCircle, Clock, AlertCircle, Eye, Filter,
  Briefcase, DollarSign, MessageSquare, FileCheck
} from "lucide-react";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [client, setClient] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const [clientData] = await base44.entities.Client.filter({
        email: user.email
      });
      setClient(clientData);

      const notifs = await base44.entities.Notification.filter(
        { recipient_email: user.email },
        "-created_date",
        50
      );
      setNotifications(notifs);

      if (clientData?.client_type === "investor") {
        const projectsList = await base44.entities.Project.filter({
          client_id: clientData.id
        });
        setProjects(projectsList);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    await base44.entities.Notification.update(notificationId, {
      is_read: true
    });
    await loadData();
  };

  const getNotificationIcon = (type) => {
    const icons = {
      milestone_approved: <CheckCircle className="w-5 h-5 text-green-600" />,
      revision_requested: <Clock className="w-5 h-5 text-amber-600" />,
      payment_released: <DollarSign className="w-5 h-5 text-blue-600" />,
      new_message: <MessageSquare className="w-5 h-5 text-purple-600" />,
      project_update: <Briefcase className="w-5 h-5 text-slate-600" />,
      default: <Bell className="w-5 h-5 text-slate-400" />
    };
    return icons[type] || icons.default;
  };

  const groupNotificationsByProject = () => {
    const grouped = {};
    notifications.forEach(notif => {
      if (notif.related_project_id) {
        if (!grouped[notif.related_project_id]) {
          grouped[notif.related_project_id] = [];
        }
        grouped[notif.related_project_id].push(notif);
      }
    });
    return grouped;
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.is_read;
    if (filter === "high") return n.priority === "high";
    return n.type === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]" />
      </div>
    );
  }

  const isInvestor = client?.client_type === "investor";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#1a1a2e]">
                {isInvestor ? "مركز الإشعارات" : "الإشعارات"}
              </h1>
              <p className="text-slate-600 mt-1">
                {isInvestor 
                  ? "ملخص تحديثات جميع مشاريعك في مكان واحد"
                  : "تابع آخر التحديثات والإشعارات"}
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {notifications.filter(n => !n.is_read).length} جديد
            </Badge>
          </div>

          <Tabs defaultValue={isInvestor ? "by-project" : "all"} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto">
              {isInvestor && (
                <TabsTrigger value="by-project">حسب المشروع</TabsTrigger>
              )}
              <TabsTrigger value="all">الكل</TabsTrigger>
              <TabsTrigger value="unread">غير مقروء</TabsTrigger>
            </TabsList>

            {isInvestor && (
              <TabsContent value="by-project" className="space-y-4">
                {Object.entries(groupNotificationsByProject()).map(([projectId, notifs]) => {
                  const project = projects.find(p => p.id === projectId);
                  return (
                    <Card key={projectId}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-[#d4a574]" />
                            {project?.title || "مشروع"}
                          </span>
                          <Badge>{notifs.length} تحديث</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {notifs.slice(0, 3).map(notif => (
                          <div
                            key={notif.id}
                            className="p-3 border rounded-lg hover:border-[#d4a574] transition-all"
                          >
                            <div className="flex items-start gap-3">
                              {getNotificationIcon(notif.type)}
                              <div className="flex-1">
                                <p className="font-medium text-sm">{notif.title}</p>
                                <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                                <span className="text-xs text-slate-400 mt-2 block">
                                  {new Date(notif.created_date).toLocaleString('ar-SA')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {notifs.length > 3 && (
                          <Button variant="ghost" size="sm" className="w-full">
                            عرض {notifs.length - 3} إشعارات إضافية
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
            )}

            <TabsContent value="all" className="space-y-3">
              {filteredNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Card className={!notif.is_read ? "border-l-4 border-l-blue-600" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getNotificationIcon(notif.type)}
                          <div className="flex-1">
                            <p className="font-medium">{notif.title}</p>
                            <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                            <span className="text-xs text-slate-400 mt-2 block">
                              {new Date(notif.created_date).toLocaleString('ar-SA')}
                            </span>
                          </div>
                        </div>
                        {!notif.is_read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notif.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="unread" className="space-y-3">
              {filteredNotifications.filter(n => !n.is_read).map((notif) => (
                <Card key={notif.id} className="border-l-4 border-l-blue-600">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getNotificationIcon(notif.type)}
                        <div className="flex-1">
                          <p className="font-medium">{notif.title}</p>
                          <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                          <span className="text-xs text-slate-400 mt-2 block">
                            {new Date(notif.created_date).toLocaleString('ar-SA')}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(notif.id)}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}