import { supabase } from "@/lib/supabaseClient";

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(label || "انتهت مهلة العملية. تحقق من الاتصال وحاول مرة أخرى.")), ms))
  ]);

export async function saveRegistration({ table, row, role, fullName, email, phone }) {
  if (!supabase) throw new Error("خدمة التسجيل غير مهيأة حالياً.");

  const { data, error } = await withTimeout(
    supabase.functions.invoke("complete-registration", {
      body: { table, row, role, fullName, email, phone }
    }),
    30000,
    "استغرق إكمال التسجيل وقتاً أطول من المتوقع. حاول مرة أخرى."
  );

  if (error) {
    let message = error.message || "تعذر إكمال التسجيل.";
    try {
      if (error.context) {
        const payload = await error.context.json();
        if (payload?.error) message = payload.error;
      }
    } catch {}
    throw new Error(message);
  }
  if (!data?.ok) throw new Error(data?.error || "تعذر إكمال التسجيل.");

  try { sessionStorage.removeItem("bytly_registration_draft"); } catch {}
  return data;
}
