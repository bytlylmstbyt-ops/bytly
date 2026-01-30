import React from 'react';
import { Home } from 'lucide-react';

export default function Logo({ className = "", size = "default" }) {
  const sizes = {
    small: { icon: 24, arabic: "text-lg", english: "text-xs" },
    default: { icon: 32, arabic: "text-xl", english: "text-sm" },
    large: { icon: 40, arabic: "text-2xl", english: "text-base" }
  };
  
  const currentSize = sizes[size] || sizes.default;
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Home 
        size={currentSize.icon} 
        className="text-[#6B5D4F]"
        strokeWidth={2}
      />
      <div className="flex flex-col leading-tight">
        <span 
          className={`font-bold ${currentSize.arabic}`}
          style={{ 
            color: '#6B5D4F',
            fontFamily: 'Cairo, system-ui, sans-serif'
          }}
        >
          بيتلي
        </span>
        <span 
          className={`font-medium ${currentSize.english} opacity-80`}
          style={{ 
            color: '#C9A66B',
            fontFamily: 'Cairo, system-ui, sans-serif'
          }}
        >
          لمسة بيت
        </span>
      </div>
    </div>
  );
}