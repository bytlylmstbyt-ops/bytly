import React from "react";
import { Loader2 } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

/**
 * Wraps page content with a pull-to-refresh gesture handler.
 * Usage: <PullToRefreshWrapper onRefresh={loadData}>{children}</PullToRefreshWrapper>
 */
export default function PullToRefreshWrapper({ onRefresh, children, className = "" }) {
  const { isRefreshing, pullDistance, containerRef } = usePullToRefresh({ onRefresh });

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none transition-all duration-150"
        style={{
          height: `${Math.max(pullDistance, isRefreshing ? 56 : 0)}px`,
          opacity: isRefreshing || pullDistance > 20 ? 1 : 0,
        }}
      >
        <div className="flex flex-col items-center gap-1">
          <Loader2
            className={`w-6 h-6 text-[#C9A66B] ${isRefreshing ? "animate-spin" : ""}`}
            style={{ transform: !isRefreshing ? `rotate(${pullDistance * 3}deg)` : undefined }}
          />
          {isRefreshing && (
            <span className="text-xs text-[#C9A66B] font-medium">جارٍ التحديث...</span>
          )}
        </div>
      </div>

      {/* Content shifts down when pulling */}
      <div
        style={{
          transform: `translateY(${isRefreshing ? 56 : pullDistance}px)`,
          transition: pullDistance === 0 ? "transform 0.25s ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}