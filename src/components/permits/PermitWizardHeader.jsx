import React from "react";
import { Check } from "lucide-react";

/**
 * رأس معالج الخطوات الفرعية داخل بطاقة الطلب
 * شريط داكن (#1A1D2B) مع الخطوة النشطة بالذهبي (#C6A775)
 */
const SUB_STEPS = ["نوع الرخصة", "بيانات الأرض", "المستندات", "الفاتورة والدفع"];

export default function PermitWizardHeader({ currentStep }) {
  return (
    <div className="bg-[#1A1D2B] px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex items-center justify-between gap-1">
        {SUB_STEPS.map((s, i) => {
          const isActive = i === currentStep;
          const isDone = i < currentStep;
          return (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full text-sm font-bold flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-[#C6A775] text-white shadow-lg ring-2 ring-[#C6A775]/30"
                      : isDone
                      ? "bg-[#C6A775]/20 text-[#C6A775] border border-[#C6A775]/40"
                      : "bg-white/5 text-[#6B7280] border border-white/10"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                    isActive ? "text-white" : isDone ? "text-[#C6A775]" : "text-[#6B7280] hidden sm:block"
                  }`}
                >
                  {s}
                </span>
              </div>
              {i < SUB_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 rounded-full mx-1 transition-colors ${
                    i < currentStep ? "bg-[#C6A775]" : "bg-white/10"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}