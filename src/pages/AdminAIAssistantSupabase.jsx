import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";
import LegacyAdminAIAssistant from "./AdminAIAssistant";

const PLATFORM_OWNER_EMAIL = "bytlylmstbyt@gmail.com";
const legacyMe = base44.auth.me.bind(base44.auth);

// Admin access bridge: resolve the current admin directly from Supabase before
// the legacy assistant page performs its own access check. No data is changed.
base44.auth.me = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return legacyMe();

    const email = (user.email || "").trim().toLowerCase();
    let profile = null;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role,email,full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      profile = data || null;
    } catch {}

    const isAdmin = email === PLATFORM_OWNER_EMAIL || profile?.role === "admin";
    return {
      id: user.id,
      user_id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "",
      role: isAdmin ? "admin" : (profile?.role || "user"),
      profile,
      _authProvider: "supabase",
    };
  } catch {
    return legacyMe();
  }
};

export default LegacyAdminAIAssistant;
