import React from 'react';
import { Home } from 'lucide-react';

export default function Logo({ className = "", size = "default", isDark = false }) {
  const sizes = {
    small: { icon: 20, iconBox: "w-12 h-12", arabic: "text-lg", english: "text-xs", subtitle: "text-[10px]" },
    default: { icon: 24, iconBox: "w-14 h-14", arabic: "text-xl", english: "text-sm", subtitle: "text-xs" },
    large: { icon: 28, iconBox: "w-16 h-16", arabic: "text-2xl", english: "text-base", subtitle: "text-sm" }
  };
  
  const currentSize = sizes[size] || sizes.default;
  const brownColor = '#4A3F35';
  const boxBgColor = '#8B7355'; // لون بني فاتح مطابق للصورة
  const textColor = isDark ? '#ffffff' : brownColor;
  const borderColor = isDark ? '#C9A66B' : brownColor;
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon with brown border and bytly text below */}
      <div className="flex flex-col items-center gap-1">
        <div 
          className={`${currentSize.iconBox} flex items-center justify-center rounded-lg border-2`}
          style={{ 
            borderColor: borderColor,
            backgroundColor: brownColor
          }}
        >
          <Home 
            size={currentSize.icon} 
            style={{ color: isDark ? brownColor : '#ffffff' }}
            strokeWidth={2.5}
          />
        </div>
        <span 
          className={`font-semibold ${currentSize.subtitle}`}
          style={{ 
            color: textColor,
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
            color: textColor,
            fontFamily: 'Cairo, system-ui, sans-serif'
          }}
        >
          بيتلي
        </span>
        <span 
          className={`font-medium ${currentSize.english}`}
          style={{ 
            color: isDark ? '#C9A66B' : '#C9A66B',
            fontFamily: 'Cairo, system-ui, sans-serif',
            opacity: isDark ? 1 : 0.8
          }}
        >
          لمسة بيت
        </span>
      </div>
    </div>
  );
}