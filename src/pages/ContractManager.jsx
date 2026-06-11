import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  FileText, Upload, CheckCircle2, XCircle, Clock, Shield,
  ChevronDown, ChevronUp, Search, Plus, Eye, Download,
  PenLine, AlertTriangle, RefreshCw, FileCheck, Building2,
  FileBadge, User, CalendarDays, Banknote, Hash, ArrowLeft
} from "lucide-react";
import moment from "moment";

// ─── حالات العقد ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft:             { label: "مسودة",           color: "bg-slate-100 text-slate-600",   dot: "bg-slate-400" },
  pending_signature: { label: "بانتظار التوقيع", color: "bg-amber-100 text-amber-700",   dot: "bg-amber-500" },
  signed:            { label: "موقع",             color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500"  },
  active:            { label: "ساري",             color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  completed:         { label: "مكتمل",            color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  terminated:        { label: "منهي",             color: "bg-red-100 text-red-700",       dot: "bg-red-500"   },
  archived:          { label: "مؤرشف",            color: "bg-slate-100 text-slate-400",   dot: "bg-slate-300" },
};

const CONTRACT_TYPES = {
  project_start:      "عقد بدء مشروع",
  service_agreement:  "اتفاقية خدمة",
};

// ─── نموذج إنشاء/تعديل عقد ──────────────────────────────────────────────────
function ContractForm({ projects, onSave, onCancel, editContract = null }) {
  const [form, setForm] = useState({
    project_id: editContract?.project_id || "",
    client_id: editContract?.client_id || "",
    engineer_id: editContract?.engineer_id || "",
    contract_type: editContract?.contract_type || "project_start",
    contract_number: editContract?.contract_number || `CNT-${Date.now()}`,
    service_description: editContract?.service_description || "",
    total_amount: editContract?.total_amount || "",
    payment_terms: editContract?.payment_terms || "",
    start_date: editContract?.start_date || "",
    delivery_date: editContract?.delivery_date || "",
    additional_terms: editContract?.additional_terms || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const data = { ...form, total_amount: Number(form.total_amount) };
    if (editContract) {
      await base44.entities.Contract.update(editContract.id, data);
    } else {
      await base44.entities.Contract.create({ ...data, status: "draft" });
    }
    setSaving(false);
    onSave();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-l from-[#4A3F35] to-[#6B5D4F] text-white px-6 py-5 rounded-t-2xl">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#C9A66B]" />
            {editContract ? "تعديل العقد" : "إنشاء عقد جديد"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* المشروع */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">المشروع *</label>
              <select
                required
                value={form.project_id}
                onChange={e => {
                  const p = projects.find(x => x.id === e.target.value);
                  set("project_id", e.target.value);
                  if (p) {
                    set("client_id", p.client_id || "");
                    set("engineer_id", p.assigned_engineer_id || "");
                  }
                }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A66B]"
              >
                <option value="">-- اختر المشروع --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            {/* نوع العقد */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">نوع العقد *</label>
              <select
                value={form.contract_type}
                onChange={e => set("contract_type", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A66B]"
              >
                <option value="project_start">عقد بدء مشروع</option>
                <option value="service_agreement">اتفاقية خدمة</option>
              </select>
            </div>
            {/* رقم العقد */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">رقم العقد</label>
              <Input value={form.contract_number} onChange={e => set("contract_number", e.target.value)} placeholder="CNT-XXXX" />
            </div>
            {/* المبلغ */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">المبلغ الإجمالي (ريال) *</label>
              <Input required type="number" value={form.total_amount} onChange={e => set("total_amount", e.target.value)} placeholder="0" />
            </div>
            {/* تاريخ البدء */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">تاريخ البدء</label>
              <Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} />
            </div>
            {/* تاريخ التسليم */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">تاريخ التسليم</label>
              <Input type="date" value={form.delivery_date} onChange={e => set("delivery_date", e.target.value)} />
            </div>
          </div>
          {/* وصف الخدمة */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">وصف الخدمة *</label>
            <textarea
              required
              value={form.service_description}
              onChange={e => set("service_description", e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A66B] resize-none"
              placeholder="وصف تفصيلي للخدمة والنطاق..."
            />
          </div>
          {/* شروط الدفع */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">شروط الدفع</label>
            <Input value={form.payment_terms} onChange={e => set("payment_terms", e.target.value)} placeholder="مثال: 50% مقدماً، 50% عند التسليم" />
          </div>
          {/* بنود إضافية */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">بنود إضافية</label>
            <textarea
              value={form.additional_terms}
              onChange={e => set("additional_terms", e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A66B] resize-none"
              placeholder="أي بنود أو شروط خاصة..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1 bg-[#6B5D4F] hover:bg-[#4A3F35] text-white">
              {saving ? "جارٍ الحفظ..." : editContract ? "حفظ التعديلات" : "إنشاء العقد"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">إلغاء</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── لوحة تفاصيل العقد ──────────────────────────────────────────────────────
function ContractDetail({ contract, project, onClose, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [signing, setSigning] = useState(null); // 'client' | 'engineer'
  const [confirmSign, setConfirmSign] = useState(null);
  const fileRef = useRef();

  const bothSigned = contract.client_signature && contract.engineer_signature;

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Contract.update(contract.id, {
      contract_pdf_url: file_url,
      status: contract.status === "draft" ? "pending_signature" : contract.status,
    });
    setUploading(false);
    onRefresh();
  }

  async function handleSign(party) {
    setSigning(party);
    const now = new Date().toISOString();
    const update = party === "client"
      ? { client_signature: true, client_signature_date: now }
      : { engineer_signature: true, engineer_signature_date: now };

    // تحديث الحالة إذا وقّع الطرفان
    const willBothSigned = party === "client"
      ? contract.engineer_signature
      : contract.client_signature;

    if (willBothSigned) {
      update.status = "signed";
    } else {
      update.status = "pending_signature";
    }

    await base44.entities.Contract.update(contract.id, update);
    setSigning(null);
    setConfirmSign(null);
    onRefresh();
  }

  async function updateStatus(newStatus) {
    await base44.entities.Contract.update(contract.id, { status: newStatus });
    onRefresh();
  }

  const cfg = STATUS_CONFIG[contract.status] || STATUS_CONFIG.draft;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">

        {/* رأس اللوحة */}
        <div className="bg-gradient-to-l from-[#4A3F35] to-[#6B5D4F] text-white px-6 py-5 rounded-t-2xl flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-[#C9A66B]" />
              <h2 className="text-lg font-bold">{CONTRACT_TYPES[contract.contract_type] || "عقد"}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
            </div>
            <p className="text-white/60 text-sm">رقم العقد: {contract.contract_number || "—"}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* بيانات العقد */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Building2, label: "المشروع", value: project?.title || "—" },
              { icon: Banknote, label: "المبلغ الإجمالي", value: `${(contract.total_amount || 0).toLocaleString()} ريال` },
              { icon: CalendarDays, label: "تاريخ البدء", value: contract.start_date ? moment(contract.start_date).format("DD/MM/YYYY") : "—" },
              { icon: CalendarDays, label: "تاريخ التسليم", value: contract.delivery_date ? moment(contract.delivery_date).format("DD/MM/YYYY") : "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5 text-[#C9A66B]" />
                  <span className="text-xs text-slate-400">{label}</span>
                </div>
                <p className="text-sm font-semibold text-slate-700 truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* وصف الخدمة */}
          {contract.service_description && (
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 mb-1">وصف الخدمة</p>
              <p className="text-sm text-slate-700 leading-relaxed">{contract.service_description}</p>
            </div>
          )}

          {/* ─── رفع النسخة الأصلية ─── */}
          <div className="border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileBadge className="w-5 h-5 text-[#C9A66B]" />
                <h3 className="font-bold text-slate-700">النسخة الأصلية من العقد</h3>
              </div>
              {contract.contract_pdf_url && (
                <a
                  href={contract.contract_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> عرض الملف
                </a>
              )}
            </div>

            {contract.contract_pdf_url ? (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-emerald-700">تم رفع نسخة العقد بنجاح</p>
                  <p className="text-xs text-emerald-500 truncate">{contract.contract_pdf_url.split("/").pop()}</p>
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="text-xs text-emerald-600 underline hover:no-underline"
                >
                  استبدال
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#C9A66B] hover:bg-amber-50 transition-colors"
              >
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500">اضغط لرفع النسخة الأصلية</p>
                <p className="text-xs text-slate-400 mt-1">PDF أو Word — الحد الأقصى 10MB</p>
              </div>
            )}

            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleUpload} />
            {uploading && (
              <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                جارٍ الرفع...
              </div>
            )}
          </div>

          {/* ─── التوقيعات الرقمية ─── */}
          <div className="border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <PenLine className="w-5 h-5 text-[#C9A66B]" />
              <h3 className="font-bold text-slate-700">التوثيق الرقمي — الموافقة من الطرفين</h3>
            </div>

            {bothSigned && (
              <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <Shield className="w-4 h-4 text-emerald-500" />
                <p className="text-sm font-semibold text-emerald-700">العقد موقع رقمياً من كلا الطرفين ✓</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* توقيع العميل */}
              <div className={`rounded-xl p-4 border-2 ${contract.client_signature ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-sm text-slate-700">العميل</span>
                  </div>
                  {contract.client_signature
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    : <Clock className="w-5 h-5 text-amber-400" />
                  }
                </div>
                {contract.client_signature ? (
                  <div>
                    <p className="text-xs text-emerald-600 font-semibold">✓ تمت الموافقة الرقمية</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {contract.client_signature_date ? moment(contract.client_signature_date).format("DD/MM/YYYY - HH:mm") : "—"}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-400 mb-3">لم يتم التوقيع بعد</p>
                    {confirmSign === "client" ? (
                      <div className="space-y-2">
                        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
                          بالضغط على "تأكيد"، أقرّ بموافقتي الرقمية على بنود هذا العقد وأن هذا الإجراء يُعدّ توقيعاً إلكترونياً ملزماً قانونياً.
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => handleSign("client")} disabled={signing === "client"}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs py-2 rounded-lg font-semibold transition-colors">
                            {signing === "client" ? "جارٍ..." : "تأكيد الموافقة"}
                          </button>
                          <button onClick={() => setConfirmSign(null)} className="flex-1 bg-slate-200 text-slate-600 text-xs py-2 rounded-lg font-semibold">إلغاء</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmSign("client")}
                        className="w-full bg-[#6B5D4F] hover:bg-[#4A3F35] text-white text-xs py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5">
                        <PenLine className="w-3.5 h-3.5" /> توقيع من طرف العميل
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* توقيع المهندس */}
              <div className={`rounded-xl p-4 border-2 ${contract.engineer_signature ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-sm text-slate-700">المهندس</span>
                  </div>
                  {contract.engineer_signature
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    : <Clock className="w-5 h-5 text-amber-400" />
                  }
                </div>
                {contract.engineer_signature ? (
                  <div>
                    <p className="text-xs text-emerald-600 font-semibold">✓ تمت الموافقة الرقمية</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {contract.engineer_signature_date ? moment(contract.engineer_signature_date).format("DD/MM/YYYY - HH:mm") : "—"}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-400 mb-3">لم يتم التوقيع بعد</p>
                    {confirmSign === "engineer" ? (
                      <div className="space-y-2">
                        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
                          بالضغط على "تأكيد"، أقرّ بموافقتي الرقمية على بنود هذا العقد وأن هذا الإجراء يُعدّ توقيعاً إلكترونياً ملزماً قانونياً.
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => handleSign("engineer")} disabled={signing === "engineer"}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs py-2 rounded-lg font-semibold transition-colors">
                            {signing === "engineer" ? "جارٍ..." : "تأكيد الموافقة"}
                          </button>
                          <button onClick={() => setConfirmSign(null)} className="flex-1 bg-slate-200 text-slate-600 text-xs py-2 rounded-lg font-semibold">إلغاء</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmSign("engineer")}
                        className="w-full bg-[#6B5D4F] hover:bg-[#4A3F35] text-white text-xs py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5">
                        <PenLine className="w-3.5 h-3.5" /> توقيع من طرف المهندس
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ─── الربط بسجل الامتثال ─── */}
          <div className="bg-gradient-to-l from-slate-50 to-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#C9A66B]/20 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#C9A66B]" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">سجل الامتثال المرتبط</p>
                <p className="text-xs text-slate-500">
                  {contract.client_signature && contract.engineer_signature
                    ? "✓ هذا العقد موثق ومحتسب في درجة الامتثال للمشروع"
                    : "⚠ يحتاج توقيع الطرفين ليُحتسب في سجل الامتثال"}
                </p>
              </div>
            </div>
            <Link
              to="/ComplianceDashboard"
              className="flex items-center gap-1.5 text-xs bg-[#6B5D4F] text-white px-3 py-2 rounded-lg hover:bg-[#4A3F35] transition-colors"
            >
              عرض الامتثال <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* تغيير الحالة */}
          {!bothSigned && (
            <div className="flex gap-2 flex-wrap">
              {contract.status !== "active" && (
                <button onClick={() => updateStatus("active")}
                  className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors">
                  تفعيل العقد
                </button>
              )}
              {contract.status !== "terminated" && (
                <button onClick={() => updateStatus("terminated")}
                  className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">
                  إنهاء العقد
                </button>
              )}
              {contract.status !== "archived" && (
                <button onClick={() => updateStatus("archived")}
                  className="text-xs bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                  أرشفة
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── الصفحة الرئيسية ─────────────────────────────────────────────────────────
export default function ContractManager() {
  const [contracts, setContracts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editContract, setEditContract] = useState(null);
  const [detailContract, setDetailContract] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [c, p] = await Promise.all([
      base44.entities.Contract.list("-created_date", 200),
      base44.entities.Project.list("-created_date", 100),
    ]);
    setContracts(c || []);
    setProjects(p || []);
    setLoading(false);
  }

  const filtered = contracts.filter(c => {
    const proj = projects.find(p => p.id === c.project_id);
    const matchSearch = !search ||
      proj?.title?.includes(search) ||
      c.contract_number?.includes(search) ||
      c.service_description?.includes(search);
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ملخص الإحصاء
  const stats = {
    total: contracts.length,
    signed: contracts.filter(c => c.client_signature && c.engineer_signature).length,
    pending: contracts.filter(c => c.status === "pending_signature").length,
    active: contracts.filter(c => c.status === "active").length,
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#C9A66B] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#4A3F35] to-[#6B5D4F] text-white px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-[#C9A66B]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">إدارة العقود</h1>
                <p className="text-white/70 text-sm">رفع النسخ الأصلية · التوثيق الرقمي · سجل الامتثال</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/ComplianceDashboard"
                className="flex items-center gap-1.5 px-4 py-2 border border-white/20 text-white text-sm rounded-lg hover:bg-white/10 transition-colors">
                <Shield className="w-4 h-4" /> سجل الامتثال
              </Link>
              <Button onClick={() => { setEditContract(null); setShowForm(true); }}
                className="bg-[#C9A66B] hover:bg-[#b8945a] text-white gap-2">
                <Plus className="w-4 h-4" /> عقد جديد
              </Button>
            </div>
          </div>

          {/* إحصاء سريع */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { label: "إجمالي العقود", value: stats.total, bg: "bg-white/10" },
              { label: "موقعة من الطرفين", value: stats.signed, bg: "bg-emerald-500/30" },
              { label: "بانتظار التوقيع", value: stats.pending, bg: "bg-amber-500/30" },
              { label: "سارية المفعول", value: stats.active, bg: "bg-blue-500/30" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3`}>
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-white/70 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* فلاتر */}
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input placeholder="ابحث برقم العقد أو اسم المشروع..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { v: "all", l: "الكل" },
              { v: "pending_signature", l: "بانتظار التوقيع" },
              { v: "signed", l: "موقع" },
              { v: "active", l: "ساري" },
              { v: "completed", l: "مكتمل" },
            ].map(f => (
              <button key={f.v} onClick={() => setFilterStatus(f.v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === f.v ? "bg-[#6B5D4F] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {/* قائمة العقود */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <FileText className="w-14 h-14 mx-auto mb-3 opacity-20" />
            <p className="font-semibold">لا توجد عقود</p>
            <p className="text-sm mt-1">ابدأ بإنشاء عقدك الأول</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(contract => {
              const project = projects.find(p => p.id === contract.project_id);
              const cfg = STATUS_CONFIG[contract.status] || STATUS_CONFIG.draft;
              const bothSigned = contract.client_signature && contract.engineer_signature;

              return (
                <div key={contract.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4 flex items-center gap-4">
                    {/* أيقونة */}
                    <div className="w-10 h-10 bg-[#C9A66B]/10 rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-[#C9A66B]" />
                    </div>

                    {/* المعلومات */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">
                          {CONTRACT_TYPES[contract.contract_type] || "عقد"}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                        {contract.contract_pdf_url && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <FileCheck className="w-3 h-3" /> ملف مرفوع
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {project?.title || "—"} · {contract.contract_number || "—"} · {moment(contract.created_date).format("DD/MM/YYYY")}
                      </p>
                    </div>

                    {/* التوقيعات */}
                    <div className="hidden md:flex items-center gap-3">
                      <div className="flex flex-col items-center gap-0.5">
                        {contract.client_signature
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          : <Clock className="w-4 h-4 text-slate-300" />
                        }
                        <span className="text-xs text-slate-400">عميل</span>
                      </div>
                      <div className="w-6 border-t border-dashed border-slate-200" />
                      <div className="flex flex-col items-center gap-0.5">
                        {contract.engineer_signature
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          : <Clock className="w-4 h-4 text-slate-300" />
                        }
                        <span className="text-xs text-slate-400">مهندس</span>
                      </div>
                    </div>

                    {/* المبلغ */}
                    <div className="hidden md:block text-left">
                      <p className="font-bold text-slate-700">{(contract.total_amount || 0).toLocaleString()}</p>
                      <p className="text-xs text-slate-400">ريال</p>
                    </div>

                    {/* إجراءات */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setDetailContract(contract)}
                        className="flex items-center gap-1.5 bg-[#6B5D4F] hover:bg-[#4A3F35] text-white text-xs px-3 py-2 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">إدارة</span>
                      </button>
                    </div>
                  </div>

                  {/* شريط الامتثال */}
                  {bothSigned && (
                    <div className="px-4 pb-3">
                      <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">محتسب في سجل الامتثال ✓</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* المودالات */}
      {showForm && (
        <ContractForm
          projects={projects}
          editContract={editContract}
          onSave={() => { setShowForm(false); setEditContract(null); loadData(); }}
          onCancel={() => { setShowForm(false); setEditContract(null); }}
        />
      )}

      {detailContract && (
        <ContractDetail
          contract={detailContract}
          project={projects.find(p => p.id === detailContract.project_id)}
          onClose={() => setDetailContract(null)}
          onRefresh={() => {
            loadData().then(() => {
              // تحديث العقد المفتوح بالبيانات الجديدة
              base44.entities.Contract.filter({ id: detailContract.id }).then(res => {
                if (res?.[0]) setDetailContract(res[0]);
              });
            });
          }}
        />
      )}
    </div>
  );
}