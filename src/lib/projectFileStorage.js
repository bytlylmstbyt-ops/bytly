import { supabase } from "@/lib/supabaseClient";

const BUCKET = "project-files";
const PREFIX = "supabase://project-files/";

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
