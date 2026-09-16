import React, { useState, useEffect, useRef, Suspense } from "react";
import { base44 } from "@/api/base44Client";
import { uploadScopedFile } from "@/lib/projectFileStorage";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Send, Paperclip, Phone, Video, ChevronLeft, Download, Loader2, Mic, MicOff,
  Users, User, Plus, X, UserCircle, MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import CloudWorkspace from "@/components/chat/CloudWorkspace";
import { useAuth } from "@/lib/AuthContext";
const SendQuoteDialog = React.lazy(() => import("@/components/quotes/SendQuoteDialog"));

const DIRECTORY_TYPES = [
  { key: "all", label: "الكل" },
  { key: "client", label: "العملاء" },
  { key: "engineer", label: "المهندسون" },
  { key: "firm", label: "الشركات / المكاتب" },
  { key: "consultant", label: "الاستشاريون" },
];

const withTimeout = (promise, ms = 15000, label = "العملية") => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`انتهت مهلة ${label}`)), ms))
]);

function normalizeUser(record, type) {
  if (!record?.email) return null;
  return {
    id: record.id,
    email: record.email,
    name: record.full_name || record.company_name || record.name || record.email,
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
  const { user: authUser, isAuthenticated } = useAuth();
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
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const loadDirectory = async (currentUser) => {
    if (!currentUser?.email) return;
    setIsLoadingDirectory(true);
    try {
      const results = await Promise.allSettled([
        withTimeout(base44.entities.Engineer.list("-created_date", 500), 12000, "المهندسين"),
        withTimeout(base44.entities.Client.list("-created_date", 500), 12000, "العملاء"),
        withTimeout(base44.entities.EngineeringFirm.list("-created_date", 500), 12000, "الشركات"),
        withTimeout(base44.entities.Consultant.list("-created_date", 500), 12000, "الاستشاريين"),
      ]);
      const rows = [];
      const maps = {};
      const add = (result, type) => {
        if (result.status !== "fulfilled") return;
        (result.value || []).forEach((record) => {
          const person = normalizeUser(record, type);
          if (!person || person.email === currentUser.email || maps[person.email]) return;
          maps[person.email] = person;
          rows.push(person);
        });
      };
      add(results[0], "engineer");
      add(results[1], "client");
      add(results[2], "firm");
      add(results[3], "consultant");
      setDirectory(rows);
      setUsersMap((prev) => ({ ...prev, ...maps }));
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
      if (!isAuthenticated || !authUser?.email) {
        throw new Error("يجب تسجيل الدخول أولاً لعرض المحادثات");
      }
      // استخدم المستخدم الحالي من AuthContext بدلاً من base44.auth.me() حتى لا تتعطل الصفحة
      // إذا كان مسار مصادقة Base44 القديم غير متاح بعد ترحيل تسجيل الدخول إلى Supabase.
      const current = authUser;
      setMe(current);
      const conversationResult = await withTimeout(
        base44.entities.Conversation.filter({ participants: current.email }, "-last_message_date", 200),
        15000,
        "المحادثات"
      );
      setConversations(conversationResult || []);
      // تحميل أدلة المستخدمين بشكل مستقل حتى لا يمنع فشل دليل واحد ظهور المحادثات.
      const results = await Promise.allSettled([
        withTimeout(base44.entities.Engineer.list("-created_date", 500), 12000, "المهندسين"),
        withTimeout(base44.entities.Client.list("-created_date", 500), 12000, "العملاء"),
        withTimeout(base44.entities.EngineeringFirm.list("-created_date", 500), 12000, "الشركات"),
        withTimeout(base44.entities.Consultant.list("-created_date", 500), 12000, "الاستشاريين"),
      ]);
      const maps = {};
      const addMap = (result, type) => {
        if (result.status !== "fulfilled") return;
        (result.value || []).forEach((record) => {
          const person = normalizeUser(record, type);
          if (person) maps[person.email] = person;
        });
      };
      addMap(results[0], "engineer");
      addMap(results[1], "client");
      addMap(results[2], "firm");
      addMap(results[3], "consultant");
      setUsersMap(maps);
      setDirectory(Object.values(maps).filter((person) => person.email !== current.email));
    } catch (error) {
      console.error("Messages load error:", error);
      setLoadError(error?.message || "حدث خطأ في تحميل المحادثات");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && authUser?.email) loadConversations();
    else if (isAuthenticated === false) {
      setIsLoading(false);
      setLoadError("يجب تسجيل الدخول أولاً لعرض المحادثات");
    }
  }, [isAuthenticated, authUser?.email]);

  const loadMessages = async (conversation) => {
    setSelectedConversation(conversation);
    setIsLoadingMessages(true);
    try {
      const list = await withTimeout(base44.entities.Message.filter({ conversation_id: conversation.id }, "created_date", 500), 15000, "الرسائل");
      setMessages(list || []);
      const unread = (list || []).filter((m) => !m.is_read && m.sender_email !== me?.email);
      await Promise.allSettled(unread.map((m) => withTimeout(base44.entities.Message.update(m.id, { is_read: true }), 8000, "تحديث القراءة")));
    } catch (error) {
      console.error("Message load error:", error);
      toast.error(error?.message || "تعذر تحميل الرسائل");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const getOtherParticipants = (conversation) => (conversation?.participants || []).filter((email) => email !== me?.email);
  const getConversationTitle = (conversation) => {
    if (conversation?.name) return conversation.name;
    return getOtherParticipants(conversation).map((email) => usersMap[email]?.name || email).join("، ") || "محادثة";
  };
  const findExistingConversation = (email) => conversations.find((c) => c.type === "direct" && Array.isArray(c.participants) && c.participants.length === 2 && c.participants.includes(me?.email) && c.participants.includes(email));

  const openDirectConversation = async (person) => {
    if (!me?.email || !person?.email) return;
    setShowNewChat(false);
    const existing = findExistingConversation(person.email);
    if (existing) return loadMessages(existing);
    try {
      const conversation = await withTimeout(base44.entities.Conversation.create({
        project_id: "direct", type: "direct", name: person.name,
        participants: [me.email, person.email],
        participant_roles: { [person.type]: person.email },
        is_archived: false, muted_by: [], is_main_room: false,
        last_message: "", last_message_date: new Date().toISOString(),
      }), 15000, "إنشاء المحادثة");
      setConversations((prev) => [conversation, ...prev]);
      setUsersMap((prev) => ({ ...prev, [person.email]: person }));
      await loadMessages(conversation);
    } catch (error) {
      console.error("Create conversation error:", error);
      toast.error(error?.message || "تعذر إنشاء المحادثة");
    }
  };

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || !selectedConversation || !me || isSending) return;
    setIsSending(true);
    try {
      const message = await withTimeout(base44.entities.Message.create({
        conversation_id: selectedConversation.id, project_id: selectedConversation.project_id || "direct",
        sender_email: me.email, sender_name: me.full_name || me.email,
        sender_role: me.role === "admin" ? "admin" : "client", content,
        original_content: content, has_sensitive_data: false, is_read: false, is_system_message: false,
      }), 15000, "إرسال الرسالة");
      await withTimeout(base44.entities.Conversation.update(selectedConversation.id, { last_message: content.slice(0, 100), last_message_date: new Date().toISOString() }), 10000, "تحديث المحادثة");
      setMessages((prev) => [...prev, message]);
      setConversations((prev) => prev.map((c) => c.id === selectedConversation.id ? { ...c, last_message: content, last_message_date: new Date().toISOString() } : c));
      setSelectedConversation((prev) => prev ? { ...prev, last_message: content, last_message_date: new Date().toISOString() } : prev);
      setNewMessage("");
    } catch (error) {
      console.error("Send message error:", error);
      toast.error(error?.message || "تعذر إرسال الرسالة");
    } finally { setIsSending(false); }
  };

  const uploadAttachment = async (file) => {
    if (!file || !selectedConversation || !me) return;
    try {
      const url = await uploadScopedFile("messages", file);
      const message = await base44.entities.Message.create({
        conversation_id: selectedConversation.id, project_id: selectedConversation.project_id || "direct",
        sender_email: me.email, sender_name: me.full_name || me.email, sender_role: "client",
        content: `📎 ${file.name}`, attachments: [{ name: file.name, url, size: file.size, type: file.type }],
        is_read: false, is_system_message: false,
      });
      setMessages((prev) => [...prev, message]);
      await base44.entities.Conversation.update(selectedConversation.id, { last_message: `📎 ${file.name}`, last_message_date: new Date().toISOString() });
    } catch (error) { console.error(error); toast.error("تعذر رفع الملف"); }
  };

  const sendCallInvite = async (type) => {
    if (!selectedConversation || !me) return;
    const roomId = `bytly-${selectedConversation.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)}`;
    const url = `https://meet.jit.si/${roomId}${type === "صوتية" ? "#config.startWithVideoMuted=true" : ""}`;
    try {
      const message = await base44.entities.Message.create({
        conversation_id: selectedConversation.id, project_id: selectedConversation.project_id || "direct",
        sender_email: me.email, sender_name: me.full_name || me.email, sender_role: "client",
        content: `📞 دعوة مكالمة ${type}\n\nانضم للمكالمة عبر الرابط:\n${url}`, is_system_message: true, is_read: false,
      });
      setMessages((prev) => [...prev, message]);
      await base44.entities.Conversation.update(selectedConversation.id, { last_message: `📞 مكالمة ${type}`, last_message_date: new Date().toISOString() });
      window.open(url, "_blank", "width=900,height=700");
    } catch (error) { console.error(error); toast.error("تعذر إرسال دعوة المكالمة"); }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return toast.error("التسجيل الصوتي غير متاح في هذا المتصفح");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => { stream.getTracks().forEach((track) => track.stop()); const blob = new Blob(audioChunksRef.current, { type: "audio/webm" }); await uploadAttachment(new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" })); };
      mediaRecorderRef.current = recorder; recorder.start(); setIsRecording(true);
    } catch (error) { console.error(error); toast.error("تعذر الوصول إلى الميكروفون"); }
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };

  const filteredDirectory = directory.filter((person) => {
    const typeOk = directoryType === "all" || person.type === directoryType;
    const q = directorySearch.trim().toLowerCase();
    const text = `${person.name} ${person.email} ${person.company_name || ""} ${person.city || ""}`.toLowerCase();
    return typeOk && (!q || text.includes(q));
  });
  const filteredConversations = conversations.filter((c) => `${getConversationTitle(c)} ${c.last_message || ""}`.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center gap-3"><Loader2 className="w-8 h-8 animate-spin" /><p className="text-sm text-gray-500">جاري تحميل المحادثات...</p></div>;
  if (loadError) return <div className="min-h-screen flex items-center justify-center p-6"><div className="max-w-md w-full rounded-2xl border p-6 text-center bg-white"><MessageCircle className="w-10 h-10 mx-auto mb-3" /><h2 className="font-bold text-lg mb-2">تعذر تحميل المحادثات</h2><p className="text-sm text-gray-500 mb-4">{loadError}</p><button onClick={loadConversations} className="px-4 py-2 rounded-lg bg-black text-white">إعادة المحاولة</button></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border overflow-hidden flex min-h-[760px]">
        <aside className={`${selectedConversation ? "hidden md:flex" : "flex"} w-full md:w-[360px] border-l flex-col`}>
          <div className="p-4 border-b"><div className="flex items-center justify-between mb-3"><h1 className="text-xl font-bold flex items-center gap-2"><MessageCircle className="w-5 h-5" /> المحادثات</h1><button onClick={() => setShowNewChat(true)} className="rounded-lg p-2 bg-amber-100 hover:bg-amber-200" title="محادثة جديدة"><Plus className="w-5 h-5" /></button></div><div className="relative"><Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث في المحادثات" className="w-full rounded-lg border py-2 pr-9 pl-3" /></div></div>
          <div className="flex-1 overflow-y-auto">{filteredConversations.length === 0 ? <div className="p-8 text-center text-gray-500"><MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>لا توجد محادثات بعد</p><button onClick={() => setShowNewChat(true)} className="mt-3 text-amber-700 font-semibold">ابدأ محادثة جديدة</button></div> : filteredConversations.map((conversation) => <button key={conversation.id} onClick={() => loadMessages(conversation)} className="w-full text-right p-4 border-b hover:bg-slate-50 flex gap-3"><UserCircle className="w-10 h-10 text-gray-400" /><div className="min-w-0 flex-1"><div className="font-semibold truncate">{getConversationTitle(conversation)}</div><div className="text-sm text-gray-500 truncate">{conversation.last_message || "ابدأ المحادثة"}</div></div></button>)}</div>
        </aside>
        <main className={`${selectedConversation ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
          {!selectedConversation ? <div className="flex-1 flex items-center justify-center text-gray-500"><div className="text-center"><MessageCircle className="w-14 h-14 mx-auto mb-3 opacity-30" /><h2 className="font-bold text-xl text-gray-700">اختر محادثة</h2><p>أو ابدأ محادثة جديدة مع أحد مستخدمي بيتلي</p></div></div> : <><header className="p-4 border-b flex items-center gap-3"><button className="md:hidden" onClick={() => setSelectedConversation(null)}><ChevronLeft /></button><UserCircle className="w-10 h-10 text-gray-400" /><div className="flex-1"><div className="font-bold">{getConversationTitle(selectedConversation)}</div><div className="text-xs text-gray-500">{getOtherParticipants(selectedConversation).map((e) => usersMap[e]?.email || e).join("، ")}</div></div><button onClick={() => sendCallInvite("صوتية")} title="مكالمة صوتية" className="p-2 rounded-lg hover:bg-gray-100"><Phone /></button><button onClick={() => sendCallInvite("فيديو")} title="مكالمة فيديو" className="p-2 rounded-lg hover:bg-gray-100"><Video /></button></header><div className="flex-1 overflow-y-auto p-4 space-y-3">{isLoadingMessages ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div> : messages.map((m) => <div key={m.id} className={`flex ${m.sender_email === me?.email ? "justify-start" : "justify-end"}`}><div className={`max-w-[75%] rounded-2xl px-4 py-2 ${m.sender_email === me?.email ? "bg-amber-100" : "bg-slate-100"}`}><div className="whitespace-pre-wrap text-sm">{m.content}</div>{m.attachments?.map((a) => <a key={a.url} href={a.url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 text-xs underline"><Download className="w-3 h-3" />{a.name}</a>)}</div></div>)}<div ref={messagesEndRef} /></div><div className="border-t p-3 flex items-center gap-2"><input type="file" id="message-file" className="hidden" onChange={(e) => uploadAttachment(e.target.files?.[0])} /><label htmlFor="message-file" className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"><Paperclip /></label><button onClick={isRecording ? stopRecording : startRecording} className={`p-2 rounded-lg ${isRecording ? "bg-red-100 text-red-600" : "hover:bg-gray-100"}>{isRecording ? <MicOff /> : <Mic />}</button><input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="اكتب رسالتك..." className="flex-1 rounded-xl border px-4 py-2" /><button onClick={sendMessage} disabled={isSending || !newMessage.trim()} className="p-3 rounded-xl bg-amber-500 disabled:opacity-40"><Send className="w-5 h-5" /></button></div></>}
        </main>
      </div>
      <AnimatePresence>{showNewChat && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><motion.div initial={{ scale: .97, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"><div className="p-4 border-b flex items-center gap-3"><div className="flex-1"><h2 className="font-bold text-lg">محادثة جديدة</h2><p className="text-sm text-gray-500">اختر الشخص الذي تريد التواصل معه</p></div><button onClick={() => setShowNewChat(false)}><X /></button></div><div className="p-4 border-b space-y-3"><div className="relative"><Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" /><input value={directorySearch} onChange={(e) => setDirectorySearch(e.target.value)} placeholder="ابحث بالاسم أو البريد أو الشركة أو المدينة" className="w-full rounded-lg border py-2 pr-9 pl-3" /></div><div className="flex gap-2 overflow-x-auto">{DIRECTORY_TYPES.map((type) => <button key={type.key} onClick={() => setDirectoryType(type.key)} className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm ${directoryType === type.key ? "bg-amber-500 text-white" : "bg-gray-100"}`}>{type.label}</button>)}</div></div><div className="max-h-[55vh] overflow-y-auto p-2">{isLoadingDirectory ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div> : filteredDirectory.length === 0 ? <div className="p-10 text-center text-gray-500"><Users className="w-10 h-10 mx-auto mb-2 opacity-30" />لا يوجد مستخدمون مطابقون</div> : filteredDirectory.map((person) => <button key={`${person.type}-${person.email}`} onClick={() => openDirectConversation(person)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-right border-b last:border-0"><div className="w-11 h-11 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">{person.profile_image ? <img src={person.profile_image} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-400" />}</div><div className="min-w-0 flex-1"><div className="font-semibold truncate">{person.name}</div><div className="text-xs text-gray-500">{person.type === "engineer" ? "مهندس" : person.type === "client" ? "عميل" : person.type === "firm" ? "شركة / مكتب" : "استشاري"}{person.city ? ` · ${person.city}` : ""}</div><div className="text-xs text-gray-400 truncate">{person.email}</div></div>{person.is_verified && <span className="text-xs text-emerald-600">موثق</span>}</button>)}</div></motion.div></motion.div>}</AnimatePresence>
      <Suspense fallback={null}><CloudWorkspace /></Suspense>
      <Suspense fallback={null}>{false && <SendQuoteDialog />}</Suspense>
    </div>
  );
}
