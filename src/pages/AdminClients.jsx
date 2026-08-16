import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Users, Search, Loader2, RefreshCw, Plus, MessageSquare,
  Mail, Phone, ChevronLeft, AlertTriangle, ThumbsUp, MessagesSquare,
  CheckCircle, Clock, Phone as PhoneIcon, Calendar, StickyNote, FileText, Receipt, FolderKanban, Activity
} from "lucide-react";
import { motion } from "framer-motion";
import ClientFormModal from "@/components/crm/ClientFormModal";
import InteractionFormModal from "@/components/crm/InteractionFormModal";

const TYPE_LABEL = { individual: "عميل محتمل", investor: "مستثمر" };
const TYPE_BADGE = {
  individual: "bg-blue-50 text-blue-700 border-blue-200",
  investor: "bg-purple-50 text-purple-700 border-purple-200",
};
const INTERACTION_LABEL = { call: "مكالمة", email: "بريد", meeting: "اجتماع", message: "رسالة", note: "ملاحظة" };
const PRIORITY_LABEL = { low: "منخفضة", medium: "متوسطة", high: "عالية", urgent: "عاجلة" };
const PRIORITY_BADGE = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};
const STATUS_LABEL = { open: "مفتوح", in_progress: "قيد المعالجة", resolved: "تم الحل", closed: "مغلق" };

