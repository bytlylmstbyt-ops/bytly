import { useState, useEffect, useRef } from "react";

/**
 * usePullToRefresh - attaches touch handlers to a scrollable container ref
 * and calls `onRefresh` when the user pulls down far enough.
 *
 * Returns { isRefreshing, pullDistance, containerRef }
 *
 * IMPORTANT: Event handlers read mutable values from refs (not closure-captured
 * state) so listeners are attached only once. Subscribing on every
 * pullDistance/isRefreshing change causes a stack overflow on mobile where
 * touchmove fires dozens of times per second.
 */
export function usePullToRefresh({ onRefresh, threshold = 70 }) {
  const containerRef = useRef(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const pulling = useRef(false);

  // Refs mirror state so event handlers always see the latest values
  // without needing to be re-subscribed.
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  // Keep refs in sync on every render (cheap — no effect needed)
  onRefreshRef.current = onRefresh;

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
      if (!pulling.current || isRefreshingRef.current) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta < 0) {
        pulling.current = false;
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }
      // Apply resistance
      const newDist = Math.min(delta * 0.5, threshold * 1.5);
      pullDistanceRef.current = newDist;
      setPullDistance(newDist);
      if (delta > 10) {
        // Prevent native scroll bounce while pulling
        e.preventDefault();
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pullDistanceRef.current >= threshold) {
        isRefreshingRef.current = true;
        pullDistanceRef.current = 0;
        setIsRefreshing(true);
        setPullDistance(0);
        try {
          await onRefreshRef.current();
        } finally {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
        }
      } else {
        pullDistanceRef.current = 0;
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
  }, [threshold]); // listeners attach once; handlers read from refs

  return { isRefreshing, pullDistance, containerRef };
}