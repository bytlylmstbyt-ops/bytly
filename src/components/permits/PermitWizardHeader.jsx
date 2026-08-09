import React from "react";
import { Check } from "lucide-react";

/**
 * رأس معالج الخطوات الفرعية داخل بطاقة الطلب
 * شريط داكن مع الخطوة النشطة بالذهبي
 */
const SUB_STEPS = ["نوع الرخصة", "بيانات الأرض", "المستندات", "الفاتورة والدفع"];

export default function PermitWizardHeader({ currentStep }) {
  return (
    <div className="bg-[#1a202c] px-4 py-3.5 sm:px-6 sm:py-4">
      <div className="flex items-center justify-between gap-1">
        {SUB_STEPS.map((s, i) => {
          const isActive = i === currentStep;
          const isDone = i < currentStep;
          return (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-gradient-to-br from-[#C9A66B] to-[#b79357] text-white shadow-md"
                      : isDone
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium hidden sm:block transition-colors ${
                    isActive ? "text-[#C9A66B]" : isDone ? "text-green-400" : "text-white/40"
                  }`}
                >
                  {s}
                </span>
              </div>
              {i < SUB_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 rounded-full mx-1 ${
                    i < currentStep ? "bg-green-500/40" : "bg-white/10"
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