export default function AdminClientsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [activeTab, setActiveTab] = useState("clients");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showClientForm, setShowClientForm] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [interactionPreselect, setInteractionPreselect] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState({ projects: [], contracts: [], invoices: [], interactions: [] });
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [clientsData, interactionsData] = await Promise.all([
        base44.entities.Client.list("-created_date", 500).catch(() => []),
        base44.entities.ClientInteraction.list("-created_date", 500).catch(() => []),
      ]);
      // count interactions + projects per client
      const enriched = await Promise.all(
        clientsData.map(async (c) => {
          const [clientInteractions, projects] = await Promise.all([
            base44.entities.ClientInteraction.filter({ client_email: c.email }).catch(() => []),
            base44.entities.Project.filter({ client_id: c.id }).catch(() => []),
          ]);
          return {
            ...c,
            interactionsCount: clientInteractions.length,
            projectsCount: projects.length,
          };
        })
      );
      setClients(enriched);
      setInteractions(interactionsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = useMemo(() => ({
    clients: clients.length,
    interactions: interactions.length,
    positive: interactions.filter(i => i.sentiment === "positive").length,
    urgentFollowups: interactions.filter(i => i.follow_up_required && i.priority === "urgent" && i.status !== "closed").length,
  }), [clients, interactions]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (c.full_name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.company_name || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" ||
        (statusFilter === "active" && c.is_subscription_active !== false) ||
        (statusFilter === "inactive" && c.is_subscription_active === false);
      return matchSearch && matchStatus;
    });
  }, [clients, search, statusFilter]);

  const filteredInteractions = useMemo(() => {
    return interactions.filter(i => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (i.title || "").toLowerCase().includes(q) ||
        (i.client_email || "").toLowerCase().includes(q) ||
        (i.content || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || i.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [interactions, search, statusFilter]);

  const followUps = useMemo(() => {
    return interactions
      .filter(i => i.follow_up_required && i.status !== "closed")
      .sort((a, b) => {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (order[a.priority] || 2) - (order[b.priority] || 2);
      });
  }, [interactions]);

  const openClientDetails = async (client) => {
    setSelectedClient(client);
    setDetailsLoading(true);
    try {
      const [projects, contracts, invoices, clientInteractions] = await Promise.all([
        base44.entities.Project.filter({ client_id: client.id }).catch(() => []),
        base44.entities.Contract.filter({ client_id: client.id }).catch(() => []),
        base44.entities.Invoice.filter({ client_id: client.id }).catch(() => []),
        base44.entities.ClientInteraction.filter({ client_email: client.email }).catch(() => []),
      ]);
      setClientDetails({ projects, contracts, invoices, interactions: clientInteractions });
    } finally { setDetailsLoading(false); }
  };

  const handleEdit = (client) => {
    setSelectedClient(null);
    setEditingClient(client);
    setShowClientForm(true);
  };

  const toggleStatus = async (client) => {
    const newStatus = client.is_subscription_active === false ? true : false;
    try {
      await base44.entities.Client.update(client.id, { is_subscription_active: newStatus });
      loadData();
    } catch (err) { console.error(err); }
  };

  const statCards = [
    { label: "متابعات عاجلة", value: stats.urgentFollowups, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "إيجابي", value: stats.positive, icon: ThumbsUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "التفاعلات", value: stats.interactions, icon: MessagesSquare, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "العملاء", value: stats.clients, icon: Users, color: "text-slate-600", bg: "bg-slate-100" },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8" dir="rtl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Button onClick={() => { setEditingClient(null); setShowClientForm(true); }} className="bg-[#3b82f6] hover:bg-[#2563eb]">
              <Plus className="w-4 h-4 ml-1" /> عميل جديد
            </Button>
            <Button variant="outline" onClick={() => { setInteractionPreselect(""); setShowInteractionForm(true); }}>
              <MessageSquare className="w-4 h-4 ml-1" /> تفاعل جديد
            </Button>
            <Button variant="ghost" size="icon" onClick={loadData} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-left">
              <h1 className="text-2xl font-bold text-[#1a1a2e]">إدارة علاقات العملاء</h1>
              <p className="text-sm text-slate-500">{stats.clients} عميل • {stats.interactions} تفاعل</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#F5F0E8] flex items-center justify-center">
              <Users className="w-6 h-6 text-[#4A3F35]" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#1a1a2e]">{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-4">
        <div className="flex gap-6">
          {[
            { key: "clients", label: "العملاء" },
            { key: "interactions", label: "سجل التفاعلات" },
            { key: "followups", label: "المتابعات" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setStatusFilter("all"); }}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? "border-[#C9A66B] text-[#4A3F35]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
              {t.key === "followups" && followUps.length > 0 && (
                <span className="mr-2 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">{followUps.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="بحث بالاسم، البريد، الشركة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            {activeTab !== "followups" && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer"
              >
                {activeTab === "clients" ? (
                  <>
                    <option value="all">جميع الحالات</option>
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                  </>
                ) : (
                  <>
                    <option value="all">جميع الحالات</option>
                    <option value="open">مفتوح</option>
                    <option value="in_progress">قيد المعالجة</option>
                    <option value="resolved">تم الحل</option>
                    <option value="closed">مغلق</option>
                  </>
                )}
              </select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tab content */}
      {activeTab === "clients" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredClients.length === 0 ? (
            <Card className="border-0 shadow-sm col-span-full">
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">لا يوجد عملاء</p>
              </CardContent>
            </Card>
          ) : (
            filteredClients.map((client, idx) => {
              const initial = (client.full_name || "؟").charAt(0);
              return (
                <motion.div key={client.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx * 0.03, 0.3) }}>
                  <Card
                    className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => openClientDetails(client)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center text-white font-bold text-lg shrink-0">
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="font-bold text-[#1a1a2e] truncate">{client.full_name}</h3>
                            <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-[#C9A66B] shrink-0" />
                          </div>
                          <Badge className={`${TYPE_BADGE[client.client_type] || TYPE_BADGE.individual} border mb-2`} variant="outline">
                            {TYPE_LABEL[client.client_type] || "عميل"}
                          </Badge>
                          <div className="space-y-1 text-xs text-slate-500">
                            {client.email && (
                              <div className="flex items-center gap-1.5 truncate">
                                <Mail className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{client.email}</span>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 shrink-0" />
                                {client.phone}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5" /> تفاعل {client.interactionsCount || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> مشروع {client.projectsCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "interactions" && (
        <div className="space-y-2">
          {filteredInteractions.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <MessagesSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">لا توجد تفاعلات</p>
              </CardContent>
            </Card>
          ) : (
            filteredInteractions.map((interaction, idx) => (
              <motion.div key={interaction.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx * 0.02, 0.3) }}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            {interaction.interaction_type === "call" ? <PhoneIcon className="w-3.5 h-3.5" /> :
                             interaction.interaction_type === "email" ? <Mail className="w-3.5 h-3.5" /> :
                             interaction.interaction_type === "meeting" ? <Calendar className="w-3.5 h-3.5" /> :
                             <StickyNote className="w-3.5 h-3.5" />}
                            {INTERACTION_LABEL[interaction.interaction_type] || interaction.interaction_type}
                          </span>
                          <h3 className="font-bold text-[#1a1a2e] text-sm">{interaction.title}</h3>
                          {interaction.priority && (
                            <Badge className={`${PRIORITY_BADGE[interaction.priority]} border-0`} variant="outline">
                              {PRIORITY_LABEL[interaction.priority]}
                            </Badge>
                          )}
                          {interaction.status && (
                            <Badge className="bg-slate-100 text-slate-600 border-0" variant="outline">
                              {STATUS_LABEL[interaction.status] || interaction.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-1 line-clamp-2">{interaction.content}</p>
                        <p className="text-xs text-slate-400">{interaction.client_email}</p>
                      </div>
                      <div className="text-left text-xs text-slate-400 shrink-0">
                        {interaction.interaction_date && new Date(interaction.interaction_date).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {activeTab === "followups" && (
        <div className="space-y-2">
          {followUps.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-2" />
                <p className="text-slate-500">لا توجد متابعات معلقة</p>
              </CardContent>
            </Card>
          ) : (
            followUps.map((interaction, idx) => (
              <motion.div key={interaction.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx * 0.02, 0.3) }}>
                <Card className={`border-0 shadow-sm ${interaction.priority === "urgent" ? "ring-1 ring-orange-200" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {interaction.priority === "urgent" && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                          <h3 className="font-bold text-[#1a1a2e] text-sm">{interaction.title}</h3>
                          <Badge className={`${PRIORITY_BADGE[interaction.priority]} border-0`} variant="outline">
                            {PRIORITY_LABEL[interaction.priority]}
                          </Badge>
                          {interaction.follow_up_date && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Clock className="w-3 h-3" />
                              {new Date(interaction.follow_up_date).toLocaleDateString('ar-SA')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-1 line-clamp-1">{interaction.content}</p>
                        <p className="text-xs text-slate-400">{interaction.client_email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await base44.entities.ClientInteraction.update(interaction.id, { status: "closed" });
                          loadData();
                        }}
                        className="text-green-600 border-green-200 hover:bg-green-50 shrink-0"
                      >
                        <CheckCircle className="w-4 h-4 ml-1" /> تمت
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>ملف العميل الكامل</DialogTitle>
            <DialogDescription>بيانات العميل ومشاريعه وعقوده وفواتيره وسجل تفاعلاته من البيانات الفعلية.</DialogDescription>
          </DialogHeader>
          {selectedClient && <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#F8F5EF] border border-[#E8DFD1]">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center text-white font-bold text-xl shrink-0">{(selectedClient.full_name || "؟").charAt(0)}</div>
              <div className="flex-1 min-w-0"><h3 className="font-bold text-lg">{selectedClient.full_name}</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2 text-xs text-slate-500"><span>{selectedClient.email || "بدون بريد"}</span><span>{selectedClient.phone || "بدون هاتف"}</span><span>{selectedClient.company_name || "بدون شركة"}</span><span>{selectedClient.city || "بدون مدينة"}</span></div></div>
              <Button variant="outline" size="sm" onClick={() => handleEdit(selectedClient)}>تعديل</Button>
            </div>
            {detailsLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#C9A66B]" /></div> : <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[{label:"المشاريع",value:clientDetails.projects.length,icon:FolderKanban},{label:"العقود",value:clientDetails.contracts.length,icon:FileText},{label:"الفواتير",value:clientDetails.invoices.length,icon:Receipt},{label:"التفاعلات",value:clientDetails.interactions.length,icon:Activity}].map(({label,value,icon:Icon}) => <Card key={label}><CardContent className="p-3 flex items-center gap-3"><Icon className="w-4 h-4 text-[#C9A66B]"/><div><p className="font-bold">{value}</p><p className="text-[11px] text-slate-500">{label}</p></div></CardContent></Card>)}</div>
              <div className="grid md:grid-cols-2 gap-4">
                <Card><CardContent className="p-4"><h4 className="font-bold mb-3">المشاريع</h4>{clientDetails.projects.length ? <div className="space-y-2">{clientDetails.projects.slice(0,8).map(p => <div key={p.id} className="p-2 rounded-lg bg-slate-50 flex justify-between gap-2"><span className="text-sm truncate">{p.title || "مشروع بدون اسم"}</span><Badge variant="outline" className="text-[10px]">{p.status || "غير محدد"}</Badge></div>)}</div> : <p className="text-sm text-slate-400">لا توجد مشاريع مرتبطة.</p>}</CardContent></Card>
                <Card><CardContent className="p-4"><h4 className="font-bold mb-3">العقود والفواتير</h4><div className="space-y-2"><div className="p-2 rounded-lg bg-slate-50 flex justify-between"><span>العقود</span><b>{clientDetails.contracts.length}</b></div><div className="p-2 rounded-lg bg-slate-50 flex justify-between"><span>الفواتير</span><b>{clientDetails.invoices.length}</b></div></div></CardContent></Card>
                <Card className="md:col-span-2"><CardContent className="p-4"><h4 className="font-bold mb-3">آخر النشاط والتواصل</h4>{clientDetails.interactions.length ? <div className="space-y-2">{clientDetails.interactions.slice(0,10).map(i => <div key={i.id} className="p-2 rounded-lg border flex justify-between gap-3"><div className="min-w-0"><p className="text-sm font-medium truncate">{i.title || "تفاعل"}</p><p className="text-xs text-slate-400 truncate">{i.content || ""}</p></div><span className="text-[11px] text-slate-400 shrink-0">{i.interaction_date ? new Date(i.interaction_date).toLocaleString('ar-SA') : ""}</span></div>)}</div> : <p className="text-sm text-slate-400">لا يوجد نشاط مسجل.</p>}</CardContent></Card>
              </div>
            </>}
          </div>}
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <ClientFormModal
        open={showClientForm}
        onOpenChange={setShowClientForm}
        onSaved={loadData}
        editingClient={editingClient}
      />
      <InteractionFormModal
        open={showInteractionForm}
        onOpenChange={setShowInteractionForm}
        onSaved={loadData}
        clients={clients}
        preselectEmail={interactionPreselect}
      />
    </div>
  );
}