import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Users } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

export default function ChatWindow({
  conversation,
  onClose,
  currentUserEmail,
  onParticipantsClick
}) {
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState({});
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessagesAndParticipants();
    subscribeToMessages();
  }, [conversation.id]);

  const loadMessagesAndParticipants = async () => {
    try {
      const msgs = await base44.entities.Message.filter({
        conversation_id: conversation.id
      });
      setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));

      // Load participant data
      const participantMap = {};
      for (const email of conversation.participants) {
        const engineers = await base44.entities.Engineer.filter({ email });
        if (engineers.length > 0) {
          participantMap[email] = engineers[0];
        }
      }
      setParticipants(participantMap);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    return base44.entities.Message.subscribe((event) => {
      if (event.data.conversation_id === conversation.id) {
        if (event.type === "create") {
          setMessages(prev => [...prev, event.data]);

          // Mark as read
          if (event.data.sender_email !== currentUserEmail) {
            base44.entities.Message.update(event.data.id, {
              read_by: [...(event.data.read_by || []), currentUserEmail]
            });
          }
        } else if (event.type === "delete") {
          setMessages(prev => prev.filter(m => m.id !== event.id));
        } else if (event.type === "update") {
          setMessages(prev => prev.map(m => m.id === event.id ? event.data : m));
        }
      }
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (data) => {
    try {
      const user = await base44.auth.me();
      await base44.entities.Message.create({
        conversation_id: conversation.id,
        project_id: conversation.project_id,
        sender_email: user.email,
        sender_name: user.full_name,
        content: data.content,
        attachments: data.attachments
      });

      // حفظ نسخة تلقائية من المرفقات في سجل المشروع
      if (data.attachments && data.attachments.length > 0 && conversation.project_id) {
        try {
          await base44.functions.invoke("saveChatAttachmentToProject", {
            project_id: conversation.project_id,
            attachments: data.attachments,
            sender_email: user.email,
            sender_name: user.full_name
          });
        } catch (e) {
          console.error("Auto-save attachments to project failed:", e);
        }
      }

      // Update conversation last message
      await base44.entities.Conversation.update(conversation.id, {
        last_message: data.content,
        last_message_date: new Date().toISOString()
      });

      // Send notifications to other participants
      const otherParticipants = conversation.participants.filter(
        p => p !== user.email && !conversation.muted_by?.includes(p)
      );

      for (const email of otherParticipants) {
        await base44.entities.Notification.create({
          recipient_email: email,
          title: `رسالة جديدة من ${user.full_name}`,
          message: data.content.substring(0, 100),
          type: "project_update",
          related_project_id: conversation.project_id,
          priority: "medium"
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await base44.entities.Message.delete(messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const getLastMessageGroup = (index) => {
    if (index === 0) return true;
    const current = messages[index];
    const prev = messages[index - 1];
    return current.sender_email !== prev.sender_email;
  };

  if (loading) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#C9A66B]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 lg:relative lg:inset-auto z-50 flex flex-col bg-white rounded-lg shadow-xl"
    >
      {/* Header */}
      <CardHeader className="border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">{conversation.name || "المحادثة"}</CardTitle>
          <p className="text-xs text-slate-600 mt-1">
            {conversation.participants.length} مشاركين
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onParticipantsClick}
            className="hidden sm:flex"
          >
            <Users className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p>لا توجد رسائل حتى الآن. ابدأ محادثة!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isOwn={msg.sender_email === currentUserEmail}
              showAvatar={getLastMessageGroup(idx)}
              onDelete={handleDeleteMessage}
              senderData={participants[msg.sender_email]}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <ChatInput onMessageSend={handleSendMessage} />
    </motion.div>
  );
}