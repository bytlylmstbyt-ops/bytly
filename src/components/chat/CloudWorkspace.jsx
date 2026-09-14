import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  Cloud, MessageSquare, CheckSquare, Send,
  ShieldCheck, MapPin, UserCheck, Loader2, FolderOpen,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

const STATUS_LABELS = {
  open: "مفتوح", in_progress: "جارٍ التنفيذ", completed: "مكتمل",
  awaiting_technical_review: "بانتظار المراجعة الفنية",
  technical_approved: "اعتماد فني", pending_client_approval: "موافقة العميل",
};

export default function CloudWorkspace({ user, usersMap, onBack }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) loadMessages(selectedProject.id);
  }, [selectedProject]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await base44.entities.Project.filter(
        { client_id: user.id, status: { $in: ["in_progress", "awaiting_technical_review", "technical_approved", "pending_client_approval"] } },
        "-created_date", 50
      );
      setProjects(data || []);
      if (data && data.length > 0) setSelectedProject(data[0]);
    } catch (e) {
      console.error("load projects error", e);
    }
    setLoading(false);
  };

  const loadMessages = async (projectId) => {
    try {
      const convos = await base44.entities.Conversation.filter({ project_id: projectId }, "-created_date");
      if (convos && convos.length > 0) {
        const msgs = await base44.entities.Message.filter(
          { conversation_id: convos[0].id }, "created_date"
        );
        setMessages(msgs || []);
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.error("load messages error", e);
      setMessages([]);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedProject || !user) return;
    setSending(true);
    try {
      let convo = await base44.entities.Conversation.filter({ project_id: selectedProject.id });
      let conversationId;
      if (convo && convo.length > 0) {
        conversationId = convo[0].id;
      } else {
        const participants = [user.email];
        if (selectedProject.assigned_engineer_id) participants.push(selectedProject.assigned_engineer_id);
        if (selectedProject.technical_consultant_id) participants.push(selectedProject.technical_consultant_id);
        const newConvo = await base44.entities.Conversation.create({
          project_id: selectedProject.id,
          participants,
          type: "group",
          name: selectedProject.title,
        });
        conversationId = newConvo.id;
      }
      const msg = await base44.entities.Message.create({
        conversation_id: conversationId,
        project_id: selectedProject.id,
        sender_email: user.email,
        sender_name: user.full_name,
        sender_role: "client",
        content: newMessage.trim(),
      });
      setMessages(prev => [...prev, msg]);
      setNewMessage("");
    } catch (e) {
      console.error("send error", e);
    }
    setSending(false);
  };

  const getEngineerName = (p) => {
    if (!p.assigned_engineer_id) return "لم يُعيّن بعد";
    const eng = usersMap && Object.values(usersMap).find(u => u.id === p.assigned_engineer_id);
    return eng?.full_name || "المهندس المعتمد";
  };

  const getConsultantName = (p) => {
    if (!p.technical_consultant_id) return "لم يُعيّن بعد";
    const con = usersMap && Object.values(usersMap).find(u => u.id === p.technical_consultant_id);
    return con?.full_name || "مستشار بيتلي";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-20" dir="rtl">
        <Cloud className="w-16 h-16 mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500 text-sm">لا توجد عقود نشطة حالياً</p>
        {onBack && (
          <Button variant="outline" onClick={onBack} className="mt-4 gap-1">
            <ChevronLeft className="w-4 h-4" />
            العودة للمحادثات
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#f9f9f9]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-2 -mr-2 gap-1 text-slate-500">
          <ChevronLeft className="w-4 h-4" />
          المحادثات
        </Button>
      )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3f0e8] text-[#a38a5a] text-xs font-medium mb-3">
            <Cloud className="w-3.5 h-3.5" />
            بيئة عمل سحابية موحدة
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#333] mb-2">مساحة العمل السحابية وعقودك النشطة</h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
            استكشف البيئة السحابية لبيتلي. هنا يمكنك التواصل مباشرة مع المصمم المعتمد، ومراجعة وتنزيل مخططاتك الهندسية،
            ومتابعة قائمة المهام والموافقات التعاقدية تحت إشراف مستشارنا المعتمد.
          </p>
        </div>

        {/* Project selector (if multiple) */}
        {projects.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedProject?.id === p.id
                    ? "bg-[#C9A66B] text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        )}

        {/* Main split layout */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Chat Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col" style={{ minHeight: "500px" }}>
              {/* Chat Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#C9A66B]" />
                  <h3 className="font-bold text-[#333] text-sm">
                    الدردشة الهندسية مع {getEngineerName(selectedProject).replace("م. ", "")} والمستشار
                  </h3>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f3f0e8] text-[#a38a5a] text-[10px] font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  جلسة محكومة رسمياً
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4 bg-[#fafafa]" style={{ maxHeight: "400px" }}>
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm text-slate-400">لا توجد رسائل بعد. ابدأ المحادثة مع المصمم والمستشار.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.sender_email === user?.email;
                      const isConsultant = msg.sender_role === "consultant" || msg.sender_role === "firm";
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-2 ${isOwn ? "justify-start" : "justify-end"}`}
                        >
                          {!isOwn && (
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback className={`text-white text-xs ${isConsultant ? "bg-blue-500" : "bg-[#6B5D4F]"}`}>
                                {(msg.sender_name || msg.sender_email)?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="max-w-[70%]">
                            {!isOwn && (
                              <p className="text-xs font-medium text-slate-600 mb-1 text-right">
                                {msg.sender_name || msg.sender_email}
                                <span className={`mr-2 text-[10px] px-1.5 py-0.5 rounded-full ${isConsultant ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                                  {isConsultant ? "مستشار" : "مصمم"}
                                </span>
                              </p>
                            )}
                            <div className={`rounded-2xl px-4 py-2.5 ${
                              isOwn
                                ? "bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white rounded-br-none"
                                : "bg-white shadow-sm rounded-bl-none border border-slate-100"
                            }`}>
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                            </div>
                            <p className={`text-[10px] text-slate-400 mt-1 ${isOwn ? "text-right" : "text-left"}`}>
                              {new Date(msg.created_date).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="اكتب ملاحظة أو استفسار بخصوص المخططات للمصممة والمستشار..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1 px-4 py-2.5 bg-[#f9f9f9] border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#C9A66B] transition-colors"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    className="bg-[#333] hover:bg-[#1a1a2e] text-white rounded-xl px-5 gap-1.5"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    إرسال
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Project Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sticky top-24">
              <div className="mb-4">
                <p className="text-xs text-[#C9A66B] font-medium mb-1">
                  مشروع رقم: {selectedProject?.id?.slice(-6).toUpperCase() || "—"}
                </p>
                <h3 className="text-lg font-bold text-[#333]">{selectedProject?.title}</h3>
                {selectedProject?.location && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedProject.location}
                  </p>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                    <UserCheck className="w-3 h-3" />
                    المصمم المعتمد:
                  </p>
                  <p className="text-xs font-medium text-[#333] text-left">{getEngineerName(selectedProject)}</p>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3 h-3" />
                    المستشار المراجع من بيتلي:
                  </p>
                  <p className="text-xs font-medium text-[#333] text-left">{getConsultantName(selectedProject)}</p>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-slate-400 shrink-0">الحالة التعاقدية الحالية:</p>
                  <p className="text-xs font-medium text-[#C9A66B] text-left">
                    {STATUS_LABELS[selectedProject?.status] || selectedProject?.status}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 mt-4">
                <Button
                  onClick={() => setActiveTab("chat")}
                  className="w-full bg-[#C9A66B] hover:bg-[#b8955a] text-white gap-2 justify-center"
                >
                  <MessageSquare className="w-4 h-4" />
                  الدردشة الهندسية
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-[#f9f9f9] border-slate-200 text-[#333] gap-2 justify-center hover:bg-slate-100"
                >
                  <FolderOpen className="w-4 h-4" />
                  المخططات والمستندات
                  {selectedProject?.attachments?.length > 0 && (
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                      {selectedProject.attachments.length} ملفات
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-[#f9f9f9] border-slate-200 text-[#333] gap-2 justify-center hover:bg-slate-100"
                >
                  <CheckSquare className="w-4 h-4" />
                  المهام والموافقات
                </Button>
              </div>

              {/* Progress indicator */}
              {selectedProject?.max_revisions > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">تقدم الموافقات</span>
                    <span className="font-semibold text-[#C9A66B]">
                      {selectedProject.revisions_count || 0}/{selectedProject.max_revisions}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] rounded-full transition-all"
                      style={{ width: `${Math.min(((selectedProject.revisions_count || 0) / selectedProject.max_revisions) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}