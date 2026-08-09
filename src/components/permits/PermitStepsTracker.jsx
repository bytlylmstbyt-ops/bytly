import React from "react";
import { Check } from "lucide-react";

/**
 * شريط التقدم العُلوي لطلب رخصة البناء
 * 5 خطوات بتدفق RTL (الخطوة 1 على اليمين)
 */
const STEPS = [
  { n: "1", t: "تقدم بطلبك", e: "املأ النموذج" },
  { n: "2", t: "رفع المخططات", e: "من مهندسك المعتمد" },
  { n: "3", t: "إرسال لبلدي", e: "تلقائي عبر API" },
  { n: "4", t: "الدفع الموحد", e: "رسوم + أتعاب + بيتلي" },
  { n: "5", t: "رخصتك الرقمية", e: "في حسابك مباشرة" },
];

export default function PermitStepsTracker({ currentStep = 0 }) {
  return (
    <div className="flex flex-row-reverse items-stretch justify-center gap-2 sm:gap-3 mb-8 overflow-x-auto pb-1">
      {STEPS.map((s, i) => {
        const isActive = i === currentStep;
        const isDone = i < currentStep;
        return (
          <React.Fragment key={i}>
            <div
              className={`flex-1 min-w-[120px] sm:min-w-[140px] bg-white rounded-xl p-3 text-center border transition-all ${
                isActive
                  ? "border-[#C9A66B] shadow-md ring-1 ring-[#C9A66B]/20"
                  : "border-[#e2e8f0] shadow-sm"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center mx-auto mb-2 transition-colors ${
                  isDone
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white"
                    : "bg-[#f3f4f6] text-[#94a3b8]"
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <p className="font-bold text-[#1a202c] text-xs sm:text-sm">{s.t}</p>
              <p className="text-[#94a3b8] text-[10px] sm:text-xs mt-0.5">{s.e}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className="hidden sm:flex items-center">
                <div
                  className={`w-6 h-0.5 ${i < currentStep ? "bg-[#C9A66B]" : "bg-[#e2e8f0]"}`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}