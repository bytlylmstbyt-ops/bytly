import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { uploadProjectFile } from "@/lib/projectFileStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Paperclip, Users, Shield, Loader2, AlertTriangle, Video, Phone, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import FilePreview from "./FilePreview";
import { motion, AnimatePresence } from "framer-motion";
import CallManager from "../calls/CallManager";

export default function EnhancedChatWindow({ conversation, currentUserEmail, onClose, projectData }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sensitiveWarning, setSensitiveWarning] = useState(null);
  const [chatError, setChatError] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const callManager = CallManager({
    conversationId: conversation.id,
    currentUserEmail,
    recipientData: {
      name: conversation.participant_roles?.engineer || conversation.participant_roles?.client || 'مستخدم',
      avatar: null
    }
  });
  const GoogleMeetButton = callManager.GoogleMeetButton;

  useEffect(() => {
    let alive = true;
    loadMessages();
    const channel = supabase
      .channel(`chat-messages-${conversation.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversation.id}`,
      }, payload => {
        if (!alive) return;
        if (payload.eventType === "INSERT") {
          const message = mapMessage(payload.new);
          setMessages(prev => {
            if (prev.some(item => item.id === message.id)) return prev;
            return [...prev.filter(item => !(item._optimistic && item.sender_user_id === message.sender_user_id)), message]
              .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
          });
          if (payload.new.sender_user_id !== currentUserIdRef.current) playNotificationSound();
          setTimeout(scrollToBottom, 100);
        } else if (payload.eventType === "UPDATE") {
          const message = mapMessage(payload.new);
          setMessages(prev => prev.map(item => item.id === message.id ? message : item));
        } else if (payload.eventType === "DELETE") {
          setMessages(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [conversation.id, currentUserEmail]);

  const currentUserIdRef = useRef(null);
  const mapMessage = row => ({
    ...row,
    content: row.body || "",
    sender_email: row.sender_email || "",
    sender_name: row.sender_name || "مستخدم",
    sender_role: row.sender_role || "user",
    created_date: row.created_at,
    attachments: row.attachments || [],
  });

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) { /* ignore */ }
  };

  const loadMessages = async () => {
    setChatError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData?.user;
      if (!user?.id) throw new Error("انتهت الجلسة؛ سجّل الدخول مجددًا.");
      currentUserIdRef.current = user.id;
      const { data, error } = await supabase
        .from("messages").select("*").eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true }).limit(500);
      if (error) throw error;
      setMessages((data || []).map(mapMessage));
      scrollToBottom();
    } catch (error) {
      console.error("Error loading messages from Supabase:", error);
      setChatError(error?.message || "تعذر تحميل الرسائل.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleFileUpload = async (files) => {
    if (!files?.length) return;
    if (!conversation.project_id) {
      toast.error("رفع المرفقات متاح حاليًا داخل محادثة مرتبطة بمشروع.");
      return;
    }
    setUploading(true);
    setChatError("");
    try {
      const attachments = [];
      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) throw new Error("الحد الأقصى لحجم الملف 20 ميجابايت.");
        const url = await uploadProjectFile(conversation.project_id, file);
        attachments.push({ name: file.name, url, size: file.size, type: file.type || "application/octet-stream" });
      }
      await sendMessageWithAttachments(attachments);
    } catch (error) {
      console.error("Chat file upload failed:", error);
      setChatError(error?.message || "تعذر رفع المرفقات.");
      toast.error("تعذر رفع المرفقات. تأكدي من صلاحية الوصول للمشروع.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sendMessageWithAttachments = async (attachments) => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const user = authData?.user;
    if (!user?.id) throw new Error("سجّل الدخول لإرسال المرفقات.");
    const content = attachments.length ? `📎 ${attachments.length} ملف(ات) مرفقة` : "";
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      project_id: conversation.project_id || null,
      sender_user_id: user.id,
      sender_email: user.email || currentUserEmail,
      sender_name: user.user_metadata?.full_name || user.email || "مستخدم",
      sender_role: getUserRole(),
      body: content,
      message_type: "attachment",
      attachments,
    });
    if (error) throw error;
    await loadMessages();
  };

  const handleSendMessage = async () => {
    const raw = newMessage.trim();
    if (!raw || sending) return;
    const optimisticId = `optimistic-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: optimisticId,
      conversation_id: conversation.id,
      sender_user_id: currentUserIdRef.current,
      sender_email: currentUserEmail,
      sender_name: "أنت",
      sender_role: getUserRole(),
      content: raw,
      created_date: new Date().toISOString(),
      _optimistic: true,
    }]);
    setNewMessage("");
    setTimeout(scrollToBottom, 50);
    setSending(true);
    setChatError("");
    setSensitiveWarning(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData?.user;
      if (!user?.id) throw new Error("انتهت الجلسة؛ سجّل الدخول مجددًا.");
      // Conservative client-side masking replaces the removed legacy filter. Never persist the raw input.
      const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
      const phonePattern = /(?:\+?\d[\d\s().-]{7,}\d)/g;
      let filtered = raw;
      const foundSensitive = emailPattern.test(raw) || phonePattern.test(raw);
      emailPattern.lastIndex = 0;
      phonePattern.lastIndex = 0;
      filtered = filtered.replace(emailPattern, "[بريد محجوب]").replace(phonePattern, "[رقم محجوب]");
      if (foundSensitive) {
        setSensitiveWarning("حُجبت بعض بيانات الاتصال قبل حفظ الرسالة. راجعي النص قبل الإرسال إذا كان الحجب غير مقصود.");
      }
      const { data, error } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        project_id: conversation.project_id || null,
        sender_user_id: user.id,
        sender_email: user.email || currentUserEmail,
        sender_name: user.user_metadata?.full_name || user.email || "مستخدم",
        sender_role: getUserRole(),
        body: filtered,
        original_content: null,
        has_sensitive_data: foundSensitive,
        message_type: "text",
      }).select("*").single();
      if (error) throw error;
      const mapped = mapMessage(data);
      setMessages(prev => prev.map(item => item.id === optimisticId ? mapped : item));
      setNewMessage("");
    } catch (error) {
      setMessages(prev => prev.filter(item => item.id !== optimisticId));
      setNewMessage(raw);
      setChatError(error?.message || "تعذر إرسال الرسالة.");
      toast.error("تعذر إرسال الرسالة");
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

  const renderMessageContent = (content, isSystem) => {
    const parts = String(content || '').split(/(https?:\/\/[^\s]+)/g);
    return parts.map((part, index) => {
      if (/^https?:\/\//i.test(part)) {
        return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className={`underline font-medium break-all ${isSystem ? 'text-emerald-800' : 'text-blue-200'}`}>{part}</a>;
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  if (loading) {
    return <Card><CardContent className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></CardContent></Card>;
  }

  return (
    <Card className="flex flex-col h-[600px]">
      {chatError && <div role="alert" className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{chatError}</div>}
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3"><Users className="w-5 h-5 text-[#C9A66B]" /><span>{conversation.name || "غرفة المشروع الرئيسية"}</span></div>
          <div className="flex items-center gap-2">
            <button onClick={() => callManager.startCall(false)} disabled={callManager.isCallActive} className="p-2 hover:bg-gray-100 rounded-full transition disabled:opacity-50" title="مكالمة صوتية"><Phone size={20} className="text-gray-600" /></button>
            <button onClick={() => callManager.startCall(true)} disabled={callManager.isCallActive} className="p-2 hover:bg-gray-100 rounded-full transition disabled:opacity-50" title="مكالمة فيديو"><Video size={20} className="text-gray-600" /></button>
            <GoogleMeetButton />
            <button className="p-2 hover:bg-gray-100 rounded-full transition" title="المزيد"><MoreVertical size={20} className="text-gray-600" /></button>
            <Badge variant="outline" className="flex items-center gap-1"><Shield className="w-3 h-3" />محمية</Badge>
          </div>
        </CardTitle>
        {conversation.is_main_room && <p className="text-xs text-slate-500 mt-1">جميع الأطراف: العميل • المهندس • الشركة الاستشارية</p>}
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => {
            const isMe = message.sender_email === currentUserEmail;
            const roleBadge = getRoleBadge(message.sender_role);
            return (
              <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {!isMe && <div className="flex items-center gap-2"><Avatar className="w-6 h-6"><AvatarFallback className="text-xs">{message.sender_name?.charAt(0)}</AvatarFallback></Avatar><span className="text-xs font-medium">{message.sender_name}</span><Badge className={`text-xs ${roleBadge.color}`}>{roleBadge.text}</Badge></div>}
                  <div className={`rounded-lg p-3 ${isMe ? 'bg-blue-600 text-white' : message.is_system_message ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-slate-100 text-slate-900'}`}>
                    <p className="text-sm whitespace-pre-wrap">{renderMessageContent(message.content, message.is_system_message)}</p>
                    {message.has_sensitive_data && <div className="flex items-center gap-1 mt-2 text-xs opacity-75"><AlertTriangle className="w-3 h-3" /><span>تم حجب معلومات اتصال</span></div>}
                    {message.attachments?.length > 0 && <div className="mt-2 space-y-2">{message.attachments.map((att, idx) => <FilePreview key={idx} attachment={att} canMarkOfficial={!isMe} onMarkOfficial={() => {}} />)}</div>}
                  </div>
                  <span className="text-xs text-slate-500">{new Date(message.created_date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="border-t p-4 space-y-2">
        {sensitiveWarning && <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800"><AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /><p>{sensitiveWarning}</p></div>}
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} multiple accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleFileUpload(Array.from(e.target.files))} />
          <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploading}>{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}</Button>
          <Input placeholder="اكتب رسالتك..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} disabled={sending} />
          <Button onClick={handleSendMessage} disabled={sending || (!newMessage.trim() && !uploading)} className="bg-gradient-to-r from-blue-600 to-indigo-600">{sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</Button>
        </div>
        <p className="text-xs text-slate-500 text-center">🔒 جميع المحادثات محمية ومؤرشفة للرجوع إليها عند الحاجة</p>
      </div>
    </Card>
  );
}