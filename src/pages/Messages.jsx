import React, { useState, useEffect, useRef, Suspense } from "react";
import { base44 } from "@/api/base44Client";
import { uploadScopedFile } from "@/lib/projectFileStorage";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Send, Paperclip, MoreVertical,
  Phone, Video, ChevronLeft, Download, Loader2, Mic, MicOff,
  Users, User, Building2, Filter, Plus, X, UserCircle, MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import CloudWorkspace from "@/components/chat/CloudWorkspace";
import { FileText } from "lucide-react";
const SendQuoteDialog = React.lazy(() => import("@/components/quotes/SendQuoteDialog"));

const DIRECTORY_TYPES = [
  { key: "all", label: "الكل" },
  { key: "client", label: "العملاء" },
  { key: "engineer", label: "المهندسون" },
  { key: "firm", label: "الشركات / المكاتب" },
  { key: "consultant", label: "الاستشاريون" },
];

function normalizeUser(record, type) {
  if (!record?.email) return null;
  const name = record.full_name || record.company_name || record.name || record.email;
  return {
    id: record.id,
    email: record.email,
    name,
    full_name: record.full_name,
    company_name: record.company_name,
    phone: record.phone,
    city: record.city,
    profile_image: record.profile_image || record.company_logo,
    type,
    _type: type,
    status: record.status,
    is_verified: record.is_verified,
  };
}

