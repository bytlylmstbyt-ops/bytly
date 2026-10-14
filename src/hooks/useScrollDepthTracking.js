import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

const VISITOR_KEY = 'bytly_analytics_visitor_id';
const SESSION_KEY = 'bytly_analytics_session_id';

function makeId() {
  return globalThis.crypto?.randomUUID?.() ||
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function getTrackingIds() {
  let visitorId = localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = makeId();
    localStorage.setItem(VISITOR_KEY, visitorId);
  }
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = makeId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return { visitorId, sessionId };
}

async function recordAnalyticsEvent(eventName, pageName, properties = {}) {
  if (!supabase) return;
  try {
    const { visitorId, sessionId } = getTrackingIds();
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date().toISOString();
    const { error: sessionError } = await supabase.from('analytics_sessions').upsert({
      id: sessionId,
      visitor_id: visitorId,
      user_id: user?.id || null,
      last_seen_at: now,
      entry_page: pageName,
      exit_page: pageName,
    }, { onConflict: 'id' });
    if (sessionError) throw sessionError;

    const { error } = await supabase.from('analytics_events').insert({
      session_id: sessionId,
      user_id: user?.id || null,
      visitor_id: visitorId,
      event_name: eventName,
      page_path: window.location.pathname,
      section_name: properties.section || null,
      metadata: { page: pageName, ...properties },
      occurred_at: now,
    });
    if (error) throw error;
  } catch (error) {
    // Analytics must never interrupt the page experience.
    if (import.meta.env.DEV) console.warn('Analytics event could not be saved:', error.message);
  }
}

/**
 * Records scroll depth milestones and section visibility in Supabase.
 * Analytics failures are best-effort and never affect page functionality.
 */
export function useScrollDepthTracking(pageName = 'page') {
  const fired = useRef(new Set());

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
        [25, 50, 75, 100].forEach((milestone) => {
          const key = `depth:${milestone}`;
          if (pct >= milestone && !fired.current.has(key)) {
            fired.current.add(key);
            void recordAnalyticsEvent('scroll_depth', pageName, { depth: milestone });
          }
        });
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [pageName]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const elements = document.querySelectorAll('[data-section]');
    if (!elements.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const section = entry.target.getAttribute('data-section');
        const key = `section:${section}`;
        if (fired.current.has(key)) return;
        fired.current.add(key);
        void recordAnalyticsEvent('section_viewed', pageName, { section });
      });
    }, { threshold: 0.5 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pageName]);
}
