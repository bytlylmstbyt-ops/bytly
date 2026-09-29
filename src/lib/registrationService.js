import { supabase } from "@/lib/supabaseClient";
import { getAcquisitionAttribution, trackAnalyticsEvent } from "@/lib/analyticsService";

const withTimeout = (promise, ms, label) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(label || "انتهت مهلة العملية. تحقق من الاتصال وحاول مرة أخرى.")), ms))
]);

/**
 * Create a brand-new Bytly account in one submission.
 *
 * The Edge Function owns the privileged Auth + profile/role-row transaction,
 * so the browser never receives or needs the Supabase service-role key.
 */
export async function saveRegistration(payload) {
  if (!supabase) throw new Error("خدمة التسجيل غير مهيأة حالياً.");

  const email = String(payload?.email || "").trim().toLowerCase();
  const fullName = String(payload?.fullName || "").trim();
  const phone = String(payload?.phone || "").trim();
  const attribution = getAcquisitionAttribution();
  await trackAnalyticsEvent("registration_started", {
    role: payload?.role || null,
    table: payload?.table || null,
    attribution: attribution || null
  });

  if (!email || !fullName || !phone) {
    await trackAnalyticsEvent("registration_failed", {
      role: payload?.role || null, table: payload?.table || null,
      stage: "client_validation", error: "الاسم والبريد الإلكتروني ورقم الهاتف مطلوبة."
    });
    throw new Error("الاسم والبريد الإلكتروني ورقم الهاتف مطلوبة.");
  }

  const response = await withTimeout(
    supabase.functions.invoke("complete-registration", {
      body: {
        table: payload.table,
        role: payload.role,
        fullName,
        email,
        phone,
        password: payload.password,
        row: payload.row || {},
        attribution
      }
    }),
    30000,
    "انتهت مهلة إنشاء الحساب. تحقق من الاتصال وحاول مرة أخرى."
  );

  if (response.error) {
    let message = response.error.message || "تعذر إكمال التسجيل.";

    // Supabase may wrap an Edge Function's JSON error in FunctionsHttpError.
    // Prefer the server's Arabic/validation message when it is available.
    try {
      const context = response.error.context;
      if (context && typeof context.json === "function") {
        const body = await context.json();
        if (body?.error) message = body.error;
      }
    } catch {}

    await trackAnalyticsEvent("registration_failed", {
      role: payload?.role || null, table: payload?.table || null,
      stage: "complete_registration", error: message
    });
    throw new Error(message);
  }

  const data = response.data;
  if (!data?.ok) {
    const message = data?.error || "تعذر إكمال التسجيل.";
    await trackAnalyticsEvent("registration_failed", {
      role: payload?.role || null, table: payload?.table || null,
      stage: "complete_registration_response", error: message
    });
    throw new Error(message);
  }

  // The Edge Function creates and confirms the Auth user server-side.
  // Start the browser session immediately so protected routes recognize the
  // newly registered user instead of sending them back to registration.
  const signInResult = await withTimeout(
    supabase.auth.signInWithPassword({
      email,
      password: String(payload?.password || "")
    }),
    20000,
    "انتهت مهلة تسجيل الدخول بعد إنشاء الحساب."
  );

  if (signInResult.error || !signInResult.data?.session?.user) {
    const message = signInResult.error?.message || "تم إنشاء الحساب لكن تعذر بدء جلسة الدخول.";
    await trackAnalyticsEvent("registration_failed", {
      role: payload?.role || null, table: payload?.table || null,
      stage: "post_registration_login", error: message
    });
    throw new Error(message);
  }

  await trackAnalyticsEvent("registration_succeeded", {
    role: payload?.role || null, table: payload?.table || null,
    user_id: data.user_id || signInResult.data.session.user.id || null,
    record_id: data.record_id || null,
    attribution: attribution || null
  });

  return { ...data, session_started: true };
}

/**
 * Kept as a compatibility no-op for older callers.
 * New registration no longer waits for an email-confirmation session or
 * stores a pending registration in localStorage.
 */
export async function resumePendingRegistration() {
  return null;
}
