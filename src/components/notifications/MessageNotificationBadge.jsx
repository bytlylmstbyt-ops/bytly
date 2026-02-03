import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";

export default function MessageNotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  useEffect(() => {
    loadUnreadCount();
    
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUserEmail(user.email);
      } catch (error) {
        console.log("Not authenticated");
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!currentUserEmail) return;

    // Subscribe to real-time message updates
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create' && event.data?.sender_email !== currentUserEmail) {
        // New message from someone else
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification('رسالة جديدة في بيتلي', {
            body: `${event.data.sender_name}: ${event.data.content?.substring(0, 50)}...`,
            icon: '/favicon.ico'
          });
        }
      }
    });

    return () => unsubscribe();
  }, [currentUserEmail]);

  const loadUnreadCount = async () => {
    try {
      const user = await base44.auth.me();
      
      // Get all conversations where user is a participant
      const allConversations = await base44.entities.Conversation.list();
      const conversations = allConversations.filter(c => 
        c.participants && c.participants.includes(user.email)
      );

      const conversationIds = conversations.map(c => c.id);
      
      // Count unread messages
      let count = 0;
      for (const convId of conversationIds) {
        const messages = await base44.entities.Message.filter({
          conversation_id: convId,
          is_read: false
        });
        // Only count messages not sent by current user
        count += messages.filter(m => m.sender_email !== user.email).length;
      }
      
      setUnreadCount(count);
    } catch (error) {
      console.log("Error loading unread count:", error);
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (unreadCount === 0) return null;

  return (
    <div className="relative">
      <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center p-0 rounded-full">
        {unreadCount > 9 ? '9+' : unreadCount}
      </Badge>
    </div>
  );
}