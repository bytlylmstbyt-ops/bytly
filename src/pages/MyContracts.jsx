import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CheckCircle, Clock, AlertCircle, Search, Filter,
  Download, Eye, Plus, Loader2, Scale, Shield, Calendar,
  DollarSign, User, Building2, ChevronDown, Printer, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import ElectronicSignModal from "@/components/contracts/ElectronicSignModal";

// ─── helpers ───────────────────────────────────────────────────────────────
const STATUS_MAP = {
  draft:            { label: "مسودة",              color: "bg-slate-100 text-slate-600",  icon: FileText },
  pending_signature:{ label: "بانتظار التوقيع",    color: "bg-amber-100 text-amber-700",  icon: Clock    },
  signed:           { label: "موقّع",               color: "bg-blue-100 text-blue-700",   icon: CheckCircle },
  active:           { label: "ساري",                color: "bg-green-100 text-green-700", icon: CheckCircle },
  completed:        { label: "مكتمل",               color: "bg-teal-100 text-teal-700",   icon: CheckCircle },
  terminated:       { label: "منتهي",               color: "bg-red-100 text-red-700",     icon: AlertCircle },
  archived:         { label: "مؤرشف",               color: "bg-slate-100 text-slate-500", icon: FileText },
};

const TYPE_MAP = {
  project_start:    "عقد بدء مشروع",
  service_agreement:"عقد تقديم خدمات",
};

