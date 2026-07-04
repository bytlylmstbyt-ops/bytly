import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette, Building2, HardHat, PenTool, Ruler, Sparkles,
  CheckCircle2, Lightbulb, FileCheck, ShieldCheck, Calculator, UserRound, ChevronLeft
} from "lucide-react";

const SPECIALTIES = [
  {
    id: "interior",
    icon: Palette,
    color: "#F4514D",
    title: "تصميم داخلي",
    count: "500+",
    description: "تصميم الفراغات الداخلية، توزيع الأثاث والإنارة، اختيار الألوان والخامات المناسبة لتحقيق بيئة سكنية جمالية وعملية متكاملة.",
    buildingCode: "اختياري / يوصى به لرفع القيمة العقارية للمنزل وتوفير الهدر قبل الشراء.",
    duration: "١٥ - ٣٠ يوم",
    price: "٤٥ - ١٢٠ ر.س / م²",
  },
  {
    id: "architecture",
    icon: Building2,
    color: "#2997D6",
    title: "تصميم معماري",
    count: "300+",
    description: "تصميم الواجهات المعمارية، توزيع الفراغات، والمخططات الأولية للمبنى بما يحقق التوازن بين الجمال والوظيفة والاستدامة وفق متطلبات البلدية.",
    buildingCode: "إلزامي / ركيزة أساسية للحصول على رخصة البناء.",
    duration: "٢٠ - ٤٥ يوم",
    price: "٣٥ - ٩٥ ر.س / م²",
  },
  {
    id: "civil",
    icon: HardHat,
    color: "#4A5568",
    title: "هندسة مدنية",
    count: "250+",
    description: "إجراء الحسابات الإنشائية الدقيقة، وتصميم القواعد، والأعمدة، والأسقف لضمان استقرار المبنى ومقاومته للزلازل والأحمال بموجب الكود السعودي.",
    buildingCode: "إلزامي / لضمان السلامة الإنشائية ومطابقة تقرير فحص التربة المعتمد.",
    duration: "١٠ - ٢٠ يوم",
    price: "٢٥ - ٦٠ ر.س / م²",
  },
  {
    id: "drafting",
    icon: PenTool,
    color: "#8A4AF3",
    title: "رسم هندسي",
    count: "200+",
    description: "تحويل الأفكار والاسكتشات الأولية إلى مخططات رقمية دقيقة ثنائية الأبعاد (2D) وثلاثية الأبعاد (3D) باستخدام أحدث برامج الرسم الهندسي.",
    buildingCode: "مطلوب لتوضيح أبعاد الكتل وحساب المسطحات بدقة للمقاول والبلدية.",
    duration: "٧ - ١٥ يوم",
    price: "١٥ - ٤٠ ر.س / م²",
  },
  {
    id: "executive",
    icon: Ruler,
    color: "#00C853",
    title: "رسم تنفيذي",
    count: "150+",
    description: "إعداد المخططات التنفيذية التفصيلية (Shop Drawings) التي توضح مسارات التمديدات، تفاصيل العزل، وتفاصيل تركيب الرخام والبورسلان لتفادي أخطاء الموقع.",
    buildingCode: "أساسي للمقاول والمهندس المشرف لمنع التضارب في مسارات التكييف والصرف والكهرباء.",
    duration: "١٠ - ١٨ يوم",
    price: "٢٠ - ٥٠ ر.س / م²",
  },
  {
    id: "decor",
    icon: Sparkles,
    color: "#FFAB00",
    title: "ديكور وإكسسوارات",
    count: "400+",
    description: "اختيار قطع الأثاث والستائر، وتصميم توزيع السجاد واللوحات الجدارية والإكسسوارات الدقيقة لتنسيق الطابع الروحي والجمالي النهائي للمنزل.",
    buildingCode: "لمسة فنية نهائية تعطي منزلك دفئاً فريداً يعكس شخصية العائلة.",
    duration: "5 - 12 يوم",
    price: "مقطوعية (حسب الفراغ)",
  },
];

const CHARTER_POINTS = [
  "أتعاب التخصص تودع بالكامل في حساب الضمان التابع لبيتلي.",
  "يتم المراجعة والتدقيق الإنشائي لكل مخرج قبل السداد.",
  "حق التعديلات مفتوح ومحفوظ بحوكمة بيتلي المهنية.",
];

