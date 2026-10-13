import React, { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { callGemini } from "@/lib/geminiClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Plus, MessageSquare, Loader2, ShieldAlert, RefreshCw } from "lucide-react";

const OWNER_EMAIL = "bytlylmstbyt@gmail.com";

function parseMessages(value) {
  if (Array.isArray(value)) return value.filter((m) => m && typeof m.text === "string" && ["user", "assistant"].includes(m.role));
  if (typeof value === "string") {
    try { return parseMessages(JSON.parse(value)); } catch { return []; }
  }
  return [];
}

export default function AdminChatbotCenter() {
  const [allowed, setAllowed] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  const verifyAccess = useCallback(async () => {
    setCheckingAccess(true);
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth?.user) throw new Error("يرجى تسجيل الدخول بحساب الإدارة.");
      const email = String(auth.user.email || "").toLowerCase();
      let role = String(auth.user.app_metadata?.role || "").toLowerCase();
      const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", auth.user.id).maybeSingle();
      if (!profile?.role) {
        const { data: fallbackProfile } = await supabase.from("profiles").select("role").eq("id", auth.user.id).maybeSingle();
        role = String(fallbackProfile?.role || role).toLowerCase();
      } else role = String(profile.role).toLowerCase();
      setAllowed(email === OWNER_EMAIL || ["admin", "owner"].includes(role));
    } catch {
      setAllowed(false);
    } finally {
      setCheckingAccess(false);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    setError("");
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) throw new Error("انتهت جلسة الدخول. سجلي الدخول من جديد.");
      const { data, error: queryError } = await supabase
        .from("admin_ai_conversations")
        .select("id,title,messages_json,created_at,updated_at")
        .eq("admin_user_id", auth.user.id)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (queryError) throw queryError;
      const rows = data || [];
      setConversations(rows);
      if (activeId) {
        const active = rows.find((row) => row.id === activeId);
        if (active) setMessages(parseMessages(active.messages_json));
        else { setActiveId(null); setMessages([]); }
      }
    } catch (e) {
      setError(e?.message || "تعذر تحميل سجل المحادثات.");
    } finally {
      setLoadingList(false);
    }
  }, [activeId]);

  useEffect(() => { verifyAccess(); }, [verifyAccess]);
  useEffect(() => { if (allowed) loadConversations(); }, [allowed, loadConversations]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, sending]);

  const openConversation = (row) => {
    setActiveId(row.id);
    setMessages(parseMessages(row.messages_json));
    setError("");
  };

  const newConversation = () => {
    setActiveId(null);
    setMessages([]);
    setDraft("");
    setError("");
  };

  const persistConversation = async (nextMessages, existingId, title) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) throw new Error("انتهت جلسة الدخول. سجلي الدخول من جديد.");
    if (existingId) {
      const { data, error: updateError } = await supabase
        .from("admin_ai_conversations")
        .update({ messages_json: nextMessages, title: title || "محادثة الشات بوت", updated_at: new Date().toISOString() })
        .eq("id", existingId)
        .eq("admin_user_id", auth.user.id)
        .select("id,title,messages_json,created_at,updated_at")
        .single();
      if (updateError) throw updateError;
      return data;
    }
    const { data, error: insertError } = await supabase
      .from("admin_ai_conversations")
      .insert({ admin_user_id: auth.user.id, title: title || "محادثة الشات بوت", messages_json: nextMessages, attachments_count: 0 })
      .select("id,title,messages_json,created_at,updated_at")
      .single();
    if (insertError) throw insertError;
    return data;
  };

  const sendMessage = async (event) => {
    event?.preventDefault?.();
    const prompt = draft.trim();
    if (!prompt || sending) return;
    setSending(true);
    setError("");
    const userMessage = { role: "user", text: prompt, created_at: new Date().toISOString() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    try {
      const history = nextMessages.slice(-12).map((m) => ({ role: m.role, text: m.text }));
      const answer = await callGemini({
        agent: "admin_chatbot",
        prompt: [
          "أنت مساعد بيتلي داخل مركز الإدارة. أجب بالعربية الواضحة ما لم يطلب المستخدم لغة أخرى.",
          "كن دقيقًا، ولا تدّعِ أنك نفذت إجراءات أو قرأت بيانات لم يتم تمريرها لك.",
          "إذا كان الطلب يتطلب تعديلًا فعليًا في النظام، اشرح الخطوات ولا تدّعِ تنفيذها.",
          "سياق المحادثة الأخيرة:",
          ...history.map((m) => (m.role === "user" ? "المستخدم: " : "المساعد: ") + m.text),
          "أجب عن رسالة المستخدم الأخيرة فقط مع مراعاة السياق."
        ].join("\n\n"),
        context: { surface: "admin-chatbot-center", conversation_history: history },
        responseFormat: "text",
      });
      const assistantMessage = { role: "assistant", text: String(answer || "").trim(), created_at: new Date().toISOString() };
      const finalMessages = [...nextMessages, assistantMessage];
      setMessages(finalMessages);
      const saved = await persistConversation(finalMessages, activeId, prompt.slice(0, 64));
      setActiveId(saved.id);
      setConversations((previous) => [saved, ...previous.filter((row) => row.id !== saved.id)]);
    } catch (e) {
      setMessages((current) => [...current, { role: "assistant", text: "تعذر الحصول على رد أو حفظ المحادثة. تحققي من الاتصال ثم حاولي مرة أخرى.", created_at: new Date().toISOString() }]);
      setError(e?.message || "تعذر إرسال الرسالة.");
    } finally {
      setSending(false);
    }
  };

  if (checkingAccess) return <div className="min-h-[50vh] flex items-center justify-center gap-3 text-slate-500" dir="rtl"><Loader2 className="animate-spin" /> جارٍ التحقق من صلاحيات الإدارة...</div>;
  if (!allowed) return <div className="min-h-[50vh] flex items-center justify-center p-4" dir="rtl"><Card className="max-w-md w-full border-red-200"><CardContent className="p-6 text-center"><ShieldAlert className="mx-auto mb-3 text-red-500" /><h1 className="font-bold text-lg">الوصول للمشرفين فقط</h1><p className="text-sm text-slate-500 mt-2">هذه الصفحة مخصصة لحساب مالك المنصة أو المشرفين المعتمدين.</p></CardContent></Card></div>;

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-[#4A3F35] flex items-center gap-2"><Bot className="text-[#C9A66B]" /> مركز الشات بوت</h1><p className="text-sm text-slate-500 mt-1">محادثات الإدارة عبر Supabase ووكيل Bytly AI.</p></div>
        <Button onClick={newConversation} className="bg-[#4A3F35] hover:bg-[#382f28]"><Plus className="w-4 h-4 ml-2" /> محادثة جديدة</Button>
      </div>
      {error && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4">
        <Card className="border-[#EFE6D3]">
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-2 px-2 py-2"><h2 className="font-semibold text-[#4A3F35]">سجل المحادثات</h2><Button variant="ghost" size="sm" onClick={loadConversations} disabled={loadingList}><RefreshCw className={`w-4 h-4 ${loadingList ? "animate-spin" : ""}`} /></Button></div>
            {loadingList ? <div className="p-4 text-sm text-slate-500 flex gap-2"><Loader2 className="w-4 h-4 animate-spin" /> جارٍ التحميل...</div> : conversations.length ? <div className="space-y-1 max-h-[60vh] overflow-y-auto">{conversations.map((row) => <button key={row.id} type="button" onClick={() => openConversation(row)} className={`w-full text-right rounded-lg px-3 py-2.5 text-sm ${activeId === row.id ? "bg-[#FEF9EE] border border-[#C9A66B]/40" : "hover:bg-slate-50"}`}><span className="flex items-center gap-2 font-medium text-[#4A3F35]"><MessageSquare className="w-4 h-4 shrink-0" /><span className="truncate">{row.title || "محادثة الشات بوت"}</span></span><span className="block text-xs text-slate-400 mt-1">{row.updated_at ? new Date(row.updated_at).toLocaleString("ar-SA") : ""}</span></button>)}</div> : <p className="p-3 text-sm text-slate-500">لا توجد محادثات محفوظة بعد.</p>}
          </CardContent>
        </Card>
        <Card className="border-[#EFE6D3] min-h-[65vh] flex flex-col">
          <CardContent className="p-4 md:p-5 flex flex-col flex-1 gap-4">
            <div className="flex-1 min-h-[300px] max-h-[60vh] overflow-y-auto space-y-4 rounded-xl bg-slate-50/70 p-3 md:p-4">
              {!messages.length && <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center text-slate-500"><Bot className="w-10 h-10 text-[#C9A66B] mb-3" /><h2 className="font-semibold text-[#4A3F35]">مرحبًا بك في شات بوت بيتلي</h2><p className="text-sm mt-1 max-w-md">اكتبي سؤالك، وسيُرسل إلى خدمة الذكاء الاصطناعي عبر Supabase.</p></div>}
              {messages.map((message, index) => <div key={message.created_at + "-" + index} className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}><div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${message.role === "user" ? "bg-[#4A3F35] text-white" : "bg-[#FEF9EE] text-[#4A3F35] border border-[#EFE6D3]"}`}>{message.text}</div></div>)}
              {sending && <div className="flex justify-end"><div className="rounded-xl bg-[#FEF9EE] px-4 py-3 text-sm text-slate-500 flex gap-2"><Loader2 className="w-4 h-4 animate-spin" /> بيتلي يفكر...</div></div>}
              <div ref={endRef} />
            </div>
            <form onSubmit={sendMessage} className="space-y-2">
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="اكتبي رسالتك هنا..." rows={3} disabled={sending} className="resize-y" />
              <div className="flex items-center justify-between gap-3"><p className="text-xs text-slate-400">يتم حفظ المحادثات في Supabase تحت حسابك الإداري.</p><Button type="submit" disabled={!draft.trim() || sending} className="bg-[#C9A66B] text-white hover:bg-[#b38f55]"><Send className="w-4 h-4 ml-2" /> {sending ? "جارٍ الإرسال..." : "إرسال"}</Button></div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
