import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { uploadProjectFile, resolveProjectFileUrl } from "@/lib/projectFileStorage";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, X, Download, Loader2, MessageSquare, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
        <AvatarFallback className={`text-xs text-white ${isMine ? "bg-[#C9A66B]" : "bg-[#1a1a2e]"}`}>
          {msg.sender_name?.charAt(0) || "؟"}
        </AvatarFallback>
      </Avatar>

      <div className={`max-w-[70%] space-y-1 ${isMine ? "items-end" : "items-start"} flex flex-col`}>
        <span className="text-xs text-slate-400">{msg.sender_name}</span>

        {/* Text content */}
        {msg.content && (
          <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isMine
              ? "bg-gradient-to-br from-[#C9A66B] to-[#c49060] text-white rounded-tr-sm"
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
                className="group flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 hover:border-[#C9A66B] transition-all shadow-sm max-w-[200px]">
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
  const [chatError, setChatError] = useState("");
  const [resolvedConversationId, setResolvedConversationId] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    let active = true;
    let channel;
    const initialize = async () => {
      setChatError("");
      if (!supabase || !projectId) return;
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const authUser = authData?.user;
        if (!authUser) throw new Error("يجب تسجيل الدخول لاستخدام دردشة المشروع.");

        const participantIds = [project?.client_user_id].filter(Boolean);
        let assignedEngineerUserId = null;
        if (project?.assigned_engineer_id) {
          const { data: engineer, error: engineerError } = await supabase.from("engineers")
            .select("user_id").eq("id", project.assigned_engineer_id).maybeSingle();
          if (engineerError) throw engineerError;
          assignedEngineerUserId = engineer?.user_id || null;
        }
        let consultantUserId = null;
        if (project?.technical_consultant_id) {
          const { data: consultant, error: consultantError } = await supabase.from("consultants")
            .select("user_id").eq("id", project.technical_consultant_id).maybeSingle();
          if (consultantError) throw consultantError;
          consultantUserId = consultant?.user_id || null;
        }
        const lookupIds = [...new Set([...participantIds, assignedEngineerUserId, consultantUserId].filter(Boolean))];
        const { data: profiles, error: profilesError } = lookupIds.length
          ? await supabase.from("profiles").select("id,user_id,email,full_name").or(
              `user_id.in.(${lookupIds.join(",")}),id.in.(${lookupIds.join(",")})`
            )
          : { data: [], error: null };
        if (profilesError) throw profilesError;
        const participantUserIds = [...new Set([
          project?.client_user_id,
          assignedEngineerUserId,
          consultantUserId,
          ...(profiles || []).map(p => p.user_id).filter(Boolean)
        ].filter(Boolean))];
        const isProjectParticipant = participantUserIds.includes(authUser.id);
        if (!isProjectParticipant) throw new Error("الدردشة متاحة لأطراف المشروع المسجلين فقط.");

        let { data: conversation, error: conversationError } = await supabase
          .from("conversations").select("id,created_by")
          .eq("project_id", projectId).eq("type", "project").maybeSingle();
        if (conversationError) throw conversationError;

        if (!conversation) {
          const { data: created, error: createError } = await supabase.from("conversations").insert({
            project_id: projectId, created_by: authUser.id, type: "project",
            title: project?.title ? `دردشة المشروع: ${project.title}` : "دردشة المشروع",
            participants: [authUser.id, ...participantUserIds]
          }).select("id,created_by").single();
          if (createError) throw createError;
          conversation = created;
          const { error: membershipError } = await supabase.from("conversation_members").upsert(
            { conversation_id: conversation.id, user_id: authUser.id },
            { onConflict: "conversation_id,user_id", ignoreDuplicates: true }
          );
          if (membershipError) throw membershipError;
        } else {
          const { data: membership, error: membershipError } = await supabase.from("conversation_members")
            .select("user_id").eq("conversation_id", conversation.id).eq("user_id", authUser.id).maybeSingle();
          if (membershipError) throw membershipError;
          if (!membership) {
            const { error: addMembershipError } = await supabase.from("conversation_members").insert({ conversation_id: conversation.id, user_id: authUser.id });
            if (addMembershipError) throw addMembershipError;
          }
        }
        if (!active) return;
        setResolvedConversationId(conversation.id);

        const { data: rows, error: messageError } = await supabase.from("messages")
          .select("id,created_at,conversation_id,sender_user_id,body,message_type,attachments,sender_email,sender_name,sender_role")
          .eq("conversation_id", conversation.id).order("created_at", { ascending: true }).limit(200);
        if (messageError) throw messageError;
        const mappedRows = await Promise.all((rows || []).map(async m => ({
          ...m, created_date: m.created_at, content: m.body,
          sender_email: m.sender_email || (m.sender_user_id === authUser.id ? authUser.email : ""),
          attachments: await Promise.all((Array.isArray(m.attachments) ? m.attachments : []).map(async att => ({
            ...att, url: await resolveProjectFileUrl(att.url).catch(() => att.url)
          })))
        })));
        if (active) setMessages(mappedRows);

        channel = supabase.channel(`project-chat-${conversation.id}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversation.id}` }, async payload => {
            if (!active) return;
            if (payload.eventType === "DELETE") {
              setMessages(prev => prev.filter(m => m.id !== payload.old.id));
              return;
            }
            const row = payload.new;
            const attachments = await Promise.all((Array.isArray(row.attachments) ? row.attachments : []).map(async att => ({
              ...att, url: await resolveProjectFileUrl(att.url).catch(() => att.url)
            })));
            if (!active) return;
            const mapped = { ...row, created_date: row.created_at, content: row.body, attachments };
            setMessages(prev => payload.eventType === "INSERT"
              ? (prev.some(m => m.id === mapped.id) ? prev : [...prev, mapped])
              : prev.map(m => m.id === mapped.id ? mapped : m));
          }).subscribe();
      } catch (error) {
        console.error("Project chat initialization failed:", error);
        if (active) setChatError(error?.message || "تعذر تحميل دردشة المشروع.");
      }
    };
    initialize();
    return () => { active = false; if (channel) supabase?.removeChannel(channel); };
  }, [projectId, project?.client_user_id, project?.assigned_engineer_id, project?.technical_consultant_id, project?.title]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    try {
      for (const file of files) {
        const file_url = await uploadProjectFile(projectId, file);
        uploaded.push({ name: file.name, url: file_url });
      }
      setPendingFiles(prev => [...prev, ...uploaded]);
    } catch (error) {
      setChatError(error?.message || "تعذر رفع المرفق.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSend = async () => {
    if (!text.trim() && pendingFiles.length === 0) return;
    setSending(true);
    setChatError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const authUser = authData?.user;
      if (!authUser || !resolvedConversationId) throw new Error("تعذر تحديد محادثة المشروع أو المستخدم.");
      const { error } = await supabase.from("messages").insert({
        conversation_id: resolvedConversationId,
        project_id: projectId,
        sender_user_id: authUser.id,
        sender_email: authUser.email || currentUser?.email || null,
        sender_name: currentUser?.full_name || authUser.email || "مستخدم",
        sender_role: "user",
        body: text.trim(),
        attachments: pendingFiles,
        message_type: pendingFiles.length ? "attachment" : "text"
      });
      if (error) throw error;
      await supabase.from("conversations").update({ last_message: text.trim() || "مرفق", last_message_date: new Date().toISOString() }).eq("id", resolvedConversationId);
      setText("");
      setPendingFiles([]);
    } catch (error) {
      setChatError(error?.message || "تعذر إرسال الرسالة.");
    } finally {
      setSending(false);
    }
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
          <MessageSquare className="w-5 h-5 text-[#C9A66B]" />
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
        {chatError && <p role="alert" className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{chatError}</p>}
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
          className="resize-none flex-1 text-sm min-h-[38px] max-h-[120px] rounded-xl border-slate-200 focus:border-[#C9A66B]"
          style={{ overflow: text.split("\n").length > 3 ? "auto" : "hidden" }}
        />

        <Button
          onClick={handleSend}
          disabled={sending || (!text.trim() && pendingFiles.length === 0)}
          className="w-9 h-9 p-0 rounded-xl bg-gradient-to-br from-[#C9A66B] to-[#c49060] hover:opacity-90 shrink-0 mb-0.5">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}