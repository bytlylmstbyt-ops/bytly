import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, Landmark, RotateCcw, ShieldCheck, CheckCircle2, Clock,
} from "lucide-react";

const STAGES = [
  {
    id: 1,
    title: "المرحلة الأولى: مخططات المعمارية الأولية مساقط وتوزيع فراغات",
    amount: 10000,
    deliverable: "مخططات المساقط الأفقية للمبنى وتوزيع الفراغات (Architectural Layout) بصيغة PDF و DWG.",
  },
  {
    id: 2,
    title: "المرحلة الثانية: المخططات الإنشائية والتفصيلية واعتماد رخصة البناء",
    amount: 15000,
    deliverable: "المخططات الإنشائية، تفاصيل التسليح، وحساب الأحمال المعتمدة لرخصة البناء.",
  },
  {
    id: 3,
    title: "المرحلة الثالثة: التصميم الداخلي ثلاثي الأبعاد 3D Renders ومخططات التنفيذ",
    amount: 12000,
    deliverable: "مجسمات ثلاثية الأبعاد للفراغات الداخلية ومخططات تنفيذية تفصيلية (Shop Drawings).",
  },
  {
    id: 4,
    title: "المرحلة الرابعة: جداول الكميات والمواصفات والمخططات النهائية للمقاول",
    amount: 8000,
    deliverable: "جداول كميات (BOQ)، مواصفات المواد، والمخططات النهائية المطبقة للمقاول.",
  },
];

const STEPS = ["إيداع المالك", "مخرجات المصمم", "تدقيق استشاري", "تحرير الدفعة"];
const COMMISSION_RATE = 0.15; // 15% عمولة المنصة

const stageStatusMap = {
  pending: { label: "انتظار الإيداع", className: "bg-[#F5F5F5] text-[#888]" },
  deposited: { label: "في الضمان", className: "bg-[#C9A66B]/15 text-[#C9A66B]" },
  in_review: { label: "قيد التدقيق", className: "bg-blue-50 text-blue-600" },
  completed: { label: "مكتملة", className: "bg-green-50 text-green-600" },
};

