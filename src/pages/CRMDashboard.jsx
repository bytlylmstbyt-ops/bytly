import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import MobileSelect from "@/components/mobile/MobileSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Plus, Search, RefreshCw, Loader2, TrendingUp,
  TrendingDown, AlertCircle, Phone, Mail, Calendar, MessageSquare, Filter
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import ClientCard from "@/components/crm/ClientCard";
import ClientFormModal from "@/components/crm/ClientFormModal";
import ClientDetailPanel from "@/components/crm/ClientDetailPanel";
import CRMInteractionForm from "@/components/CRMInteractionForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const INTERACTION_ICON = { call: Phone, email: Mail, meeting: Calendar, message: MessageSquare, note: MessageSquare };
const INTERACTION_COLOR = { call: "bg-green-100 text-green-700", email: "bg-blue-100 text-blue-700", meeting: "bg-purple-100 text-purple-700", message: "bg-amber-100 text-amber-700", note: "bg-slate-100 text-slate-600" };
const INTERACTION_LABEL = { call: "مكالمة", email: "بريد", meeting: "اجتماع", message: "رسالة", note: "ملاحظة" };

export default function CRMDashboard() {
  const [clients, setClients]             = useState([]);
  const [interactions, setInteractions]   = useState([]);
  const [followUps, setFollowUps]         = useState([]);
  const [loading, setLoading]             = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchQuery, setSearchQuery]     = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);

  const [clientModal, setClientModal]     = useState(false);
  const [interactionModal, setInteractionModal] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cls, ints, fups] = await Promise.all([
        base44.entities.Client.list('-created_date', 100),
        base44.entities.ClientInteraction.list('-interaction_date', 100),
        base44.entities.FollowUpMeeting.filter({ status: 'scheduled' }).catch(() => []),
      ]);
      setClients(cls);
      setInteractions(ints);
      setFollowUps(fups);
    } catch (e) { toast.error("فشل التحميل"); }
    finally { setLoading(false); }
  };

  const saveClient = async (form) => {
    setActionLoading(true);
    try {
      if (editingClient) {
        await base44.entities.Client.update(editingClient.id, form);
        toast.success("تم التحديث ✓");
        if (selectedClient?.id === editingClient.id) {
          setSelectedClient({ ...editingClient, ...form });
        }
      } else {
        await base44.entities.Client.create(form);
        toast.success("تم إضافة العميل ✓");
      }
      setClientModal(false);
      setEditingClient(null);
      loadAll();
    } catch (e) { toast.error("فشل الحفظ: " + e.message); }
    finally { setActionLoading(false); }
  };

  const openEditClient = (client) => {
    setEditingClient(client);
    setClientModal(true);
  };

  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || (c.full_name || c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) || (c.company || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.crm_status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Interaction count per client email
  const interactionCountByEmail = interactions.reduce((acc, int) => {
    acc[int.client_email] = (acc[int.client_email] || 0) + 1;
    return acc;
  }, {});

  const sentimentStats = {
    positive: interactions.filter(i => i.sentiment === "positive").length,
    negative: interactions.filter(i => i.sentiment === "negative").length,
    neutral:  interactions.filter(i => i.sentiment === "neutral").length,
  };

  const urgentFollowUps = followUps.filter(f => {
    const diff = (new Date(f.scheduled_date) - new Date()) / 86400000;
    return diff <= 2;
  });

  const stats = [
    { label: "العملاء",       value: clients.length,             color: "text-slate-700",  icon: Users },
    { label: "التفاعلات",     value: interactions.length,        color: "text-blue-700",   icon: MessageSquare },
    { label: "إيجابي",        value: sentimentStats.positive,    color: "text-green-700",  icon: TrendingUp },
    { label: "متابعات عاجلة", value: urgentFollowUps.length,     color: "text-amber-700",  icon: AlertCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">إدارة علاقات العملاء</h1>
              <p className="text-xs text-slate-500">{clients.length} عميل • {interactions.length} تفاعل</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ml-1 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" onClick={() => setInteractionModal(true)}>
              <MessageSquare className="w-4 h-4 ml-1" />تفاعل جديد
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setEditingClient(null); setClientModal(true); }}>
              <Plus className="w-4 h-4 ml-1" />عميل جديد
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(s => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="clients">
          <TabsList>
            <TabsTrigger value="clients" className="text-xs">العملاء</TabsTrigger>
            <TabsTrigger value="interactions" className="text-xs">سجل التفاعلات</TabsTrigger>
            <TabsTrigger value="followups" className="text-xs">المتابعات ({followUps.length})</TabsTrigger>
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <div className="flex gap-2 mb-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث بالاسم، البريد، الشركة..." className="pr-9 text-sm" />
              </div>
              <MobileSelect
                value={statusFilter}
                onValueChange={setStatusFilter}
                label="الحالة"
                options={[
                  { value: "all", label: "جميع الحالات" },
                  { value: "lead", label: "محتمل" },
                  { value: "active", label: "نشط" },
                  { value: "inactive", label: "غير نشط" },
                  { value: "churned", label: "منسحب" },
                ]}
              />
            </div>
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا يوجد عملاء</p>
                <Button className="mt-3 bg-blue-600 text-white" onClick={() => setClientModal(true)}>
                  <Plus className="w-4 h-4 ml-1" />إضافة عميل
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredClients.map(c => (
                  <ClientCard
                    key={c.id}
                    client={c}
                    interactionCount={interactionCountByEmail[c.email] || 0}
                    projectCount={0}
                    onClick={() => setSelectedClient(c)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Interactions Tab */}
          <TabsContent value="interactions">
            <div className="space-y-2">
              {interactions.slice(0, 50).map(int => {
                const Icon = INTERACTION_ICON[int.interaction_type] || MessageSquare;
                return (
                  <div key={int.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-all">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${INTERACTION_COLOR[int.interaction_type] || 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-800">{int.title}</p>
                        <Badge className={`text-xs ${INTERACTION_COLOR[int.interaction_type] || 'bg-slate-100 text-slate-600'}`}>
                          {INTERACTION_LABEL[int.interaction_type] || int.interaction_type}
                        </Badge>
                        {int.sentiment && (
                          <Badge className={`text-xs ${int.sentiment === 'positive' ? 'bg-green-100 text-green-700' : int.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-slate-100'}`}>
                            {int.sentiment === 'positive' ? '😊' : int.sentiment === 'negative' ? '😟' : '😐'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-blue-600 mt-0.5">{int.client_email}</p>
                      {int.content && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{int.content}</p>}
                    </div>
                    <p className="text-xs text-slate-400 shrink-0">
                      {int.interaction_date ? format(parseISO(int.interaction_date), 'd MMM', { locale: ar }) : ''}
                    </p>
                  </div>
                );
              })}
              {interactions.length === 0 && <p className="text-center text-slate-400 py-12 text-sm">لا توجد تفاعلات</p>}
            </div>
          </TabsContent>

          {/* Follow-ups Tab */}
          <TabsContent value="followups">
            <div className="space-y-2">
              {followUps.map(f => {
                const isUrgent = (new Date(f.scheduled_date) - new Date()) / 86400000 <= 2;
                return (
                  <div key={f.id} className={`p-3 rounded-lg border ${isUrgent ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
                          {f.title}
                          {isUrgent && <Badge className="bg-amber-500 text-white text-xs">عاجل</Badge>}
                        </p>
                        <p className="text-xs text-blue-600">{f.client_email}</p>
                      </div>
                      <p className="text-xs text-slate-500">
                        {f.scheduled_date ? format(parseISO(f.scheduled_date), 'd MMM yyyy', { locale: ar }) : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
              {followUps.length === 0 && <p className="text-center text-slate-400 py-12 text-sm">لا توجد متابعات مجدولة</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Client Detail Panel */}
      {selectedClient && (
        <ClientDetailPanel
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onEdit={() => { openEditClient(selectedClient); setSelectedClient(null); }}
        />
      )}

      {/* Client Form Modal */}
      <ClientFormModal
        open={clientModal}
        onClose={() => { setClientModal(false); setEditingClient(null); }}
        onSave={saveClient}
        initial={editingClient}
        loading={actionLoading}
      />

      {/* Interaction Modal */}
      <Dialog open={interactionModal} onOpenChange={setInteractionModal}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>تسجيل تفاعل جديد</DialogTitle></DialogHeader>
          <CRMInteractionForm onSuccess={() => { setInteractionModal(false); loadAll(); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}