const ADVISORY_TEXT =
  "للراغبين ببناء فيلا، يوصى بالجمع بين التصميم المعماري والتصميم الداخلي منذ البداية لضمان تطابق أماكن الأعمدة مع توزيع الأثاث والتكييف المخفي.";

export default function SpecialtiesSection() {
  const [selected, setSelected] = useState(0);
  const specialty = SPECIALTIES[selected];

  return (
    <section className="py-20 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
            تخصصات بيتلي الهندسية
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            دليل تفصيلي لمتطلبات المشاريع السكنية مع حماية كاملة لحقوقك
          </p>
        </motion.div>

        {/* Category Tabs */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 mb-8">
          {SPECIALTIES.map((spec, index) => {
            const isActive = index === selected;
            return (
              <button
                key={spec.id}
                onClick={() => setSelected(index)}
                className={`rounded-2xl p-4 text-center transition-all duration-200 ${
                  isActive
                    ? "bg-white border-2 shadow-lg"
                    : "bg-white border border-[#EBEBEB] hover:shadow-md opacity-70 hover:opacity-100"
                }`}
                style={isActive ? { borderColor: spec.color } : {}}
              >
                <div
                  className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2"
                  style={{ backgroundColor: spec.color }}
                >
                  <spec.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-sm text-[#333333]">{spec.title}</h3>
                <p className="text-xs text-slate-400">{spec.count} متخصص</p>
              </button>
            );
          })}
        </div>

        {/* Detail Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={specialty.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-xl border border-[#EBEBEB] overflow-hidden"
          >
            <div className="grid lg:grid-cols-[320px_1fr]">
              {/* Left: Charter Sidebar */}
              <div className="bg-[#F9F7F2] p-6 lg:p-8 border-l border-[#EBEBEB]">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <FileCheck className="w-5 h-5 text-[#C9A66B]" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-bold text-[#333333]">ميثاق أمان المعاملات</h3>
                </div>

                <ul className="space-y-3 mb-6">
                  {CHARTER_POINTS.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" strokeWidth={1.5} />
                      <span className="text-sm text-[#555555] leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="bg-white rounded-xl p-4 border border-[#F0E6D6]">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-[#C9A66B] shrink-0" strokeWidth={1.5} />
                    <span className="text-sm font-bold text-[#C9A66B]">نصيحة بيتلي الاستشارية:</span>
                  </div>
                  <p className="text-xs text-[#777777] leading-relaxed">{ADVISORY_TEXT}</p>
                </div>
              </div>

              {/* Right: Details */}
              <div className="p-6 lg:p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-1">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: specialty.color }}
                  >
                    <specialty.icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-[#333333]">{specialty.title}</h3>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#666666] bg-[#F5F5F5] px-3 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.5} />
                    حماية بيتلي
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">دليل تفصيلي لمتطلبات المشاريع السكنية</p>

                {/* Description */}
                <div className="bg-[#F9F9F9] rounded-xl p-4 mb-5">
                  <p className="text-sm text-[#555555] leading-relaxed">{specialty.description}</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <div className="bg-[#F9F9F9] rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">حالة كود البناء السعودي</p>
                    <p className="text-sm font-medium text-[#C9A66B] leading-relaxed">{specialty.buildingCode}</p>
                  </div>
                  <div className="bg-[#F9F9F9] rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">متوسط مدة الإنجاز المتوقعة</p>
                    <p className="text-sm font-bold text-[#333333]">{specialty.duration}</p>
                  </div>
                  <div className="bg-[#F9F9F9] rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">متوسط سعر السوق السعودي</p>
                    <p className="text-sm font-bold text-[#333333]">{specialty.price}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/CostEstimator"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#C9A66B] text-[#C9A66B] text-sm font-medium hover:bg-[#C9A66B]/5 transition-colors"
                  >
                    <Calculator className="w-4 h-4" strokeWidth={1.5} />
                    احسب ميزانية وهيكل ميثاق هذا التخصص
                  </Link>
                  <Link
                    to={`/Engineers?category=${encodeURIComponent(specialty.title)}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1A1A1A] text-white text-sm font-medium hover:bg-[#333333] transition-colors flex-1"
                  >
                    تصفح وتوظيف مهندس {specialty.title}
                    <UserRound className="w-4 h-4" strokeWidth={1.5} />
                    <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}