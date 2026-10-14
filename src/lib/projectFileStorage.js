import { supabase } from "@/lib/supabaseClient";

const BUCKET = "project-files";
const PREFIX = "supabase://project-files/";

export async function uploadScopedFile(scope, file, options = {}) {
  if (!supabase) throw new Error("Supabase غير مهيأ.");
  if (!scope || !file) throw new Error("بيانات الملف غير مكتملة.");

  // Draft attachments are kept private and isolated until a real project is created.
  // Once projectId is available, use the same project-scoped folder as normal project files.
  if (scope === "project-files" && options.projectId) {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!authData?.user?.id) throw new Error("يجب تسجيل الدخول قبل رفع الملفات.");
    const safeDraftName = (file.name || "file").replace(/[^\\w.\\-\\u0600-\\u06FF ]/g, "_");
    const path = `${options.projectId}/${crypto.randomUUID()}-${safeDraftName}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw error;
    return `${PREFIX}${path}`;
  }

  const safeName = (file.name || "file").replace(/[^\\w.\\-\\u0600-\\u06FF ]/g, "_");
  let path;
  if (scope === "permits" || scope === "ready-designs" || scope === "ready-design-previews") {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const userId = authData?.user?.id;
    if (!userId) throw new Error("يجب تسجيل الدخول قبل رفع الملفات.");
    // Private originals and public previews have separate storage prefixes and RLS policies.
    path = `${scope}/${userId}/${crypto.randomUUID()}-${safeName}`;
  } else {
    path = `${scope}/${crypto.randomUUID()}-${safeName}`;
  }
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return `${PREFIX}${path}`;
}

export async function uploadProjectFile(projectId, file) {
  if (!supabase) throw new Error("Supabase غير مهيأ.");
  if (!projectId || !file) throw new Error("بيانات الملف غير مكتملة.");

  const safeName = (file.name || "file").replace(/[^\w.\-\u0600-\u06FF ]/g, "_");
  const path = `${projectId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return `${PREFIX}${path}`;
}

export async function resolveProjectFileUrl(value, expiresIn = 3600) {
  if (!value) return null;
  if (!value.startsWith(PREFIX)) return value;

  if (!supabase) return null;
  const path = value.slice(PREFIX.length);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data?.signedUrl || null;
}

export async function deleteProjectFile(value) {
  if (!value?.startsWith(PREFIX) || !supabase) return;
  const path = value.slice(PREFIX.length);
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export function getProjectFileName(value) {
  if (!value) return "ملف";
  const raw = value.startsWith(PREFIX) ? value.slice(PREFIX.length) : value;
  return decodeURIComponent(raw.split("/").pop() || "ملف").replace(/^\w+-/, "");
}
