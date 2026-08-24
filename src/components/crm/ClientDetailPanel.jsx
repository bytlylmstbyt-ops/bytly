import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Mail, Phone, Building2, Calendar, Plus, Loader2, RefreshCw, Sparkles, X, Edit2, Briefcase
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

const INTERACTION_ICONS = {
  call:    "📞", email: "✉️", meeting: "📅", message: "💬", note: "📝",
};

export default function ClientDetailPanel({ client, onClose, onEdit }) {
  const [interactions, setInteractions]   = useState([]);
  const [projects, setProjects]           = useState([]);
  const [gmailEmails, setGmailEmails]     = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [gmailLoading, setGmailLoading]   = useState(false);
  const [calLoading, setCalLoading]       = useState(false);
  const [newInteraction, setNewInteraction] = useState(null);
  const [saving, setSaving]               = useState(false);

  useEffect(() => {
    if (client) { loadClientData(); }
  }, [client?.id]);

  const loadClientData = async () => {
    setLoading(true);
    try {
      const [ints, projs] = await Promise.all([
        base44.entities.ClientInteraction.filter({ client_email: client.email }, '-interaction_date', 30),
        base44.entities.Project.filter({ client_id: client.id }, '-created_date', 10).catch(() => []),
      ]);
      setInteractions(ints);
      setProjects(projs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadGmailEmails = async () => {
    setGmailLoading(true);
    try {
      const res = await base44.functions.invoke("gmailService", {
        action: "listEmails",
        data: { query: `from:${client.email} OR to:${client.email}`, maxResults: 10 }
      });
      setGmailEmails(res.data?.emails || []);
    } catch (e) { toast.error("فشل تحميل الرسائل"); }
    finally { setGmailLoading(false); }
  };

  const loadCalendarEvents = async () => {
    setCalLoading(true);
    try {
      const res = await base44.functions.invoke("calendarService", {
        action: "listEvents",
        data: { q: client.email, maxResults: 10 }
      });
      setCalendarEvents(res.data?.events || []);
    } catch (e) { toast.error("فشل تحميل الأحداث"); }
    finally { setCalLoading(false); }
  };

  const saveInteraction = async () => {
    if (!newInteraction?.title) return;
    setSaving(true);
    try {
      await base44.entities.ClientInteraction.create({
        client_email: client.email,
        project_id: newInteraction.project_id || "",
        interaction_type: newInteraction.type || "note",
        title: newInteraction.title,
        content: newInteraction.content || "",
        interaction_date: new Date().toISOString(),
        priority: "medium",
      });
      toast.success("تم حفظ التفاعل ✓");
      setNewInteraction(null);
      loadClientData();
    } catch (e) { toast.error("فشل الحفظ"); }
    finally { setSaving(false); }
  };

  const aiSuggestFollowup = async () => {
    if (interactions.length === 0) { toast.error("لا توجد تفاعلات للتحليل"); return; }
    const lastInteraction = interactions[0];
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `بناءً على آخر تفاعل مع العميل ${client.full_name || client.name}:
نوع التفاعل: ${lastInteraction.interaction_type}
العنوان: ${lastInteraction.title}
المحتوى: ${lastInteraction.content}

اقترح خطوة متابعة مناسبة بجملة واحدة بالعربية.`
      });
      toast.success("اقتراح AI: " + res, { duration: 6000 });
    } catch (e) { toast.error("فشل الاقتراح"); }
  };

  if (!client) return null;

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-l from-slate-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded"><X className="w-5 h-5 text-slate-500" /></button>
            <Button size="sm" variant="outline" onClick={onEdit}><Edit2 className="w-3.5 h-3.5 ml-1" />تعديل</Button>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="w-14 h-14">
              <AvatarFallback className="text-white text-xl font-bold" style={{ background: client.color || "#6B5D4F" }}>
                {(client.full_name || client.name || "?").charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{client.full_name || client.name}</h2>
              {client.job_title && <p className="text-sm text-slate-500">{client.job_title}</p>}
              {client.company && (
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />{client.company}
                </p>
              )}
              <div className="flex gap-2 mt-1 flex-wrap">
                <a href={`mailto:${client.email}`} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                  <Mail className="w-3 h-3" />{client.email}
                </a>
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                    <Phone className="w-3 h-3" />{client.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
          {client.notes && <p className="text-xs text-slate-500 mt-3 bg-slate-50 p-2 rounded">{client.notes}</p>}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="interactions" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-3 grid grid-cols-4">
            <TabsTrigger value="interactions" className="text-xs">التفاعلات</TabsTrigger>
            <TabsTrigger value="projects" className="text-xs">المشاريع</TabsTrigger>
            <TabsTrigger value="gmail" className="text-xs" onClick={loadGmailEmails}>Gmail</TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs" onClick={loadCalendarEvents}>التقويم</TabsTrigger>
          </TabsList>

          {/* Interactions */}
          <TabsContent value="interactions" className="p-4 space-y-3 flex-1">
            <div className="flex gap-2">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                onClick={() => setNewInteraction({ type: "note", title: "", content: "" })}>
                <Plus className="w-3.5 h-3.5 ml-1" />تفاعل جديد
              </Button>
              <Button size="sm" variant="outline" onClick={aiSuggestFollowup}>
                <Sparkles className="w-3.5 h-3.5 ml-1" />AI
              </Button>
            </div>

            {newInteraction && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <Select value={newInteraction.type} onValueChange={v => setNewInteraction(p => ({...p, type: v}))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">مكالمة</SelectItem>
                    <SelectItem value="email">بريد</SelectItem>
                    <SelectItem value="meeting">اجتماع</SelectItem>
                    <SelectItem value="message">رسالة</SelectItem>
                    <SelectItem value="note">ملاحظة</SelectItem>
                  </SelectContent>
                </Select>
                <Input className="h-8 text-xs" placeholder="العنوان *" value={newInteraction.title}
                  onChange={e => setNewInteraction(p => ({...p, title: e.target.value}))} />
                <Textarea className="text-xs" rows={2} placeholder="التفاصيل..." value={newInteraction.content}
                  onChange={e => setNewInteraction(p => ({...p, content: e.target.value}))} />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-blue-600 text-white text-xs" onClick={saveInteraction} disabled={saving}>
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "حفظ"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setNewInteraction(null)}>إلغاء</Button>
                </div>
              </div>
            )}

            {loading ? <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></div> :
              interactions.length === 0 ? <p className="text-center text-slate-400 py-8 text-sm">لا توجد تفاعلات بعد</p> :
              interactions.map(int => (
                <div key={int.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg border">
                  <span className="text-xl shrink-0 mt-0.5">{INTERACTION_ICONS[int.interaction_type] || "💬"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{int.title}</p>
                    {int.content && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{int.content}</p>}
                    <p className="text-xs text-slate-400 mt-1">
                      {int.interaction_date ? format(parseISO(int.interaction_date), 'd MMM yyyy', { locale: ar }) : ''}
                    </p>
                  </div>
                  {int.sentiment && (
                    <Badge className={`text-xs shrink-0 ${int.sentiment === 'positive' ? 'bg-green-100 text-green-700' : int.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                      {int.sentiment === 'positive' ? '😊' : int.sentiment === 'negative' ? '😟' : '😐'}
                    </Badge>
                  )}
                </div>
              ))
            }
          </TabsContent>

          {/* Projects */}
          <TabsContent value="projects" className="p-4 space-y-3">
            {loading ? <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div> :
              projects.length === 0 ? <p className="text-center text-slate-400 py-8 text-sm">لا توجد مشاريع مرتبطة</p> :
              projects.map(p => (
                <div key={p.id} className="p-3 bg-slate-50 rounded-lg border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.title}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge className="text-xs bg-slate-100 text-slate-600">{p.status}</Badge>
                      {p.budget_max && <span className="text-xs text-slate-500">{p.budget_max?.toLocaleString()} ر.س</span>}
                    </div>
                  </div>
                  <Briefcase className="w-4 h-4 text-slate-400" />
                </div>
              ))
            }
          </TabsContent>

          {/* Gmail */}
          <TabsContent value="gmail" className="p-4 space-y-3">
            <Button size="sm" variant="outline" onClick={loadGmailEmails} disabled={gmailLoading} className="w-full">
              {gmailLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" /> : <RefreshCw className="w-3.5 h-3.5 ml-1" />}
              تحديث الرسائل
            </Button>
            {gmailLoading ? <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div> :
              gmailEmails.length === 0 ? <p className="text-center text-slate-400 py-8 text-sm">لا توجد رسائل من/إلى {client.email}</p> :
              gmailEmails.map((email, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border">
                  <p className="text-sm font-medium text-slate-800 truncate">{email.subject || "(بدون موضوع)"}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{email.snippet}</p>
                  <p className="text-xs text-slate-400 mt-1">من: {email.from}</p>
                </div>
              ))
            }
          </TabsContent>

          {/* Calendar */}
          <TabsContent value="calendar" className="p-4 space-y-3">
            <Button size="sm" variant="outline" onClick={loadCalendarEvents} disabled={calLoading} className="w-full">
              {calLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" /> : <RefreshCw className="w-3.5 h-3.5 ml-1" />}
              تحديث الأحداث
            </Button>
            {calLoading ? <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div> :
              calendarEvents.length === 0 ? <p className="text-center text-slate-400 py-8 text-sm">لا توجد أحداث مرتبطة</p> :
              calendarEvents.map((ev, i) => (
                <div key={i} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-slate-800">{ev.summary || ev.title}</p>
                  {ev.start && <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" />{ev.start?.dateTime || ev.start?.date}</p>}
                  {ev.location && <p className="text-xs text-slate-400 mt-0.5">📍 {ev.location}</p>}
                </div>
              ))
            }
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}