// ─── Contract Card ──────────────────────────────────────────────────────────
function ContractCard({ contract, project, client, engineer, currentUserEmail, onSign, onExportPDF }) {
  const status = STATUS_MAP[contract.status] || STATUS_MAP.draft;
  const StatusIcon = status.icon;
  const isClient = currentUserEmail === client?.email;
  const isEngineer = currentUserEmail === engineer?.email;
  const mySignature = isClient ? contract.client_signature : contract.engineer_signature;
  const otherSignature = isClient ? contract.engineer_signature : contract.client_signature;
  const canSign = !mySignature && (contract.status === "pending_signature" || contract.status === "draft");

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Top accent */}
      <div className={`h-1 w-full ${contract.status === "active" ? "bg-green-500" : contract.status === "pending_signature" ? "bg-amber-400" : "bg-slate-300"}`} />

      <div className="p-5" dir="rtl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#1a1a2e] truncate">{project?.title || "مشروع غير محدد"}</p>
              <p className="text-xs text-slate-400 mt-0.5">{TYPE_MAP[contract.contract_type] || "عقد"}</p>
              <p className="text-xs text-slate-400 font-mono">{contract.contract_number}</p>
            </div>
          </div>
          <Badge className={`${status.color} border-0 shrink-0 flex items-center gap-1`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </Badge>
        </div>

        {/* Parties */}
        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">{client?.full_name || "—"}</span>
          <span className="text-slate-300">←→</span>
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">{engineer?.full_name || "—"}</span>
        </div>

        {/* Financials & dates */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-50 rounded-xl px-3 py-2">
            <p className="text-xs text-slate-400">القيمة</p>
            <p className="text-sm font-bold text-[#1a1a2e]">
              {contract.total_amount?.toLocaleString() || "—"} <span className="font-normal text-xs">ر.س</span>
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl px-3 py-2">
            <p className="text-xs text-slate-400">تاريخ التسليم</p>
            <p className="text-sm font-semibold text-slate-700">
              {contract.delivery_date ? new Date(contract.delivery_date).toLocaleDateString("ar") : "—"}
            </p>
          </div>
        </div>

        {/* Signatures status */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${contract.client_signature ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
            {contract.client_signature ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            العميل
          </div>
          <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${contract.engineer_signature ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
            {contract.engineer_signature ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            المهندس
          </div>
          {contract.client_signature && contract.engineer_signature && (
            <div className="flex items-center gap-1 text-xs text-green-700 font-semibold">
              <Shield className="w-3.5 h-3.5" />
              موثّق بالكامل
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <Link to={createPageUrl("Contract") + `?id=${contract.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              عرض
            </Button>
          </Link>
          {canSign && (
            <Button size="sm" onClick={() => onSign(contract)} className="flex-1 bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              توقيع
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onExportPDF(contract, project, client, engineer)} className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            PDF
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── New Contract Dialog ────────────────────────────────────────────────────
function NewContractDialog({ projects, engineers, clients, currentUser, onCreated }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    contract_type: "service_agreement",
    total_amount: "",
    start_date: new Date().toISOString().split("T")[0],
    delivery_date: "",
    payment_terms: "30% دفعة مقدمة، 40% عند التصاميم الأولية، 30% عند التسليم النهائي",
    additional_terms: "",
  });

  const inProgressProjects = projects.filter(p => p.status === "in_progress" && p.assigned_engineer_id);

  const handleSelectProject = (p) => {
    setSelectedProject(p);
    setForm(prev => ({
      ...prev,
      total_amount: p.escrow_amount || p.budget_max || "",
      delivery_date: p.deadline || "",
    }));
    setStep(2);
  };

  const handleCreate = async () => {
    if (!selectedProject) return;
    setIsCreating(true);

    // Find client & engineer for the project
    const clientData = await base44.entities.Client.filter({ email: selectedProject.created_by });
    const engineerData = await base44.entities.Engineer.filter({ id: selectedProject.assigned_engineer_id });

    const contract = await base44.entities.Contract.create({
      project_id: selectedProject.id,
      client_id: clientData[0]?.id || "",
      engineer_id: selectedProject.assigned_engineer_id,
      contract_number: `BYT-${Date.now().toString().slice(-8)}`,
      ...form,
      total_amount: parseFloat(form.total_amount) || 0,
      status: "pending_signature",
      client_signature: false,
      engineer_signature: false,
    });

    setIsCreating(false);
    setOpen(false);
    setStep(1);
    setSelectedProject(null);
    onCreated(contract.id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white gap-2">
          <Plus className="w-4 h-4" />
          عقد جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#d4a574]" />
            إنشاء عقد جديد
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3 mt-2">
            <p className="text-sm text-slate-500">اختر المشروع الذي تريد إنشاء عقد له:</p>
            {inProgressProjects.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">لا توجد مشاريع قيد التنفيذ تتطلب عقداً</p>
              </div>
            ) : (
              inProgressProjects.map(p => {
                const eng = engineers.find(e => e.id === p.assigned_engineer_id);
                return (
                  <button key={p.id} onClick={() => handleSelectProject(p)}
                    className="w-full text-right p-4 rounded-xl border border-slate-200 hover:border-[#d4a574] hover:bg-amber-50/30 transition-all">
                    <p className="font-semibold text-[#1a1a2e]">{p.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">المهندس: {eng?.full_name || "غير محدد"}</p>
                  </button>
                );
              })
            )}
          </div>
        )}

        {step === 2 && selectedProject && (
          <div className="space-y-4 mt-2">
            <div className="bg-amber-50 rounded-xl p-3 flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-[#d4a574] shrink-0" />
              <span className="font-medium text-slate-700">{selectedProject.title}</span>
              <button onClick={() => setStep(1)} className="mr-auto text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label>نوع العقد</Label>
              <Select value={form.contract_type} onValueChange={v => setForm(p => ({ ...p, contract_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="project_start">عقد بدء مشروع</SelectItem>
                  <SelectItem value="service_agreement">عقد اتفاق تقديم خدمات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>القيمة الإجمالية (ر.س)</Label>
              <Input type="number" value={form.total_amount}
                onChange={e => setForm(p => ({ ...p, total_amount: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>تاريخ البدء</Label>
                <Input type="date" value={form.start_date}
                  onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>تاريخ التسليم</Label>
                <Input type="date" value={form.delivery_date}
                  onChange={e => setForm(p => ({ ...p, delivery_date: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>شروط الدفع</Label>
              <Textarea rows={2} value={form.payment_terms}
                onChange={e => setForm(p => ({ ...p, payment_terms: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>بنود إضافية (اختياري)</Label>
              <Textarea rows={2} value={form.additional_terms} placeholder="أي شروط إضافية..."
                onChange={e => setForm(p => ({ ...p, additional_terms: e.target.value }))} />
            </div>

            <div className="bg-blue-50 border-r-4 border-blue-400 p-3 rounded-lg text-xs text-blue-800">
              <Shield className="w-3.5 h-3.5 inline-block ml-1" />
              سيُرسل العقد لكلا الطرفين للتوقيع الإلكتروني
            </div>

            <Button onClick={handleCreate} disabled={isCreating || !form.total_amount}
              className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white">
              {isCreating ? <><Loader2 className="w-4 h-4 animate-spin ml-2" />جاري الإنشاء...</> : <><CheckCircle className="w-4 h-4 ml-2" />إنشاء العقد</>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Sign Dialog ────────────────────────────────────────────────────────────
function SignDialog({ contract, client, engineer, currentUser, onSigned }) {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);

  const isClient = currentUser?.email === client?.email;

  const handleSign = async () => {
    setSigning(true);
    const updates = {};
    if (isClient) { updates.client_signature = true; updates.client_signature_date = new Date().toISOString(); }
    else           { updates.engineer_signature = true; updates.engineer_signature_date = new Date().toISOString(); }

    const bothSigned = (isClient && contract.engineer_signature) || (!isClient && contract.client_signature);
    if (bothSigned) updates.status = "active";
    else updates.status = "pending_signature";

    await base44.entities.Contract.update(contract.id, updates);
    setSigning(false);
    setOpen(false);
    onSigned();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex-1 bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          توقيع
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>التوقيع الإلكتروني</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 space-y-1">
            <p><span className="font-semibold">العقد:</span> {contract.contract_number}</p>
            <p><span className="font-semibold">القيمة:</span> {contract.total_amount?.toLocaleString()} ر.س</p>
            <p><span className="font-semibold">أنت توقع بصفة:</span> {isClient ? "العميل (الطرف الأول)" : "المهندس (الطرف الثاني)"}</p>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox id="agree-sign" checked={agreed} onCheckedChange={setAgreed} />
            <Label htmlFor="agree-sign" className="text-sm leading-relaxed cursor-pointer">
              أقر بأنني قرأت العقد وأوافق على جميع بنوده وشروطه. التوقيع الإلكتروني ملزم قانونياً.
            </Label>
          </div>
          <Button onClick={handleSign} disabled={!agreed || signing}
            className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white">
            {signing ? <><Loader2 className="w-4 h-4 animate-spin ml-2" />جاري التوقيع...</> : <><CheckCircle className="w-4 h-4 ml-2" />تأكيد التوقيع</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── PDF Export ─────────────────────────────────────────────────────────────
async function exportContractPDF(contract, project, client, engineer) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", format: "a4" });

  // RTL support via text positioning
  const W = doc.internal.pageSize.getWidth();
  let y = 20;

  const addLine = (text, opts = {}) => {
    const { size = 12, bold = false, center = false, color = [30, 30, 30], indent = 0 } = opts;
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const x = center ? W / 2 : W - 20 - indent;
    doc.text(text, x, y, { align: center ? "center" : "right", ...({}) });
    y += size * 0.6 + 3;
  };

  const rule = () => { doc.setDrawColor(200); doc.line(15, y, W - 15, y); y += 5; };

  // Header
  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, W, 35, "F");
  doc.setFontSize(18); doc.setTextColor(255, 255, 255);
  doc.text("Bytly - بيتلي", W / 2, 15, { align: "center" });
  doc.setFontSize(11); doc.setTextColor(212, 165, 116);
  doc.text(TYPE_MAP[contract.contract_type] || "عقد", W / 2, 25, { align: "center" });
  y = 45;

  addLine(`رقم العقد: ${contract.contract_number}`, { size: 10, color: [100, 100, 100] });
  addLine(`تاريخ الإنشاء: ${new Date(contract.created_date).toLocaleDateString("ar")}`, { size: 10, color: [100, 100, 100] });
  rule();

  addLine("المشروع", { size: 13, bold: true });
  addLine(project?.title || "—", { size: 11, indent: 5 });
  y += 3; rule();

  addLine("الطرف الأول - العميل", { size: 13, bold: true });
  addLine(`الاسم: ${client?.full_name || "—"}`, { size: 11, indent: 5 });
  addLine(`البريد: ${client?.email || "—"}`, { size: 11, indent: 5 });
  y += 3; rule();

  addLine("الطرف الثاني - المهندس", { size: 13, bold: true });
  addLine(`الاسم: ${engineer?.full_name || "—"}`, { size: 11, indent: 5 });
  addLine(`التخصص: ${engineer?.specialization || "—"}`, { size: 11, indent: 5 });
  addLine(`رقم القيد: ${engineer?.registration_number || "—"}`, { size: 11, indent: 5 });
  y += 3; rule();

  addLine("التفاصيل المالية", { size: 13, bold: true });
  addLine(`القيمة الإجمالية: ${contract.total_amount?.toLocaleString()} ريال سعودي`, { size: 11, indent: 5 });
  addLine(`شروط الدفع: ${contract.payment_terms || "—"}`, { size: 11, indent: 5 });
  addLine(`تاريخ البدء: ${contract.start_date ? new Date(contract.start_date).toLocaleDateString("ar") : "—"}`, { size: 11, indent: 5 });
  addLine(`تاريخ التسليم: ${contract.delivery_date ? new Date(contract.delivery_date).toLocaleDateString("ar") : "—"}`, { size: 11, indent: 5 });
  y += 3; rule();

  addLine("التوقيعات", { size: 13, bold: true });
  addLine(`توقيع العميل: ${contract.client_signature ? "✓ موقّع - " + new Date(contract.client_signature_date).toLocaleDateString("ar") : "لم يُوقَّع بعد"}`, { size: 11, indent: 5, color: contract.client_signature ? [22, 163, 74] : [160, 160, 160] });
  addLine(`توقيع المهندس: ${contract.engineer_signature ? "✓ موقّع - " + new Date(contract.engineer_signature_date).toLocaleDateString("ar") : "لم يُوقَّع بعد"}`, { size: 11, indent: 5, color: contract.engineer_signature ? [22, 163, 74] : [160, 160, 160] });
  y += 3; rule();

  // Footer
  doc.setFontSize(8); doc.setTextColor(150);
  doc.text("وثيقة رسمية صادرة عن منصة بيتلي | www.mybytly.com", W / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

  doc.save(`عقد-${contract.contract_number}.pdf`);
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function MyContracts() {
  const [contracts, setContracts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [clients, setClients] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [signingContract, setSigningContract] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setIsLoading(true);
    const user = await base44.auth.me();
    setCurrentUser(user);

    const [engData, clientData, projectData] = await Promise.all([
      base44.entities.Engineer.filter({ email: user.email }),
      base44.entities.Client.filter({ email: user.email }),
      base44.entities.Project.list("-created_date", 100),
    ]);

    const myEngineer = engData[0];
    const myClient = clientData[0];

    // Load contracts where user is client or engineer
    let allContracts = [];
    if (myClient) {
      const cc = await base44.entities.Contract.filter({ client_id: myClient.id });
      allContracts = [...allContracts, ...cc];
    }
    if (myEngineer) {
      const ec = await base44.entities.Contract.filter({ engineer_id: myEngineer.id });
      // Deduplicate
      ec.forEach(c => { if (!allContracts.find(x => x.id === c.id)) allContracts.push(c); });
    }

    // Load related entities
    const [allEngineers, allClients] = await Promise.all([
      base44.entities.Engineer.list("-created_date", 200),
      base44.entities.Client.list("-created_date", 200),
    ]);

    setContracts(allContracts);
    setProjects(projectData);
    setEngineers(allEngineers);
    setClients(allClients);
    setIsLoading(false);
  };

  const getProject  = (id) => projects.find(p => p.id === id);
  const getEngineer = (id) => engineers.find(e => e.id === id);
  const getClient   = (id) => clients.find(c => c.id === id);

  const filtered = contracts.filter(c => {
    const project = getProject(c.project_id);
    const matchSearch = !search || project?.title?.includes(search) || c.contract_number?.includes(search);
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchTab = activeTab === "all" ||
      (activeTab === "pending" && c.status === "pending_signature") ||
      (activeTab === "active"  && c.status === "active") ||
      (activeTab === "completed" && (c.status === "completed" || c.status === "signed"));
    return matchSearch && matchStatus && matchTab;
  });

  // Stats
  const stats = {
    total:   contracts.length,
    pending: contracts.filter(c => c.status === "pending_signature").length,
    active:  contracts.filter(c => c.status === "active").length,
    done:    contracts.filter(c => ["completed","signed"].includes(c.status)).length,
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] flex items-center gap-2">
              <Scale className="w-7 h-7 text-[#d4a574]" />
              عقودي
            </h1>
            <p className="text-slate-400 text-sm mt-1">إدارة وتوقيع عقودك الهندسية بشكل رقمي آمن</p>
          </div>
          <NewContractDialog
            projects={projects}
            engineers={engineers}
            clients={clients}
            currentUser={currentUser}
            onCreated={(id) => { loadAll(); window.location.href = createPageUrl("Contract") + `?id=${id}`; }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "إجمالي العقود", value: stats.total,   color: "from-slate-500 to-slate-700",   icon: FileText   },
            { label: "بانتظار التوقيع", value: stats.pending, color: "from-amber-400 to-amber-600", icon: Clock      },
            { label: "سارية",          value: stats.active,  color: "from-green-400 to-green-600",  icon: CheckCircle},
            { label: "مكتملة",         value: stats.done,    color: "from-teal-400 to-teal-600",    icon: Shield     },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white`}>
              <s.icon className="w-5 h-5 mb-2 opacity-80" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs opacity-80 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث باسم المشروع أو رقم العقد..."
              className="pr-9 rounded-xl" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl">
              <Filter className="w-4 h-4 ml-1 text-slate-400" />
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all">الكل ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">بانتظار التوقيع ({stats.pending})</TabsTrigger>
            <TabsTrigger value="active">سارية ({stats.active})</TabsTrigger>
            <TabsTrigger value="completed">مكتملة ({stats.done})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Contracts Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Scale className="w-14 h-14 mx-auto mb-4 text-slate-200" />
            <p className="text-lg font-medium">لا توجد عقود</p>
            <p className="text-sm mt-1">أنشئ عقدك الأول بالنقر على "عقد جديد"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(contract => {
              const project  = getProject(contract.project_id);
              const engineer = getEngineer(contract.engineer_id);
              const client   = getClient(contract.client_id);
              const isClient = currentUser?.email === client?.email;
              const mySignature = isClient ? contract.client_signature : contract.engineer_signature;
              const canSign = !mySignature && ["pending_signature","draft"].includes(contract.status);

              return canSign ? (
                <div key={contract.id} className="relative">
                  {/* Override sign button inside card with our dialog */}
                  <ContractCard
                    contract={contract}
                    project={project}
                    client={client}
                    engineer={engineer}
                    currentUserEmail={currentUser?.email}
                    onSign={() => setSigningContract({ contract, project, client, engineer })}
                    onExportPDF={() => exportContractPDF(contract, project, client, engineer)}
                  />
                </div>
              ) : (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  project={project}
                  client={client}
                  engineer={engineer}
                  currentUserEmail={currentUser?.email}
                  onSign={() => {}}
                  onExportPDF={() => exportContractPDF(contract, project, client, engineer)}
                />
              );
            })}
          </div>
        )}

        {/* Electronic Sign Modal (global) */}
        {signingContract && (
          <ElectronicSignModal
            contract={signingContract.contract}
            project={signingContract.project}
            client={signingContract.client}
            engineer={signingContract.engineer}
            currentUser={currentUser}
            onDone={() => { setSigningContract(null); loadAll(); }}
            onClose={() => setSigningContract(null)}
          />
        )}
      </div>
    </div>
  );
}

// SigningModal replaced by ElectronicSignModal component