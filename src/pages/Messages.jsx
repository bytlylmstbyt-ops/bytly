import React, { useEffect, useMemo, useState } from "react";
import { Search, Send, Paperclip, Phone, Video, ChevronLeft, Download, Loader2, Users, Plus, X, MessageCircle, Image, FileText, Smile } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { uploadScopedFile } from "@/lib/projectFileStorage";

const TYPES = [["all", "الكل"], ["client", "العملاء"], ["engineer", "المهندسون"], ["firm", "الشركات / المكاتب"], ["consultant", "الاستشاريون"]];
const timeout = (promise, ms = 12000) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("انتهت مهلة الاتصال")), ms))]);
const emailOf = value => String(value?.email || "").trim().toLowerCase();
const displayName = row => row?.full_name || row?.company_name || row?.name || row?.email || "مستخدم";
function normalize(row, type) { if (!row?.email) return null; return { id: row.id, email: String(row.email).trim().toLowerCase(), name: displayName(row), company_name: row.company_name || "", city: row.city || "", image: row.profile_image || row.company_logo || "", type, verified: !!row.is_verified }; }

export default function Messages() {
  const { user, isAuthenticated } = useAuth();
  const me = emailOf(user);
  const [conversations, setConversations] = useState([]), [directory, setDirectory] = useState([]), [selected, setSelected] = useState(null), [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true), [loadingMessages, setLoadingMessages] = useState(false), [error, setError] = useState("");
  const [search, setSearch] = useState(""), [directorySearch, setDirectorySearch] = useState(""), [type, setType] = useState("all"), [newChat, setNewChat] = useState(false);
  const [draft, setDraft] = useState(""), [sending, setSending] = useState(false), [showAddMenu, setShowAddMenu] = useState(false);

  const loadConversations = async () => {
    if (!supabase || !me) { setLoading(false); setError("يجب تسجيل الدخول للوصول إلى المحادثات."); return; }
    setLoading(true); setError("");
    try { const result = await timeout(supabase.from("user_conversations").select("*").contains("participants", [me]).order("last_message_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false })); if (result.error) throw result.error; setConversations(result.data || []); }
    catch (e) { console.error(e); setError(e?.message || "تعذر تحميل المحادثات"); } finally { setLoading(false); }
  };
  const loadDirectory = async () => {
    if (!supabase) return;
    try {
      const results = await Promise.allSettled([
        supabase.from("profiles").select("id,email,full_name,role,phone").limit(200),
        supabase.from("engineers").select("id,email,full_name,phone,city,specialization,is_verified,profile_image").limit(200),
        supabase.from("clients").select("id,email,full_name,phone,city,company_name").limit(200),
        supabase.from("engineering_firms").select("id,email,company_name,phone,city,is_verified,company_logo").limit(200),
        supabase.from("consultants").select("id,email,full_name,phone,city,status").limit(200)
      ]);
      const map = new Map(); const add = (rows, role) => (rows || []).forEach(row => { const p = normalize(row, role); if (p && p.email !== me) map.set(p.email, p); });
      if (results[0].status === "fulfilled") results[0].value.data?.forEach(row => add([row], row.role === "engineer" ? "engineer" : row.role === "firm" ? "firm" : row.role === "consultant" ? "consultant" : "client"));
      if (results[1].status === "fulfilled") add(results[1].value.data, "engineer"); if (results[2].status === "fulfilled") add(results[2].value.data, "client"); if (results[3].status === "fulfilled") add(results[3].value.data, "firm"); if (results[4].status === "fulfilled") add(results[4].value.data, "consultant");
      setDirectory([...map.values()]);
    } catch (e) { console.error("Directory error", e); }
  };
  const openConversation = async conversation => {
    if (!conversation) return; setSelected(conversation); setMessages([]); setLoadingMessages(true); setShowAddMenu(false);
    try { const result = await timeout(supabase.from("user_messages").select("*").eq("conversation_id", conversation.id).order("created_at", { ascending: true })); if (result.error) throw result.error; setMessages(result.data || []); }
    catch (e) { console.error(e); toast.error(e?.message || "تعذر تحميل تفاصيل المحادثة"); } finally { setLoadingMessages(false); }
  };
  useEffect(() => { if (isAuthenticated && me) { loadConversations(); loadDirectory(); } else { setLoading(false); setError("يجب تسجيل الدخول للوصول إلى المحادثات."); } }, [isAuthenticated, me]);
  const peopleByEmail = useMemo(() => new Map(directory.map(p => [p.email, p])), [directory]);
  const rows = useMemo(() => conversations.map(c => { const participants = Array.isArray(c.participants) ? c.participants : []; const others = participants.filter(email => String(email).toLowerCase() !== me); const people = others.map(email => peopleByEmail.get(String(email).toLowerCase())).filter(Boolean); return { ...c, otherEmails: others, people, displayName: c.name || people.map(p => p.name).join("، ") || others.join("، ") || "محادثة مباشرة" }; }), [conversations, peopleByEmail, me]);
  const filtered = useMemo(() => rows.filter(c => `${c.displayName} ${c.otherEmails.join(" ")} ${c.last_message || ""}`.toLowerCase().includes(search.toLowerCase())), [rows, search]);
  const people = useMemo(() => directory.filter(p => (type === "all" || p.type === type) && `${p.name} ${p.email} ${p.company_name} ${p.city}`.toLowerCase().includes(directorySearch.toLowerCase())), [directory, type, directorySearch]);
  const startDirect = async person => {
    if (!person || !me) return; const existing = conversations.find(c => c.type === "direct" && Array.isArray(c.participants) && c.participants.length === 2 && c.participants.map(String).map(x => x.toLowerCase()).includes(me) && c.participants.map(String).map(x => x.toLowerCase()).includes(person.email));
    if (existing) { setNewChat(false); return openConversation(existing); }
    try { const now = new Date().toISOString(); const payload = { id: crypto.randomUUID(), created_at: now, updated_at: now, project_id: "direct", type: "direct", name: person.name, participants: [me, person.email], participant_roles: { [person.type]: person.email }, admin_emails: [], is_archived: false, muted_by: [], is_main_room: false }; const result = await timeout(supabase.from("user_conversations").insert(payload).select("*").single()); if (result.error) throw result.error; setConversations(prev => [result.data, ...prev]); setNewChat(false); await openConversation(result.data); }
    catch (e) { console.error(e); toast.error(e?.message || "تعذر إنشاء المحادثة"); }
  };
  const sendMessage = async () => {
    const content = draft.trim(); if (!content || !selected || !me || sending) return; setSending(true);
    try { const payload = { id: crypto.randomUUID(), conversation_id: selected.id, project_id: selected.project_id || "direct", sender_email: me, sender_name: user?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || me, sender_role: user?.role || "user", content, original_content: content, has_sensitive_data: false, attachments: [], is_read: false, read_by: [], is_system_message: false }; const result = await timeout(supabase.from("user_messages").insert(payload).select("*").single()); if (result.error) throw result.error; setMessages(prev => [...prev, result.data]); setDraft(""); const now = new Date().toISOString(); await supabase.from("user_conversations").update({ last_message: content, last_message_date: now, updated_at: now }).eq("id", selected.id); setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, last_message: content, last_message_date: now, updated_at: now } : c)); }
    catch (e) { toast.error(e?.message || "تعذر إرسال الرسالة"); } finally { setSending(false); }
  };
  const attachFile = async event => {
    const file = event.target.files?.[0]; if (!file || !selected || !me) return;
    try { const uploaded = await uploadScopedFile("messages", file); const attachment = { name: file.name, url: uploaded?.url || uploaded?.file_url, size: file.size, type: file.type, is_official: false }; const payload = { id: crypto.randomUUID(), conversation_id: selected.id, project_id: selected.project_id || "direct", sender_email: me, sender_name: user?.full_name || me, sender_role: user?.role || "user", content: `📎 ${file.name}`, original_content: null, has_sensitive_data: false, attachments: [attachment], is_read: false, read_by: [], is_system_message: false }; const result = await timeout(supabase.from("user_messages").insert(payload).select("*").single()); if (result.error) throw result.error; setMessages(prev => [...prev, result.data]); const now = new Date().toISOString(); await supabase.from("user_conversations").update({ last_message: `📎 ${file.name}`, last_message_date: now, updated_at: now }).eq("id", selected.id); }
    catch (e) { toast.error(e?.message || "تعذر رفع المرفق"); } finally { event.target.value = ""; }
  };
  const call = video => { if (!selected) return; const room = `Bytly-${selected.id}`; window.open(`https://meet.jit.si/${encodeURIComponent(room)}`, "_blank", "noopener,noreferrer"); toast.success(video ? "تم فتح مكالمة الفيديو" : "تم فتح المكالمة"); };

  if (loading) return <div className="min-h-[70vh] flex items-center justify-center"><div className="flex items-center gap-3 text-slate-600"><Loader2 className="animate-spin"/> جاري تحميل المحادثات...</div></div>;
  if (error) return <div className="min-h-[70vh] flex items-center justify-center p-6"><div className="max-w-md w-full rounded-2xl border bg-white p-8 text-center shadow-sm"><MessageCircle className="mx-auto mb-4 h-10 w-10 text-[#C9A66B]"/><h2 className="text-xl font-bold mb-2">تعذر تحميل المحادثات</h2><p className="text-sm text-slate-600 mb-5">{error}</p><button onClick={loadConversations} className="rounded-xl bg-[#3b2418] px-5 py-2.5 text-white">إعادة المحاولة</button></div></div>;

  return <div className="min-h-[70vh] bg-slate-50 p-3 md:p-6" dir="rtl"><div className="mx-auto max-w-7xl rounded-2xl border bg-white shadow-sm overflow-hidden">
    <div className="flex items-center justify-between border-b p-4"><div><h1 className="text-xl font-bold">المحادثات</h1><p className="text-sm text-slate-500">تواصل مباشر مع مستخدمي بيتلي</p></div><button onClick={() => setNewChat(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#3b2418] px-4 py-2 text-white"><Plus size={18}/> محادثة جديدة</button></div>
    <div className="grid min-h-[650px] md:grid-cols-[330px_1fr]" dir="ltr">
      <aside className="border-r bg-slate-50" dir="rtl"><div className="p-3"><div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث في المحادثات" className="w-full rounded-xl border bg-white py-2.5 pr-9 pl-3 text-sm"/></div></div><div className="max-h-[570px] overflow-auto">{filtered.length===0?<div className="p-8 text-center text-sm text-slate-500">لا توجد محادثات بعد.</div>:filtered.map(c=><button key={c.id} onClick={()=>openConversation(c)} className={`w-full border-b p-4 text-right hover:bg-white ${selected?.id===c.id?'bg-white':''}`}><div className="font-semibold truncate">{c.displayName}</div><div className="mt-1 truncate text-xs text-slate-500">{c.last_message || "ابدأ المحادثة"}</div></button>)}</div></aside>
      <main dir="rtl" className="flex min-h-[650px] flex-col">
        <div className="border-b bg-white p-4">{selected?<div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><button className="md:hidden" onClick={()=>setSelected(null)}><ChevronLeft/></button><div className="h-11 w-11 shrink-0 rounded-full bg-[#ead7b7] flex items-center justify-center"><Users size={20}/></div><div className="min-w-0"><div className="font-bold truncate">{selected.name || selected.people?.map(p=>p.name).join("، ") || (selected.participants || []).filter(e=>String(e).toLowerCase()!==me).join("، ") || "مستخدم"}</div><div className="text-xs text-slate-500">محادثة مباشرة</div></div></div><div className="flex items-center gap-1"><button onClick={()=>call(false)} title="مكالمة صوتية" className="rounded-xl p-2.5 hover:bg-slate-100"><Phone size={19}/></button><button onClick={()=>call(true)} title="مكالمة فيديو" className="rounded-xl p-2.5 hover:bg-slate-100"><Video size={20}/></button></div></div>:<div className="py-3 text-slate-500">اختر محادثة من القائمة أو اضغط «محادثة جديدة».</div>}</div>
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">{!selected?<div className="h-full min-h-[480px] flex items-center justify-center text-slate-400">اختر مستخدمًا لبدء التواصل.</div>:loadingMessages?<div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div>:messages.length===0?<div className="h-full min-h-[400px] flex items-center justify-center text-sm text-slate-400">لا توجد رسائل بعد. اكتب أول رسالة الآن.</div>:messages.map(m=><div key={m.id} className={`flex ${m.sender_email===me?'justify-start':'justify-end'}`}><div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${m.sender_email===me?'bg-[#3b2418] text-white':'bg-white border text-slate-800'}`}><div className="whitespace-pre-wrap text-sm">{m.content}</div>{(m.attachments||[]).map((a,i)=><a key={i} href={a.url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 text-xs underline"><Download size={14}/>{a.name}</a>)}</div></div>)}</div>
        {selected&&<div className="border-t bg-white p-3"><div className="flex items-end gap-2 relative">
          <div className="relative"><button type="button" onClick={()=>setShowAddMenu(v=>!v)} title="إضافة" className="flex h-12 w-12 items-center justify-center rounded-xl border bg-white hover:bg-slate-50"><Plus size={22}/></button>
            {showAddMenu&&<div className="absolute bottom-14 right-0 z-30 w-52 rounded-2xl border bg-white p-2 shadow-xl"><label className="flex cursor-pointer items-center gap-3 rounded-xl p-3 text-sm hover:bg-slate-50"><Image size={18}/> صورة أو فيديو<input type="file" accept="image/*,video/*" className="hidden" onChange={e=>{attachFile(e);setShowAddMenu(false)}}/></label><label className="flex cursor-pointer items-center gap-3 rounded-xl p-3 text-sm hover:bg-slate-50"><FileText size={18}/> ملف أو مستند<input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" className="hidden" onChange={e=>{attachFile(e);setShowAddMenu(false)}}/></label><button type="button" onClick={()=>{setShowAddMenu(false);toast.info("يمكن إضافة المزيد من خيارات التواصل لاحقًا")}} className="flex w-full items-center gap-3 rounded-xl p-3 text-sm hover:bg-slate-50"><Smile size={18}/> خيارات إضافية</button></div>}
          </div>
          <label title="إرفاق مرفق" className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border hover:bg-slate-50"><Paperclip size={21}/><input type="file" className="hidden" onChange={attachFile}/></label>
          <textarea value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}} rows={2} placeholder="اكتب رسالتك..." className="min-h-[48px] flex-1 resize-none rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A66B]"/>
          <button onClick={sendMessage} disabled={!draft.trim()||sending} title="إرسال" className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3b2418] text-white disabled:opacity-50">{sending?<Loader2 size={20} className="animate-spin"/>:<Send size={20}/>}</button>
        </div><div className="mt-1 text-[11px] text-slate-400">اكتب رسالتك · 📎 إرفاق · ＋ إضافة · Enter للإرسال · Shift+Enter لسطر جديد</div></div>}
      </main>
    </div>
  </div>
  {newChat&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl"><div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-xl"><div className="flex items-center justify-between border-b p-4"><div><h2 className="text-lg font-bold">محادثة جديدة</h2><p className="text-xs text-slate-500">اختر مستخدمًا حقيقيًا للتواصل معه</p></div><button onClick={()=>setNewChat(false)}><X/></button></div><div className="border-b p-3"><div className="relative mb-3"><Search className="absolute right-3 top-3 h-4 w-4 text-slate-400"/><input value={directorySearch} onChange={e=>setDirectorySearch(e.target.value)} placeholder="ابحث بالاسم أو البريد أو الشركة أو المدينة" className="w-full rounded-xl border py-2.5 pr-9 pl-3 text-sm"/></div><div className="flex flex-wrap gap-2">{TYPES.map(([key,label])=><button key={key} onClick={()=>setType(key)} className={`rounded-full px-3 py-1.5 text-xs ${type===key?'bg-[#3b2418] text-white':'bg-slate-100 text-slate-700'}`}>{label}</button>)}</div></div><div className="max-h-[55vh] overflow-auto p-2">{people.length===0?<div className="p-10 text-center text-sm text-slate-500">لا يوجد مستخدم مطابق للبحث.</div>:people.map(person=><button key={person.email} onClick={()=>startDirect(person)} className="flex w-full items-center gap-3 rounded-xl p-3 text-right hover:bg-slate-50"><div className="h-11 w-11 shrink-0 rounded-full bg-[#ead7b7] flex items-center justify-center"><Users size={19}/></div><div className="min-w-0 flex-1"><div className="font-semibold truncate">{person.name}</div><div className="text-xs text-slate-500 truncate">{person.email}{person.company_name?` · ${person.company_name}`:""}</div></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px]">{TYPES.find(x=>x[0]===person.type)?.[1] || "مستخدم"}</span></button>)}</div></div></div>}
  </div>;
}
