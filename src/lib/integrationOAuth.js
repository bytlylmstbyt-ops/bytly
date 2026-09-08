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

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/meetings.space.created",
  "https://www.googleapis.com/auth/analytics.readonly",
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

  const redirectTo = `${window.location.origin}${window.location.pathname}?integration_connected=${encodeURIComponent(type)}`;
  const options = {
    redirectTo,
    queryParams: {
      prompt: "select_account consent",
      access_type: "offline",
    },
  };

  if (provider === "google") {
    options.scopes = GOOGLE_SCOPES;
  }

  const { data, error } = await supabase.auth.linkIdentity({
    provider,
    options,
  });

  if (error) throw error;
  return data;
}

export async function getLinkedOAuthProviders() {
  if (!supabase) return [];
  const { data, error } = await supabase.auth.getUserIdentities();
  if (error) throw error;
  return data?.identities || [];
}
