import { supabase } from "@/lib/supabaseClient";

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(label || "انتهت مهلة العملية. تحقق من الاتصال وحاول مرة أخرى.")), ms))
  ]);

export async function saveRegistration({ table, row, role, fullName, email, phone, userIdField = "user_id" }) {
  if (!supabase) throw new Error("خدمة التسجيل غير مهيأة حالياً.");

  // Authentication is created exactly once by RegisterAccount. This service only
  // saves the authenticated user's profile and role-specific record.
  const current = await withTimeout(
    supabase.auth.getUser(),
    12000,
    "تعذر التحقق من جلسة التسجيل."
  );
  if (current.error) throw current.error;

  const user = current.data?.user || null;
  if (!user) {
    throw new Error("انتهت جلسة التسجيل. ابدأ من صفحة إنشاء الحساب مرة أخرى.");
  }

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

  // Retrying the final step must update the user's own pending record instead of
  // creating duplicates. RLS remains the source of truth for ownership.
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
