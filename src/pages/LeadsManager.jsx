import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LeadCard from "@/components/leads/LeadCard";
import LeadFormModal from "@/components/leads/LeadFormModal";
import { Plus, ArrowRight, Users, TrendingUp, CheckCircle2, UserCheck, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const STATUS_LABELS = {
  all: "الكل",
  new: "جديد",
  contacted: "تم التواصل",
  interested: "مهتم",
  contracted: "تعاقد",
  lost: "خسارة",
};

export default function LeadsManager() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const fetchLeads = async () => {
    setLoading(true);
    const data = await base44.entities.Lead.list("-created_date", 100);
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleSave = async (form) => {
    if (editingLead) {
      await base44.entities.Lead.update(editingLead.id, form);
      toast({ title: "تم التحديث بنجاح" });
    } else {
      await base44.entities.Lead.create(form);
      toast({ title: "تمت إضافة العميل بنجاح" });
    }
    setModalOpen(false);
    setEditingLead(null);
    fetchLeads();
  };

  const handleStatusChange = async (id, status) => {
    await base44.entities.Lead.update(id, { status });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const handleDelete = async (id) => {
    if (!confirm("هل تريد حذف هذا العميل؟")) return;
    await base44.entities.Lead.delete(id);
    setLeads(prev => prev.filter(l => l.id !== id));
    toast({ title: "تم الحذف" });
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setModalOpen(true);
  };

  const filtered = leads.filter(l => {
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    const matchSearch = !search || l.name?.includes(search) || l.phone?.includes(search) || l.email?.includes(search);
    return matchStatus && matchSearch;
  });

  const stats = {
    total: leads.length,
    contracted: leads.filter(l => l.status === "contracted").length,
    interested: leads.filter(l => l.status === "interested").length,
    contacted: leads.filter(l => l.status === "contacted").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/30 p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 text-slate-500 hover:text-slate-700">
            <ArrowRight className="w-4 h-4" /> رجوع
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">لوحة العملاء المحتملين</h1>
            <p className="text-sm text-slate-500">تتبع العملاء المجذوبين عبر مركز التسويق</p>
          </div>
          <Button
            onClick={() => { setEditingLead(null); setModalOpen(true); }}
            className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2"
          >
            <Plus className="w-4 h-4" /> إضافة عميل
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "إجمالي العملاء", value: stats.total, icon: <Users className="w-5 h-5 text-slate-500" />, bg: "bg-white" },
            { label: "تم التواصل", value: stats.contacted, icon: <UserCheck className="w-5 h-5 text-yellow-500" />, bg: "bg-yellow-50" },
            { label: "مهتمون", value: stats.interested, icon: <TrendingUp className="w-5 h-5 text-orange-500" />, bg: "bg-orange-50" },
            { label: "تعاقدوا", value: stats.contracted, icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, bg: "bg-green-50" },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-xl p-4 border border-slate-100 flex items-center gap-3 shadow-sm`}>
              {s.icon}
              <div>
                <div className="text-2xl font-bold text-slate-700">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="ابحث بالاسم أو الهاتف..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد عملاء محتملون بعد</p>
            <Button
              onClick={() => { setEditingLead(null); setModalOpen(true); }}
              className="mt-4 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"
            >
              أضف أول عميل
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      <LeadFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingLead(null); }}
        lead={editingLead}
        onSave={handleSave}
      />
    </div>
  );
}