import React from "react";

/**
 * بطاقة اختيار نوع الرخصة / نوع المبنى
 * مستوحاة من تصميم الصورة المرجعية — أيقونة + تسمية في بطاقة
 */
export default function PermitTypeCard({ icon, label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-3 sm:p-4 rounded-2xl border-2 text-center transition-all duration-200 group ${
        selected
          ? "border-[#C9A66B] bg-gradient-to-br from-[#FEF9EE] to-[#FFFDF7] shadow-md ring-1 ring-[#C9A66B]/20"
          : "border-[#e2e8f0] bg-white hover:border-[#C9A66B]/40 hover:shadow-sm"
      }`}
    >
      {selected && (
        <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#C9A66B] text-white flex items-center justify-center text-[10px] font-bold">
          ✓
        </span>
      )}
      <div className="text-2xl sm:text-3xl mb-1.5 transition-transform group-hover:scale-110">
        {icon}
      </div>
      <p
        className={`text-xs sm:text-sm font-semibold ${
          selected ? "text-[#1a202c]" : "text-[#475569]"
        }`}
      >
        {label}
      </p>
    </button>
  );
}