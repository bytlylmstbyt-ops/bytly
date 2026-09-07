import { supabase } from "@/lib/supabaseClient";

function getRegistrationDraft() {
  try {
    const raw = sessionStorage.getItem("bytly_registration_draft");
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!draft?.email || !draft?.password) return null;
    return draft;
  } catch {
    return null;
  }
}

export async function saveRegistration({ table, row, role, fullName, email, phone, userIdField = "user_id" }) {
  let { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  let user = authData?.user;

  if (!user) {
    const draft = getRegistrationDraft();
    if (!draft) throw new Error("تعذر العثور على بيانات التسجيل. ابدئي التسجيل من البداية.");

    const { data, error } = await supabase.auth.signUp({
      email: draft.email,
      password: draft.password,
      options: {
        data: {
          full_name: draft.full_name || fullName || "",
          name: draft.full_name || fullName || "",
          role: draft.role || role,
          registration_role: draft.role || role
        }
      }
    });
    if (error) throw error;
    if (!data?.user) throw new Error("تعذر إنشاء الحساب");

    // If email confirmation is enabled there may be no session yet. We must not
    // claim registration success because the profile row cannot be safely linked.
    if (!data.session) {
      throw new Error("تم إنشاء حساب الدخول، لكن يلزم تأكيد البريد الإلكتروني قبل إتمام التسجيل.");
    }
    user = data.user;
    authData = data;
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    user_id: user.id,
    full_name: fullName || user.user_metadata?.full_name || "",
    email: user.email || email || "",
    phone: phone || "",
    role
  });
  if (profileError && profileError.code !== "23505") throw profileError;

  const { data, error } = await supabase.from(table).insert({
    ...row,
    [userIdField]: user.id,
    email: user.email || email || row.email
  }).select("*").single();
  if (error) throw error;

  try { sessionStorage.removeItem("bytly_registration_draft"); } catch {}
  return data;
}
