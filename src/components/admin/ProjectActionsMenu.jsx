import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { logProjectChange, logProjectDeletion } from "@/components/admin/logProjectChange";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import ActivityLogDialog from "@/components/admin/ActivityLogDialog";
import ContractViewDialog from "@/components/admin/ContractViewDialog";
import PaymentsViewDialog from "@/components/admin/PaymentsViewDialog";
import {
  MoreVertical, Eye, Edit, RefreshCw, CheckCircle2, XCircle,
  Pause, Play, Lock, Trash2, UserCog, Loader2, AlertTriangle,
  Scale, Wallet, MessagesSquare, History, DollarSign,
} from "lucide-react";

const STATUS_LABELS = {
  open: "مفتوح", in_progress: "قيد التنفيذ", awaiting_technical_review: "بانتظار المراجعة الفنية",
  technical_approved: "معتمد فنيًا", pending_client_approval: "بانتظار موافقة العميل",
  completed: "مكتمل", cancelled: "ملغي", disputed: "نزاع",
};

// Which actions are allowed for a given status
function allowedActions(status) {
  const active = ["open", "in_progress", "awaiting_technical_review", "pending_client_approval", "technical_approved"];
  return {
    approve: ["awaiting_technical_review", "pending_client_approval"].includes(status),
    reject: !["completed", "cancelled"].includes(status),
    pause: ["open", "in_progress"].includes(status),
    reactivate: status === "cancelled",
    close: ["in_progress", "technical_approved", "pending_client_approval"].includes(status),
  };
}

