import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, X, FileText, Image, Download, Loader2, MessageSquare, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const FILE_ICONS = { pdf: "📄", dwg: "📐", dxf: "📐", png: "🖼️", jpg: "🖼️", jpeg: "🖼️", zip: "🗜️" };
const getExt = (url) => url?.split(".").pop()?.toLowerCase() || "";
const isImage = (url) => ["jpg","jpeg","png","gif","webp"].includes(getExt(url));

function ChatMessage({ msg, currentUserEmail }) {
  const isMine = msg.sender_email === currentUserEmail;
  const time = new Date(msg.created_date).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
    >
      <Avatar className="w-8 h-8 shrink-0 mt-1">
        <AvatarFallback className={`text-xs text-white ${isMine ? "bg-[#d4a574]" : "bg-[#1a1a2e]"}`}>
          {msg.sender_name?.charAt(0) || "؟"}
        </AvatarFallback>
      </Avatar>

      <div className={`max-w-[70%] space-y-1 ${isMine ? "items-end" : "items-start"} flex flex-col`}>
        <span className="text-xs text-slate-400">{msg.sender_name}</span>

        {/* Text content */}
        {msg.content && (
          <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isMine
              ? "bg-gradient-to-br from-[#d4a574] to-[#c49060] text-white rounded-tr-sm"
              : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
          }`}>
            {msg.content}
          </div>
        )}

        {/* Attachments */}
        {msg.attachments?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {msg.attachments.map((att, i) => (
              <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 hover:border-[#d4a574] transition-all shadow-sm max-w-[200px]">
                {isImage(att.url) ? (
                  <div className="relative">
                    <img src={att.url} alt={att.name} className="w-16 h-16 object-cover rounded-lg" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                      <Download className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-xl">{FILE_ICONS[getExt(att.url)] || "📎"}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{att.name}</p>
                      <p className="text-xs text-slate-400 uppercase">{getExt(att.url)}</p>
                    </div>
                    <Download className="w-3.5 h-3.5 text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </>
                )}
              </a>
            ))}
          </div>
        )}

        <span className="text-xs text-slate-300">{time}</span>
      </div>
    </motion.div>
  );
}

export default function ProjectChat({ projectId, project, currentUser, engineerName }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  // Determine conversation ID (use projectId as unique key)
  const conversationId = `project_chat_${projectId}`;

  useEffect(() => {
    loadMessages();
    // Real-time subscription
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.conversation_id === conversationId) {
        setMessages(prev => {
          if (event.type === "create") return [...prev, event.data];
          if (event.type === "update") return prev.map(m => m.id === event.id ? event.data : m);
          if (event.type === "delete") return prev.filter(m => m.id !== event.id);
          return prev;
        });
      }
    });
    return unsub;
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    const msgs = await base44.entities.Message.filter({ conversation_id: conversationId }, "created_date", 100);
    setMessages(msgs);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push({ name: file.name, url: file_url });
    }
    setPendingFiles(prev => [...prev, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  };

  const handleSend = async () => {
    if (!text.trim() && pendingFiles.length === 0) return;
    setSending(true);
    await base44.entities.Message.create({
      conversation_id: conversationId,
      project_id: projectId,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name || currentUser.email,
      sender_role: "client",
      content: text.trim(),
      attachments: pendingFiles,
      is_read: false,
    });
    setText("");
    setPendingFiles([]);
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[520px] bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#1a1a2e] to-[#2d2d4e] text-white shrink-0">
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-[#d4a574]" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">دردشة المشروع</h3>
          <p className="text-xs text-white/50">{engineerName ? `مع ${engineerName}` : "قناة التواصل الخاصة بالمشروع"}</p>
        </div>
        <div className="mr-auto flex items-center gap-1 text-xs text-white/50">
          <Shield className="w-3.5 h-3.5 text-green-400" />
          <span>محمي</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <MessageSquare className="w-10 h-10 text-slate-200" />
            <p className="text-sm">لا توجد رسائل بعد. ابدأ المحادثة!</p>
          </div>
        )}
        {messages.map(msg => (
          <ChatMessage key={msg.id} msg={msg} currentUserEmail={currentUser.email} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Pending files preview */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="px-4 pt-2 flex flex-wrap gap-2 bg-white border-t border-slate-100 overflow-hidden">
            {pendingFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
                <span>{FILE_ICONS[getExt(f.url)] || "📎"}</span>
                <span className="max-w-[100px] truncate">{f.name}</span>
                <button onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                  className="text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="px-3 py-3 bg-white border-t border-slate-100 flex items-end gap-2 shrink-0">
        <input type="file" ref={fileRef} multiple className="hidden"
          accept="image/*,.pdf,.dwg,.dxf,.zip,.rar"
          onChange={handleFileSelect} />

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors shrink-0 mb-0.5">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </button>

        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب رسالتك... (Enter للإرسال)"
          rows={1}
          className="resize-none flex-1 text-sm min-h-[38px] max-h-[120px] rounded-xl border-slate-200 focus:border-[#d4a574]"
          style={{ overflow: text.split("\n").length > 3 ? "auto" : "hidden" }}
        />

        <Button
          onClick={handleSend}
          disabled={sending || (!text.trim() && pendingFiles.length === 0)}
          className="w-9 h-9 p-0 rounded-xl bg-gradient-to-br from-[#d4a574] to-[#c49060] hover:opacity-90 shrink-0 mb-0.5">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}