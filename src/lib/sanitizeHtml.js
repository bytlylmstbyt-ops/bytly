import DOMPurify from "dompurify";

/**
 * Sanitize untrusted HTML (e.g. email bodies) before rendering via
 * dangerouslySetInnerHTML. Strips scripts, event handlers, and styles
 * to prevent stored XSS.
 */
export function sanitizeHtml(html) {
  if (!html) return "";
  return DOMPurify.sanitize(String(html), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "style"],
    FORBID_ATTR: ["style"],
    ALLOW_DATA_ATTR: false,
  });
}