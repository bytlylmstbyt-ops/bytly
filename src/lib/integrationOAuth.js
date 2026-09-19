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
  gmail: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.settings.basic",
  ].join(" "),
};

// LinkedIn OIDC provides identity information. Share on LinkedIn adds the
// member-posting permission required for publishing posts.
const LINKEDIN_OIDC_SCOPES = [
  "openid",
  "profile",
  "email",
  "w_member_social",
].join(" ");

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

  const redirectTo = `${window.location.origin}/auth/callback?integration=${encodeURIComponent(type)}`;

  try {
    window.sessionStorage.setItem("bytly_pending_integration", type);
  } catch (_) {}

  const options = {
    redirectTo,
    queryParams: {
      prompt: "consent",
      access_type: "offline",
    },
  };

  if (provider === "google" && GOOGLE_SCOPES_BY_TYPE[type]) {
    options.scopes = GOOGLE_SCOPES_BY_TYPE[type];
  } else if (provider === "linkedin_oidc") {
    options.scopes = LINKEDIN_OIDC_SCOPES;
  }

  const { data, error } = await supabase.auth.linkIdentity({
    provider,
    options,
  });

  if (error) {
    const message = error.message || "تعذر بدء مصادقة مزود الخدمة.";
    const lower = message.toLowerCase();

    if (/manual linking|identity linking|linking is disabled/.test(lower)) {
      throw new Error(
        "ربط الحسابات OAuth غير مفعّل في Supabase. فعّل Enable Manual Linking من إعدادات Authentication ثم أعد المحاولة."
      );
    }

    if (/provider.*(not enabled|disabled|not found|unsupported)|unsupported.*provider|provider.*configuration/.test(lower)) {
      if (type === "linkedin") {
        throw new Error(
          "مزود LinkedIn (OIDC) غير مفعّل أو بيانات تطبيق LinkedIn غير مكتملة في Supabase. يجب تفعيل LinkedIn (OIDC) وإدخال Client ID وClient Secret ثم حفظ الإعداد."
        );
      }
      throw new Error("مزود OAuth لهذه الخدمة غير مفعّل أو غير مكتمل في Supabase.");
    }

    if (/redirect|redirect_to|not allowed/.test(lower)) {
      throw new Error(
        "عنوان الرجوع OAuth غير مسموح في Supabase. يجب السماح بـ https://mybytly.com/auth/callback في Redirect URLs."
      );
    }

    if (/scope|invalid.*permission|unauthorized_scope/.test(lower) && type === "linkedin") {
      throw new Error(
        "LinkedIn رفض صلاحية النشر. تأكدي من إضافة منتج «Share on LinkedIn» إلى نفس تطبيق LinkedIn، ثم أعيدي المصادقة."
      );
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
