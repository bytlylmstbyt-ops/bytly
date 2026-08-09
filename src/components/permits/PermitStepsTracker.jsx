import React from "react";
import { Check } from "lucide-react";

/**
 * شريط التقدم العُلوي لطلب رخصة البناء
 * 5 دوائر متصلة بخط أفقي، بتدفق RTL (الخطوة 1 على اليمين)
 */
const STEPS = [
  { n: "1", t: "تقدم بطلبك", e: "املأ النموذج" },
  { n: "2", t: "رفع المخططات", e: "من مهندسك المعتمد" },
  { n: "3", t: "إرسال لبلدي", e: "تلقائي عبر API" },
  { n: "4", t: "الدفع الموحد", e: "رسوم + أتعاب + بيتلي" },
  { n: "5", t: "الرخصة الرقمية", e: "تصلك مباشرة" },
];

export default function PermitStepsTracker({ currentStep = 0 }) {
  return (
    <div className="flex flex-row-reverse items-start justify-between gap-1 sm:gap-2 mb-8 px-2">
      {STEPS.map((s, i) => {
        const isActive = i === currentStep;
        const isDone = i < currentStep;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center text-center shrink-0" style={{ flex: "1 1 0", minWidth: 64 }}>
              <div
                className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-base font-bold transition-all ${
                  isDone
                    ? "bg-[#C6A775] text-white"
                    : isActive
                    ? "bg-[#FDF6ED] text-[#C6A775] border-2 border-[#C6A775] shadow-md"
                    : "bg-white text-[#9CA3AF] border-2 border-[#E5E7EB]"
                }`}
              >
                {isDone ? <Check className="w-5 h-5" /> : s.n}
              </div>
              <p className={`mt-2 text-[11px] sm:text-sm font-bold leading-tight ${isActive || isDone ? "text-[#1A1D2B]" : "text-[#9CA3AF]"}`}>
                {s.t}
              </p>
              <p className="text-[9px] sm:text-xs text-[#9CA3AF] mt-0.5 leading-tight hidden sm:block">{s.e}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex items-center justify-center pt-5 sm:pt-6" style={{ flex: "0 0 auto" }}>
                <div
                  className={`w-full h-0.5 rounded-full transition-colors min-w-[8px] sm:min-w-[24px] ${
                    i < currentStep ? "bg-[#C6A775]" : "bg-[#E5E7EB]"
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}