import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to real-time updates
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === "create") {
        setNotifications((prev) => [event.data, ...prev]);
        if (!event.data.is_read) {
          setUnreadCount((prev) => prev + 1);
        }
      } else if (event.type === "update") {
        setNotifications((prev) => prev.map((n) => n.id === event.id ? event.data : n));
        if (event.data.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } else if (event.type === "delete") {
        setNotifications((prev) => prev.filter((n) => n.id !== event.id));
        if (!event.data.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loadNotifications = async () => {
    try {
      const user = await base44.auth.me();
      const notifs = await base44.entities.Notification.filter(
        { recipient_email: user.email },
        "-created_date",
        10
      );
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.is_read).length);
    } catch (e) {
      console.error("Error loading notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  const TYPE_ICONS = {
    approval: "✅",
    project_update: "📊",
    payment: "💰",
    withdrawal: "💸",
    new_message: "💬",
    review: "📝",
    milestone: "🎯",
    system: "🔔"
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative w-10 h-10 p-0">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-2 border-b">
          <span className="text-sm font-semibold">الإشعارات</span>
          {unreadCount > 0 && (
            <span className="text-xs text-red-500">{unreadCount} غير مقروء</span>
          )}
        </div>
        
        {loading ? (
          <div className="p-4 text-center text-sm text-slate-500">جارٍ التحميل...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">لا توجد إشعارات جديدة</div>
        ) : (
          <>
            {notifications.slice(0, 10).map((n) => (
              <DropdownMenuItem key={n.id} asChild>
                <Link 
                  to={createPageUrl("NotificationCenter")}
                  className={`flex items-start gap-2 p-2 cursor-pointer ${!n.is_read ? "bg-blue-50" : ""}`}
                >
                  <span className="text-lg">{TYPE_ICONS[n.type] || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${!n.is_read ? "font-bold" : ""}`}>{n.title}</p>
                    <p className="text-xs text-slate-500 truncate">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(n.created_date).toLocaleDateString("ar-SA", { 
                        month: "short", 
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link 
                to={createPageUrl("NotificationCenter")}
                className="text-center text-sm text-[#d4a574] font-medium p-2"
              >
                عرض كل الإشعارات
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}