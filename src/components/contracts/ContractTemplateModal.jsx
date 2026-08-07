import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Scale, Loader2, CheckCircle, FileText, Calendar, DollarSign,
  User, Building2, Shield, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { logWorkspaceActivity } from "@/components/project/logWorkspaceActivity";

/**
 * ContractTemplateModal
 * Opens a Bytly-branded contract template, pre-filled from project + proposal data,
 * and creates a Contract entity on submit.
 *
 * Props: project, engineer, client, proposals, currentUser, onClose, onCreated
 */
export default function ContractTemplateModal({
  project, engineer, client, proposals, currentUser, onClose, onCreated
}) {
  const today = new Date().toISOString().split("T")[0];
  const acceptedProposal = useMemo(
    () => (proposals || []).find((p) => p.status === "accepted"),
    [proposals]
  );

  const defaultAmount = acceptedProposal?.price
    || project?.escrow_amount
    || project?.budget_max
    || project?.budget_min
    || 0;

  const defaultDeliveryDays = acceptedProposal?.delivery_days || 30;
  const deliveryDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + defaultDeliveryDays);
    return d.toISOString().split("T")[0];
  })();

  const [form, setForm] = useState({
    contract_type: acceptedProposal ? "service_agreement" : "project_start",
    total_amount: defaultAmount,
    start_date: project?.start_date || today,
    delivery_date: project?.deadline || deliveryDate,
    payment_terms: "30% دفعة مقدمة، 40% عند التصاميم الأولية، 30% عند التسليم النهائي",
    additional_terms: "",
  });
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);

  const engineerName = engineer?.full_name || "المهندس المسؤول";
  const engineerEmail = engineer?.email || project?.assigned_engineer_id || "—";
  const engineerPhone = engineer?.phone || "—";
  const engineerSpecialization = engineer?.specialization || "—";
  const engineerLicense = engineer?.registration_number || engineer?.civil_engineering_license || "—";

  const clientName = client?.full_name || project?.created_by || "العميل";
  const clientEmail = client?.email || project?.created_by || "—";
  const clientPhone = client?.phone || "—";

  const contractNumber = `BYT-${Date.now().toString().slice(-8)}`;
  const handleField = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleCreate = async () => {
    setCreating(true);
    try {
      const contract = await base44.entities.Contract.create({
        project_id: project.id,
        client_id: client?.id || project?.client_id || "",
        provider_type: engineer ? "engineer" : "engineer",
        engineer_id: engineer?.id || project?.assigned_engineer_id || "",
        contract_number: contractNumber,
        contract_type: form.contract_type,
        service_description: buildContractText(),
        total_amount: Number(form.total_amount),
        payment_terms: form.payment_terms,
        delivery_date: form.delivery_date,
        start_date: form.start_date,
        additional_terms: form.additional_terms,
        status: "pending_signature",
        client_signature: false,
        engineer_signature: false,
        contract_version: 1,
        description: `عقد رقمي ${contractNumber} بين ${clientName} (العميل) و${engineerName} (المهندس) للمشروع "${project?.title}". القيمة: ${Number(form.total_amount).toLocaleString()} ر.س.`,
      });

      await logWorkspaceActivity({
        projectId: project.id,
        user: currentUser,
        activityType: "contract_created",
        summary: `تم إنشاء عقد جديد رقم ${contractNumber} للمشروع`,
        entityType: "contract",
        entityId: contract.id,
        entityTitle: `عقد #${contractNumber}`,
      });

      setCreating(false);
      setDone(true);
      setTimeout(() => onCreated?.(contract), 1600);
    } catch (err) {
      console.error("Contract creation failed:", err);
      setCreating(false);
    }
  };

  const buildContractText = () => `
عقد عمل رقمي لتقديم خدمات هندسية وتصميمية

رقم العقد: ${contractNumber}
تاريخ الإنشاء: ${today}

══════════════════════════════════════════════════════════════

إنه في يوم ${today}، تم الاتفاق بين الطرفين المذكورين أدناه:

الطرف الأول (العميل):
  الاسم: ${clientName}
  البريد الإلكتروني: ${clientEmail}
  الهاتف: ${clientPhone}

الطرف الثاني (المهندس/الجهة المنفذة):
  الاسم: ${engineerName}
  التخصص: ${engineerSpecialization}
  رقم الترخيص/القيد: ${engineerLicense}
  البريد الإلكتروني: ${engineerEmail}
  الهاتف: ${engineerPhone}

══════════════════════════════════════════════════════════════

المادة (1) — موضوع العقد:
  يقدم الطرف الثاني خدمات هندسية وتصميمية للطرف الأول المتعلقة بالمشروع التالي:
  عنوان المشروع: ${project?.title || "—"}
  وصف المشروع: ${project?.description || "—"}
  نوع المشروع: ${project?.category || "—"}
  موقع المشروع: ${project?.location || "—"}

══════════════════════════════════════════════════════════════

المادة (2) — القيمة الإجمالية وشروط الدفع:
  القيمة الإجمالية للعقد: ${Number(form.total_amount).toLocaleString()} ريال سعودي
  شروط الدفع: ${form.payment_terms}
  ${form.additional_terms ? "\n  بنود إضافية: " + form.additional_terms : ""}

══════════════════════════════════════════════════════════════

المادة (3) — المدة الزمنية والتسليم:
  تاريخ البدء: ${form.start_date}
  تاريخ التسليم: ${form.delivery_date}
  يلتزم الطرف الثاني بتسليم كافة المخرجات في الموعد المحدد.

══════════════════════════════════════════════════════════════

المادة (4) — حقوق الملكية الفكرية:
  تنتقل جميع حقوق الملكية الفكرية للتصاميم والمخرجات النهائية
  إلى الطرف الأول بعد استكمال الدفعات المستحقة بالكامل.

══════════════════════════════════════════════════════════════

المادة (5) — التعديلات والمراجعات:
  يحق للطرف الأول طلب تعديلات ضمن الحد المسموح به (${project?.max_revisions || 3} مرات).

══════════════════════════════════════════════════════════════

المادة (6) — حل النزاعات:
  في حال نشوء أي نزاع، يتم حله عبر منصة بيتلي كوسيط أول،
  ثم يُحال إلى التحكيم وفقاً للأنظمة السعودية.

══════════════════════════════════════════════════════════════

المادة (7) — السريّة وأحكام عامة:
  يلتزم الطرفان بالسرية. هذا العقد ساري من تاريخ توقيع الطرفين.
  يخوض للأنظمة المعمول بها في المملكة العربية السعودية.

══════════════════════════════════════════════════════════════

تم إنشاء هذا العقد إلكترونياً عبر منصة بيتلي | www.mybytly.com
  `.trim();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
      dir="rtl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Branded Header ─────────────────────────────────────── */}
        <div className="bg-gradient-to-l from-[#4A3F35] via-[#6B5D4F] to-[#C9A66B] px-5 sm:px-7 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base sm:text-lg">إنشاء عقد رسمي</h2>
              <p className="text-white/70 text-xs">قالب عقد بيتلي — ملزم قانونياً</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable Content ─────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-6">
          {done ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <p className="font-bold text-[#4A3F35] text-lg">تم إنشاء العقد بنجاح</p>
              <p className="text-slate-500 text-sm mt-1">رقم العقد: {contractNumber}</p>
            </div>
          ) : (
            <>
              {/* ── Contract Preview (Bytly branded) ─────────────── */}
              <div className="rounded-xl border border-[#C9A66B]/30 overflow-hidden">
                {/* Letterhead */}
                <div className="bg-[#F5F0E8] px-5 py-4 flex items-center justify-between border-b border-[#C9A66B]/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-[#4A3F35] text-sm">بيتلي</p>
                      <p className="text-[10px] text-[#6B5D4F]/60">منصة الهندسة والتصميم</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-[#6B5D4F]/60">رقم العقد</p>
                    <p className="font-mono text-xs font-semibold text-[#4A3F35]">{contractNumber}</p>
                  </div>
                </div>

                {/* Title */}
                <div className="px-5 py-3 text-center border-b border-[#C9A66B]/15">
                  <h3 className="font-bold text-[#4A3F35] text-sm">عقد عمل رقمي لتقديم خدمات هندسية</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">تاريخ الإنشاء: {today}</p>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-3 text-xs text-slate-700 leading-relaxed">
                  {/* Parties */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="font-semibold text-[#6B5D4F] mb-1.5 flex items-center gap-1">
                        <User className="w-3 h-3" /> الطرف الأول — العميل
                      </p>
                      <p className="text-slate-600">{clientName}</p>
                      <p className="text-slate-400 text-[10px]">{clientEmail}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="font-semibold text-[#6B5D4F] mb-1.5 flex items-center gap-1">
                        <User className="w-3 h-3" /> الطرف الثاني — المهندس
                      </p>
                      <p className="text-slate-600">{engineerName}</p>
                      <p className="text-slate-400 text-[10px]">{engineerSpecialization}</p>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <p className="font-semibold text-[#4A3F35]">المادة (1) — موضوع العقد</p>
                    <p className="text-slate-600 mt-0.5">{project?.title}</p>
                  </div>

                  {/* Value */}
                  <div>
                    <p className="font-semibold text-[#4A3F35]">المادة (2) — القيمة وشروط الدفع</p>
                    <p className="text-slate-600 mt-0.5">
                      {Number(form.total_amount).toLocaleString()} ر.س — {form.payment_terms}
                    </p>
                  </div>

                  {/* Duration */}
                  <div>
                    <p className="font-semibold text-[#4A3F35]">المادة (3) — المدة والتسليم</p>
                    <p className="text-slate-600 mt-0.5">
                      من {form.start_date} إلى {form.delivery_date}
                    </p>
                  </div>

                  {form.additional_terms && (
                    <div>
                      <p className="font-semibold text-[#4A3F35]">بنود إضافية</p>
                      <p className="text-slate-600 mt-0.5">{form.additional_terms}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-2.5 bg-[#F5F0E8] border-t border-[#C9A66B]/20 text-center">
                  <p className="text-[10px] text-[#6B5D4F]/60">
                    منصة بيتلي | www.mybytly.com — عقد ملزم قانونياً وفق الأنظمة السعودية
                  </p>
                </div>
              </div>

              {/* ── Editable Fields ──────────────────────────────── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#4A3F35]">
                  <FileText className="w-4 h-4" />
                  <h4 className="font-semibold text-sm">تفاصيل العقد</h4>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">نوع العقد</Label>
                    <Select value={form.contract_type} onValueChange={(v) => handleField("contract_type", v)}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project_start">عقد بدء مشروع</SelectItem>
                        <SelectItem value="service_agreement">اتفاق تقديم خدمات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">القيمة الإجمالية (ر.س)</Label>
                    <div className="relative">
                      <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="number"
                        value={form.total_amount}
                        onChange={(e) => handleField("total_amount", e.target.value)}
                        className="pr-10 h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">تاريخ البدء</Label>
                    <div className="relative">
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="date"
                        value={form.start_date}
                        onChange={(e) => handleField("start_date", e.target.value)}
                        className="pr-10 h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">تاريخ التسليم</Label>
                    <div className="relative">
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="date"
                        value={form.delivery_date}
                        onChange={(e) => handleField("delivery_date", e.target.value)}
                        className="pr-10 h-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">شروط الدفع</Label>
                  <Textarea
                    value={form.payment_terms}
                    onChange={(e) => handleField("payment_terms", e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">بنود إضافية (اختياري)</Label>
                  <Textarea
                    value={form.additional_terms}
                    onChange={(e) => handleField("additional_terms", e.target.value)}
                    placeholder="أي شروط أو بنود إضافية..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div className="flex items-start gap-2 bg-[#F5F0E8] rounded-lg p-3">
                  <Shield className="w-4 h-4 text-[#C9A66B] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#6B5D4F] leading-relaxed">
                    سيتم إنشاء عقد قانوني ملزم بين الطرفين وفق الأنظمة السعودية. بعد الإنشاء سيُرسل العرض للتوقيع الإلكتروني من كلا الطرفين.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer Actions ──────────────────────────────────────── */}
        {!done && (
          <div className="border-t border-slate-100 px-5 sm:px-7 py-4 flex gap-3 shrink-0">
            <Button variant="outline" className="flex-1 h-10" onClick={onClose}>إلغاء</Button>
            <Button
              className="flex-1 h-10 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"
              disabled={creating || !form.total_amount}
              onClick={handleCreate}
            >
              {creating ? (
                <><Loader2 className="w-4 h-4 animate-spin ml-1.5" />جاري الإنشاء...</>
              ) : (
                <><CheckCircle className="w-4 h-4 ml-1.5" />إنشاء العقد</>
              )}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}