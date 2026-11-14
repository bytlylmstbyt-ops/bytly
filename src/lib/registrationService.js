import { supabase } from "@/lib/supabaseClient";

const withTimeout = (promise, ms, label) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(label || "انتهت مهلة العملية. تحقق من الاتصال وحاول مرة أخرى.")), ms))
]);

async function readFunctionError(error, fallback) {
  let message = error?.message || fallback;
  try {
    const context = error?.context;
    if (context && typeof context.json === "function") {
      const body = await context.json();
      if (body?.error) message = body.error;
    }
  } catch {}
  return message;
}

export async function uploadRegistrationDocument(file, field, uploadSessionId) {
  if (!supabase) throw new Error("خدمة التسجيل غير مهيأة حالياً.");
  const allowedFields = ["graduation_certificate_url", "saudi_engineers_council_certificate_url"];
  if (!allowedFields.includes(field)) throw new Error("نوع مستند التسجيل غير مسموح.");
  const prepared = await withTimeout(
    supabase.functions.invoke("create-engineer-registration-upload", {
      body: { field, uploadSessionId, name: file.name, type: file.type, size: file.size }
    }),
    20000,
    "انتهت مهلة تجهيز رفع الشهادة."
  );
  if (prepared.error) throw new Error(await readFunctionError(prepared.error, "تعذر تجهيز رفع الشهادة."));
  const upload = prepared.data;
  if (!upload?.ok || !upload?.path || !upload?.token) {
    throw new Error(upload?.error || "تعذر تجهيز رابط رفع الشهادة.");
  }
  const result = await withTimeout(
    supabase.storage.from("registration-documents").uploadToSignedUrl(
      upload.path,
      upload.token,
      file,
      { contentType: file.type, upsert: false }
    ),
    120000,
    "انتهت مهلة رفع الشهادة. حاول مرة أخرى."
  );
  if (result.error) throw result.error;
  return { path: upload.path };
}

export async function cleanupRegistrationUploads(paths = []) {
  if (!supabase || !paths.length) return;
  const match = String(paths[0] || "").match(/^registration-temp\/([0-9a-f-]{36})\//i);
  if (!match) return;
  try {
    await supabase.functions.invoke("create-engineer-registration-upload", {
      body: { action: "cleanup", uploadSessionId: match[1], paths }
    });
  } catch (error) {
    console.warn("Temporary registration document cleanup failed:", error);
  }
}

/**
 * Complete account creation after both required engineer certificates have
 * been uploaded to private temporary paths using server-issued upload tokens.
 */
export async function saveRegistration(payload) {
  if (!supabase) throw new Error("خدمة التسجيل غير مهيأة حالياً.");

  const email = String(payload?.email || "").trim().toLowerCase();
  const fullName = String(payload?.fullName || "").trim();
  const phone = String(payload?.phone || "").trim();
  let attribution = null;
  try { attribution = JSON.parse(localStorage.getItem("bytly_acquisition_attribution") || "null"); } catch {}

  if (!email || !fullName || !phone) throw new Error("الاسم والبريد الإلكتروني ورقم الهاتف مطلوبة.");

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
        documents: payload.documents || {},
        attribution
      }
    }),
    120000,
    "انتهت مهلة إنشاء الحساب. تحقق من الاتصال وحاول مرة أخرى."
  );

  if (response.error) throw new Error(await readFunctionError(response.error, "تعذر إكمال التسجيل."));
  const data = response.data;
  if (!data?.ok) throw new Error(data?.error || "تعذر إكمال التسجيل.");

  const signInResult = await withTimeout(
    supabase.auth.signInWithPassword({ email, password: String(payload?.password || "") }),
    20000,
    "انتهت مهلة تسجيل الدخول بعد إنشاء الحساب."
  );
  if (signInResult.error || !signInResult.data?.session?.user) {
    throw new Error(signInResult.error?.message || "تم إنشاء الحساب لكن تعذر بدء جلسة الدخول.");
  }
  return { ...data, session_started: true };
}

export async function resumePendingRegistration() {
  return null;
}
