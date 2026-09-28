import { supabase } from "@/lib/supabaseClient";

const withTimeout = (promise, ms, label) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(label || "انتهت مهلة العملية. تحقق من الاتصال وحاول مرة أخرى.")), ms))
]);

async function notifyEmailAgent(data, payload) {
  try {
    const user = {
      id: data?.user?.id || data?.user_id || data?.id || data?.profile?.user_id || data?.profile?.id || payload?.id || payload?.userId || payload?.email,
      fullName: payload?.fullName,
      email: payload?.email,
      phone: payload?.phone,
      role: payload?.role || payload?.table,
    };

    const response = await fetch("/api/email-agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bytly-email-agent-secret": import.meta.env.VITE_BYTLY_EMAIL_AGENT_SECRET || "",
      },
      body: JSON.stringify({ action: "new_user", user }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      console.warn("Bytly email agent notification failed:", body?.error || response.statusText);
    }
  } catch (error) {
    // Email delivery must never turn a successful account creation into a failed registration.
    console.warn("Bytly email agent notification skipped:", error?.message || error);
  }
}

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

  if (!email || !fullName || !phone) {
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
        row: payload.row || {}
      }
    }),
    30000,
    "انتهت مهلة إنشاء الحساب. تحقق من الاتصال وحاول مرة أخرى."
  );

  if (response.error) {
    let message = response.error.message || "تعذر إكمال التسجيل.";

    try {
      const context = response.error.context;
      if (context && typeof context.json === "function") {
        const body = await context.json();
        if (body?.error) message = body.error;
      }
    } catch {}

    throw new Error(message);
  }

  const data = response.data;
  if (!data?.ok) {
    throw new Error(data?.error || "تعذر إكمال التسجيل.");
  }

  await notifyEmailAgent(data, payload);
  return data;
}

/**
 * Kept as a compatibility no-op for older callers.
 * New registration no longer waits for an email-confirmation session or
 * stores a pending registration in localStorage.
 */
export async function resumePendingRegistration() {
  return null;
}
