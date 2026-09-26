import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageCircle, RefreshCw, Users, Archive, Search, Plus, X } from "lucide-react";
import CreateProjectMeetLink from "@/components/project/CreateProjectMeetLink";

export default function AdminConversationsCenter() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [{ data: authData, error: authError }, { data: convs, error: convError }, { data: msgs, error: msgError }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("conversations").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(500),
      ]);
      if (authError) throw authError;
      if (convError) throw convError;
      if (msgError) throw msgError;
      const latestByConversation = {};
      (msgs || []).forEach(m => {
        if (!latestByConversation[m.conversation_id]) latestByConversation[m.conversation_id] = m;
      });
      const enriched = (convs || []).map(c => ({
        ...c,
        name: c.title || "محادثة بدون اسم",
        type: c.status || "active",
        last_message: latestByConversation[c.id]?.body || "",
        last_message_date: latestByConversation[c.id]?.created_at || c.created_at,
        participants: [],
      }));
      setUser(authData?.user || null);
      setConversations(enriched);
      setMessages(msgs || []);
    } catch (e) {
      console.error("Admin conversations Supabase load error:", e);
      setError("تعذر تحميل مركز المحادثات من قاعدة البيانات. تحققي من صلاحيات المشرف ثم حاولي مرة أخرى.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const messageCountByConversation = useMemo(() => {
    const map = {}; messages.forEach(m => { map[m.conversation_id] = (map[m.conversation_id] || 0) + 1; }); return map;
  }, [messages]);

  const unreadCount = useMemo(() => messages.filter(m => m.sender_user_id !== user?.id).length, [messages, user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase(); if (!q) return conversations;
    return conversations.filter(c => [c.name, c.project_id, ...(c.participants || [])].filter(Boolean).some(v => String(v).toLowerCase().includes(q)));
  }, [conversations, search]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" /></div>;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900">مركز المحادثات</h1><p className="text-sm text-slate-500 mt-1">إدارة ومتابعة محادثات المنصة ورسائلها من مكان واحد.</p></div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateMeeting(true)} className="gap-2 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"><Plus className="w-4 h-4" /> محادثة جديدة</Button>
          <Button variant="outline" onClick={load} className="gap-2"><RefreshCw className="w-4 h-4" />تحديث</Button>
        </div>
      </div>

      {showCreateMeeting && (
        <Card className="border-[#C9A66B]/30 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>إنشاء اجتماع / محادثة مشروع</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowCreateMeeting(false)}><X className="w-5 h-5" /></Button>
          </CardHeader>
          <CardContent>
            <CreateProjectMeetLink
              onCancel={() => setShowCreateMeeting(false)}
              onCreated={() => { setShowCreateMeeting(false); load(); }}
            />
          </CardContent>
        </Card>
      )}

      {error && <Card className="border-red-200 bg-red-50"><CardContent className="p-4 text-sm text-red-700">{error}</CardContent></Card>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><MessageCircle className="w-5 h-5 mb-2 text-[#C9A66B]" /><p className="text-2xl font-bold">{conversations.length}</p><p className="text-xs text-slate-500">إجمالي المحادثات</p></CardContent></Card>
        <Card><CardContent className="p-4"><MessageCircle className="w-5 h-5 mb-2 text-blue-600" /><p className="text-2xl font-bold">{messages.length}</p><p className="text-xs text-slate-500">إجمالي الرسائل</p></CardContent></Card>
        <Card><CardContent className="p-4"><Users className="w-5 h-5 mb-2 text-green-600" /><p className="text-2xl font-bold">{conversations.filter(c => c.type === "group" || c.type === "three_way").length}</p><p className="text-xs text-slate-500">محادثات جماعية/ثلاثية</p></CardContent></Card>
        <Card><CardContent className="p-4"><Archive className="w-5 h-5 mb-2 text-amber-600" /><p className="text-2xl font-bold">{unreadCount}</p><p className="text-xs text-slate-500">رسائل غير مقروءة</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Search className="w-5 h-5" />المحادثات</CardTitle></CardHeader><CardContent className="space-y-4">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث باسم المحادثة أو المشروع أو البريد الإلكتروني..." />
        <div className="space-y-2">
          {filtered.length === 0 ? <p className="text-center text-sm text-slate-500 py-8">لا توجد محادثات مطابقة.</p> : filtered.map(conversation => (
            <div key={conversation.id} className="border rounded-xl p-4 hover:bg-slate-50 transition">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><MessageCircle className="w-4 h-4 text-[#C9A66B]" /><h3 className="font-semibold truncate">{conversation.name || "محادثة بدون اسم"}</h3><Badge variant="outline">{conversation.type || "direct"}</Badge>{conversation.is_archived && <Badge variant="secondary">مؤرشفة</Badge>}</div><p className="text-xs text-slate-500 mt-1">المشاركون: {(conversation.participants || []).join("، ") || "—"}</p>{conversation.project_id && <p className="text-xs text-slate-500 mt-1">المشروع: {conversation.project_id}</p>}</div>
                <div className="text-right md:min-w-40"><p className="text-sm font-medium">{messageCountByConversation[conversation.id] || 0} رسالة</p><p className="text-xs text-slate-400 mt-1">{conversation.last_message_date ? new Date(conversation.last_message_date).toLocaleString("ar-SA") : "لا يوجد نشاط"}</p></div>
              </div>
              {conversation.last_message && <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{conversation.last_message}</div>}
            </div>
          ))}
        </div>
      </CardContent></Card>
    </div>
  );
}