export default function ProjectActionsMenu({ project, engineers, onView, onUpdated, onDeleted, isAdmin = true }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showFinance, setShowFinance] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [financeForm, setFinanceForm] = useState({});
  const [reason, setReason] = useState("");

  const can = allowedActions(project?.status);
  const hasEngineer = !!project?.assigned_engineer_id;
  const hasClient = !!project?.client_id;
  const hasEscrow = (project?.escrow_amount || 0) > 0 || (project?.budget_max || 0) > 0;

  const execUpdate = async (data, actionLabel) => {
    setLoading(true);
    try {
      await base44.entities.Project.update(project.id, data);
      await logProjectChange(project, data, user);
      await onUpdated();
      setConfirmAction(null);
      setReason("");
    } catch (err) {
      alert(`فشل: ${actionLabel}. ${err.message || ""}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { type } = confirmAction;
    if (type === "approve") return execUpdate({ status: "technical_approved", technical_review_status: "approved", technical_review_date: new Date().toISOString() }, "الموافقة");
    if (type === "reject") return execUpdate({ status: "cancelled" }, "الرفض");
    if (type === "pause") return execUpdate({ status: "cancelled" }, "الإيقاف");
    if (type === "reactivate") return execUpdate({ status: "open" }, "إعادة التفعيل");
    if (type === "close") return execUpdate({ status: "completed", client_final_approval: true, client_approval_date: new Date().toISOString() }, "الإغلاق");
    if (type === "delete") return handleDelete();
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await base44.entities.Project.delete(project.id);
      await logProjectDeletion(project, user);
      await onDeleted();
      setConfirmAction(null);
    } catch (err) {
      alert(`فشل الحذف. ${err.message || ""}`);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = () => {
    setEditForm({ title: project.title || "", description: project.description || "" });
    setShowEdit(true);
  };

  const saveEdit = async () => {
    setLoading(true);
    try {
      await base44.entities.Project.update(project.id, editForm);
      await logProjectChange(project, editForm, user);
      await onUpdated();
      setShowEdit(false);
    } catch (err) {
      alert("فشل التعديل");
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (status) => {
    setLoading(true);
    try {
      await base44.entities.Project.update(project.id, { status });
      await logProjectChange(project, { status }, user);
      await onUpdated();
      setShowStatus(false);
    } catch (err) {
      alert("فشل تغيير الحالة");
    } finally {
      setLoading(false);
    }
  };

  const assignEngineer = async (engId) => {
    setLoading(true);
    try {
      await base44.entities.Project.update(project.id, { assigned_engineer_id: engId || null });
      await logProjectChange(project, { assigned_engineer_id: engId || null }, user);
      await onUpdated();
      setShowAssign(false);
    } catch (err) {
      alert("فشل التعيين");
    } finally {
      setLoading(false);
    }
  };

  const openFinance = () => {
    setFinanceForm({
      escrow_amount: project.escrow_amount || 0,
      budget_min: project.budget_min || 0,
      budget_max: project.budget_max || 0,
      platform_commission: project.platform_commission ?? 15,
      engineer_payment: project.engineer_payment || 0,
      technical_consultant_fee: project.technical_consultant_fee || 0,
      legal_consultant_fee: project.legal_consultant_fee || 0,
    });
    setShowFinance(true);
  };

  const saveFinance = async () => {
    setLoading(true);
    try {
      const numericForm = Object.fromEntries(
        Object.entries(financeForm).map(([k, v]) => [k, Number(v) || 0])
      );
      await base44.entities.Project.update(project.id, numericForm);
      await logProjectChange(project, numericForm, user);
      await onUpdated();
      setShowFinance(false);
    } catch (err) {
      alert("فشل حفظ المبالغ المالية");
    } finally {
      setLoading(false);
    }
  };

  const openMessages = () => {
    navigate(`/Messages?project_id=${project.id}`);
  };

  const confirmConfig = {
    approve: { title: "الموافقة على المشروع", desc: "سيتم اعتماد المشروع فنيًا والمتابعة للعميل.", btn: "موافقة", color: "bg-green-600 hover:bg-green-700" },
    reject: { title: "رفض المشروع", desc: "سيتم إلغاء المشروع. لا يمكن التراجع بسهولة.", btn: "رفض", color: "bg-red-600 hover:bg-red-700" },
    pause: { title: "إيقاف المشروع", desc: "سيتم إيقاف المشروع مؤقتًا (حالة ملغي). يمكن إعادة تفعيله لاحقًا.", btn: "إيقاف", color: "bg-amber-600 hover:bg-amber-700" },
    reactivate: { title: "إعادة تفعيل المشروع", desc: "سيتم إعادة المشروع للحالة المفتوحة.", btn: "إعادة تفعيل", color: "bg-blue-600 hover:bg-blue-700" },
    close: { title: "إغلاق المشروع", desc: "سيتم اعتبار المشروع مكتملًا مع موافقة العميل النهائية.", btn: "إغلاق", color: "bg-[#4A3F35] hover:bg-[#3a322a]" },
    delete: { title: "حذف المشروع", desc: "سيتم حذف المشروع نهائيًا. لا يمكن التراجع!", btn: "حذف نهائي", color: "bg-red-700 hover:bg-red-800" },
  };

  const Item = ({ icon: Icon, label, onClick, disabled, danger }) => (
    <DropdownMenuItem
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer ${danger ? "text-red-700 focus:text-red-700 focus:bg-red-50" : ""}`}
    >
      <Icon className="w-4 h-4 ml-2" /> {label}
    </DropdownMenuItem>
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-[#C9A66B]/10">
            <MoreVertical className="w-4 h-4 text-slate-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <Item icon={Eye} label="عرض التفاصيل" onClick={onView} />
          <Item icon={Edit} label="تعديل المشروع" onClick={openEdit} />
          <Item icon={RefreshCw} label="تغيير الحالة" onClick={() => setShowStatus(true)} />
          <Item icon={UserCog} label="تعيين المهندس" onClick={() => setShowAssign(true)} />
          <DropdownMenuSeparator />
          <Item icon={Scale} label="عرض العقد" onClick={() => setShowContract(true)} disabled={!hasEngineer && !hasClient} />
          <Item icon={DollarSign} label="تعديل المبالغ المالية" onClick={openFinance} />
          <Item icon={Wallet} label="المدفوعات والمحفظة" onClick={() => setShowPayments(true)} disabled={!hasEscrow} />
          <Item icon={MessagesSquare} label="فتح المحادثات" onClick={openMessages} disabled={!hasClient && !hasEngineer} />
          <Item icon={History} label="سجل النشاط" onClick={() => setShowActivity(true)} />
          <DropdownMenuSeparator />
          <Item icon={CheckCircle2} label="الموافقة" onClick={() => setConfirmAction({ type: "approve" })} disabled={!can.approve} />
          <Item icon={XCircle} label="رفض المشروع" onClick={() => setConfirmAction({ type: "reject" })} disabled={!can.reject} danger />
          <Item icon={Pause} label="إيقاف المشروع" onClick={() => setConfirmAction({ type: "pause" })} disabled={!can.pause} />
          <Item icon={Play} label="إعادة تفعيل" onClick={() => setConfirmAction({ type: "reactivate" })} disabled={!can.reactivate} />
          <Item icon={Lock} label="إغلاق المشروع" onClick={() => setConfirmAction({ type: "close" })} disabled={!can.close} />
          <DropdownMenuSeparator />
          <Item icon={Trash2} label="حذف المشروع" onClick={() => setConfirmAction({ type: "delete" })} disabled={!isAdmin} danger />
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader><DialogTitle>تعديل المشروع</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>عنوان المشروع</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>إلغاء</Button>
            <Button onClick={saveEdit} disabled={loading} className="bg-[#4A3F35] hover:bg-[#3a322a]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change status dialog */}
      <Dialog open={showStatus} onOpenChange={setShowStatus}>
        <DialogContent>
          <DialogHeader><DialogTitle>تغيير حالة المشروع</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm text-slate-500 mb-2">الحالة الحالية: <Badge variant="outline">{STATUS_LABELS[project.status]}</Badge></p>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <button
                key={k}
                onClick={() => changeStatus(k)}
                disabled={loading || k === project.status}
                className={`w-full text-right p-3 rounded-lg border text-sm transition-colors ${k === project.status ? "border-[#C9A66B] bg-[#FEF9EE]" : "border-slate-200 hover:bg-slate-50"}`}
              >
                {v} {k === project.status && <span className="text-xs text-[#C9A66B]">✓ الحالية</span>}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign engineer dialog */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent>
          <DialogHeader><DialogTitle>تعيين / تغيير المهندس المسؤول</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2 max-h-80 overflow-y-auto">
            <button
              onClick={() => assignEngineer("")}
              disabled={loading}
              className="w-full text-right p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm"
            >
              — بدون مهندس —
            </button>
            {engineers.map(e => (
              <button
                key={e.id}
                onClick={() => assignEngineer(e.id)}
                disabled={loading}
                className={`w-full text-right p-3 rounded-lg border text-sm transition-colors ${e.id === project.assigned_engineer_id ? "border-[#C9A66B] bg-[#FEF9EE]" : "border-slate-200 hover:bg-slate-50"}`}
              >
                {e.full_name} {e.id === project.assigned_engineer_id && <span className="text-xs text-[#C9A66B]">✓ الحالي</span>}
                <p className="text-xs text-slate-400 mt-0.5">{e.specialization || ""} • {e.city || ""}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Financial edit dialog */}
      <Dialog open={showFinance} onOpenChange={setShowFinance}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-[#C9A66B]" /> تعديل المبالغ المالية</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            <p className="text-xs text-slate-400">سيتم توثيق كل تغيير في سجل النشاط التفصيلي مع التاريخ والوقت واسم المستخدم.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>مبلغ الضمان (ر.س)</Label>
                <Input type="number" value={financeForm.escrow_amount ?? 0} onChange={(e) => setFinanceForm({ ...financeForm, escrow_amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>عمولة المنصة (%)</Label>
                <Input type="number" value={financeForm.platform_commission ?? 15} onChange={(e) => setFinanceForm({ ...financeForm, platform_commission: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>الحد الأدنى للميزانية (ر.س)</Label>
                <Input type="number" value={financeForm.budget_min ?? 0} onChange={(e) => setFinanceForm({ ...financeForm, budget_min: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>الحد الأعلى للميزانية (ر.س)</Label>
                <Input type="number" value={financeForm.budget_max ?? 0} onChange={(e) => setFinanceForm({ ...financeForm, budget_max: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>صافي دفع المهندس (ر.س)</Label>
                <Input type="number" value={financeForm.engineer_payment ?? 0} onChange={(e) => setFinanceForm({ ...financeForm, engineer_payment: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>أتعاب المستشار الفني (ر.س)</Label>
                <Input type="number" value={financeForm.technical_consultant_fee ?? 0} onChange={(e) => setFinanceForm({ ...financeForm, technical_consultant_fee: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>أتعاب المستشار القانوني (ر.س)</Label>
                <Input type="number" value={financeForm.legal_consultant_fee ?? 0} onChange={(e) => setFinanceForm({ ...financeForm, legal_consultant_fee: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinance(false)}>إلغاء</Button>
            <Button onClick={saveFinance} disabled={loading} className="bg-[#4A3F35] hover:bg-[#3a322a]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ وتوثيق"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Side dialogs */}
      <ActivityLogDialog project={project} open={showActivity} onOpenChange={setShowActivity} />
      <ContractViewDialog project={project} open={showContract} onOpenChange={setShowContract} />
      <PaymentsViewDialog project={project} open={showPayments} onOpenChange={setShowPayments} />

      {/* Confirmation dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmAction?.type === "delete" && <AlertTriangle className="w-5 h-5 text-red-600" />}
              {confirmConfig[confirmAction?.type]?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-slate-600 mb-3">{confirmConfig[confirmAction?.type]?.desc}</p>
            {["reject", "pause", "close"].includes(confirmAction?.type) && (
              <div className="space-y-1.5">
                <Label>السبب / ملاحظة (اختياري)</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="سبب الإجراء..." />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>إلغاء</Button>
            <Button onClick={handleConfirm} disabled={loading} className={confirmConfig[confirmAction?.type]?.color}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmConfig[confirmAction?.type]?.btn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}