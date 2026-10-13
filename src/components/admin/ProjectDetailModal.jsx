import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, FileText, Scale, Wallet, MessagesSquare, History,
  Briefcase, MapPin, User, Clock, DollarSign, Paperclip
} from "lucide-react";
import ProjectDetailActivityLog from "@/components/admin/ProjectDetailActivityLog";

const STATUS_LABELS = {
  open: "مفتوح", in_progress: "قيد التنفيذ", awaiting_technical_review: "بانتظار المراجعة الفنية",
  technical_approved: "معتمد فنيًا", pending_client_approval: "بانتظار موافقة العميل",
  completed: "مكتمل", cancelled: "ملغي", disputed: "نزاع",
};
const STATUS_COLORS = {
  open: "bg-blue-100 text-blue-700", in_progress: "bg-amber-100 text-amber-700",
  awaiting_technical_review: "bg-purple-100 text-purple-700", technical_approved: "bg-indigo-100 text-indigo-700",
  pending_client_approval: "bg-cyan-100 text-cyan-700", completed: "bg-green-100 text-green-700",
  cancelled: "bg-slate-100 text-slate-500", disputed: "bg-red-100 text-red-700",
};

const TABS = [
  { key: "overview", label: "نظرة عامة", icon: FileText },
  { key: "proposals", label: "العروض", icon: Briefcase },
  { key: "contract", label: "العقد", icon: Scale },
  { key: "payments", label: "المدفوعات", icon: Wallet },
  { key: "files", label: "الملفات", icon: Paperclip },
  { key: "messages", label: "المحادثات", icon: MessagesSquare },
  { key: "history", label: "سجل الإجراءات", icon: History },
];

