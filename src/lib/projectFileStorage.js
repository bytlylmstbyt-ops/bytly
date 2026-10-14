import { supabase } from "@/lib/supabaseClient";

const BUCKET = "project-files";
const PREFIX = "supabase://project-files/";

export async function uploadScopedFile(scope, file, options = {}) {
  if (!supabase) throw new Error("Supabase غير مهيأ.");
  if (!scope || !file) throw new Error("بيانات الملف غير مكتملة.");

  // Draft attachments are private and scoped to the authenticated user's own folder.
  if (scope === "project-files" && options.projectId === "drafts") {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const userId = authData?.user?.id;
    if (!userId) throw new Error("يجب تسجيل الدخول قبل رفع الملفات.");
    const safeDraftName = (file.name || "file").replace(/[^\w.\-\u0600-\u06FF ]/g, "_");
    const path = `drafts/${userId}/${crypto.randomUUID()}-${safeDraftName}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw error;
    return `${PREFIX}${path}`;
  }

  const safeName = (file.name || "file").replace(/[^\w.\-\u0600-\u06FF ]/g, "_");
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

/**
 * Move uploaded draft attachments into the newly-created project's folder.
 * Draft files are private to their uploader; project-folder files are readable
 * by project participants under the project-files storage RLS policies.
 */
export async function promoteDraftProjectFiles(values, projectId) {
  if (!supabase) throw new Error("Supabase غير مهيأ.");
  if (!projectId) throw new Error("معرّف المشروع غير متوفر.");

  const attachments = [];
  const sourcePaths = [];

  for (const value of values || []) {
    if (!value?.startsWith(`${PREFIX}drafts/`)) {
      attachments.push(value);
      continue;
    }

    const sourcePath = value.slice(PREFIX.length);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(sourcePath);
    if (downloadError) throw downloadError;

    const fileName = sourcePath.split("/").pop() || "attachment";
    const targetPath = `${projectId}/${crypto.randomUUID()}-${fileName}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(targetPath, fileData, {
      upsert: false,
      contentType: fileData.type || undefined,
    });
    if (uploadError) throw uploadError;

    attachments.push(`${PREFIX}${targetPath}`);
    sourcePaths.push(sourcePath);
  }

  return { attachments, sourcePaths };
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
