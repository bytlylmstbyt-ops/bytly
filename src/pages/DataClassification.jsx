import React, { useState } from "react";
import { Shield, Eye, Lock, AlertTriangle, Search, Download, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DATA_CLASSIFICATION = [
  // ─── بيانات عامة ───────────────────────────────────────────────
  { entity: "Engineer", field: "full_name", arabicName: "اسم المهندس", category: "public", sensitivity: "عام", description: "الاسم المعروض في الملف الشخصي العام", retention: "مدة الحساب", lawBasis: "مصلحة مشروعة" },
  { entity: "Engineer", field: "specialization", arabicName: "التخصص", category: "public", sensitivity: "عام", description: "التخصص الهندسي المعروض", retention: "مدة الحساب", lawBasis: "مصلحة مشروعة" },
  { entity: "Engineer", field: "portfolio", arabicName: "معرض الأعمال", category: "public", sensitivity: "عام", description: "صور ومشاريع المهندس العامة", retention: "مدة الحساب", lawBasis: "موافقة صريحة" },
  { entity: "Project", field: "title", arabicName: "اسم المشروع", category: "public", sensitivity: "عام", description: "عنوان المشروع المعروض في السوق", retention: "5 سنوات", lawBasis: "عقد" },
  { entity: "Project", field: "category", arabicName: "فئة المشروع", category: "public", sensitivity: "عام", description: "نوع المشروع (سكني، تجاري...)", retention: "5 سنوات", lawBasis: "عقد" },
  { entity: "ReadyMadeDesign", field: "title", arabicName: "اسم التصميم", category: "public", sensitivity: "عام", description: "اسم التصميم في متجر التصاميم", retention: "مدة النشر", lawBasis: "مصلحة مشروعة" },
  { entity: "TechnicalResource", field: "title", arabicName: "المورد الفني", category: "public", sensitivity: "عام", description: "المعايير والموارد الفنية المنشورة", retention: "دائم", lawBasis: "مصلحة مشروعة" },
  { entity: "Review", field: "rating", arabicName: "التقييم", category: "public", sensitivity: "عام", description: "تقييم المهندس من العميل", retention: "مدة الحساب", lawBasis: "موافقة صريحة" },
  { entity: "ChatbotFAQ", field: "question/answer", arabicName: "أسئلة الدعم", category: "public", sensitivity: "عام", description: "أسئلة وأجوبة الدعم الفني العام", retention: "دائم", lawBasis: "مصلحة مشروعة" },
  { entity: "MarketEntity", field: "name / region", arabicName: "بيانات الكيانات السوقية", category: "public", sensitivity: "عام", description: "بيانات المطورين والمستثمرين المعتمدة", retention: "مدة العضوية", lawBasis: "موافقة صريحة" },

  // ─── بيانات شخصية ──────────────────────────────────────────────
  { entity: "User", field: "email", arabicName: "البريد الإلكتروني", category: "personal", sensitivity: "شخصي", description: "البريد الإلكتروني لتسجيل الدخول", retention: "مدة الحساب + سنة", lawBasis: "عقد" },
  { entity: "User", field: "full_name", arabicName: "الاسم الكامل", category: "personal", sensitivity: "شخصي", description: "الاسم الكامل للمستخدم", retention: "مدة الحساب", lawBasis: "عقد" },
  { entity: "Engineer", field: "phone", arabicName: "رقم الهاتف", category: "personal", sensitivity: "شخصي", description: "رقم هاتف المهندس للتواصل", retention: "مدة الحساب", lawBasis: "موافقة صريحة" },
  { entity: "Client", field: "phone", arabicName: "هاتف العميل", category: "personal", sensitivity: "شخصي", description: "رقم هاتف العميل", retention: "مدة الحساب", lawBasis: "موافقة صريحة" },
  { entity: "Lead", field: "name / phone / email", arabicName: "بيانات العملاء المحتملين", category: "personal", sensitivity: "شخصي", description: "معلومات تواصل العملاء المحتملين", retention: "سنتان", lawBasis: "موافقة صريحة" },
  { entity: "Notification", field: "recipient_email", arabicName: "بريد مستلم الإشعار", category: "personal", sensitivity: "شخصي", description: "البريد المستخدم لإرسال الإشعارات", retention: "سنة", lawBasis: "مصلحة مشروعة" },
  { entity: "ChatbotConversation", field: "user_email / messages", arabicName: "محادثات الشات", category: "personal", sensitivity: "شخصي", description: "سجل محادثات المستخدم مع البوت", retention: "سنتان", lawBasis: "موافقة صريحة" },
  { entity: "Review", field: "comment", arabicName: "تعليق التقييم", category: "personal", sensitivity: "شخصي", description: "التعليق النصي في تقييم المهندس", retention: "مدة الحساب", lawBasis: "موافقة صريحة" },
  { entity: "OnboardingFlow", field: "client_email / project_details", arabicName: "بيانات Onboarding", category: "personal", sensitivity: "شخصي", description: "تفاصيل متطلبات المشروع للعميل الجديد", retention: "سنة", lawBasis: "موافقة صريحة" },
  { entity: "QuoteRequest", field: "client_name / phone / email", arabicName: "بيانات طلب العرض", category: "personal", sensitivity: "شخصي", description: "معلومات العميل في طلب عرض السعر", retention: "3 سنوات", lawBasis: "عقد" },

  // ─── بيانات حساسة ──────────────────────────────────────────────
  { entity: "Contract", field: "total_amount / signatures", arabicName: "قيمة العقد والتوقيعات", category: "sensitive", sensitivity: "حساس", description: "المبالغ المالية والتوقيعات الرقمية", retention: "10 سنوات", lawBasis: "التزام قانوني" },
  { entity: "Transaction", field: "amount / payment_method", arabicName: "بيانات المعاملات", category: "sensitive", sensitivity: "حساس", description: "تفاصيل المدفوعات والتحويلات", retention: "10 سنوات", lawBasis: "التزام قانوني" },
  { entity: "Payment", field: "stripe_session / amount", arabicName: "بيانات Stripe", category: "sensitive", sensitivity: "حساس", description: "معرفات جلسات الدفع عبر Stripe", retention: "7 سنوات", lawBasis: "التزام قانوني" },
  { entity: "WithdrawalRequest", field: "amount / bank_info", arabicName: "طلبات السحب البنكية", category: "sensitive", sensitivity: "حساس", description: "طلبات سحب الأرباح والبيانات البنكية", retention: "10 سنوات", lawBasis: "التزام قانوني" },
  { entity: "PermitApplication", field: "land_number / ownership_deed", arabicName: "بيانات رخصة البناء", category: "sensitive", sensitivity: "حساس", description: "رقم القطعة وصك الملكية ووثائق البناء", retention: "15 سنوات", lawBasis: "التزام قانوني" },
  { entity: "Complaint", field: "complaint_details", arabicName: "تفاصيل الشكاوى", category: "sensitive", sensitivity: "حساس", description: "محتوى الشكاوى والنزاعات", retention: "7 سنوات", lawBasis: "التزام قانوني" },
  { entity: "Dispute", field: "evidence / resolution", arabicName: "بيانات النزاعات", category: "sensitive", sensitivity: "حساس", description: "الأدلة وقرارات الفصل في النزاعات", retention: "10 سنوات", lawBasis: "التزام قانوني" },
  { entity: "LegalReview", field: "case_analysis / recommendation", arabicName: "المراجعة القانونية", category: "sensitive", sensitivity: "حساس", description: "التحليلات والتوصيات القانونية", retention: "10 سنوات", lawBasis: "التزام قانوني" },
  { entity: "ProjectMilestone", field: "escrow_amount / payment_released", arabicName: "بيانات الضمان المالي", category: "sensitive", sensitivity: "حساس", description: "المبالغ المحجوزة في الضمان وتواريخ التحرير", retention: "7 سنوات", lawBasis: "عقد" },
  { entity: "Engineer", field: "national_id / balady_number", arabicName: "الهوية الوطنية ورقم بلدي", category: "sensitive", sensitivity: "حساس", description: "رقم هوية المهندس ورقم اعتماده في بلدي", retention: "مدة الاعتماد + 5 سنوات", lawBasis: "التزام قانوني" },
  { entity: "PlatformRevenue", field: "commission / revenue", arabicName: "إيرادات المنصة", category: "sensitive", sensitivity: "حساس", description: "سجلات العمولات والإيرادات الإجمالية", retention: "10 سنوات", lawBasis: "التزام قانوني" },
];

const CATEGORIES = {
  all: { label: "الكل", color: "bg-slate-100 text-slate-700", icon: null },
  public: { label: "بيانات عامة", color: "bg-green-100 text-green-700", icon: Eye },
  personal: { label: "بيانات شخصية", color: "bg-blue-100 text-blue-700", icon: Shield },
  sensitive: { label: "بيانات حساسة", color: "bg-red-100 text-red-700", icon: Lock },
};

const CategoryBadge = ({ category }) => {
  const cfg = CATEGORIES[category];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {cfg.label}
    </span>
  );
};

