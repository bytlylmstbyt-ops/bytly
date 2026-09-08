import { supabase } from "@/lib/supabaseClient";

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(label || "انتهت مهلة العملية. تحقق من الاتصال وحاول مرة أخرى.")), ms))
  ]);

function getRegistrationDraft() {
  try {
    const raw = sessionStorage.getItem("bytly_registration_draft");
    const draft = raw ? JSON.parse(raw) : null;
    return draft?.email && draft?.password ? draft : null;
  } catch {
    return null;
  }
}

export async function saveRegistration({ table, row, role, fullName, email, phone, userIdField = "user_id" }) {
  let user = null;
  const draft = getRegistrationDraft();

  // First reuse a session if one already exists.
  const current = await withTimeout(supabase.auth.getUser(), 12000, "تعذر التحقق من جلسة التسجيل.");
  if (current.error) throw current.error;
  user = current.data?.user || null;

  // A previous final attempt may have created Auth successfully but failed while
  // saving the role record. Reuse that account instead of creating another one.
  if (!user && draft) {
    const login = await withTimeout(
      supabase.auth.signInWithPassword({ email: draft.email, password: draft.password }),
      15000,
      "تعذر الاتصال بخدمة التسجيل."
    );
    if (!login.error) user = login.data?.user || null;
  }

  // Create Auth only when the user presses the final "إتمام التسجيل" button.
  if (!user) {
    if (!draft) throw new Error("بيانات التسجيل غير مكتملة. ابدأ التسجيل من البداية.");
    const signup = await withTimeout(
      supabase.auth.signUp({
        email: draft.email.trim().toLowerCase(),
        password: draft.password,
        options: {
          data: {
            full_name: draft.full_name || fullName || "",
            name: draft.full_name || fullName || "",
            role: draft.role || role,
            registration_role: draft.role || role
          }
        }
      }),
      20000,
      "استغرق إنشاء الحساب وقتًا طويلًا. حاول مرة أخرى."
    );
    if (signup.error) throw signup.error;
    user = signup.data?.user || null;
    if (!user) throw new Error("تعذر إنشاء حساب المستخدم.");

    // Make the newly created session available before writing protected tables.
    if (!signup.data?.session) {
      const login = await withTimeout(
        supabase.auth.signInWithPassword({ email: draft.email, password: draft.password }),
        15000,
        "تم إنشاء الحساب لكن تعذر بدء الجلسة."
      );
      if (login.error || !login.data?.user) {
        throw new Error("تم إنشاء الحساب، لكن يلزم تأكيد البريد الإلكتروني قبل إتمام التسجيل.");
      }
      user = login.data.user;
    }
  }

  const profilePayload = {
    user_id: user.id,
    full_name: fullName || user.user_metadata?.full_name || "",
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

  // If the user retried after a network failure, update their own role row.
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
  return saved.data;
}
