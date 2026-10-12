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

  useEffect(() => {
    if (!project?.id) return;
    setTab("overview");
    setLoading(true);
    (async () => {
      try {
        const results = await Promise.all([
          supabase.from("project_offers").select("*").eq("project_id", project.id).order("created_at", { ascending: false }),
          supabase.from("project_contracts").select("*").eq("project_id", project.id).order("created_at", { ascending: false }),
          supabase.from("project_payments").select("*").eq("project_id", project.id).order("created_at", { ascending: false }),
          supabase.from("project_activity").select("*").eq("project_id", project.id).order("created_at", { ascending: false }).limit(100),
          supabase.from("project_milestones").select("*").eq("project_id", project.id).order("sequence_no", { ascending: true }),
          supabase.from("messages").select("*").eq("project_id", project.id).order("created_at", { ascending: false }).limit(100),
        ]);
        const failed = results.find((result) => result.error);
        if (failed?.error) throw failed.error;
        const [offersResult, contractsResult, paymentsResult, activityResult, milestonesResult, messagesResult] = results;
        const offers = offersResult.data || [];
        const engineerUserIds = [...new Set(offers.map((offer) => offer.engineer_user_id).filter(Boolean))];
        let engineers = [];
        if (engineerUserIds.length) {
          const { data, error } = await supabase.from("engineers").select("id,user_id,full_name").in("user_id", engineerUserIds);
          if (error) throw error;
          engineers = data || [];
        }
        const engMap = {};
        engineers.forEach((engineer) => { engMap[engineer.user_id] = engineer; });
        const proposals = offers.map((offer) => ({
          ...offer,
          engineer_name: engMap[offer.engineer_user_id]?.full_name || "غير معروف",
          price: offer.amount,
          delivery_days: offer.duration_days,
          cover_letter: offer.proposal,
        }));
        const transactions = (paymentsResult.data || []).map((payment) => ({
          ...payment,
          type: payment.escrow_status === "held" || payment.escrow_status === "held_in_escrow"
            ? "escrow_hold"
            : payment.status === "released" || payment.escrow_status === "released" ? "escrow_release" : "payment",
          user_email: payment.payer_user_id ? "دافع الدفعة" : "—",
          status: payment.escrow_status === "held" ? "held_in_escrow" : payment.status,
        }));
        const logs = (activityResult.data || []).map((item) => ({
          ...item,
          action_type: item.action,
          created_date: item.created_at,
          summary: item.metadata?.summary || item.metadata?.description || item.action || "تحديث على المشروع",
          actor_name: item.metadata?.actor_name || "مستخدم المنصة",
          actor_email: item.metadata?.actor_email || "",
        }));
        const messages = (messagesResult.data || []).map((message) => ({
          ...message,
          sender_id: message.sender_user_id,
          created_date: message.created_at,
          content: message.body,
        }));
        setData({
          proposals,
          contracts: contractsResult.data || [],
          transactions,
          messages,
          logs,
          milestones: milestonesResult.data || [],
        });
      } catch (err) {
        console.error("Detail load error", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [project?.id]);

  const clientName = project?.client_id ? lookup.clients[project.client_id] : "—";
  const engineerName = project?.assigned_engineer_id ? lookup.engineers[project.assigned_engineer_id] : "—";
  const totalContractValue = data.contracts.reduce((s, c) => s + (c.total_amount || 0), 0) || project?.escrow_amount || 0;
  const completionPct = project?.status === "completed" ? 100 :
    project?.status === "cancelled" ? 0 :
    data.milestones.length > 0 ? Math.round(data.milestones.filter(m => m.status === "completed" || m.status === "approved").length / data.milestones.length * 100) :
    project?.status === "in_progress" ? 50 : 10;

  const TabContent = () => {
    if (loading) return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 text-[#C9A66B] animate-spin" /></div>;

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