import React, { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { uploadScopedFile } from "@/lib/projectFileStorage";
import { motion } from "framer-motion";
import {
  Archive, BellOff, Building2, Check, ChevronLeft, Download, Eye, FileText,
  Filter, Image as ImageIcon, Loader2, MessageCircle, Mic, MicOff,
  MoreVertical, Paperclip, Phone, Plus, Search, Send, Users, User, UserCircle,
  Video, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import CloudWorkspace from "@/components/chat/CloudWorkspace";

const SendQuoteDialog = React.lazy(() => import("@/components/quotes/SendQuoteDialog"));

const TYPES = [
  { key: "all", label: "الكل", icon: Filter },
  { key: "client", label: "العملاء", icon: User },
  { key: "engineer", label: "المهندسون", icon: UserCircle },
  { key: "firm", label: "الشركات", icon: Building2 },
  { key: "group", label: "المجموعات", icon: Users },
];

export default function MessagesCenter() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [usersMap, setUsersMap] = useState({});
  const [allUsers, setAllUsers] = useState({ engineers: [], clients: [], firms: [] });
  const [unread, setUnread] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [newQuery, setNewQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showCloud, setShowCloud] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [groupMode, setGroupMode] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [muted, setMuted] = useState({});
  const endRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (!selected?.id) return;
    loadMessages(selected.id);
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.conversation_id !== selected.id) return;
      setMessages(prev => {
        if (event.type === "create") {
          if (prev.some(m => m.id === event.id)) return prev;
          return [...prev.filter(m => !m._optimistic), event.data].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        }
        if (event.type === "update") return prev.map(m => m.id === event.id ? event.data : m);
        if (event.type === "delete") return prev.filter(m => m.id !== event.id);
        return prev;
      });
      if (event.type === "create" && event.data?.sender_email !== user?.email) markUnread(selected.id);
    });
    return () => unsub?.();
  }, [selected?.id, user?.email]);

  useEffect(() => {
    const unsub = base44.entities.Conversation.subscribe((event) => {
      if (!user?.email) return;
      const belongs = event.data?.participants?.includes(user.email) || event.data?.admin_emails?.includes(user.email);
      if (!belongs) return;
      setConversations(prev => {
        if (event.type === "create") return prev.some(c => c.id === event.id) ? prev : [event.data, ...prev];
        if (event.type === "update") return prev.map(c => c.id === event.id ? event.data : c);
        if (event.type === "delete") return prev.filter(c => c.id !== event.id);
        return prev;
      });
    });
    return () => unsub?.();
  }, [user?.email]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const init = async () => {
    setLoading(true);
    try {
      const me = await base44.auth.me();
      setUser(me);
      const [convos, engineers, clients, firms] = await Promise.all([
        base44.entities.Conversation.filter({ participants: me.email }, "-last_message_date"),
        base44.entities.Engineer.list(),
        base44.entities.Client.list(),
        base44.entities.EngineeringFirm.list(),
      ]);
      const map = {};
      engineers.forEach(x => { map[x.email] = { ...x, _type: "engineer" }; });
      clients.forEach(x => { map[x.email] = { ...x, _type: "client" }; });
      firms.forEach(x => { map[x.email] = { ...x, _type: "firm", full_name: x.company_name }; });
      setUsersMap(map);
      setAllUsers({ engineers, clients, firms });
      setConversations(convos || []);
      const ids = (convos || []).map(c => c.id);
      const unreadMap = {};
      await Promise.all(ids.slice(0, 100).map(async id => {
        const msgs = await base44.entities.Message.filter({ conversation_id: id }, "-created_date", 50);
        unreadMap[id] = msgs.filter(m => !m.is_read && m.sender_email !== me.email).length;
      }));
      setUnread(unreadMap);
    } catch (e) {
      console.error("messages init error", e);
      toast.error("تعذر تحميل المحادثات");
    } finally { setLoading(false); }
  };

  const loadMessages = async (id) => {
    try {
      const msgs = await base44.entities.Message.filter({ conversation_id: id }, "created_date", 500);
      setMessages(msgs || []);
      const incoming = (msgs || []).filter(m => !m.is_read && m.sender_email !== user?.email);
      await Promise.all(incoming.map(m => base44.entities.Message.update(m.id, { is_read: true })));
      setUnread(prev => ({ ...prev, [id]: 0 }));
    } catch (e) { toast.error("تعذر تحميل الرسائل"); }
  };

  const markUnread = (id) => setUnread(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));

  const getName = (c) => {
    if (c?.name) return c.name;
    return (c?.participants || []).filter(x => x !== user?.email).map(x => usersMap[x]?.full_name || usersMap[x]?.company_name || x).join("، ") || "محادثة";
  };
  const getType = (c) => {
    if (c?.type === "group" || c?.type === "three_way" || (c?.participants || []).length > 2) return "group";
    const other = (c?.participants || []).find(x => x !== user?.email);
    return usersMap[other]?._type || "direct";
  };
  const getAvatar = (c) => {
    const other = (c?.participants || []).find(x => x !== user?.email);
    return usersMap[other]?.profile_image || usersMap[other]?.company_logo;
  };

  const filtered = useMemo(() => conversations.filter(c => {
    const name = getName(c).toLowerCase();
    if (query && !name.includes(query.toLowerCase())) return false;
    return type === "all" || getType(c) === type;
  }), [conversations, query, type, usersMap, user?.email]);

  const newResults = useMemo(() => {
    const q = newQuery.trim().toLowerCase();
    if (!q) return [];
    return [
      ...allUsers.engineers.filter(x => x.email !== user?.email && ((x.full_name || "").toLowerCase().includes(q) || x.email.toLowerCase().includes(q))).map(x => ({ ...x, _type: "engineer" })),
      ...allUsers.clients.filter(x => x.email !== user?.email && ((x.full_name || "").toLowerCase().includes(q) || x.email.toLowerCase().includes(q))).map(x => ({ ...x, _type: "client" })),
      ...allUsers.firms.filter(x => (x.company_name || "").toLowerCase().includes(q) || x.email.toLowerCase().includes(q)).map(x => ({ ...x, _type: "firm", full_name: x.company_name })),
    ];
  }, [newQuery, allUsers, user?.email]);

  const send = async () => {
    if (!newMessage.trim() || !selected || !user) return;
    const text = newMessage.trim();
    const temp = { id: `optimistic-${Date.now()}`, conversation_id: selected.id, sender_email: user.email, sender_name: user.full_name, sender_role: "user", content: text, created_date: new Date().toISOString(), _optimistic: true };
    setMessages(prev => [...prev, temp]); setNewMessage(""); setSending(true);
    try {
      let content = text;
      let original_content = text;
      let has_sensitive_data = false;
      try {
        const { data } = await base44.functions.invoke("filterSensitiveData", { content: text });
        if (data) { content = data.filteredContent ?? text; original_content = data.originalContent ?? text; has_sensitive_data = !!data.hasSensitiveData; }
      } catch { /* keep normal message if filter function is unavailable */ }
      const saved = await base44.entities.Message.create({ conversation_id: selected.id, project_id: selected.project_id || "direct", sender_email: user.email, sender_name: user.full_name, sender_role: getSenderRole(selected), content, original_content, has_sensitive_data });
      await base44.entities.Conversation.update(selected.id, { last_message: content.slice(0, 100), last_message_date: new Date().toISOString() });
      setMessages(prev => prev.map(m => m.id === temp.id ? saved : m));
    } catch (e) { setMessages(prev => prev.filter(m => m.id !== temp.id)); setNewMessage(text); toast.error("تعذر إرسال الرسالة"); }
    finally { setSending(false); }
  };

  const getSenderRole = c => {
    const roles = c?.participant_roles || {};
    if (roles.client === user?.email) return "client";
    if (roles.engineer === user?.email) return "engineer";
    if (roles.firm === user?.email) return "firm";
    return user?.role === "admin" ? "admin" : "client";
  };

  const upload = async (e) => {
    const files = Array.from(e.target.files || []); if (!files.length || !selected) return;
    setSending(true);
    try {
      for (const file of files) {
        const url = await uploadScopedFile("messages", file);
        const msg = await base44.entities.Message.create({ conversation_id: selected.id, project_id: selected.project_id || "direct", sender_email: user.email, sender_name: user.full_name, sender_role: getSenderRole(selected), content: `📎 ${file.name}`, attachments: [{ name: file.name, url, type: file.type, size: file.size }] });
        setMessages(prev => [...prev, msg]);
      }
      await base44.entities.Conversation.update(selected.id, { last_message: "📎 مرفق", last_message_date: new Date().toISOString() });
    } catch { toast.error("تعذر رفع المرفق"); } finally { setSending(false); e.target.value = ""; }
  };

  const recordVoice = async () => {
    if (recording) { recorderRef.current?.stop(); setRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream); chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          stream.getTracks().forEach(t => t.stop());
          const file = new File([blob], "voice-message.webm", { type: "audio/webm" });
          const url = await uploadScopedFile("messages", file);
          const msg = await base44.entities.Message.create({ conversation_id: selected.id, project_id: selected.project_id || "direct", sender_email: user.email, sender_name: user.full_name, sender_role: getSenderRole(selected), content: "🎤 رسالة صوتية", attachments: [{ name: file.name, url, type: file.type, size: file.size }] });
          setMessages(prev => [...prev, msg]);
        } catch { toast.error("تعذر إرسال الرسالة الصوتية"); }
      };
      recorder.start(); recorderRef.current = recorder; setRecording(true);
    } catch { toast.error("يجب السماح بالوصول إلى الميكروفون"); }
  };

  const call = (video) => {
    if (!selected) return;
    const room = `bytly-${selected.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)}`;
    const url = `https://meet.jit.si/${room}${video ? "" : "#config.startWithVideoMuted=true"}`;
    base44.entities.Message.create({ conversation_id: selected.id, project_id: selected.project_id || "direct", sender_email: user.email, sender_name: user.full_name, content: `📞 دعوة مكالمة ${video ? "فيديو" : "صوتية"} — ${url}`, is_system_message: false }).catch(() => {});
    window.open(url, "_blank", "width=900,height=700");
  };

  const createDirect = async target => {
    const existing = conversations.find(c => c.participants?.length === 2 && c.participants.includes(user.email) && c.participants.includes(target.email));
    if (existing) { setSelected(existing); setShowNew(false); return; }
    try {
      const name = target._type === "firm" ? target.company_name : target.full_name;
      const c = await base44.entities.Conversation.create({ project_id: "direct", participants: [user.email, target.email], type: "direct", name, participant_roles: { [target._type]: target.email } });
      setConversations(prev => [c, ...prev]); setSelected(c); setShowNew(false); setNewQuery("");
    } catch { toast.error("تعذر إنشاء المحادثة"); }
  };

  const createGroup = async () => {
    if (!selectedParticipants.length) return;
    try {
      const c = await base44.entities.Conversation.create({ project_id: "group", participants: [user.email, ...selectedParticipants], type: "group", name: groupName || "محادثة جماعية", admin_emails: [user.email] });
      setConversations(prev => [c, ...prev]); setSelected(c); setShowNew(false); setGroupMode(false); setSelectedParticipants([]); setGroupName("");
    } catch { toast.error("تعذر إنشاء المجموعة"); }
  };

  const toggleMute = async () => {
    if (!selected || !user) return;
    const current = selected.muted_by || [];
    const next = current.includes(user.email) ? current.filter(x => x !== user.email) : [...current, user.email];
    const updated = await base44.entities.Conversation.update(selected.id, { muted_by: next });
    setSelected(updated); setMuted(prev => ({ ...prev, [selected.id]: next.includes(user.email) }));
  };

  const archive = async () => {
    if (!selected) return;
    const updated = await base44.entities.Conversation.update(selected.id, { is_archived: true });
    setConversations(prev => prev.filter(c => c.id !== selected.id)); setSelected(null); setMessages([]); toast.success("تمت أرشفة المحادثة");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#C9A66B]" /></div>;
  if (showCloud) return <div dir="rtl"><CloudWorkspace user={user} usersMap={usersMap} onBack={() => setShowCloud(false)} /></div>;

  return <div className="h-[calc(100vh-80px)] min-h-[620px] bg-slate-50" dir="rtl">
    <div className="max-w-7xl mx-auto h-full p-2 sm:p-4">
      <div className="flex h-full bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
        <aside className={`w-full md:w-96 border-l flex flex-col ${selected ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div><h1 className="text-xl font-bold text-[#1a1a2e]">المحادثات</h1><p className="text-xs text-slate-500">مراسلة مباشرة، مجموعات ومحادثات المشاريع</p></div>
              <div className="flex gap-1">
                <Button size="icon" variant="outline" onClick={() => setShowCloud(true)} title="مساحة العمل السحابية"><Eye className="w-4 h-4" /></Button>
                <Button size="icon" onClick={() => setShowNew(true)} className="bg-[#1a1a2e] text-white" title="محادثة جديدة"><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input className="pr-9" placeholder="ابحث في المحادثات..." value={query} onChange={e => setQuery(e.target.value)} /></div>
            <div className="flex gap-1.5 flex-wrap">{TYPES.map(f => <button key={f.key} onClick={() => setType(f.key)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs ${type === f.key ? "bg-[#1a1a2e] text-white" : "bg-slate-100 text-slate-600"}`}><f.icon className="w-3 h-3" />{f.label}</button>)}</div>
          </div>
          <ScrollArea className="flex-1">{filtered.map(c => {
            const t = getType(c), n = unread[c.id] || 0;
            return <button key={c.id} onClick={() => setSelected(c)} className={`w-full p-4 flex gap-3 text-right border-b hover:bg-slate-50 ${selected?.id === c.id ? "bg-amber-50 border-r-2 border-r-[#C9A66B]" : ""}`}>
              <Avatar className="w-11 h-11"><AvatarImage src={getAvatar(c)} /><AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] text-white">{t === "group" ? <Users className="w-5 h-5" /> : getName(c).charAt(0)}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><span className="font-semibold text-sm truncate">{getName(c)}</span>{n > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">{n}</span>}</div><p className="text-xs text-slate-500 truncate mt-1">{c.last_message || "ابدأ المحادثة"}</p><p className="text-[10px] text-slate-400 mt-1">{t === "group" ? "محادثة جماعية" : (usersMap[(c.participants || []).find(x => x !== user?.email)]?._type === "engineer" ? "مهندس" : "مستخدم")}</p></div>
            </button>;
          })}</ScrollArea>
        </aside>

        <main className={`flex-1 flex flex-col ${selected ? "flex" : "hidden md:flex"}`}>
          {!selected ? <div className="flex-1 flex items-center justify-center text-center bg-slate-50"><div><MessageCircle className="w-16 h-16 mx-auto text-slate-200 mb-3" /><h2 className="font-semibold text-slate-600">اختر محادثة</h2><p className="text-sm text-slate-400 mt-1">أو ابدأ محادثة جديدة من الزر +</p></div></div> : <>
            <header className="p-3 sm:p-4 border-b flex items-center justify-between bg-white">
              <div className="flex items-center gap-2 min-w-0"><button className="md:hidden p-2" onClick={() => setSelected(null)}><ChevronLeft /></button><Avatar className="w-10 h-10"><AvatarImage src={getAvatar(selected)} /><AvatarFallback className="bg-[#1a1a2e] text-white">{getType(selected) === "group" ? <Users /> : getName(selected).charAt(0)}</AvatarFallback></Avatar><div className="min-w-0"><h2 className="font-bold text-sm truncate">{getName(selected)}</h2><p className="text-xs text-slate-500">{getType(selected) === "group" ? `${selected.participants?.length || 0} مشاركين` : "محادثة مباشرة"}</p></div></div>
              <div className="flex items-center gap-1"><Button variant="ghost" size="icon" onClick={() => call(false)} title="مكالمة صوتية"><Phone className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => call(true)} title="مكالمة فيديو"><Video className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => setShowQuote(true)} title="إرسال عرض سعر"><FileText className="w-4 h-4" /></Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={toggleMute}><BellOff className="w-4 h-4 ml-2" />{(selected.muted_by || []).includes(user?.email) ? "إلغاء الكتم" : "كتم الإشعارات"}</DropdownMenuItem><DropdownMenuItem onClick={archive} className="text-amber-700"><Archive className="w-4 h-4 ml-2" />أرشفة المحادثة</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
            </header>
            {getType(selected) === "group" && <div className="px-4 py-2 bg-purple-50 border-b flex gap-2 overflow-x-auto">{selected.participants?.map(email => <span key={email} className="text-xs px-2 py-1 rounded-full bg-white border text-slate-600 whitespace-nowrap">{usersMap[email]?.full_name || usersMap[email]?.company_name || email}</span>)}</div>}
            <ScrollArea className="flex-1 p-4 bg-slate-50"><div className="space-y-3">{messages.map(m => { const own = m.sender_email === user?.email; const atts = m.attachments || []; return <motion.div key={m.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex ${own ? "justify-start" : "justify-end"}`}><div className={`max-w-[80%] ${own ? "items-start" : "items-end"} flex flex-col`}><div className={`rounded-2xl px-4 py-2.5 ${own ? "bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white rounded-br-none" : "bg-white border shadow-sm rounded-bl-none"}`}><p className="text-sm whitespace-pre-wrap">{m.content}</p>{m.has_sensitive_data && <p className="text-[10px] mt-1 opacity-70">تم تنقيح بيانات اتصال حساسة</p>}{atts.map((a, i) => <div key={i} className="mt-2">{a.type?.startsWith("image/") ? <a href={a.url} target="_blank" rel="noreferrer"><img src={a.url} alt={a.name} className="max-w-56 max-h-48 rounded-lg object-cover" /></a> : a.type?.startsWith("audio/") ? <audio controls src={a.url} className="max-w-56" /> : <a href={a.url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 text-xs ${own ? "text-white" : "text-blue-600"}`}><Download className="w-4 h-4" />{a.name || "تحميل المرفق"}</a>}</div>)}</div><span className="text-[10px] text-slate-400 mt-1">{new Date(m.created_date).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}{own && m.is_read ? " · مقروء" : ""}</span></div></motion.div>; })}<div ref={endRef} /></div></ScrollArea>
            <div className="p-3 border-t bg-white"><div className="flex items-center gap-2"><input id="messages-file" type="file" multiple className="hidden" onChange={upload} /><label htmlFor="messages-file" className="p-2 cursor-pointer hover:bg-slate-100 rounded-lg" title="إرفاق ملف"><Paperclip className="w-5 h-5 text-slate-500" /></label><button onClick={recordVoice} className={`p-2 rounded-lg ${recording ? "bg-red-100 text-red-600 animate-pulse" : "hover:bg-slate-100 text-slate-500"}`} title="رسالة صوتية">{recording ? <MicOff /> : <Mic />}</button><Input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="اكتب رسالتك..." className="flex-1" /><Button disabled={!newMessage.trim() || sending} onClick={send} className="bg-[#1a1a2e] text-white"><Send /></Button></div></div>
          </>}
        </main>
      </div>
    </div>
  };

  return null;
}