export default function ProjectDetailModal({ open, onOpenChange, project, lookup }) {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ proposals: [], contracts: [], transactions: [], messages: [], logs: [], milestones: [] });
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!open || !project?.id) return;
    let cancelled = false;
    setTab("overview");
    setLoading(true);
    setLoadError("");

    const load = async () => {
      const read = async (label, query) => {
        try {
          const { data: rows, error } = await query;
          if (error) throw error;
          return rows || [];
        } catch (error) {
          console.error(`Project detail ${label} query failed:`, error);
          if (!cancelled) setLoadError((current) => current || "بعض تفاصيل المشروع غير متاحة من قاعدة البيانات الحالية.");
          return [];
        }
      };

      try {
        const [proposals, contracts, transactions, logs, milestones, messages, engineers] = await Promise.all([
          read("project offers", supabase.from("project_offers").select("*").eq("project_id", project.id).order("created_at", { ascending: false })),
          read("contracts", supabase.from("project_contracts").select("*").eq("project_id", project.id).order("created_at", { ascending: false })),
          read("wallet transactions", supabase.from("wallet_transactions").select("*").eq("project_id", project.id).order("created_at", { ascending: false })),
          read("activity", supabase.from("project_activity").select("*").eq("project_id", project.id).order("created_at", { ascending: false })),
          read("milestones", supabase.from("project_milestones").select("*").eq("project_id", project.id).order("sequence_no", { ascending: true })),
          read("messages", supabase.from("messages").select("*").eq("project_id", project.id).order("created_at", { ascending: false })),
          read("engineers", supabase.from("engineers").select("id,user_id,base44_id,full_name")),
        ]);

        // Legacy proposals remain read-only in staging until identity/project mappings are verified.
        // Prefer live Supabase offers; only consult staging when no live offers exist.
        let proposalRows = proposals || [];
        if (proposalRows.length === 0 && project.base44_id) {
          proposalRows = await read(
            "legacy proposal staging",
            supabase
              .from("base44_proposal_migration_staging")
              .select("*")
              .eq("project_base44_id", project.base44_id)
              // Demo-only legacy rows must never appear as real customer offers.
              .neq("status", "demo_excluded")
              .order("created_at", { ascending: false })
          );
        }

        const engineerMap = {};
        (engineers || []).forEach((engineer) => {
          if (engineer.id) engineerMap[engineer.id] = engineer;
          if (engineer.user_id) engineerMap[engineer.user_id] = engineer;
          if (engineer.base44_id) engineerMap[engineer.base44_id] = engineer;
        });
        const proposalsWithNames = proposalRows.map((proposal) => {
          const engineerId = proposal.engineer_id || proposal.engineer_user_id || proposal.engineer_base44_id || null;
          return {
            ...proposal,
            engineer_id: engineerId,
            price: proposal.price ?? proposal.amount ?? 0,
            delivery_days: proposal.delivery_days ?? proposal.duration_days ?? 0,
            cover_letter: proposal.cover_letter ?? proposal.proposal ?? "",
            engineer_name: engineerMap[engineerId]?.full_name || "غير معروف",
          };
        });

        if (!cancelled) {
          setData({
            proposals: proposalsWithNames,
            contracts: contracts || [],
            transactions: transactions || [],
            messages: messages || [],
            logs: logs || [],
            milestones: milestones || [],
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [open, project?.id, project?.base44_id]);

  const clientName = project?.client_id ? lookup.clients[project.client_id] : "—";
  const engineerName = project?.assigned_engineer_id ? lookup.engineers[project.assigned_engineer_id] : "—";
  const totalContractValue = data.contracts.reduce((s, c) => s + (c.total_amount || 0), 0) || project?.escrow_amount || 0;
  const completionPct = project?.status === "completed" ? 100 :
    project?.status === "cancelled" ? 0 :
    data.milestones.length > 0 ? Math.round(data.milestones.filter(m => m.status === "completed" || m.status === "approved").length / data.milestones.length * 100) :
    project?.status === "in_progress" ? 50 : 10;

  const TabContent = () => {
    if (loading) return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 text-[#C9A66B] animate-spin" /></div>;
    if (loadError) return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{loadError} قد تكون بعض البيانات التاريخية لم تُرحّل بعد.</div>;

    switch (tab) {
      case "overview":
        return (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <InfoRow icon={User} label="العميل" value={clientName} />
              <InfoRow icon={User} label="المهندس" value={engineerName} />
              <InfoRow icon={MapPin} label="الموقع" value={project.location || "—"} />
              <InfoRow icon={Briefcase} label="التصنيف" value={project.category || "—"} />
              <InfoRow icon={DollarSign} label="قيمة الضمان" value={`${(project.escrow_amount || 0).toLocaleString()} ر.س`} />
              <InfoRow icon={Clock} label="نوع المشروع" value={project.project_type === "full_construction" ? "بناء كامل" : "خدمة سريعة"} />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">الوصف</p>
              <p className="text-slate-600">{project.description || "لا يوجد وصف"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">نسبة الإنجاز</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#C9A66B] rounded-full" style={{ width: `${completionPct}%` }} />
                </div>
                <span className="text-sm font-medium text-[#4A3F35]">{completionPct}%</span>
              </div>
            </div>
          </div>
        );
      case "proposals":
        return data.proposals.length === 0 ? <Empty icon={Briefcase} text="لا توجد عروض" /> : (
          <div className="space-y-2">
            {data.proposals.map(p => (
              <Card key={p.id} className="border border-slate-100"><CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-[#4A3F35]">{p.engineer_name}</p>
                    <p className="text-xs text-slate-400">{p.price?.toLocaleString() || 0} ر.س • {p.delivery_days || 0} يوم</p>
                  </div>
                  <Badge className={p.status === "accepted" ? "bg-green-100 text-green-700" : p.status === "rejected" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"} variant="outline">
                    {p.status === "accepted" ? "مقبول" : p.status === "rejected" ? "مرفوض" : "معلق"}
                  </Badge>
                </div>
                {p.cover_letter && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.cover_letter}</p>}
              </CardContent></Card>
            ))}
          </div>
        );
      case "contract":
        return data.contracts.length === 0 ? <Empty icon={Scale} text="لا يوجد عقد" /> : (
          <div className="space-y-2">
            {data.contracts.map(c => (
              <Card key={c.id} className="border border-slate-100"><CardContent className="p-3 space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[#4A3F35]">عقد #{c.contract_number || c.id.slice(-6)}</p>
                  <Badge className={c.status === "signed" || c.status === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"} variant="outline">
                    {c.status === "signed" ? "موقع" : c.status === "active" ? "نشط" : c.status === "completed" ? "مكتمل" : "مسودة"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">القيمة: {c.total_amount?.toLocaleString() || 0} ر.س</p>
                <p className="text-xs text-slate-500">{c.service_description?.slice(0, 100) || ""}</p>
              </CardContent></Card>
            ))}
          </div>
        );
      case "payments":
        return data.transactions.length === 0 ? <Empty icon={Wallet} text="لا توجد معاملات" /> : (
          <div className="space-y-2">
            {data.transactions.map(t => (
              <Card key={t.id} className="border border-slate-100"><CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-[#4A3F35]">{t.type === "escrow_hold" ? "حجز ضمان" : t.type === "escrow_release" ? "تحرير ضمان" : t.type === "commission" ? "عمولة" : t.type === "payment" ? "دفعة" : t.type}</p>
                    <p className="text-xs text-slate-400">{t.user_email}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-[#4A3F35]">{t.amount?.toLocaleString() || 0} ر.س</p>
                    <Badge className={t.status === "completed" ? "bg-green-100 text-green-700" : t.status === "held_in_escrow" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"} variant="outline">
                      {t.status === "completed" ? "مكتملة" : t.status === "held_in_escrow" ? "محجوزة" : t.status}
                    </Badge>
                  </div>
                </div>
              </CardContent></Card>
            ))}
          </div>
        );
      case "files":
        return (!project.attachments || project.attachments.length === 0) && (!project.technical_report_file) ? <Empty icon={Paperclip} text="لا توجد ملفات" /> : (
          <div className="space-y-2">
            {project.technical_report_file && (
              <a href={project.technical_report_file} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 text-sm text-[#4A3F35]">
                <FileText className="w-4 h-4 text-[#C9A66B]" /> التقرير الفني
              </a>
            )}
            {(project.attachments || []).map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 text-sm text-[#4A3F35]">
                <Paperclip className="w-4 h-4 text-[#C9A66B]" /> مرفق {i + 1}
              </a>
            ))}
          </div>
        );
      case "messages":
        return data.messages.length === 0 ? <Empty icon={MessagesSquare} text="لا توجد محادثات" /> : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.messages.map(m => (
              <div key={m.id} className="p-3 rounded-lg bg-slate-50 text-sm">
                <p className="text-xs text-slate-400 mb-0.5">{m.sender_email || m.sender_id || "—"} • {m.created_date && new Date(m.created_date).toLocaleString("ar-SA")}</p>
                <p className="text-slate-600">{m.content || m.text || ""}</p>
              </div>
            ))}
          </div>
        );
      case "history":
        return <ProjectDetailActivityLog projectId={project.id} projectTitle={project.title} />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>{project?.title || "تفاصيل المشروع"}</span>
            {project?.status && (
              <Badge className={`${STATUS_COLORS[project.status]} border`} variant="outline">
                {STATUS_LABELS[project.status]}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-1 mb-3">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                  tab === t.key ? "bg-[#4A3F35] text-white" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="overflow-y-auto flex-1">
          <TabContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
      <Icon className="w-4 h-4 text-[#C9A66B] shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-[#4A3F35] truncate">{value}</p>
      </div>
    </div>
  );
}

function Empty({ icon: Icon, text }) {
  return (
    <div className="py-8 text-center">
      <Icon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}