import { useEffect } from "react";

// Persist admin page filter/search state in sessionStorage keyed by page,
// so navigating away and pressing back (history back) restores the exact view.
const PREFIX = "bytly:admin:filters:";

export function readAdminFilters(key) {
  try { return JSON.parse(sessionStorage.getItem(PREFIX + key) || "{}"); } catch { return {}; }
}

export function writeAdminFilters(key, obj) {
  try { sessionStorage.setItem(PREFIX + key, JSON.stringify(obj)); } catch {}
}

/**
 * Save window scroll position when the page unmounts (SPA route change),
 * and restore it after `loading` turns false on the next mount.
 */
export function useAdminScrollRestore(key, loading) {
  const scrollKey = PREFIX + key + ":scroll";
  useEffect(() => {
    return () => {
      try { sessionStorage.setItem(scrollKey, String(window.scrollY)); } catch {}
    };
  }, [scrollKey]);
  useEffect(() => {
    if (loading) return;
    try {
      const y = Number(sessionStorage.getItem(scrollKey) || "0");
      if (y > 0) requestAnimationFrame(() => window.scrollTo(0, y));
    } catch {}
  }, [loading, scrollKey]);
}