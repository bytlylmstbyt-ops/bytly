import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Sparkles, ShieldAlert, Trash2, RefreshCw } from "lucide-react";

const PLATFORM_OWNER_EMAIL = "bytlylmstbyt@gmail.com";

const starterPrompts = [
  "اعطني ملخصًا سريعًا لحالة المنصة الآن.",
  "ما عدد المستخدمين والمشاريع ومقدمي الخدمة حاليًا؟",
  "حلل أهم الأشياء التي يجب أن أراجعها في مركز الإدارة.",
  "راجع لي حالة النزاعات والمشاريع وأعطني نقاط متابعة عملية."
];

function AccessDenied() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4" dir="rtl">
      <Card className="max-w-md w-full border-r-4 border-red-400">
        <CardContent className="p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#4A3F35] mb-2">هذه الصفحة مخصصة للمشرفين فقط</h2>
          <p className="text-sm text-slate-500">غير مصرح لك بالوصول إلى مساعد الإدارة المركزي.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminAIAssistantSupabase() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState("");
  const [context, setContext] = useState({});
  const bottomRef = useRef(null);

  const loadContext = async () => {
    const queries = await Promise.allSettled([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase.from("companies").select("id", { count: "exact", head: true }),
      supabase.from("disputes").select("id", { count: "exact", head: true }),
      supabase.from("admin_audit_logs").select("id", { count: "exact", head: true }),
    ]);
    const value = {
      users_count: queries[0].value?.count ?? null,
      projects_count: queries[1].value?.count ?? null,
      companies_count: queries[2].value?.count ?? null,
      disputes_count: queries[3].value?.count ?? null,
      admin_audit_logs_count: queries[4].value?.count ?? null,
      captured_at: new Date().toISOString(),
    };
    setContext(value);
    return value;
  };

  const loadHistory = async (adminId) => {
    setLoadingHistory(true);
    const { data, error: historyError } = await supabase
      .from("admin_ai_conversations")
      .select("id,title,messages_json,updated_at")
      .eq("admin_user_id", adminId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!historyError && data) {
      setConversationId(data.id);
      const saved = Array.isArray(data.messages_json) ? data.messages_json : [];
      setMessages(saved);
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data?.user) throw authError || new Error("لم يتم العثور على جلسة تسجيل دخول");
        const authUser = data.user;
        const email = (authUser.email || "").trim().toLowerCase();
        const { data: profile } = await supabase
          .from("profiles")
          .select("role,full_name,email")
          .eq("user_id", authUser.id)
          .maybeSingle();
        const isAdmin = email === PLATFORM_OWNER_EMAIL || profile?.role === "admin";
        if (!mounted) return;
        setUser(authUser);
        setAllowed(isAdmin);
        if (isAdmin) {
          await Promise.all([loadHistory(authUser.id), loadContext()]);
        } else {
          setLoadingHistory(false);
        }
      } catch (e) {
        if (mounted) setAllowed(false);
        setLoadingHistory(false);
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const saveConversation = async (nextMessages, id = conversationId) => {
    if (!user) return;
    const title = nextMessages.find((m) => m.role === "user")?.content?.slice(0, 80) || "محادثة مساعد الإدارة";
    if (id) {
      await supabase.from("admin_ai_conversations").update({
        title,
        messages_json: nextMessages,
        updated_at: new Date().toISOString()
      }).eq("id", id).eq("admin_user_id", user.id);
      return id;
    }
    const { data } = await supabase.from("admin_ai_conversations").insert({
      admin_user_id: user.id,
      title,
      messages_json: nextMessages,
      attachments_count: 0
    }).select("id").single();
    if (data?.id) setConversationId(data.id);
    return data?.id || null;
  };

  const sendMessage = async (text) => {
    const prompt = String(text || "").trim();
    if (!prompt || sending || !allowed) return;
    setError("");
    const userMessage = { role: "user", content: prompt, created_at: new Date().toISOString() };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("bytly-ai", {
        body: {
          agent: "admin",
          prompt,
          context: {
            ...context,
            recent_messages: next.slice(-10),
            page: "AdminControlCenter/AdminAIAssistantSupabase"
          },
          responseFormat: "text"
        }
      });
      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error || "تعذر تشغيل المساعد");
      const assistantMessage = {
        role: "assistant",
        content: data.result,
        created_at: new Date().toISOString(),
        model: data.model || "bytly-ai"
      };
      const finalMessages = [...next, assistantMessage];
      setMessages(finalMessages);
      await saveConversation(finalMessages);
    } catch (e) {
      const msg = e?.message || "حدث خطأ غير معروف";
      setError(msg);
      setMessages(next);
    } finally {
      setSending(false);
    }
  };

  const clearConversation = async () => {
    setError("");
    if (conversationId && user) {
      await supabase.from("admin_ai_conversations").delete().eq("id", conversationId).eq("admin_user_id", user.id);
    }
    setConversationId(null);
    setMessages([]);
  };

  const refresh = async () => {
    if (!user) return;
    setError("");
    await loadContext();
    await loadHistory(user.id);
  };

  if (checking || loadingHistory) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" /></div>;
  }
  if (!allowed) return <AccessDenied />;

  return (
    <div className="min-h-[70vh] bg-[#F7F8FC] p-4 md:p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="bg-[#11162A] text-white px-5 py-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#C9A66B] flex items-center justify-center"><Sparkles className="w-6 h-6" /></div>
              <div>
                <h1 className="text-xl font-bold">مساعد الإدارة المركزي</h1>
                <p className="text-xs text-slate-300 mt-1">مساعد Bytly الإداري — متصل ببيانات Supabase ووكيل Bytly AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={refresh} className="text-white hover:bg-white/10" title="تحديث البيانات"><RefreshCw className="w-4 h-4" /></Button>
              <Button variant="ghost" onClick={clearConversation} className="text-white hover:bg-white/10" title="مسح المحادثة"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {messages.length === 0 && (
              <div className="mb-5">
                <div className="rounded-xl border border-[#E8E1D6] bg-[#FCFAF6] p-4 mb-4">
                  <p className="font-semibold text-[#4A3F35]">جاهز للعمل.</p>
                  <p className="text-sm text-slate-500 mt-1">اكتبي طلبك مباشرة. المساعد يستقبل سياقًا حيًا من قاعدة البيانات، ولا ينفذ عمليات حساسة تلقائيًا.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {starterPrompts.map((prompt) => (
                    <button key={prompt} onClick={() => sendMessage(prompt)} className="text-right rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 hover:border-[#C9A66B] hover:shadow-sm transition">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 min-h-[360px] max-h-[58vh] overflow-y-auto pr-1">
              {messages.map((message, index) => (
                <div key={index} className={message.role === "user" ? "flex justify-start" : "flex justify-end"}>
                  <div className={message.role === "user" ? "max-w-[85%] rounded-2xl rounded-br-md bg-[#11162A] text-white px-4 py-3 whitespace-pre-wrap" : "max-w-[90%] rounded-2xl rounded-bl-md bg-white border border-slate-200 text-slate-700 px-4 py-3 whitespace-pre-wrap shadow-sm"}>
                    <div className="text-[11px] opacity-60 mb-1">{message.role === "user" ? "أنت" : "مساعد Bytly AI"}</div>
                    <div className="text-sm leading-7">{message.content}</div>
                  </div>
                </div>
              ))}
              {sending && <div className="flex justify-end"><div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> جاري التحليل...</div></div>}
              <div ref={bottomRef} />
            </div>

            {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}

            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="mt-5 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} disabled={sending} placeholder="اكتبي طلبك للمساعد الإداري..." className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C9A66B]" />
              <Button type="submit" disabled={sending || !input.trim()} className="rounded-xl bg-[#6D5CE7] hover:bg-[#5B4AD0] px-5"><Send className="w-4 h-4" /></Button>
            </form>

            <div className="mt-3 text-[11px] text-slate-400 text-center">
              بيانات السياق الحالية: {context.users_count ?? "—"} مستخدم • {context.projects_count ?? "—"} مشروع • {context.companies_count ?? "—"} شركة • {context.disputes_count ?? "—"} نزاع
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
