import { useState, useEffect, useRef } from "react";

/**
 * usePullToRefresh - attaches touch handlers to a scrollable container ref
 * and calls `onRefresh` when the user pulls down far enough.
 *
 * Returns { isRefreshing, pullDistance, containerRef }
 */
export function usePullToRefresh({ onRefresh, threshold = 70 }) {
  const containerRef = useRef(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const pulling = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      // Only trigger when scrolled to the very top
      const scrollTop = el.scrollTop ?? window.scrollY;
      if (scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (e) => {
      if (!pulling.current || isRefreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta < 0) {
        pulling.current = false;
        setPullDistance(0);
        return;
      }
      // Apply resistance
      setPullDistance(Math.min(delta * 0.5, threshold * 1.5));
      if (delta > 10) {
        // Prevent native scroll bounce while pulling
        e.preventDefault();
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        setPullDistance(0);
        await onRefresh();
        setIsRefreshing(false);
      } else {
        setPullDistance(0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [isRefreshing, pullDistance, threshold, onRefresh]);

  return { isRefreshing, pullDistance, containerRef };
}