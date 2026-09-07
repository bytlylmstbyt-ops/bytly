import { supabase } from "@/lib/supabaseClient";

export async function saveRegistration({ table, row, role, fullName, email, phone, userIdField = "user_id" }) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData?.user;
  if (!user) throw new Error("انتهت جلسة التسجيل. يرجى تسجيل الدخول مرة أخرى.");

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
  return data;
}
