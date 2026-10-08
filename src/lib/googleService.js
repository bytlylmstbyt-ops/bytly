import { supabase } from "@/lib/supabaseClient";

export async function googleService(action, data = {}) {
  const { data: result, error } = await supabase.functions.invoke("google-service", { body: { action, data } });
  if (error) throw error;
  if (result?.success === false || (result?.ok === false && result?.error)) throw new Error(result.error || "تعذر تنفيذ عملية Google");
  return result;
}

export const googleDrive = {
  list: (data) => googleService("driveList", data),
  upload: (data) => googleService("driveUpload", data),
};

export const googleSheets = {
  read: (data) => googleService("sheetsRead", data),
  append: (data) => googleService("sheetsAppend", data),
  update: (data) => googleService("sheetsUpdate", data),
};
