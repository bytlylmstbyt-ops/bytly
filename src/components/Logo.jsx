import React from 'react';
import { Home } from 'lucide-react';

export default function Logo({ className = "", size = "default", isDark = false }) {
  const sizes = {
    small: { icon: 18, iconBox: "w-9 h-9 md:w-12 md:h-12", arabic: "text-base md:text-lg", english: "text-[10px] md:text-xs", subtitle: "text-[9px] md:text-[10px]" },
    default: { icon: 20, iconBox: "w-10 h-10 md:w-14 md:h-14", arabic: "text-lg md:text-xl", english: "text-[11px] md:text-sm", subtitle: "text-[10px] md:text-xs" },
    large: { icon: 24, iconBox: "w-12 h-12 md:w-16 md:h-16", arabic: "text-xl md:text-2xl", english: "text-xs md:text-base", subtitle: "text-[11px] md:text-sm" }
  };
  
  const currentSize = sizes[size] || sizes.default;
  const boxBgColor = '#8B7355'; // بني متوسط للخلفية
  const mainTextColor = isDark ? '#ffffff' : '#3D3935'; // بني داكن للنص الرئيسي
  const subTextColor = isDark ? '#C9A66B' : '#9B8B7E'; // بيج/رمادي للنص الثانوي
  
  return (
    <div className={`flex items-center gap-2 md:gap-3 ${className}`}>
      {/* Icon with bytly text below */}
      <div className="flex flex-col items-center gap-0.5 md:gap-1 shrink-0">
        <div 
          className={`${currentSize.iconBox} flex items-center justify-center rounded-xl`}
          style={{ 
            background: 'linear-gradient(to top, #A89178, #6B5D4F)'
          }}
        >
          <Home 
            size={currentSize.icon} 
            style={{ color: '#ffffff' }}
            strokeWidth={2.5}
          />
        </div>
        <span 
          className={`font-semibold ${currentSize.subtitle}`}
          style={{ 
            color: mainTextColor,
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '0.5px'
          }}
        >
          bytly
        </span>
      </div>
      
      {/* Arabic text */}
      <div className="flex flex-col leading-tight">
        <span 
          className={`font-bold ${currentSize.arabic}`}
          style={{ 
            color: mainTextColor,
            fontFamily: 'Cairo, system-ui, sans-serif'
          }}
        >
          بيتلي
        </span>
        <span 
          className={`font-medium ${currentSize.english}`}
          style={{ 
            color: subTextColor,
            fontFamily: 'Cairo, system-ui, sans-serif'
          }}
        >
          لمسة بيت
        </span>
        <span 
          className={`font-normal ${currentSize.subtitle} opacity-80 hidden md:block`}
          style={{ 
            color: isDark ? '#E5D4B8' : '#C9A66B',
            fontFamily: 'Cairo, system-ui, sans-serif',
            letterSpacing: '0.3px'
          }}
        >
          للمنظومة الهندسية المتكاملة
        </span>
      </div>
    </div>
  );
}