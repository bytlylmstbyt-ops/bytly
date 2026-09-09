import { supabase } from "@/lib/supabaseClient";

const withTimeout = (promise, ms, label) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(label || "انتهت مهلة العملية. تحقق من الاتصال وحاول مرة أخرى.")), ms))
]);

async function getCurrentUser() {
  const current = await withTimeout(supabase.auth.getUser(), 12000, "تعذر التحقق من جلسة التسجيل.");
  if (current.error) throw current.error;
  return current.data?.user || null;
}

function persistPendingRegistration(payload) {
  const safe = {
    table: payload.table, row: payload.row || {}, role: payload.role,
    fullName: payload.fullName || "", email: String(payload.email || "").trim().toLowerCase(),
    phone: payload.phone || "", userIdField: payload.userIdField || "user_id", created_at: Date.now()
  };
  try {
    localStorage.setItem("bytly_pending_registration", JSON.stringify(safe));
    localStorage.setItem("bytly_registration_pending", JSON.stringify({ role: safe.role }));
  } catch {}
}

async function startPasswordlessRegistration({ fullName, email, role }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail) throw new Error("البريد الإلكتروني مطلوب.");
  const { data, error } = await withTimeout(
    supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: String(fullName || "").trim(), name: String(fullName || "").trim(), role, account_type: role }
      }
    }),
    12000,
    "REGISTRATION_TIMEOUT"
  );
  if (error) throw error;
  return data;
}

async function saveAuthenticatedRegistration({ table, row, role, fullName, email, phone, userIdField }, user) {
  const metadataRole = user.user_metadata?.role || user.user_metadata?.account_type;
  // RegisterClient is shared by homeowner and investor forms; its database role
  // is still "client", while Auth metadata can correctly be "investor".
  const effectiveRole = role === "client" && metadataRole === "investor" ? "investor" : role;
  if (metadataRole && effectiveRole && metadataRole !== effectiveRole) throw new Error("نوع الحساب لا يطابق مسار التسجيل الحالي. ابدأ التسجيل من جديد.");

  const profilePayload = {
    user_id: user.id,
    full_name: fullName || user.user_metadata?.full_name || user.user_metadata?.name || "",
    email: user.email || email || "",
    phone: phone || "",
    role: effectiveRole
  };
  const profile = await withTimeout(supabase.from("profiles").upsert(profilePayload, { onConflict: "user_id" }), 15000, "تعذر حفظ بيانات الحساب.");
  if (profile.error) throw profile.error;

  const rolePayload = { ...row, [userIdField]: user.id, email: user.email || email || row.email };
  const existing = await withTimeout(supabase.from(table).select("id").eq(userIdField, user.id).limit(1), 12000, "تعذر التحقق من بيانات التسجيل.");
  if (existing.error) throw existing.error;

  let saved;
  if (existing.data?.[0]?.id) {
    saved = await withTimeout(supabase.from(table).update(rolePayload).eq("id", existing.data[0].id).select("*").single(), 15000, "تعذر تحديث بيانات التسجيل.");
  } else {
    saved = await withTimeout(supabase.from(table).insert(rolePayload).select("*").single(), 15000, "تعذر حفظ بيانات التسجيل.");
  }
  if (saved.error) throw saved.error;

  try { sessionStorage.removeItem("bytly_registration_draft"); } catch {}
  try { localStorage.removeItem("bytly_registration_pending"); } catch {}
  try { localStorage.removeItem("bytly_pending_registration"); } catch {}
  return saved.data;
}

export async function saveRegistration(payload) {
  if (!supabase) throw new Error("خدمة التسجيل غير مهيأة حالياً.");
  const user = await getCurrentUser();
  if (!user) {
    persistPendingRegistration(payload);
    await startPasswordlessRegistration(payload);
    throw new Error("EMAIL_CONFIRMATION_REQUIRED");
  }
  return saveAuthenticatedRegistration(payload, user);
}

export async function resumePendingRegistration() {
  if (!supabase) throw new Error("خدمة التسجيل غير مهيأة حالياً.");
  const user = await getCurrentUser();
  if (!user) return null;
  let pending = null;
  try { pending = JSON.parse(localStorage.getItem("bytly_pending_registration") || "null"); } catch {}
  if (!pending?.table || !pending?.role) return null;
  return saveAuthenticatedRegistration(pending, user);
}
