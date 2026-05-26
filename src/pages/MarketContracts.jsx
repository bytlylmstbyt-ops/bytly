import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  FileText, Upload, CheckCircle2, Clock, AlertCircle,
  Plus, Eye, PenLine, Loader2, Shield, Calendar, DollarSign
} from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG = {
  draft:             { label: "مسودة",        color: "bg-slate-100 text-slate-700",  icon: FileText },
  pending_signatures:{ label: "قيد التوقيع",  color: "bg-amber-100 text-amber-700",  icon: Clock },
  active:            { label: "قيد التنفيذ",  color: "bg-green-100 text-green-700",  icon: CheckCircle2 },
  completed:         { label: "مكتمل",         color: "bg-blue-100 text-blue-700",    icon: CheckCircle2 },
  terminated:        { label: "ملغي",          color: "bg-red-100 text-red-700",      icon: AlertCircle },
};

export default function MarketContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [signing, setSigning] = useState(false);

  const [form, setForm] = useState({
    title: "", developer_entity_name: "", investor_entity_name: "",
    project_description: "", total_amount: "", start_date: "", end_date: "", notes: ""
  });
  const [contractFile, setContractFile] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [u, contractsData, entitiesData] = await Promise.all([
      base44.auth.me(),
      base44.entities.MarketContract.list("-created_date"),
      base44.entities.MarketEntity.filter({ status: "active" }),
    ]);
    setUser(u);
    setContracts(contractsData);
    setEntities(entitiesData);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setUploading(true);

    let fileUrl = null;
    let fileName = null;

    if (contractFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: contractFile });
      fileUrl = file_url;
      fileName = contractFile.name;
    }

    await base44.entities.MarketContract.create({
      ...form,
      total_amount: form.total_amount ? Number(form.total_amount) : null,
      contract_file_url: fileUrl,
      contract_file_name: fileName,
      status: fileUrl ? "pending_signatures" : "draft",
    });

    toast.success("تم إنشاء العقد بنجاح");
    setShowCreate(false);
    setForm({ title: "", developer_entity_name: "", investor_entity_name: "", project_description: "", total_amount: "", start_date: "", end_date: "", notes: "" });
    setContractFile(null);
    setUploading(false);
    loadData();
  };

  const handleUploadFile = async (contract, file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.MarketContract.update(contract.id, {
      contract_file_url: file_url,
      contract_file_name: file.name,
      status: "pending_signatures",
    });
    toast.success("تم رفع العقد");
    setUploading(false);
    loadData();
    setShowDetail(prev => ({ ...prev, contract_file_url: file_url, contract_file_name: file.name, status: "pending_signatures" }));
  };

  const handleSign = async (contract, party) => {
    setSigning(true);
    const now = new Date().toISOString();
    const updates = party === "developer"
      ? { developer_signed: true, developer_signed_date: now, developer_signed_by: user.email }
      : { investor_signed: true, investor_signed_date: now, investor_signed_by: user.email };

    // تحقق هل الطرف الآخر وقّع بالفعل
    const otherSigned = party === "developer" ? contract.investor_signed : contract.developer_signed;
    if (otherSigned) updates.status = "active"; // كلا الطرفين وقّعا → قيد التنفيذ

    await base44.entities.MarketContract.update(contract.id, updates);

    if (otherSigned) {
      toast.success("🎉 وقّع الطرفان! تم تحويل حالة العقد إلى قيد التنفيذ");
    } else {
      toast.success("تم تسجيل موافقتك الرقمية بنجاح");
    }

    setSigning(false);
    loadData();
    setShowDetail(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#c9a66b]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/20 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#4a3c31] flex items-center gap-2">
              <FileText className="w-7 h-7 text-[#c9a66b]" />
              إدارة عقود المطورين والمستثمرين
            </h1>
            <p className="text-sm text-slate-500 mt-1">رفع العقود، الموافقة الرقمية، ومتابعة حالة كل عقد</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-[#4a3c31] hover:bg-[#3a2e24] gap-2">
            <Plus className="w-4 h-4" /> عقد جديد
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "إجمالي العقود", value: contracts.length, color: "text-[#4a3c31]" },
            { label: "قيد التنفيذ", value: contracts.filter(c => c.status === "active").length, color: "text-green-600" },
            { label: "قيد التوقيع", value: contracts.filter(c => c.status === "pending_signatures").length, color: "text-amber-600" },
            { label: "مكتملة", value: contracts.filter(c => c.status === "completed").length, color: "text-blue-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contracts List */}
        <div className="space-y-3">
          {contracts.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد عقود بعد. ابدأ بإنشاء عقد جديد.</p>
              </CardContent>
            </Card>
          )}
          {contracts.map(contract => {
            const cfg = STATUS_CONFIG[contract.status] || STATUS_CONFIG.draft;
            const StatusIcon = cfg.icon;
            return (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-[#4a3c31] text-lg">{contract.title}</h3>
                        <Badge className={`${cfg.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" /> {cfg.label}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <span className="text-blue-700 font-medium">🏗 {contract.developer_entity_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-green-700 font-medium">💼 {contract.investor_entity_name}</span>
                        </div>
                        {contract.total_amount && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            {contract.total_amount.toLocaleString("ar-SA")} ريال
                          </div>
                        )}
                        {contract.start_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {contract.start_date}
                          </div>
                        )}
                      </div>
                      {/* Signature Status */}
                      <div className="flex gap-3 flex-wrap text-xs">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${contract.developer_signed ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          {contract.developer_signed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          المطور: {contract.developer_signed ? "وقّع" : "لم يوقع"}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${contract.investor_signed ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          {contract.investor_signed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          المستثمر: {contract.investor_signed ? "وقّع" : "لم يوقع"}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowDetail(contract)}>
                      <Eye className="w-4 h-4" /> إدارة العقد
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Create Contract Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء عقد جديد</DialogTitle>
            <DialogDescription>أدخل تفاصيل العقد بين المطور والمستثمر</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div>
              <Label>عنوان العقد *</Label>
              <Input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="مثال: عقد مشروع الأبراج السكنية" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>المطور العقاري *</Label>
                <Input required value={form.developer_entity_name} onChange={e => setForm({...form, developer_entity_name: e.target.value})} placeholder="اسم المطور" className="mt-1" />
              </div>
              <div>
                <Label>المستثمر *</Label>
                <Input required value={form.investor_entity_name} onChange={e => setForm({...form, investor_entity_name: e.target.value})} placeholder="اسم المستثمر" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>وصف المشروع</Label>
              <Textarea value={form.project_description} onChange={e => setForm({...form, project_description: e.target.value})} placeholder="وصف مختصر للمشروع..." className="mt-1 resize-none" rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>القيمة (ريال)</Label>
                <Input type="number" value={form.total_amount} onChange={e => setForm({...form, total_amount: e.target.value})} placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label>تاريخ البدء</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="mt-1" />
              </div>
              <div>
                <Label>تاريخ الانتهاء</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>ملف العقد (PDF)</Label>
              <div className="mt-1 border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                <p className="text-xs text-slate-500 mb-2">ارفع ملف العقد (اختياري عند الإنشاء)</p>
                <input type="file" accept=".pdf,.doc,.docx" onChange={e => setContractFile(e.target.files[0])} className="hidden" id="create-file" />
                <label htmlFor="create-file" className="cursor-pointer text-xs text-[#c9a66b] hover:underline">
                  {contractFile ? contractFile.name : "اختر ملفاً"}
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 bg-[#4a3c31] hover:bg-[#3a2e24]" disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "إنشاء العقد"}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contract Detail Dialog */}
      {showDetail && (
        <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>{showDetail.title}</DialogTitle>
              <DialogDescription>
                <Badge className={`${(STATUS_CONFIG[showDetail.status] || STATUS_CONFIG.draft).color} mt-1`}>
                  {(STATUS_CONFIG[showDetail.status] || STATUS_CONFIG.draft).label}
                </Badge>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              {/* Info */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">المطور:</span><span className="font-medium text-blue-700">{showDetail.developer_entity_name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">المستثمر:</span><span className="font-medium text-green-700">{showDetail.investor_entity_name}</span></div>
                {showDetail.total_amount && <div className="flex justify-between"><span className="text-slate-500">القيمة:</span><span className="font-medium">{showDetail.total_amount.toLocaleString("ar-SA")} ريال</span></div>}
                {showDetail.start_date && <div className="flex justify-between"><span className="text-slate-500">البدء:</span><span>{showDetail.start_date}</span></div>}
                {showDetail.end_date && <div className="flex justify-between"><span className="text-slate-500">الانتهاء:</span><span>{showDetail.end_date}</span></div>}
              </div>

              {/* Contract File */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> ملف العقد</h4>
                {showDetail.contract_file_url ? (
                  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800 truncate">{showDetail.contract_file_name || "ملف العقد"}</p>
                    </div>
                    <a href={showDetail.contract_file_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        <Eye className="w-3 h-3" /> عرض
                      </Button>
                    </a>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                    <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                    <p className="text-xs text-slate-500 mb-2">لم يُرفع ملف العقد بعد</p>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={e => handleUploadFile(showDetail, e.target.files[0])} className="hidden" id="detail-file" />
                    <label htmlFor="detail-file" className="cursor-pointer">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs pointer-events-none">
                        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Upload className="w-3 h-3" /> رفع الملف</>}
                      </Button>
                    </label>
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><PenLine className="w-4 h-4" /> الموافقة الرقمية</h4>
                <div className="space-y-2">
                  {/* Developer */}
                  <div className={`flex items-center justify-between p-3 rounded-lg border ${showDetail.developer_signed ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}>
                    <div>
                      <p className="text-sm font-medium">جهة المطور</p>
                      {showDetail.developer_signed && (
                        <p className="text-xs text-slate-500">وقّع بتاريخ {new Date(showDetail.developer_signed_date).toLocaleDateString("ar-SA")}</p>
                      )}
                    </div>
                    {showDetail.developer_signed
                      ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                      : showDetail.contract_file_url
                        ? <Button size="sm" onClick={() => handleSign(showDetail, "developer")} disabled={signing} className="bg-[#c9a66b] hover:bg-[#b8935a] text-white text-xs gap-1">
                            {signing ? <Loader2 className="w-3 h-3 animate-spin" /> : <><PenLine className="w-3 h-3" /> أوافق كمطور</>}
                          </Button>
                        : <span className="text-xs text-slate-400">يلزم رفع الملف أولاً</span>
                    }
                  </div>
                  {/* Investor */}
                  <div className={`flex items-center justify-between p-3 rounded-lg border ${showDetail.investor_signed ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}>
                    <div>
                      <p className="text-sm font-medium">جهة المستثمر</p>
                      {showDetail.investor_signed && (
                        <p className="text-xs text-slate-500">وقّع بتاريخ {new Date(showDetail.investor_signed_date).toLocaleDateString("ar-SA")}</p>
                      )}
                    </div>
                    {showDetail.investor_signed
                      ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                      : showDetail.contract_file_url
                        ? <Button size="sm" onClick={() => handleSign(showDetail, "investor")} disabled={signing} className="bg-[#4a3c31] hover:bg-[#3a2e24] text-white text-xs gap-1">
                            {signing ? <Loader2 className="w-3 h-3 animate-spin" /> : <><PenLine className="w-3 h-3" /> أوافق كمستثمر</>}
                          </Button>
                        : <span className="text-xs text-slate-400">يلزم رفع الملف أولاً</span>
                    }
                  </div>
                </div>
              </div>

              {/* Status notice when both signed */}
              {showDetail.developer_signed && showDetail.investor_signed && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm text-green-800">
                  <Shield className="w-4 h-4 shrink-0" />
                  وقّع الطرفان — العقد قيد التنفيذ الآن بحماية منصة بيتلي.
                </div>
              )}

              <Button variant="outline" className="w-full" onClick={() => setShowDetail(null)}>إغلاق</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}