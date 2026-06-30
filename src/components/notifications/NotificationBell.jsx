import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Bell, CheckCircle, Briefcase, DollarSign, MessageSquare, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_ICONS = {
  approval: "✅",
  project_update: "📊",
  payment: "💰",
  withdrawal: "💵",
  new_message: "💬",
  review: "📝",
  milestone: "🎯",
  system: "🔔"
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
    
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === "create") {
        setNotifications((prev) => [event.data, ...prev].slice(0, 10));
        setUnreadCount((prev) => prev + 1);
      } else if (event.type === "update") {
        setNotifications((prev) => prev.map((n) => n.id === event.id ? event.data : n));
        if (event.data.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } else if (event.type === "delete") {
        setNotifications((prev) => prev.filter((n) => n.id !== event.id));
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
    }
  };

  const markAllAsRead = async () => {
    try {
      const user = await base44.auth.me();
      const unread = notifications.filter((n) => !n.is_read);
      await Promise.all(
        unread.map((n) => base44.entities.Notification.update(n.id, { is_read: true }))
      );
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error("Error marking as read:", e);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-slate-100"
          aria-label="الإشعارات"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="font-semibold text-sm">الإشعارات</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 text-xs"
            >
              <CheckCircle className="w-3 h-3 ml-1" />
              الكل كمقروء
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            لا توجد إشعارات
          </div>
        ) : (
          <>
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} asChild>
                <Link
                  to={createPageUrl("NotificationCenter")}
                  className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${
                    !n.is_read ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xl shrink-0">
                    {TYPE_ICONS[n.type] || "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${!n.is_read ? "text-slate-900" : "text-slate-700"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {n.message}
                    </p>
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
                className="text-center text-sm text-[#d4a574] font-medium p-2 hover:bg-amber-50"
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