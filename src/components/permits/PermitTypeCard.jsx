import React from "react";
import { Check } from "lucide-react";

/**
 * بطاقة اختيار نوع الرخصة / نوع المبنى
 * بطاقة بيضاء مع حدود رمادية فاتحة، أيقونة + تسمية
 */
export default function PermitTypeCard({ icon, label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-3 sm:p-4 rounded-2xl border-2 text-center transition-all duration-200 group ${
        selected
          ? "border-[#C6A775] bg-[#FDF6ED] shadow-md"
          : "border-[#E5E7EB] bg-white hover:border-[#C6A775]/50 hover:shadow-sm"
      }`}
    >
      {selected && (
        <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-[#C6A775] text-white flex items-center justify-center shadow">
          <Check className="w-3 h-3" />
        </span>
      )}
      <div className="text-2xl sm:text-3xl mb-1.5 transition-transform group-hover:scale-110">
        {icon}
      </div>
      <p
        className={`text-xs sm:text-sm font-semibold ${
          selected ? "text-[#1A1D2B]" : "text-[#4B5563]"
        }`}
      >
        {label}
      </p>
    </button>
  );
}