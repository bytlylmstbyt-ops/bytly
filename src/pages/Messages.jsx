import React, { useEffect, useMemo, useState } from "react";
import { Search, Send, Paperclip, Phone, Video, ChevronLeft, Download, Loader2, Users, Plus, X, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { uploadScopedFile } from "@/lib/projectFileStorage";

const TYPES = [["all", "الكل"], ["client", "العملاء"], ["engineer", "المهندسون"], ["firm", "الشركات / المكاتب"], ["consultant", "الاستشاريون"]];
const withTimeout = (promise, ms = 12000) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("انتهت مهلة الاتصال")), ms))]);
const emailOf = value => String(value?.email || "").trim().toLowerCase();
const nameOf = row => row?.full_name || row?.company_name || row?.name || row?.email || "مستخدم";

function normalize(row, type) {
  if (!row?.email) return null;
  return { id: row.id, email: row.email, name: nameOf(row), company_name: row.company_name || "", city: row.city || "", image: row.profile_image || row.company_logo || "", type, verified: !!row.is_verified };
}

export default function Messages() {
  const { user, isAuthenticated } = useAuth();
  const me = emailOf(user);
  const [conversations, setConversations] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [directorySearch, setDirectorySearch] = useState("");
  const [type, setType] = useState("all");
  const [newChat, setNewChat] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const loadConversations = async () => {
    if (!supabase || !me) { setLoading(false); setError("تعذر تحديد حساب المستخدم الحالي. سجّل الدخول ثم أعد المحاولة."); return; }
    setLoading(true); setError("");
    try {
      const { data, error: dbError } = await withTimeout(supabase.from("user_conversations").select("*").contains("participants", [me]).order("last_message_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }), 12000);
      if (dbError) throw dbError;
      setConversations(data || []);
    } catch (e) {
      console.error("Messages load error", e);
      setError(e?.message || "تعذر تحميل المحادثات");
    } finally { setLoading(false); }
  };

  const loadDirectory = async () => {
    if (!supabase) return;
    setLoadingDirectory(true);
    try {
      const results = await Promise.allSettled([
        supabase.from("profiles").select("id,email,full_name,role,phone").limit(200),
        supabase.from("engineers").select("id,email,full_name,phone,city,specialization,is_verified,profile_image").limit(200),
        supabase.from("clients").select("id,email,full_name,phone,city,company_name").limit(200),
        supabase.from("engineering_firms").select("id,email,company_name,phone,city,is_verified,company_logo").limit(200),
        supabase.from("consultants").select("id,email,full_name,phone,city,status").limit(200),
      ]);
      const out = new Map();
      const add = (rows, typeName) => (rows || []).forEach(r => { const n = normalize(r, typeName); if (n && n.email !== me) out.set(n.email, n); });
      if (results[0].status === "fulfilled") results[0].value.data?.forEach(r => { const role = r.role === "engineer" ? "engineer" : r.role === "firm" ? "firm" : r.role === "consultant" ? "consultant" : "client"; add([r], role); });
      if (results[1].status === "fulfilled") add(results[1].value.data, "engineer");
      if (results[2].status === "fulfilled") add(results[2].value.data, "client");
      if (results[3].status === "fulfilled") add(results[3].value.data, "firm");
      if (results[4].status === "fulfilled") add(results[4].value.data, "consultant");
      setDirectory([...out.values()]);
    } catch (e) { console.error("Directory load error", e); }
    finally { setLoadingDirectory(false); }
  };

  const loadMessages = async conversation => {
    if (!conversation) return;
    setSelected(conversation); setLoadingMessages(true);
    try {
      const { data, error: dbError } = await withTimeout(supabase.from("user_messages").select("*").eq("conversation_id", conversation.id).order("created_at", { ascending: true }), 12000);
      if (dbError) throw dbError;
      setMessages(data || []);
    } catch (e) { toast.error(e?.message || "تعذر تحميل الرسائل"); setMessages([]); }
    finally { setLoadingMessages(false); }
  };

  useEffect(() => { if (isAuthenticated && me) { loadConversations(); loadDirectory(); } else { setLoading(false); setError("يجب تسجيل الدخول للوصول إلى المحادثات."); } }, [isAuthenticated, me]);

  const peopleByEmail = useMemo(() => new Map(directory.map(p => [p.email, p])), [directory]);
  const conversationRows = useMemo(() => conversations.map(c => {
    const others = (c.participants || []).filter(e => e !== me);
    const people = others.map(e => peopleByEmail.get(e)).filter(Boolean);
    return { ...c, otherEmails: others, people, displayName: c.name || people.map(p => p.name).join("، ") || others.join("، ") || "محادثة" };
  }), [conversations, peopleByEmail, me]);
  const filteredConversations = useMemo(() => conversationRows.filter(c => `${c.displayName} ${c.otherEmails.join(" ")} ${c.last_message || ""}`.toLowerCase().includes(search.toLowerCase())), [conversationRows, search]);
  const filteredDirectory = useMemo(() => directory.filter(p => (type === "all" || p.type === type) && `${p.name} ${p.email} ${p.company_name} ${p.city}`.toLowerCase().includes(directorySearch.toLowerCase())), [directory, type, directorySearch]);

  const startDirect = async person => {
    if (!person || !me) return;
    const target = person.email;
    const existing = conversations.find(c => c.type === "direct" && Array.isArray(c.participants) && c.participants.length === 2 && c.participants.includes(target) && c.participants.includes(me));
    if (existing) { setNewChat(false); return loadMessages(existing); }
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const payload = { id, created_at: now, updated_at: now, project_id: "direct", type: "direct", name: person.name, participants: [me, target], participant_roles: { [person.type]: target }, admin_emails: [], is_archived: false, muted_by: [], is_main_room: false };
      const { data, error: dbError } = await withTimeout(supabase.from("user_conversations").insert(payload).select("*").single(), 12000);
      if (dbError) throw dbError;
      setConversations(prev => [data, ...prev]); setNewChat(false); await loadMessages(data);
    } catch (e) { console.error(e); toast.error(e?.message || "تعذر إنشاء المحادثة"); }
  };

  const send = async () => {
    const content = draft.trim();
    if (!content || !selected || !me || sending) return;
    setSending(true);
    try {
      const payload = { id: crypto.randomUUID(), conversation_id: selected.id, project_id: selected.project_id || "direct", sender_email: me, sender_name: user?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || me, sender_role: user?.role || "user", content, original_content: content, has_sensitive_data: false, attachments: [], is_read: false, read_by: [], is_system_message: false };
      const { data, error: dbError } = await withTimeout(supabase.from("user_messages").insert(payload).select("*").single(), 12000);
      if (dbError) throw dbError;
      setMessages(prev => [...prev, data]); setDraft("");
      const now = new Date().toISOString();
      await supabase.from("user_conversations").update({ last_message: content, last_message_date: now, updated_at: now }).eq("id", selected.id);
      setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, last_message: content, last_message_date: now, updated_at: now } : c));
    } catch (e) { toast.error(e?.message || "تعذر إرسال الرسالة"); }
    finally { setSending(false); }
  };

  const attach = async event => {
    const file = event.target.files?.[0];
    if (!file || !selected || !me) return;
    try {
      const uploaded = await uploadScopedFile("messages", file);
      const attachment = { name: file.name, url: uploaded?.url || uploaded?.file_url, size: file.size, type: file.type, is_official: false };
      const payload = { id: crypto.randomUUID(), conversation_id: selected.id, project_id: selected.project_id || "direct", sender_email: me, sender_name: user?.full_name || me, sender_role: user?.role || "user", content: `📎 ${file.name}`, original_content: null, has_sensitive_data: false, attachments: [attachment], is_read: false, read_by: [], is_system_message: false };
      const { data, error: dbError } = await withTimeout(supabase.from("user_messages").insert(payload).select("*").single(), 12000);
      if (dbError) throw dbError;
      setMessages(prev => [...prev, data]);
    } catch (e) { toast.error(e?.message || "تعذر رفع المرفق"); }
    finally { event.target.value = ""; }
  };

  if (loading) return <div className="min-h-[70vh] flex items-center justify-center"><div className="flex items-center gap-3 text-slate-600"><Loader2 className="animate-spin" /> جاري تحميل المحادثات...</div></div>;
  if (error) return <div className="min-h-[70vh] flex items-center justify-center p-6"><div className="max-w-md w-full rounded-2xl border bg-white p-8 text-center shadow-sm"><MessageCircle className="mx-auto mb-4 h-10 w-10 text-[#C9A66B]" /><h2 className="text-xl font-bold mb-2">تعذر تحميل المحادثات</h2><p className="text-sm text-slate-600 mb-5">{error}</p><button onClick={loadConversations} className="rounded-xl bg-[#3b2418] px-5 py-2.5 text-white">إعادة المحاولة</button></div></div>;

  return <div className="min-h-[70vh] bg-slate-50 p-3 md:p-6" dir="rtl">
    <div className="mx-auto max-w-6xl rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b p-4"><div><h1 className="text-xl font-bold">المحادثات</h1><p className="text-sm text-slate-500">تواصل مباشر مع مستخدمي بيتلي</p></div><button onClick={() => setNewChat(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#3b2418] px-4 py-2 text-white"><Plus size={18}/> محادثة جديدة</button></div>
      <div className="grid min-h-[600px] md:grid-cols-[320px_1fr]" dir="ltr">
        <aside className="border-r bg-slate-50" dir="rtl"><div className="p-3"><div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث في المحادثات" className="w-full rounded-xl border bg-white py-2.5 pr-9 pl-3 text-sm"/></div></div><div className="max-h-[520px] overflow-auto">{filteredConversations.length===0?<div className="p-8 text-center text-sm text-slate-500">لا توجد محادثات بعد.</div>:filteredConversations.map(c=><button key={c.id} onClick={()=>loadMessages(c)} className={`w-full border-b p-4 text-right hover:bg-white ${selected?.id===c.id?'bg-white':''}`}><div className="font-semibold truncate">{c.displayName}</div><div className="mt-1 truncate text-xs text-slate-500">{c.last_message || "ابدأ المحادثة"}</div></button>)}</div></aside>
        <main dir="rtl" className="flex flex-col"><div className="border-b p-4">{selected?<div className="flex items-center gap-3"><button className="md:hidden" onClick={()=>setSelected(null)}><ChevronLeft/></button><div className="h-10 w-10 rounded-full bg-[#ead7b7] flex items-center justify-center"><Users size={20}/></div><div><div className="font-bold">{selected.name || selected.participants.filter(e=>e!==me).join("، ")}</div><div className="text-xs text-slate-500">محادثة مباشرة</div></div></div>:<div className="py-3 text-slate-500">اختر محادثة أو ابدأ محادثة جديدة.</div>}</div><div className="flex-1 space-y-3 overflow-auto p-4 bg-slate-50">{!selected?<div className="h-full flex items-center justify-center text-slate-400">ابدأ من زر «محادثة جديدة» للتواصل مع مستخدم حقيقي.</div>:loadingMessages?<div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div>:messages.length===0?<div className="text-center text-sm text-slate-400 py-10">لا توجد رسائل بعد.</div>:messages.map(m=><div key={m.id} className={`flex ${m.sender_email===me?'justify-start':'justify-end'}`}><div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.sender_email===me?'bg-[#3b2418] text-white':'bg-white border'}`}><div className="whitespace-pre-wrap text-sm">{m.content}</div>{(m.attachments||[]).map((a,i)=><a key={i} href={a.url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 text-xs underline"><Download size={14}/>{a.name}</a>)}</div></div>)}</div>{selected&&<div className="border-t bg-white p-3"><div className="flex items-center gap-2"><label className="cursor-pointer rounded-xl p-2 hover:bg-slate-100"><Paperclip size={19}/><input type="file" className="hidden" onChange={attach}/></label><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} placeholder="اكتب رسالتك..." className="flex-1 rounded-xl border px-4 py-3 text-sm"/><button disabled={sending||!draft.trim()} onClick={send} className="rounded-xl bg-[#3b2418] p-3 text-white disabled:opacity-50"><Send size={18}/></button></div></div>}</main>
      </div>
    </div>
    {newChat&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl" dir="rtl"><div className="flex items-center justify-between border-b p-4"><div><h2 className="font-bold">محادثة جديدة</h2><p className="text-xs text-slate-500">اختر مستخدمًا حقيقيًا للتواصل معه</p></div><button onClick={()=>setNewChat(false)}><X/></button></div><div className="p-4"><div className="flex gap-2 overflow-auto pb-3">{TYPES.map(([v,l])=><button key={v} onClick={()=>setType(v)} className={`whitespace-nowrap rounded-full px-3 py-2 text-sm ${type===v?'bg-[#3b2418] text-white':'bg-slate-100'}`}>{l}</button>)}</div><div className="relative mb-3"><Search className="absolute right-3 top-3 h-4 w-4 text-slate-400"/><input value={directorySearch} onChange={e=>setDirectorySearch(e.target.value)} placeholder="ابحث بالاسم أو البريد أو الشركة أو المدينة" className="w-full rounded-xl border py-2.5 pr-9 pl-3 text-sm"/></div><div className="max-h-[55vh] overflow-auto">{loadingDirectory?<div className="py-10 text-center"><Loader2 className="mx-auto animate-spin"/></div>:filteredDirectory.length===0?<div className="py-10 text-center text-sm text-slate-500">لا يوجد مستخدمون مطابقون.</div>:filteredDirectory.map(p=><button key={p.email} onClick={()=>startDirect(p)} className="flex w-full items-center gap-3 border-b p-3 text-right hover:bg-slate-50"><div className="h-10 w-10 rounded-full bg-[#ead7b7] flex items-center justify-center">{p.image?<img src={p.image} className="h-10 w-10 rounded-full object-cover"/>:<Users size={18}/>}</div><div className="min-w-0 flex-1"><div className="font-semibold truncate">{p.name}</div><div className="text-xs text-slate-500 truncate">{p.email}{p.city?` · ${p.city}`:""}</div></div><span className="text-xs rounded-full bg-slate-100 px-2 py-1">{TYPES.find(x=>x[0]===p.type)?.[1]||"مستخدم"}</span></button>)}</div></div></div></div>}
  </div>;
}
