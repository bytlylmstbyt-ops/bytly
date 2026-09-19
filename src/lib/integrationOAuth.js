import { supabase } from "@/lib/supabaseClient";

const PROVIDERS = {
  googlecalendar: "google",
  gmail: "google",
  googledrive: "google",
  googlesheets: "google",
  googlemeet: "google",
  google_analytics: "google",
  github: "github",
  linkedin: "linkedin_oidc",
  notion: "notion",
  slack: "slack_oidc",
  discord: "discord",
};

const GOOGLE_SCOPES_BY_TYPE = {
  // Gmail only asks for the Gmail permissions it actually uses.
  // Do not request Calendar/Drive/Sheets/Meet/Analytics permissions while connecting Gmail.
  gmail: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.settings.basic",
  ].join(" "),
};

export function getOAuthProvider(type) {
  return PROVIDERS[type] || null;
}

export function isDirectOAuthSupported(type) {
  return Boolean(getOAuthProvider(type));
}

export async function startIntegrationOAuth(type) {
  if (!supabase) throw new Error("Supabase غير مهيأ.");

  const provider = getOAuthProvider(type);
  if (!provider) {
    throw new Error("هذا التكامل لا يملك OAuth مباشرًا مهيأً في Bytly حتى الآن.");
  }

  // Keep the callback on the fixed production admin route so Supabase redirect allow-list can match it exactly.
  const redirectTo = `${window.location.origin}/auth/callback?integration=${encodeURIComponent(type)}`;
  try {
    window.sessionStorage.setItem("bytly_pending_integration", type);
  } catch (_) {
    // Session storage can be unavailable in hardened/private browser modes.
  }

  const options = {
    redirectTo,
    queryParams: {
      prompt: "consent",
      access_type: "offline",
    },
  };

  if (provider === "google" && GOOGLE_SCOPES_BY_TYPE[type]) {
    options.scopes = GOOGLE_SCOPES_BY_TYPE[type];
  }

  const { data, error } = await supabase.auth.linkIdentity({
    provider,
    options,
  });

  if (error) {
    const message = error.message || "تعذر بدء مصادقة مزود الخدمة.";
    if (/manual linking|identity linking|linking is disabled/i.test(message)) {
      throw new Error("ربط الحسابات OAuth غير مفعّل في Supabase. فعّل Enable Manual Linking من إعدادات Authentication ثم أعد المحاولة.");
    }
    if (/redirect|redirect_to|not allowed/i.test(message)) {
      throw new Error("عنوان الرجوع OAuth غير مسموح في Supabase. يجب السماح بـ https://mybytly.com/auth/callback في Redirect URLs.");
    }
    throw new Error(message);
  }

  return data;
}

export async function getLinkedOAuthProviders() {
  if (!supabase) return [];
  const { data, error } = await supabase.auth.getUserIdentities();
  if (error) throw error;
  return data?.identities || [];
}
