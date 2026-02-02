import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send, Paperclip, Users, Shield, Loader2, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import FilePreview from "./FilePreview";
import { motion, AnimatePresence } from "framer-motion";

export default function EnhancedChatWindow({ 
  conversation, 
  currentUserEmail, 
  onClose,
  projectData 
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sensitiveWarning, setSensitiveWarning] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [conversation.id]);

  const loadMessages = async () => {
    try {
      const msgs = await base44.entities.Message.filter(
        { conversation_id: conversation.id },
        "created_date"
      );
      setMessages(msgs);
      scrollToBottom();
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileUpload = async (files) => {
    setUploading(true);
    try {
      const attachments = [];
      
      for (const file of files) {
        const { data } = await base44.functions.invoke('uploadFile', { file });
        attachments.push({
          name: file.name,
          url: data.file_url,
          size: file.size,
          type: file.type
        });
      }

      await sendMessageWithAttachments(attachments);
    } catch (error) {
      toast.error("خطأ في رفع الملفات");
    } finally {
      setUploading(false);
    }
  };

  const sendMessageWithAttachments = async (attachments) => {
    const user = await base44.auth.me();
    
    await base44.entities.Message.create({
      conversation_id: conversation.id,
      project_id: conversation.project_id,
      sender_email: currentUserEmail,
      sender_name: user.full_name,
      sender_role: getUserRole(),
      content: attachments.length > 0 ? `📎 ${attachments.length} ملف(ات) مرفقة` : "",
      attachments
    });

    await loadMessages();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !uploading) return;

    setSending(true);
    setSensitiveWarning(null);
    
    try {
      const user = await base44.auth.me();
      
      // Filter sensitive data
      const { data: filterResult } = await base44.functions.invoke(
        'filterSensitiveData',
        { content: newMessage }
      );

      if (filterResult.hasSensitiveData) {
        setSensitiveWarning(filterResult.warning);
      }

      await base44.entities.Message.create({
        conversation_id: conversation.id,
        project_id: conversation.project_id,
        sender_email: currentUserEmail,
        sender_name: user.full_name,
        sender_role: getUserRole(),
        content: filterResult.filteredContent,
        original_content: filterResult.originalContent,
        has_sensitive_data: filterResult.hasSensitiveData
      });

      // Update last message in conversation
      await base44.entities.Conversation.update(conversation.id, {
        last_message: filterResult.filteredContent.substring(0, 100),
        last_message_date: new Date().toISOString()
      });

      setNewMessage("");
      await loadMessages();
    } catch (error) {
      toast.error("خطأ في إرسال الرسالة");
    } finally {
      setSending(false);
    }
  };

  const getUserRole = () => {
    const roles = conversation.participant_roles || {};
    if (roles.client === currentUserEmail) return "client";
    if (roles.engineer === currentUserEmail) return "engineer";
    if (roles.firm === currentUserEmail) return "firm";
    return "user";
  };

  const getRoleBadge = (role) => {
    const badges = {
      client: { text: "العميل", color: "bg-blue-100 text-blue-700" },
      engineer: { text: "المهندس", color: "bg-green-100 text-green-700" },
      firm: { text: "الشركة الاستشارية", color: "bg-purple-100 text-purple-700" },
      admin: { text: "الإدارة", color: "bg-slate-100 text-slate-700" }
    };
    return badges[role] || badges.admin;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-[#d4a574]" />
            <span>{conversation.name || "غرفة المشروع الرئيسية"}</span>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            محمية
          </Badge>
        </CardTitle>
        
        {conversation.is_main_room && (
          <p className="text-xs text-slate-500 mt-1">
            جميع الأطراف: العميل • المهندس • الشركة الاستشارية
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => {
            const isMe = message.sender_email === currentUserEmail;
            const roleBadge = getRoleBadge(message.sender_role);
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {!isMe && (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {message.sender_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{message.sender_name}</span>
                      <Badge className={`text-xs ${roleBadge.color}`}>
                        {roleBadge.text}
                      </Badge>
                    </div>
                  )}
                  
                  <div className={`rounded-lg p-3 ${
                    isMe 
                      ? 'bg-blue-600 text-white' 
                      : message.is_system_message 
                        ? 'bg-amber-50 border border-amber-200 text-amber-900'
                        : 'bg-slate-100 text-slate-900'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {message.has_sensitive_data && (
                      <div className="flex items-center gap-1 mt-2 text-xs opacity-75">
                        <AlertTriangle className="w-3 h-3" />
                        <span>تم حجب معلومات اتصال</span>
                      </div>
                    )}

                    {message.attachments?.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((att, idx) => (
                          <FilePreview
                            key={idx}
                            attachment={att}
                            canMarkOfficial={!isMe}
                            onMarkOfficial={() => {}}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <span className="text-xs text-slate-500">
                    {new Date(message.created_date).toLocaleTimeString('ar-SA', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="border-t p-4 space-y-2">
        {sensitiveWarning && (
          <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{sensitiveWarning}</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => handleFileUpload(Array.from(e.target.files))}
          />
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>

          <Input
            placeholder="اكتب رسالتك..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={sending}
          />

          <Button
            onClick={handleSendMessage}
            disabled={sending || (!newMessage.trim() && !uploading)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        <p className="text-xs text-slate-500 text-center">
          🔒 جميع المحادثات محمية ومؤرشفة للرجوع إليها عند الحاجة
        </p>
      </div>
    </Card>
  );
}