export default function Messages() {
  const [me, setMe] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [directory, setDirectory] = useState([]);
  const [directoryType, setDirectoryType] = useState("all");
  const [directorySearch, setDirectorySearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [quoteConversation, setQuoteConversation] = useState(null);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const loadDirectory = async () => {
    setIsLoadingDirectory(true);
    try {
      const results = await Promise.allSettled([
        base44.entities.Engineer.list("-created_date", 500),
        base44.entities.Client.list("-created_date", 500),
        base44.entities.EngineeringFirm.list("-created_date", 500),
        base44.entities.Consultant.list("-created_date", 500),
      ]);
      const rows = [];
      const maps = {};
      const add = (result, type) => {
        if (result.status !== "fulfilled") return;
        (result.value || []).forEach((record) => {
          const user = normalizeUser(record, type);
          if (!user || user.email === me?.email) return;
          if (!maps[user.email]) {
            maps[user.email] = user;
            rows.push(user);
          }
        });
      };
      add(results[0], "engineer");
      add(results[1], "client");
      add(results[2], "firm");
      add(results[3], "consultant");
      setDirectory(rows);
      setUsersMap((prev) => ({ ...prev, ...Object.fromEntries(rows.map((u) => [u.email, u])) }));
    } catch (error) {
      console.error("Directory load error:", error);
      toast.error("تعذر تحميل قائمة المستخدمين");
    } finally {
      setIsLoadingDirectory(false);
    }
  };

  const loadConversations = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const current = await base44.auth.me();
      setMe(current);
      const [conversationResult, engineerResult, clientResult, firmResult, consultantResult] = await Promise.allSettled([
        base44.entities.Conversation.filter({ participants: current.email }, "-last_message_date", 200),
        base44.entities.Engineer.list("-created_date", 500),
        base44.entities.Client.list("-created_date", 500),
        base44.entities.EngineeringFirm.list("-created_date", 500),
        base44.entities.Consultant.list("-created_date", 500),
      ]);
      if (conversationResult.status !== "fulfilled") throw conversationResult.reason;
      const maps = {};
      const addMap = (result, type) => {
        if (result.status !== "fulfilled") return;
        (result.value || []).forEach((r) => {
          const u = normalizeUser(r, type);
          if (u) maps[u.email] = u;
        });
      };
      addMap(engineerResult, "engineer");
      addMap(clientResult, "client");
      addMap(firmResult, "firm");
      addMap(consultantResult, "consultant");
      setUsersMap(maps);
      setDirectory(Object.values(maps).filter((u) => u.email !== current.email));
      setConversations(conversationResult.value || []);
    } catch (error) {
      console.error("Messages load error:", error);
      setLoadError(error?.message || "حدث خطأ في تحميل المحادثات");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    if (me) loadDirectory();
  }, [me?.email]);

  const loadMessages = async (conversation) => {
    setSelectedConversation(conversation);
    setIsLoadingMessages(true);
    try {
      const list = await base44.entities.Message.filter({ conversation_id: conversation.id }, "created_date", 500);
      setMessages(list || []);
      const unread = (list || []).filter((m) => !m.is_read && m.sender_email !== me?.email);
      await Promise.allSettled(unread.map((m) => base44.entities.Message.update(m.id, { is_read: true })));
    } catch (error) {
      console.error("Message load error:", error);
      toast.error("تعذر تحميل الرسائل");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getOtherParticipants = (conversation) => (conversation?.participants || []).filter((email) => email !== me?.email);
  const getConversationTitle = (conversation) => {
    if (conversation?.name) return conversation.name;
    const names = getOtherParticipants(conversation).map((email) => usersMap[email]?.name || email);
    return names.join("، ") || "محادثة";
  };

  const findExistingConversation = (email) => conversations.find((c) =>
    c.type === "direct" && Array.isArray(c.participants) && c.participants.length === 2 &&
    c.participants.includes(me?.email) && c.participants.includes(email)
  );

  const openDirectConversation = async (person) => {
    if (!me?.email || !person?.email) return;
    setShowNewChat(false);
    const existing = findExistingConversation(person.email);
    if (existing) {
      await loadMessages(existing);
      return;
    }
    try {
      const conversation = await base44.entities.Conversation.create({
        project_id: "direct",
        type: "direct",
        name: person.name,
        participants: [me.email, person.email],
        participant_roles: { [person.type]: person.email },
        is_archived: false,
        muted_by: [],
        is_main_room: false,
        last_message: "",
        last_message_date: new Date().toISOString(),
      });
      setConversations((prev) => [conversation, ...prev]);
      setUsersMap((prev) => ({ ...prev, [person.email]: person }));
      await loadMessages(conversation);
      toast.success(`تم فتح المحادثة مع ${person.name}`);
    } catch (error) {
      console.error("Create conversation error:", error);
      toast.error("تعذر إنشاء المحادثة");
    }
  };

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || !selectedConversation || !me || isSending) return;
    setIsSending(true);
    try {
      const message = await base44.entities.Message.create({
        conversation_id: selectedConversation.id,
        project_id: selectedConversation.project_id || "direct",
        sender_email: me.email,
        sender_name: me.full_name || me.email,
        sender_role: me.role === "admin" ? "admin" : (usersMap[me.email]?._type || "client"),
        content,
        original_content: content,
        has_sensitive_data: false,
        is_read: false,
        is_system_message: false,
      });
      await base44.entities.Conversation.update(selectedConversation.id, {
        last_message: content.slice(0, 100),
        last_message_date: new Date().toISOString(),
      });
      setMessages((prev) => [...prev, message]);
      setConversations((prev) => prev.map((c) => c.id === selectedConversation.id ? { ...c, last_message: content, last_message_date: new Date().toISOString() } : c));
      setSelectedConversation((prev) => prev ? { ...prev, last_message: content, last_message_date: new Date().toISOString() } : prev);
      setNewMessage("");
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("تعذر إرسال الرسالة");
    } finally {
      setIsSending(false);
    }
  };

  const uploadAttachment = async (file) => {
    if (!file || !selectedConversation || !me) return;
    try {
      const url = await uploadScopedFile("messages", file);
      const message = await base44.entities.Message.create({
        conversation_id: selectedConversation.id,
        project_id: selectedConversation.project_id || "direct",
        sender_email: me.email,
        sender_name: me.full_name || me.email,
        sender_role: "client",
        content: `📎 ${file.name}`,
        attachments: [{ name: file.name, url, size: file.size, type: file.type }],
        is_read: false,
        is_system_message: false,
      });
      setMessages((prev) => [...prev, message]);
      await base44.entities.Conversation.update(selectedConversation.id, { last_message: `📎 ${file.name}`, last_message_date: new Date().toISOString() });
    } catch (error) {
      console.error("Attachment error:", error);
      toast.error("تعذر رفع الملف");
    }
  };

  const sendCallInvite = async (type) => {
    if (!selectedConversation || !me) return;
    const roomId = `bytly-${selectedConversation.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)}`;
    const url = `https://meet.jit.si/${roomId}${type === "صوتية" ? "#config.startWithVideoMuted=true" : ""}`;
    try {
      const message = await base44.entities.Message.create({
        conversation_id: selectedConversation.id,
        project_id: selectedConversation.project_id || "direct",
        sender_email: me.email,
        sender_name: me.full_name || me.email,
        sender_role: "client",
        content: `📞 دعوة مكالمة ${type}\n\nانضم للمكالمة عبر الرابط:\n${url}`,
        is_system_message: true,
        is_read: false,
      });
      setMessages((prev) => [...prev, message]);
      await base44.entities.Conversation.update(selectedConversation.id, { last_message: `📞 مكالمة ${type}`, last_message_date: new Date().toISOString() });
      window.open(url, "_blank", "width=900,height=700");
    } catch (error) {
      console.error("Call invite error:", error);
      toast.error("تعذر إرسال دعوة المكالمة");
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return toast.error("التسجيل الصوتي غير متاح في هذا المتصفح");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        await uploadAttachment(file);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      toast.error("تعذر الوصول إلى الميكروفون");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const filteredDirectory = directory.filter((person) => {
    const typeOk = directoryType === "all" || person.type === directoryType;
    const q = directorySearch.trim().toLowerCase();
    const text = `${person.name} ${person.email} ${person.company_name || ""} ${person.city || ""}`.toLowerCase();
    return typeOk && (!q || text.includes(q));
  });

  const filteredConversations = conversations.filter((c) => {
    const text = `${getConversationTitle(c)} ${c.last_message || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  if (loadError) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border p-6 text-center bg-white">
        <MessageCircle className="w-10 h-10 mx-auto mb-3" />
        <h2 className="font-bold text-lg mb-2">تعذر تحميل المحادثات</h2>
        <p className="text-sm text-gray-500 mb-4">{loadError}</p>
        <button onClick={loadConversations} className="px-4 py-2 rounded-lg bg-black text-white">إعادة المحاولة</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border overflow-hidden flex min-h-[760px]">
        <aside className={`${selectedConversation ? "hidden md:flex" : "flex"} w-full md:w-[360px] border-l flex-col`}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold flex items-center gap-2"><MessageCircle className="w-5 h-5" /> المحادثات</h1>
              <button onClick={() => setShowNewChat(true)} className="rounded-lg p-2 bg-amber-100 hover:bg-amber-200" title="محادثة جديدة"><Plus className="w-5 h-5" /></button>
            </div>
            <div className="relative"><Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث في المحادثات" className="w-full rounded-lg border py-2 pr-9 pl-3" /></div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? <div className="p-8 text-center text-gray-500"><MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>لا توجد محادثات بعد</p><button onClick={() => setShowNewChat(true)} className="mt-3 text-amber-700 font-semibold">ابدأ محادثة جديدة</button></div> : filteredConversations.map((conversation) => (
              <button key={conversation.id} onClick={() => loadMessages(conversation)} className="w-full text-right p-4 border-b hover:bg-slate-50 flex gap-3">
                <UserCircle className="w-10 h-10 text-gray-400" />
                <div className="min-w-0 flex-1"><div className="font-semibold truncate">{getConversationTitle(conversation)}</div><div className="text-sm text-gray-500 truncate">{conversation.last_message || "ابدأ المحادثة"}</div></div>
              </button>
            ))}
          </div>
        </aside>

        <main className={`${selectedConversation ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-gray-500"><div className="text-center"><MessageCircle className="w-14 h-14 mx-auto mb-3 opacity-30" /><h2 className="font-bold text-xl text-gray-700">اختر محادثة</h2><p>أو ابدأ محادثة جديدة مع أحد مستخدمي بيتلي</p></div></div>
          ) : (
            <>
              <header className="p-4 border-b flex items-center gap-3">
                <button className="md:hidden" onClick={() => setSelectedConversation(null)}><ChevronLeft /></button>
                <UserCircle className="w-10 h-10 text-gray-400" />
                <div className="flex-1"><div className="font-bold">{getConversationTitle(selectedConversation)}</div><div className="text-xs text-gray-500">{getOtherParticipants(selectedConversation).map((e) => usersMap[e]?.email || e).join("، ")}</div></div>
                <button onClick={() => sendCallInvite("صوتية")} title="مكالمة صوتية" className="p-2 rounded-lg hover:bg-gray-100"><Phone /></button>
                <button onClick={() => sendCallInvite("فيديو")} title="مكالمة فيديو" className="p-2 rounded-lg hover:bg-gray-100"><Video /></button>
              </header>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingMessages ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div> : messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_email === me?.email ? "justify-start" : "justify-end"}`}><div className={`max-w-[75%] rounded-2xl px-4 py-2 ${m.sender_email === me?.email ? "bg-amber-100" : "bg-slate-100"}`}><div className="whitespace-pre-wrap text-sm">{m.content}</div>{m.attachments?.map((a) => <a key={a.url} href={a.url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 text-xs underline"><Download className="w-3 h-3" />{a.name}</a>)}</div></div>
                ))}<div ref={messagesEndRef} /></div>
              <div className="border-t p-3 flex items-center gap-2">
                <input type="file" id="message-file" className="hidden" onChange={(e) => uploadAttachment(e.target.files?.[0])} />
                <label htmlFor="message-file" className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"><Paperclip /></label>
                <button onClick={isRecording ? stopRecording : startRecording} className={`p-2 rounded-lg ${isRecording ? "bg-red-100 text-red-600" : "hover:bg-gray-100"}`} title="رسالة صوتية">{isRecording ? <MicOff /> : <Mic />}</button>
                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="اكتب رسالتك..." className="flex-1 rounded-xl border px-4 py-2" />
                <button onClick={sendMessage} disabled={isSending || !newMessage.trim()} className="p-3 rounded-xl bg-amber-500 disabled:opacity-40"><Send className="w-5 h-5" /></button>
              </div>
            </>
          )}
        </main>
      </div>

      <AnimatePresence>
        {showNewChat && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <motion.div initial={{ scale: .97, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex items-center gap-3"><div className="flex-1"><h2 className="font-bold text-lg">محادثة جديدة</h2><p className="text-sm text-gray-500">اختر الشخص الذي تريد التواصل معه</p></div><button onClick={() => setShowNewChat(false)}><X /></button></div>
            <div className="p-4 border-b space-y-3"><div className="relative"><Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" /><input value={directorySearch} onChange={(e) => setDirectorySearch(e.target.value)} placeholder="ابحث بالاسم أو البريد أو الشركة أو المدينة" className="w-full rounded-lg border py-2 pr-9 pl-3" /></div><div className="flex gap-2 overflow-x-auto">{DIRECTORY_TYPES.map((type) => <button key={type.key} onClick={() => setDirectoryType(type.key)} className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm ${directoryType === type.key ? "bg-amber-500 text-white" : "bg-gray-100"}`}>{type.label}</button>)}</div></div>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {isLoadingDirectory ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div> : filteredDirectory.length === 0 ? <div className="p-10 text-center text-gray-500"><Users className="w-10 h-10 mx-auto mb-2 opacity-30" />لا يوجد مستخدمون مطابقون</div> : filteredDirectory.map((person) => <button key={`${person.type}-${person.email}`} onClick={() => openDirectConversation(person)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-right border-b last:border-0"><div className="w-11 h-11 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">{person.profile_image ? <img src={person.profile_image} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-400" />}</div><div className="min-w-0 flex-1"><div className="font-semibold truncate">{person.name}</div><div className="text-xs text-gray-500">{person.type === "engineer" ? "مهندس" : person.type === "client" ? "عميل" : person.type === "firm" ? "شركة / مكتب" : "استشاري"}{person.city ? ` · ${person.city}` : ""}</div><div className="text-xs text-gray-400 truncate">{person.email}</div></div>{person.is_verified && <span className="text-xs text-emerald-600">موثق</span>}</button>)}
            </div>
          </motion.div>
        </motion.div>}
      </AnimatePresence>

      <Suspense fallback={null}>{showQuoteDialog && quoteConversation && <SendQuoteDialog conversation={quoteConversation} onClose={() => { setShowQuoteDialog(false); setQuoteConversation(null); }} />}</Suspense>
    </div>
  );
}