export default function DataClassification() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = DATA_CLASSIFICATION.filter(row => {
    const matchFilter = filter === "all" || row.category === filter;
    const matchSearch = !search ||
      row.entity.toLowerCase().includes(search.toLowerCase()) ||
      row.arabicName.includes(search) ||
      row.description.includes(search);
    return matchFilter && matchSearch;
  });

  const counts = {
    all: DATA_CLASSIFICATION.length,
    public: DATA_CLASSIFICATION.filter(r => r.category === "public").length,
    personal: DATA_CLASSIFICATION.filter(r => r.category === "personal").length,
    sensitive: DATA_CLASSIFICATION.filter(r => r.category === "sensitive").length,
  };

  const handleExport = () => {
    const headers = ["الكيان", "الحقل", "الاسم العربي", "التصنيف", "الوصف", "مدة الاحتفاظ", "الأساس القانوني"];
    const rows = DATA_CLASSIFICATION.map(r => [r.entity, r.field, r.arabicName, r.sensitivity, r.description, r.retention, r.lawBasis]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bytly_data_classification.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4" dir="rtl">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#4A3F35]">جدول تصنيف البيانات</h1>
              <p className="text-sm text-gray-500">امتثال نظام حماية البيانات الشخصية (PDPL) — المملكة العربية السعودية</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(CATEGORIES).map(([key, cfg]) => {
            const Icon = cfg.icon || Filter;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`p-4 rounded-xl border-2 text-right transition-all ${filter === key ? "border-[#C9A66B] bg-white shadow-md" : "border-transparent bg-white hover:border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl font-bold text-[#4A3F35]">{counts[key]}</span>
                  <Icon className="w-5 h-5 text-[#C9A66B]" />
                </div>
                <p className="text-xs text-gray-500">{cfg.label}</p>
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="ابحث عن كيان أو حقل..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-9 text-right"
            />
          </div>
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2 whitespace-nowrap">
            <Download className="w-4 h-4" />
            تصدير CSV
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-[#4A3F35] text-white">
                <tr>
                  <th className="px-4 py-3 font-medium">الكيان</th>
                  <th className="px-4 py-3 font-medium">الحقل / البيانات</th>
                  <th className="px-4 py-3 font-medium">الاسم العربي</th>
                  <th className="px-4 py-3 font-medium">التصنيف</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">الوصف</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">مدة الاحتفاظ</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">الأساس القانوني</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{row.entity}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[140px] truncate">{row.field}</td>
                    <td className="px-4 py-3 font-medium text-[#4A3F35]">{row.arabicName}</td>
                    <td className="px-4 py-3"><CategoryBadge category={row.category} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell max-w-[200px]">{row.description}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border">{row.retention}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        row.lawBasis === "التزام قانوني" ? "bg-purple-50 text-purple-700" :
                        row.lawBasis === "عقد" ? "bg-blue-50 text-blue-700" :
                        row.lawBasis === "موافقة صريحة" ? "bg-green-50 text-green-700" :
                        "bg-orange-50 text-orange-700"
                      }`}>{row.lawBasis}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <p>لا توجد نتائج مطابقة</p>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800" dir="rtl">
          <p className="font-semibold mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> ملاحظة قانونية</p>
          <p>هذا الجدول مُعدّ وفق متطلبات <strong>نظام حماية البيانات الشخصية السعودي (PDPL)</strong> الصادر بالمرسوم الملكي رقم م/19. يجب مراجعته دورياً مع مستشار قانوني معتمد وتحديثه عند إضافة كيانات جديدة للمنصة.</p>
        </div>
      </div>
    </div>
  );
}