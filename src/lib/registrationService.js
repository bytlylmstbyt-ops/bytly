import { supabase } from "@/lib/supabaseClient";

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(label || "انتهت مهلة العملية. تحقق من الاتصال وحاول مرة أخرى.")), ms))
  ]);

const generateTemporaryPassword = () => {
  // The user is no longer asked for a password during registration.
  // Supabase still needs a password for a password-auth user, so create a
  // strong random temporary value that is never displayed or persisted.
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `Bytly-${Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("")}-A9!`;
};

async function ensureRegistrationUser({ fullName, email, role }) {
  const current = await withTimeout(supabase.auth.getUser(), 12000, "تعذر التحقق من جلسة التسجيل.");
  if (current.error) throw current.error;
  if (current.data?.user) return current.data.user;

  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail) throw new Error("البريد الإلكتروني مطلوب.");

  const password = generateTemporaryPassword();
  const { data, error } = await withTimeout(
    supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: String(fullName || "").trim(),
          name: String(fullName || "").trim(),
          role,
          account_type: role
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    }),
    12000,
    "REGISTRATION_TIMEOUT"
  );

  if (error) throw error;
  if (!data?.user) throw new Error("تعذر إنشاء حساب المستخدم.");

  // If email confirmation is disabled, Supabase gives us a session and the
  // role-specific record can be saved immediately. If confirmation is enabled,
  // the callback will complete the pending registration after verification.
  if (data.session?.user) return data.session.user;

  try {
    localStorage.setItem("bytly_registration_pending", JSON.stringify({ role, next_path: window.location.pathname }));
  } catch {}
  throw new Error("EMAIL_CONFIRMATION_REQUIRED");
}

export async function saveRegistration({ table, row, role, fullName, email, phone, userIdField = "user_id" }) {
  if (!supabase) throw new Error("خدمة التسجيل غير مهيأة حالياً.");

  const user = await ensureRegistrationUser({ fullName, email, role });

  const metadataRole = user.user_metadata?.role || user.user_metadata?.account_type;
  if (metadataRole && role && metadataRole !== role) {
    throw new Error("نوع الحساب لا يطابق مسار التسجيل الحالي. ابدأ التسجيل من جديد.");
  }

  const profilePayload = {
    user_id: user.id,
    full_name: fullName || user.user_metadata?.full_name || user.user_metadata?.name || "",
    email: user.email || email || "",
    phone: phone || "",
    role
  };

  const profile = await withTimeout(
    supabase.from("profiles").upsert(profilePayload, { onConflict: "user_id" }),
    15000,
    "تعذر حفظ بيانات الحساب."
  );
  if (profile.error) throw profile.error;

  const rolePayload = {
    ...row,
    [userIdField]: user.id,
    email: user.email || email || row.email
  };

  const existing = await withTimeout(
    supabase.from(table).select("id").eq(userIdField, user.id).limit(1),
    12000,
    "تعذر التحقق من بيانات التسجيل."
  );
  if (existing.error) throw existing.error;

  let saved;
  if (existing.data?.[0]?.id) {
    saved = await withTimeout(
      supabase.from(table).update(rolePayload).eq("id", existing.data[0].id).select("*").single(),
      15000,
      "تعذر تحديث بيانات التسجيل."
    );
  } else {
    saved = await withTimeout(
      supabase.from(table).insert(rolePayload).select("*").single(),
      15000,
      "تعذر حفظ بيانات التسجيل."
    );
  }
  if (saved.error) throw saved.error;

  try { sessionStorage.removeItem("bytly_registration_draft"); } catch {}
  try { localStorage.removeItem("bytly_registration_pending"); } catch {}
  return saved.data;
}
