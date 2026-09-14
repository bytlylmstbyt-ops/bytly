import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * useScrollDepthTracking — fires analytics events for:
 *  - scroll depth milestones (25 / 50 / 75 / 100 %)
 *  - section visibility (any element with `data-section="name"` becoming 50% visible)
 * Each milestone/section fires exactly once per mount.
 *
 * @param {string} pageName — logical page identifier included in event properties
 */
export function useScrollDepthTracking(pageName = 'page') {
  const fired = useRef(new Set());

  // Scroll-depth milestones — throttled via requestAnimationFrame so the
  // layout reads (scrollY / scrollHeight) happen at most once per frame,
  // preventing jank on long pages during rapid scrolling.
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const docEl = document.documentElement;
        const scrollable = docEl.scrollHeight - window.innerHeight;
        if (scrollable <= 0) return;
        const pct = Math.round((window.scrollY / scrollable) * 100);
        [25, 50, 75, 100].forEach((m) => {
          if (pct >= m && !fired.current.has(`depth:${m}`)) {
            fired.current.add(`depth:${m}`);
            try {
              base44.analytics.track({
                eventName: 'scroll_depth',
                properties: { page: pageName, depth: m },
              });
            } catch (e) { /* analytics is best-effort */ }
          }
        });
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [pageName]);

  // Section visibility via IntersectionObserver
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const els = document.querySelectorAll('[data-section]');
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const name = entry.target.getAttribute('data-section');
          const key = `section:${name}`;
          if (fired.current.has(key)) return;
          fired.current.add(key);
          try {
            base44.analytics.track({
              eventName: 'section_viewed',
              properties: { page: pageName, section: name },
            });
          } catch (e) { /* best-effort */ }
        });
      },
      { threshold: 0.5 }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pageName]);
}