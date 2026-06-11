import React, { useState } from "react";
import { Shield, Eye, Lock, AlertTriangle, Download, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DATA_SCHEMA = [
  {
    entity: "Engineer",
    entity_ar: "المهندس",
    fields: [
      { name: "full_name", ar: "الاسم الكامل", classification: "personal", sensitivity: "medium", pdpl: true, note: "بيانات شخصية — تستوجب موافقة صريحة (PDPL)" },
      { name: "email", ar: "البريد الإلكتروني", classification: "personal", sensitivity: "high", pdpl: true, note: "معرّف فريد — يُعامل كبيانات حساسة" },
      { name: "phone", ar: "رقم الهاتف", classification: "personal", sensitivity: "high", pdpl: true, note: "قناة تواصل مباشرة — تشفير عند التخزين" },
      { name: "national_id", ar: "رقم الهوية الوطنية", classification: "sensitive", sensitivity: "critical", pdpl: true, note: "بيانات حكومية — أعلى مستوى حماية مطلوب" },
      { name: "specialization", ar: "التخصص الهندسي", classification: "public", sensitivity: "low", pdpl: false, note: "معلومات مهنية عامة — يمكن عرضها للعموم" },
      { name: "rating", ar: "التقييم العام", classification: "public", sensitivity: "low", pdpl: false, note: "بيانات عامة — تُعرض في صفحة الملف الشخصي" },
      { name: "bank_account", ar: "رقم الحساب البنكي", classification: "sensitive", sensitivity: "critical", pdpl: true, note: "بيانات مالية — تشفير إلزامي + سجل وصول" },
    ]
  },
  {
    entity: "Project",
    entity_ar: "المشروع",
    fields: [
      { name: "title", ar: "عنوان المشروع", classification: "public", sensitivity: "low", pdpl: false, note: "معلومات عامة — مرئية في الكتالوج" },
      { name: "description", ar: "وصف المشروع", classification: "public", sensitivity: "low", pdpl: false, note: "محتوى تسويقي — لا قيود على الوصول" },
      { name: "budget", ar: "الميزانية", classification: "sensitive", sensitivity: "high", pdpl: false, note: "بيانات مالية تجارية — وصول محدود بالأطراف المعنية" },
      { name: "location", ar: "موقع المشروع", classification: "internal", sensitivity: "medium", pdpl: false, note: "بيانات تشغيلية — لمستخدمي المشروع فقط" },
      { name: "contract_pdf_url", ar: "ملف العقد", classification: "sensitive", sensitivity: "critical", pdpl: true, note: "وثيقة قانونية — تشفير + سجل تدقيق إلزامي" },
    ]
  },
  {
    entity: "Contract",
    entity_ar: "العقد",
    fields: [
      { name: "total_amount", ar: "المبلغ الإجمالي", classification: "sensitive", sensitivity: "high", pdpl: false, note: "بيانات مالية — وصول للأطراف الموقّعة فقط" },
      { name: "client_signature_ip", ar: "IP التوقيع", classification: "sensitive", sensitivity: "high", pdpl: true, note: "بيانات تتبع — تُستخدم للإثبات القانوني فقط" },
      { name: "client_id", ar: "معرف العميل", classification: "internal", sensitivity: "medium", pdpl: true, note: "ربط داخلي — يخضع لسياسة RLS" },
      { name: "status", ar: "حالة العقد", classification: "internal", sensitivity: "low", pdpl: false, note: "حالة سير العمل — وصول للأطراف المعنية" },
    ]
  },
  {
    entity: "Payment / Transaction",
    entity_ar: "الدفع / المعاملة المالية",
    fields: [
      { name: "stripe_payment_intent", ar: "معرف الدفع (Stripe)", classification: "sensitive", sensitivity: "critical", pdpl: false, note: "معرف مالي خارجي — لا يُعرض أبداً للمستخدم النهائي" },
      { name: "amount", ar: "المبلغ", classification: "sensitive", sensitivity: "high", pdpl: false, note: "بيانات مالية — وصول محدود" },
      { name: "payment_status", ar: "حالة الدفع", classification: "internal", sensitivity: "medium", pdpl: false, note: "حالة تشغيلية — مرئية للطرفين" },
    ]
  },
  {
    entity: "Notification",
    entity_ar: "الإشعار",
    fields: [
      { name: "recipient_email", ar: "بريد المستلم", classification: "personal", sensitivity: "high", pdpl: true, note: "بيانات شخصية — لا تُرسل لجهات خارجية" },
      { name: "message", ar: "نص الإشعار", classification: "internal", sensitivity: "low", pdpl: false, note: "محتوى تشغيلي — غير مشاركَ خارجياً" },
    ]
  },
  {
    entity: "PermitApplication",
    entity_ar: "طلب رخصة البناء",
    fields: [
      { name: "land_number", ar: "رقم القطعة", classification: "sensitive", sensitivity: "high", pdpl: false, note: "بيانات حكومية — مشاركة مع بلدي فقط" },
      { name: "ownership_deed_file", ar: "وثيقة الملكية", classification: "sensitive", sensitivity: "critical", pdpl: true, note: "وثيقة رسمية — تشفير إلزامي وسجل وصول" },
      { name: "client_name", ar: "اسم مقدم الطلب", classification: "personal", sensitivity: "medium", pdpl: true, note: "بيانات شخصية — يُشارك مع الجهة الحكومية فقط" },
    ]
  },
];

const CLASS_CONFIG = {
  public:    { label: "عامة",    labelEn: "Public",    color: "bg-green-100 text-green-800",   icon: <Eye className="w-3 h-3" />,       border: "border-green-200" },
  internal:  { label: "داخلية", labelEn: "Internal",  color: "bg-blue-100 text-blue-800",    icon: <Shield className="w-3 h-3" />,    border: "border-blue-200" },
  personal:  { label: "شخصية",  labelEn: "Personal",  color: "bg-yellow-100 text-yellow-800", icon: <AlertTriangle className="w-3 h-3" />, border: "border-yellow-200" },
  sensitive: { label: "حساسة",  labelEn: "Sensitive", color: "bg-red-100 text-red-800",      icon: <Lock className="w-3 h-3" />,      border: "border-red-200" },
};

const SENSITIVITY_CONFIG = {
  low:      { label: "منخفضة", color: "bg-green-500" },
  medium:   { label: "متوسطة", color: "bg-yellow-500" },
  high:     { label: "عالية",  color: "bg-orange-500" },
  critical: { label: "حرجة",   color: "bg-red-600" },
};

export default function DataClassification() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [filterClass, setFilterClass] = useState("all");

  const toggle = (entity) => setExpanded(prev => ({ ...prev, [entity]: !prev[entity] }));

  const filtered = DATA_SCHEMA.map(e => ({
    ...e,
    fields: e.fields.filter(f => {
      const matchSearch = search === "" ||
        f.ar.includes(search) || f.name.includes(search) || f.note.includes(search);
      const matchClass = filterClass === "all" || f.classification === filterClass;
      return matchSearch && matchClass;
    })
  })).filter(e => e.fields.length > 0);

  const totalFields = DATA_SCHEMA.reduce((a, e) => a + e.fields.length, 0);
  const pdplCount   = DATA_SCHEMA.reduce((a, e) => a + e.fields.filter(f => f.pdpl).length, 0);
  const sensitiveCount = DATA_SCHEMA.reduce((a, e) => a + e.fields.filter(f => f.classification === "sensitive").length, 0);

  const exportCSV = () => {
    const rows = [["الكيان", "الحقل", "الاسم بالعربية", "التصنيف", "مستوى الحساسية", "PDPL", "ملاحظة"]];
    DATA_SCHEMA.forEach(e => e.fields.forEach(f =>
      rows.push([e.entity_ar, f.name, f.ar, CLASS_CONFIG[f.classification].label, SENSITIVITY_CONFIG[f.sensitivity].label, f.pdpl ? "نعم" : "لا", f.note])
    ));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "bytly_data_classification.csv"; a.click();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#4A3F35]">مخطط تصنيف البيانات</h1>
            <p className="text-sm text-slate-500">Data Classification Schema — متوافق مع PDPL و NCA</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "إجمالي الحقول", value: totalFields, color: "text-slate-700", bg: "bg-slate-50" },
          { label: "خاضعة لـ PDPL", value: pdplCount, color: "text-yellow-700", bg: "bg-yellow-50" },
          { label: "بيانات حساسة", value: sensitiveCount, color: "text-red-700", bg: "bg-red-50" },
          { label: "الكيانات المُصنّفة", value: DATA_SCHEMA.length, color: "text-[#6B5D4F]", bg: "bg-amber-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center border border-slate-100`}>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(CLASS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterClass(filterClass === key ? "all" : key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${cfg.color} ${cfg.border} ${filterClass === key ? "ring-2 ring-offset-1 ring-[#C9A66B]" : "opacity-80 hover:opacity-100"}`}
          >
            {cfg.icon} {cfg.label} <span className="opacity-60">({cfg.labelEn})</span>
          </button>
        ))}
        {filterClass !== "all" && (
          <button onClick={() => setFilterClass("all")} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 underline">
            إلغاء الفلتر
          </button>
        )}
      </div>

      {/* Search + Export */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            placeholder="ابحث عن حقل أو ملاحظة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9 text-right"
          />
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2 shrink-0">
          <Download className="w-4 h-4" /> تصدير CSV
        </Button>
      </div>

      {/* Tables */}
      <div className="space-y-4">
        {filtered.map(entity => (
          <div key={entity.entity} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button
              className="w-full flex items-center justify-between px-5 py-4 bg-[#F9F6F2] hover:bg-[#F0EBE3] transition-colors"
              onClick={() => toggle(entity.entity)}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-[#4A3F35] text-base">{entity.entity_ar}</span>
                <span className="text-xs text-slate-400 font-mono">{entity.entity}</span>
                <span className="text-xs bg-[#C9A66B]/20 text-[#6B5D4F] px-2 py-0.5 rounded-full">
                  {entity.fields.length} حقل
                </span>
              </div>
              {expanded[entity.entity] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {(expanded[entity.entity] !== false && expanded[entity.entity] !== undefined ? true : expanded[entity.entity] === undefined) && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs">
                      <th className="text-right px-4 py-2 font-medium">الحقل</th>
                      <th className="text-right px-4 py-2 font-medium">التصنيف</th>
                      <th className="text-right px-4 py-2 font-medium">الحساسية</th>
                      <th className="text-right px-4 py-2 font-medium">PDPL</th>
                      <th className="text-right px-4 py-2 font-medium">ملاحظة الامتثال</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entity.fields.map(field => {
                      const cls = CLASS_CONFIG[field.classification];
                      const sens = SENSITIVITY_CONFIG[field.sensitivity];
                      return (
                        <tr key={field.name} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">{field.ar}</div>
                            <div className="text-xs text-slate-400 font-mono">{field.name}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cls.color}`}>
                              {cls.icon} {cls.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${sens.color}`} />
                              <span className="text-xs text-slate-600">{sens.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {field.pdpl
                              ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">✓ مشمول</span>
                              : <span className="text-xs text-slate-300">—</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-xs">{field.note}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 leading-relaxed">
        <strong>ملاحظة قانونية:</strong> الحقول المُحددة بـ "PDPL مشمول" تستوجب الامتثال لنظام حماية البيانات الشخصية السعودي الصادر بالمرسوم الملكي رقم م/19. 
        يجب مراجعة هذا الجدول دورياً عند إضافة كيانات أو حقول جديدة للنظام.
      </div>
    </div>
  );
}