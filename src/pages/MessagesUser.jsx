import React, { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Send, Paperclip, Phone, Video, ChevronLeft, Download, Loader2,
  Users, User, Plus, X, UserCircle, MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { uploadScopedFile } from "@/lib/projectFileStorage";
import { useAuth } from "@/lib/AuthContext";

const TYPES = [
  ["all", "الكل"],
  ["client", "العملاء"],
  ["engineer", "المهندسون"],
  ["firm", "الشركات / المكاتب"],
  ["consultant", "الاستشاريون"],
];

const timeout = (promise, ms, label) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`انتهت مهلة ${label}`)), ms)),
]);

function normalize(record, type) {
  if (!record?.email) return null;
  return {
    id: record.id,
    email: record.email,
    name: record.full_name || record.company_name || record.name || record.email,
    company_name: record.company_name,
    city: record.city,
    image: record.profile_image || record.company_logo,
    type,
    verified: !!record.is_verified,
  };
}

export default function MessagesUser() {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState({});
  const [directory, setDirectory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [newChat, setNewChat] = useState(false);
  const [type, setType] = useState("all");
  const [directorySearch, setDirectorySearch] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const loadDirectory = async () => {
    if (!user?.email) return;
    setLoadingDirectory(true);
    const requests = [
      ["engineer", base44.entities.Engineer.list("-created_date", 500)],
      ["client", base44.entities.Client.list("-created_date", 500)],
      ["firm", base44.entities.EngineeringFirm.list("-created_date", 500)],
      ["consultant", base44.entities.Consultant.list("-created_date", 500)],
    ];
    const results = await Promise.allSettled(requests.map(([kind, request]) => timeout(request, 12000, kind)));
    const map = {};
    results.forEach((result, index) => {
      if (result.status !== "fulfilled") return;
      (result.value || []).forEach((record) => {
        const person = normalize(record, requests[index][0]);
        if (person && person.email !== user.email && !map[person.email]) map[person.email] = person;
      });
    });
    setUsers((prev) => ({ ...prev, ...map }));
    setDirectory(Object.values(map));
    setLoadingDirectory(false);
  };

  const load = async () => {
    if (!isAuthenticated || !user?.email) {
      setLoading(false);
      setError("يجب تسجيل الدخول أولاً لعرض المحادثات");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const rows = await timeout(
        base44.entities.Conversation.filter({ participants: user.email }, "-last_message_date", 200),
        15000,
        "المحادثات"
      );
      setConversations(rows || []);
      loadDirectory().catch((e) => console.error("directory", e));
    } catch (e) {
      console.error("conversation load", e);
      setError(e?.message || "تعذر تحميل المحادثات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.email) load();
    else if (isAuthenticated === false) {
      setLoading(false);
      setError("يجب تسجيل الدخول أولاً لعرض المحادثات");
    }
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const otherEmails = (conversation) => (conversation?.participants || []).filter((email) => email !== user?.email);
  const title = (conversation) => conversation?.name || otherEmails(conversation).map((email) => users[email]?.name || email).join("، ") || "محادثة";

  const openConversation = async (conversation) => {
    setSelected(conversation);
    setLoadingMessages(true);
    try {
      const rows = await timeout(
        base44.entities.Message.filter({ conversation_id: conversation.id }, "created_date", 500),
        15000,
        "الرسائل"
      );
      setMessages(rows || []);
      await Promise.allSettled((rows || []).filter((m) => !m.is_read && m.sender_email !== user?.email).map((m) => base44.entities.Message.update(m.id, { is_read: true })));
    } catch (e) {
      console.error("message load", e);
      toast.error(e?.message || "تعذر تحميل الرسائل");
    } finally {
      setLoadingMessages(false);
    }
  };

  const startDirect = async (person) => {
    setNewChat(false);
    const existing = conversations.find((c) => c.type === "direct" && Array.isArray(c.participants) && c.participants.length === 2 && c.participants.includes(user.email) && c.participants.includes(person.email));
    if (existing) return openConversation(existing);
    try {
      const conversation = await timeout(base44.entities.Conversation.create({
        project_id: "direct",
        type: "direct",
        name: person.name,
        participants: [user.email, person.email],
        participant_roles: { [person.type]: person.email },
        is_archived: false,
        muted_by: [],
        is_main_room: false,
        last_message: "",
        last_message_date: new Date().toISOString(),
      }), 15000, "إنشاء المحادثة");
      setConversations((prev) => [conversation, ...prev]);
      setUsers((prev) => ({ ...prev, [person.email]: person }));
      await openConversation(conversation);
    } catch (e) {
      console.error("conversation create", e);
      toast.error(e?.message || "تعذر إنشاء المحادثة");
    }
  };

  const send = async () => {
    const content = text.trim();
    if (!content || !selected || !user || sending) return;
    setSending(true);
    try {
      const message = await timeout(base44.entities.Message.create({
        conversation_id: selected.id,
        project_id: selected.project_id || "direct",
        sender_email: user.email,
        sender_name: user.full_name || user.email,
        sender_role: user.role || "user",
        content,
        original_content: content,
        has_sensitive_data: false,
        is_read: false,
        is_system_message: false,
      }), 15000, "إرسال الرسالة");
      const date = new Date().toISOString();
      await timeout(base44.entities.Conversation.update(selected.id, { last_message: content.slice(0, 100), last_message_date: date }), 10000, "تحديث المحادثة");
      setMessages((prev) => [...prev, message]);
      setConversations((prev) => prev.map((c) => c.id === selected.id ? { ...c, last_message: content, last_message_date: date } : c));
      setSelected((prev) => ({ ...prev, last_message: content, last_message_date: date }));
      setText("");
    } catch (e) {
      console.error("send message", e);
      toast.error(e?.message || "تعذر إرسال الرسالة");
    } finally {
      setSending(false);
    }
  };

  const attach = async (file) => {
    if (!file || !selected || !user) return;
    try {
      const url = await uploadScopedFile("messages", file);
      const message = await base44.entities.Message.create({
        conversation_id: selected.id,
        project_id: selected.project_id || "direct",
        sender_email: user.email,
        sender_name: user.full_name || user.email,
        sender_role: user.role || "user",
        content: `📎 ${file.name}`,
        attachments: [{ name: file.name, url, size: file.size, type: file.type }],
        is_read: false,
        is_system_message: false,
      });
      setMessages((prev) => [...prev, message]);
    } catch (e) {
      console.error("attachment", e);
      toast.error("تعذر رفع الملف");
    }
  };

  const call = async (kind) => {
    if (!selected || !user) return;
    const room = `bytly-${String(selected.id).replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)}`;
    const url = `https://meet.jit.si/${room}${kind === "صوتية" ? "#config.startWithVideoMuted=true" : ""}`;
    try {
      const message = await base44.entities.Message.create({
        conversation_id: selected.id,
        project_id: selected.project_id || "direct",
        sender_email: user.email,
        sender_name: user.full_name || user.email,
        sender_role: user.role || "user",
        content: `📞 دعوة مكالمة ${kind}\n\n${url}`,
        is_system_message: true,
        is_read: false,
      });
      setMessages((prev) => [...prev, message]);
      window.open(url, "_blank", "width=900,height=700");
    } catch (e) {
      toast.error("تعذر إرسال دعوة المكالمة");
    }
  };

  const visibleConversations = useMemo(() => conversations.filter((c) => `${title(c)} ${c.last_message || ""}`.toLowerCase().includes(search.toLowerCase())), [conversations, users, search]);
  const visibleDirectory = useMemo(() => directory.filter((p) => {
    const typeOk = type === "all" || p.type === type;
    const q = directorySearch.trim().toLowerCase();
    return typeOk && (!q || `${p.name} ${p.email} ${p.company_name || ""} ${p.city || ""}`.toLowerCase().includes(q));
  }), [directory, type, directorySearch]);

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center gap-3"><Loader2 className="w-8 h-8 animate-spin" /><p className="text-sm text-gray-500">جاري تحميل المحادثات...</p></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center p-6"><div className="max-w-md w-full rounded-2xl border p-6 text-center bg-white"><MessageCircle className="w-10 h-10 mx-auto mb-3" /><h2 className="font-bold text-lg mb-2">تعذر تحميل المحادثات</h2><p className="text-sm text-gray-500 mb-4">{error}</p><button onClick={load} className="px-4 py-2 rounded-lg bg-black text-white">إعادة المحاولة</button></div></div>;

  return <div className="min-h-screen bg-slate-50 p-4 md:p-6">
    <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border overflow-hidden flex min-h-[760px]">
      <aside className={`${selected ? "hidden md:flex" : "flex"} w-full md:w-[360px] border-l flex-col`}>
        <div className="p-4 border-b"><div className="flex items-center justify-between mb-3"><h1 className="text-xl font-bold flex items-center gap-2"><MessageCircle className="w-5 h-5" /> المحادثات</h1><button onClick={() => setNewChat(true)} className="rounded-lg p-2 bg-amber-100 hover:bg-amber-200" title="محادثة جديدة"><Plus className="w-5 h-5" /></button></div><div className="relative"><Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث في المحادثات" className="w-full rounded-lg border py-2 pr-9 pl-3" /></div></div>
        <div className="flex-1 overflow-y-auto">{visibleConversations.length ? visibleConversations.map((c) => <button key={c.id} onClick={() => openConversation(c)} className="w-full text-right p-4 border-b hover:bg-slate-50 flex gap-3"><UserCircle className="w-10 h-10 text-gray-400" /><div className="min-w-0 flex-1"><div className="font-semibold truncate">{title(c)}</div><div className="text-sm text-gray-500 truncate">{c.last_message || "ابدأ المحادثة"}</div></div></button>) : <div className="p-8 text-center text-gray-500"><MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>لا توجد محادثات بعد</p><button onClick={() => setNewChat(true)} className="mt-3 text-amber-700 font-semibold">ابدأ محادثة جديدة</button></div>}</div>
      </aside>
      <main className={`${selected ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
        {!selected ? <div className="flex-1 flex items-center justify-center text-gray-500"><div className="text-center"><MessageCircle className="w-14 h-14 mx-auto mb-3 opacity-30" /><h2 className="font-bold text-xl text-gray-700">اختر محادثة</h2><p>أو ابدأ محادثة جديدة مع أحد مستخدمي بيتلي</p></div></div> : <><header className="p-4 border-b flex items-center gap-3"><button className="md:hidden" onClick={() => setSelected(null)}><ChevronLeft /></button><UserCircle className="w-10 h-10 text-gray-400" /><div className="flex-1"><div className="font-bold">{title(selected)}</div><div className="text-xs text-gray-500">{otherEmails(selected).join("، ")}</div></div><button onClick={() => call("صوتية")} className="p-2 rounded-lg hover:bg-gray-100" title="مكالمة صوتية"><Phone /></button><button onClick={() => call("فيديو")} className="p-2 rounded-lg hover:bg-gray-100" title="مكالمة فيديو"><Video /></button></header><div className="flex-1 overflow-y-auto p-4 space-y-3">{loadingMessages ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div> : messages.map((m) => <div key={m.id} className={`flex ${m.sender_email === user?.email ? "justify-start" : "justify-end"}`}><div className={`max-w-[75%] rounded-2xl px-4 py-2 ${m.sender_email === user?.email ? "bg-amber-100" : "bg-slate-100"}`}><div className="whitespace-pre-wrap text-sm">{m.content}</div>{m.attachments?.map((a) => <a key={a.url} href={a.url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 text-xs underline"><Download className="w-3 h-3" />{a.name}</a>)}</div></div>)}<div ref={endRef} /></div><div className="border-t p-3 flex items-center gap-2"><input type="file" id="message-file" className="hidden" onChange={(e) => attach(e.target.files?.[0])} /><label htmlFor="message-file" className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"><Paperclip /></label><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="اكتب رسالتك..." className="flex-1 rounded-xl border px-4 py-2" /><button onClick={send} disabled={sending || !text.trim()} className="p-3 rounded-xl bg-amber-500 disabled:opacity-40"><Send className="w-5 h-5" /></button></div></>}
      </main>
    </div>
    <AnimatePresence>{newChat && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><motion.div initial={{ scale: .97, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"><div className="p-4 border-b flex items-center gap-3"><div className="flex-1"><h2 className="font-bold text-lg">محادثة جديدة</h2><p className="text-sm text-gray-500">اختر الشخص الذي تريد التواصل معه</p></div><button onClick={() => setNewChat(false)}><X /></button></div><div className="p-4 border-b space-y-3"><div className="relative"><Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" /><input value={directorySearch} onChange={(e) => setDirectorySearch(e.target.value)} placeholder="ابحث بالاسم أو البريد أو الشركة أو المدينة" className="w-full rounded-lg border py-2 pr-9 pl-3" /></div><div className="flex gap-2 overflow-x-auto">{TYPES.map(([key, label]) => <button key={key} onClick={() => setType(key)} className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm ${type === key ? "bg-amber-500 text-white" : "bg-gray-100"}`}>{label}</button>)}</div></div><div className="max-h-[55vh] overflow-y-auto p-2">{loadingDirectory ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div> : visibleDirectory.length ? visibleDirectory.map((person) => <button key={`${person.type}-${person.email}`} onClick={() => startDirect(person)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-right border-b last:border-0"><div className="w-11 h-11 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">{person.image ? <img src={person.image} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-400" />}</div><div className="min-w-0 flex-1"><div className="font-semibold truncate">{person.name}</div><div className="text-xs text-gray-500">{person.type === "engineer" ? "مهندس" : person.type === "client" ? "عميل" : person.type === "firm" ? "شركة / مكتب" : "استشاري"}{person.city ? ` · ${person.city}` : ""}</div><div className="text-xs text-gray-400 truncate">{person.email}</div></div>{person.verified && <span className="text-xs text-emerald-600">موثق</span>}</button>) : <div className="p-10 text-center text-gray-500"><Users className="w-10 h-10 mx-auto mb-2 opacity-30" />لا يوجد مستخدمون مطابقون</div>}</div></motion.div></motion.div>}</AnimatePresence>
  </div>;
}
