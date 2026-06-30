import React from 'react';
import { Home } from 'lucide-react';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function Logo({ className = "", size = "default", isDark = false }) {
  const { isRTL } = useLanguage();

  const sizes = {
    small: { icon: 18, iconBox: "w-9 h-9 md:w-12 md:h-12", main: "text-base md:text-lg", sub: "text-[10px] md:text-xs", tagline: "text-[9px] md:text-[10px]" },
    default: { icon: 20, iconBox: "w-10 h-10 md:w-14 md:h-14", main: "text-lg md:text-xl", sub: "text-[11px] md:text-sm", tagline: "text-[10px] md:text-xs" },
    large: { icon: 24, iconBox: "w-12 h-12 md:w-16 md:h-16", main: "text-xl md:text-2xl", sub: "text-xs md:text-base", tagline: "text-[11px] md:text-sm" }
  };

  const currentSize = sizes[size] || sizes.default;
  const mainTextColor = isDark ? '#ffffff' : '#3D3935';
  const subTextColor = isDark ? '#C9A66B' : '#9B8B7E';

  const brandName = isRTL ? 'بيتلي' : 'Bytly';
  const brandSub = isRTL ? 'المنظومة الهندسية المتكاملة' : 'Integrated Engineering Ecosystem';

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
          className={`font-semibold ${currentSize.tagline}`}
          style={{
            color: mainTextColor,
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '0.5px'
          }}
        >
          bytly
        </span>
      </div>

      {/* Brand text */}
      <div className="flex flex-col leading-tight">
        <span
          className={`font-bold ${currentSize.main}`}
          style={{
            color: mainTextColor,
            fontFamily: isRTL ? 'Cairo, system-ui, sans-serif' : 'system-ui, sans-serif'
          }}
        >
          {brandName}
        </span>
        <span
          className={`font-medium ${currentSize.sub}`}
          style={{
            color: subTextColor,
            fontFamily: isRTL ? 'Cairo, system-ui, sans-serif' : 'system-ui, sans-serif'
          }}
        >
          {brandSub}
        </span>
      </div>
    </div>
  );
}