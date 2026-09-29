import { supabase } from "@/lib/supabaseClient";

const visitorKey = "bytly_analytics_visitor_id";
const sessionKey = "bytly_analytics_session";

export function getVisitorId() {
  try {
    let id = localStorage.getItem(visitorKey);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(visitorKey, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function getAnalyticsSessionId() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(sessionKey) || "null");
    return saved?.id || null;
  } catch {
    return null;
  }
}

export function getAcquisitionAttribution() {
  try {
    const raw = localStorage.getItem("bytly_acquisition_attribution");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function trackAnalyticsEvent(eventName, metadata = {}) {
  if (!supabase || !eventName) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("analytics_events").insert({
      session_id: getAnalyticsSessionId(),
      user_id: user?.id || null,
      visitor_id: getVisitorId(),
      event_name: eventName,
      page_path: window.location.pathname + window.location.search,
      metadata: metadata && typeof metadata === "object" ? metadata : {},
      occurred_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn("[Bytly analytics] event failed:", error?.message || error);
  }
}