export default function ProjectStagesSimulator() {
  const [activeStage, setActiveStage] = useState(1);
  const [stageStatuses, setStageStatuses] = useState({
    1: "pending", 2: "pending", 3: "pending", 4: "pending",
  });

  const current = STAGES.find((s) => s.id === activeStage);
  const status = stageStatuses[activeStage];
  const currentStep = status === "pending" ? 0 :
    status === "deposited" ? 1 :
    status === "in_review" ? 2 :
    status === "completed" ? 4 : 0;

  const ACTION_LABELS = {
    pending: "إيداع",
    deposited: "تأكيد المخرجات",
    in_review: "اعتماد التدقيق",
  };

  const NEXT_STATUS = {
    pending: "deposited",
    deposited: "in_review",
    in_review: "completed",
  };

  const handleAction = () => {
    setStageStatuses((prev) => {
      const currentStatus = prev[activeStage];
      if (currentStatus === "completed") return prev;
      const next = NEXT_STATUS[currentStatus];
      const updated = { ...prev, [activeStage]: next };
      // بعد اكتمال مرحلة، انتقل تلقائياً للمرحلة التالية إن وُجدت
      if (next === "completed" && activeStage < STAGES.length) {
        setTimeout(() => setActiveStage(activeStage + 1), 600);
      }
      return updated;
    });
  };

  const handleReset = () => {
    setStageStatuses({ 1: "pending", 2: "pending", 3: "pending", 4: "pending" });
    setActiveStage(1);
  };

  const inEscrow = STAGES.reduce(
    (sum, s) => (stageStatuses[s.id] !== "pending" && stageStatuses[s.id] !== "completed" ? sum + s.amount : sum),
    0
  );
  const released = STAGES.reduce(
    (sum, s) => (stageStatuses[s.id] === "completed" ? sum + s.amount : sum),
    0
  );
  const commission = Math.round(released * COMMISSION_RATE);
  const netToEngineer = released - commission;
  const totalProject = STAGES.reduce((sum, s) => sum + s.amount, 0);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 max-w-3xl"
        >
          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            اختبر دور منصة بيتلي كـ «وسيط ضامن وحقوقي» يربط الملاك بالمهندسين المستقلين. جرب الخطوات الأربعة لإتمام أي مرحلة هندسية بنجاح وضمان حماية مبالغك.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Dark Interaction Panel */}
          <div className="bg-[#1A1A1A] rounded-2xl p-6 lg:p-8 flex flex-col">
            <p className="text-[#C9A66B] text-sm mb-2">المرحلة النشطة قيد الحوكمة والتنفيذ</p>
            <h3 className="text-white text-lg lg:text-xl font-bold mb-5 leading-relaxed">{current.title}</h3>

            {/* Deliverable Card */}
            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[#C9A66B]" strokeWidth={1.5} />
                <span className="text-white text-sm font-semibold">المخرجات التعاقدية الملزمة</span>
              </div>
              <p className="text-[#C9A66B] text-sm leading-relaxed">{current.deliverable}</p>
            </div>

            {/* Progress Steps */}
            <div className="mb-6">
              <div className="flex gap-2">
                {STEPS.map((step, i) => (
                  <div key={i} className="flex-1">
                    <div
                      className={`text-center text-xs py-2 px-1 rounded-lg border transition-colors ${
                        i < currentStep
                          ? "bg-[#C9A66B] text-[#1A1A1A] border-[#C9A66B] font-semibold"
                          : i === currentStep
                          ? "bg-[#C9A66B]/20 text-[#C9A66B] border-[#C9A66B]"
                          : "bg-white/5 text-white/30 border-white/10"
                      }`}
                    >
                      {i + 1}. {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="mt-auto">
              <p className="text-white/60 text-sm mb-3">اتخاذ الإجراء كطرف في العقد:</p>
              <button
                onClick={handleAction}
                disabled={status === "completed"}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-bold transition-all ${
                  status === "completed"
                    ? "bg-green-500/15 text-green-400 cursor-default"
                    : "bg-[#C9A66B] text-[#1A1A1A] hover:bg-[#D4B06B] active:scale-[0.98]"
                }`}
              >
                {status === "completed" ? (
                  <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} />
                ) : (
                  <Landmark className="w-5 h-5" strokeWidth={1.5} />
                )}
                {status === "pending" && `إيداع الدفعة في حساب الضمان لبيتلي (${current.amount.toLocaleString()} ر.س)`}
                {status === "deposited" && "تأكيد استلام المخرجات من المصمم"}
                {status === "in_review" && "اعتماد التدقيق الاستشاري وتحرير الدفعة"}
                {status === "completed" && "تم تحرير الدفعة للمهندس بنجاح"}
              </button>

              <div className="flex items-center gap-2 mt-4">
                <ShieldCheck className="w-4 h-4 text-[#C9A66B] shrink-0" strokeWidth={1.5} />
                <p className="text-white/50 text-xs leading-relaxed">
                  {status === "pending" && "مرحباً بك في محاكي حوكمة بيتلي، ابدأ بإيداع المرحلة في حساب الضمان."}
                  {status === "deposited" && "تم إيداع المبلغ في الضمان — انتظر تسليم المصمم للمخرجات."}
                  {status === "in_review" && "المخرجات قيد التدقيق الاستشاري قبل تحرير الدفعة للمهندس."}
                  {status === "completed" && "اكتملت المرحلة وتحررت الدفعة للمهندس. انتقل للمرحلة التالية."}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Stages List */}
          <div className="bg-white rounded-2xl p-6 lg:p-8 border border-[#EBEBEB] shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[#333]">مراحل المشروع المبرمة</h3>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-[#C9A66B] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
                إعادة البدء
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {STAGES.map((stage) => {
                const isActive = stage.id === activeStage;
                const stStatus = stageStatuses[stage.id];
                const statusInfo = stageStatusMap[stStatus];
                return (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStage(stage.id)}
                    className={`w-full text-right rounded-xl p-4 border transition-all ${
                      isActive
                        ? "border-[#C9A66B] bg-[#C9A66B]/5 shadow-sm"
                        : "border-[#EBEBEB] hover:border-[#C9A66B]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-2">
                        <span className={`text-xs font-bold mt-0.5 ${isActive ? "text-[#C9A66B]" : "text-slate-400"}`}>
                          0{stage.id}
                        </span>
                        <p className={`text-sm font-semibold leading-relaxed ${isActive ? "text-[#333]" : "text-[#555]"}`}>
                          {stage.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pr-7">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-[#C9A66B]">
                          {stage.amount.toLocaleString()} ر.س
                        </span>
                        <span className="text-[10px] text-slate-400">
                          عمولة بيتلي: {Math.round(stage.amount * COMMISSION_RATE).toLocaleString()} ر.س · صافي المهندس: {(stage.amount - Math.round(stage.amount * COMMISSION_RATE)).toLocaleString()} ر.س
                        </span>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full ${statusInfo.className} inline-flex items-center gap-1`}>
                        {stStatus === "pending" ? (
                          <Clock className="w-3 h-3" strokeWidth={1.5} />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />
                        )}
                        {statusInfo.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#EBEBEB]">
              <div className="bg-[#C9A66B]/5 rounded-xl p-4 text-center border border-[#C9A66B]/20">
                <p className="text-xs text-slate-400 mb-1">في حساب الضمان لبيتلي</p>
                <p className="text-lg font-bold text-[#C9A66B]">{inEscrow.toLocaleString()} ر.س</p>
              </div>
              <div className="bg-[#F9F9F9] rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">المستمل للمهندس (صافي)</p>
                <p className="text-lg font-bold text-[#333]">{netToEngineer.toLocaleString()} ر.س</p>
              </div>
              <div className="bg-[#4A3F35]/5 rounded-xl p-4 text-center border border-[#4A3F35]/15">
                <p className="text-xs text-slate-400 mb-1">عمولة بيتلي ({Math.round(COMMISSION_RATE * 100)}%)</p>
                <p className="text-lg font-bold text-[#4A3F35]">{commission.toLocaleString()} ر.س</p>
              </div>
              <div className="bg-[#F9F9F9] rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">إجمالي قيمة المشروع</p>
                <p className="text-lg font-bold text-[#333]">{totalProject.toLocaleString()} ر.س</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}