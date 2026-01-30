import React from 'react';
import { Home } from 'lucide-react';

export default function Logo({ className = "", size = "default" }) {
  const sizes = {
    small: { icon: 24, text: "text-sm" },
    default: { icon: 32, text: "text-base" },
    large: { icon: 40, text: "text-lg" }
  };
  
  const currentSize = sizes[size] || sizes.default;
  
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <Home 
        size={currentSize.icon} 
        className="text-[#6B5D4F]"
        strokeWidth={2}
      />
      <span 
        className={`font-semibold tracking-wide ${currentSize.text}`}
        style={{ 
          color: '#6B5D4F',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        bytly
      </span>
    </div>
  );
}