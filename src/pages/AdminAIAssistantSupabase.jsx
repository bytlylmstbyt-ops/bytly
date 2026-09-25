import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Loader2, ShieldAlert, RefreshCw, Plus, MessageCircle, CheckCircle2, XCircle, Wrench } from "lucide-react";

const OWNER = "bytlylmstbyt@gmail.com";

function AccessDenied() {
  return <div className="min-h-[60vh] flex items-center justify-center px-4" dir="rtl">
    <Card className="max-w-md w-full border-r-4 border-red-400"><CardContent className="p-8 text-center">
      <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
      <h2 className="text-lg font-bold text-[#4A3F35] mb-2">هذه الصفحة مخصصة للمشرفين فقط</h2>
      <p className="text-sm text-slate-500">غير مصرح لك بالوصول إلى مساعد المنصة.</p>
    </CardContent></Card>
  </div>;
}

export default function AdminAIAssistantSupabase() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [checking, setChecking] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [deciding, setDeciding] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (isLoadingAuth) return;
      try {
        const { data: { user: liveUser } } = await supabase.auth.getUser();
        const active = liveUser || user;
        const email = (active?.email || "").trim().toLowerCase();
        let role = user?.role || user?.profile?.role || "";
        if (active?.id) {
          const { data } = await supabase.from("profiles").select("role").eq("user_id", active.id).maybeSingle();
          role = data?.role || role;
        }
        const ok = isAuthenticated && !!active && (email === OWNER || role === "admin");
        if (mounted) { setAdmin(ok); setChecking(false); }
      } catch {
        if (mounted) { setAdmin(false); setChecking(false); }
      }
    })();
    return () => { mounted = false; };
  }, [isLoadingAuth, isAuthenticated, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, asking]);

  const send = async (value) => {
    const q = String(value ?? input).trim();
    if (!q || asking) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setAsking(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-ai", { body: { action: "message", message: q } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.kind === "data") setMessages(prev => [...prev, { role: "assistant", text: data.answer }]);
      else if (data?.kind === "plan") setMessages(prev => [...prev, { role: "plan", id: data.id, plan: data.plan }]);
      else setMessages(prev => [...prev, { role: "assistant", text: JSON.stringify(data) }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "error", text: e?.message || "تعذر معالجة طلبك الآن. حاول مرة أخرى." }]);
    } finally { setAsking(false); }
  };

  const decide = async (id, action) => {
    setDeciding(id + ":" + action);
    try {
      const { data, error } = await supabase.functions.invoke("admin-ai", { body: { action, id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages(prev => prev.map(m => m.role === "plan" && m.id === id ? { ...m, plan: { ...m.plan, status: data.status } } : m));
      setMessages(prev => [...prev, { role: "assistant", text: data.note || "تم تحديث حالة الخطة." }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "error", text: e?.message || "تعذر تحديث الخطة." }]);
    } finally { setDeciding(null); }
  };

  if (isLoadingAuth || checking) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-[#C9A66B]" /></div>;
  if (!admin) return <AccessDenied />;

  const quick = [
    "إيش المشاريع اللي تحتاج متابعة؟",
    "كم عدد المهندسين والعملاء والمستخدمين؟",
    "ما حالة الأتمتة والإشعارات؟",
    "افحص حالة قاعدة البيانات والمشاريع",
  ];

  return <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-5" dir="rtl">
    <div className="flex items-center justify-between gap-3 mb-5">
      <div><div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#C9A66B]" /><h1 className="text-2xl font-bold text-[#4A3F35]">مساعد الإدارة المركزي</h1></div>
      <p className="text-sm text-slate-500 mt-1">مساعد بيتلي — بيانات المنصة، الفحص، وخطط التغيير.</p></div>
      <Button size="sm" variant="outline" onClick={() => setMessages([])}><Plus className="w-4 h-4 ml-1" /> محادثة جديدة</Button>
    </div>
    <Card className="border-[#EFE6D3]"><CardContent className="p-4">
      <div ref={scrollRef} className="h-[55vh] overflow-y-auto space-y-3">
        {!messages.length && <div className="h-full flex flex-col items-center justify-center text-center gap-4">
          <MessageCircle className="w-9 h-9 text-[#C9A66B]/60" /><p className="font-semibold text-[#4A3F35]">ماذا تريدين أن أفعل؟</p>
          <div className="flex flex-wrap justify-center gap-2">{quick.map(q => <button key={q} onClick={() => send(q)} className="text-xs px-3 py-1.5 rounded-full border border-[#C9A66B]/40 hover:bg-[#FEF9EE]">{q}</button>)}</div>
        </div>}
        {messages.map((m,i) => <div key={i} className="flex justify-start">
          {m.role === "user" ? <div className="bg-[#4A3F35] text-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-sm">{m.text}</div> :
           m.role === "error" ? <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-2.5 max-w-[85%] text-sm">{m.text}</div> :
           m.role === "plan" ? <Card className="max-w-[90%] border-[#EFE6D3]"><CardContent className="p-4">
             <div className="flex items-center gap-2 mb-2"><Wrench className="w-4 h-4 text-[#C9A66B]" /><b className="text-sm">خطة تغيير</b></div>
             <p className="text-sm mb-2">{m.plan.plain_explanation_ar}</p>
             <p className="text-xs text-slate-500 mb-3">{m.plan.execution_note}</p>
             {m.plan.status === "awaiting_approval" && <div className="flex gap-2">
               <Button size="sm" onClick={() => decide(m.id,"approve")} disabled={!!deciding}>{deciding?.endsWith(":approve") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} اعتماد الخطة</Button>
               <Button size="sm" variant="outline" onClick={() => decide(m.id,"reject")} disabled={!!deciding}>{deciding?.endsWith(":reject") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} إلغاء</Button>
             </div>}
           </CardContent></Card> :
           <div className="bg-[#FEF9EE] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[90%] text-sm text-[#4A3F35] whitespace-pre-wrap">{m.text}</div>}
        </div>)}
        {asking && <div className="text-xs text-slate-400 flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> جارٍ الفهم والمعالجة...</div>}
      </div>
      <form onSubmit={e => {e.preventDefault();send();}} className="mt-4 border-t border-[#EFE6D3] pt-4 flex gap-2">
        <Textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="ماذا تريدين أن أفعل؟" rows={1} className="resize-none flex-1" />
        <Button type="submit" disabled={asking || !input.trim()} className="bg-[#4A3F35] hover:bg-[#3a3129]"><Send className="w-4 h-4" /></Button>
      </form>
    </CardContent></Card>
    <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> الاتصال الآن عبر Supabase Edge Function، وليس Base44.</p>
  </div>;
}
