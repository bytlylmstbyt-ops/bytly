import { supabase } from "@/lib/supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://wbqtgdkubrocnqnykhlt.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_8dsKwVbalFlUNA65FJaWlA_1ch0TKfw";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/bytly-ai`;

export async function callGemini({ agent = "assistant", prompt, context = {}, responseFormat = "text" }) {
  if (!prompt?.trim()) throw new Error("يرجى إدخال الطلب");

  let accessToken = null;
  try {
    const { data } = await supabase?.auth?.getSession?.();
    accessToken = data?.session?.access_token || null;
  } catch {
    // The public assistant can work without a signed-in user.
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const headers = {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ agent, prompt, context, responseFormat }),
      signal: controller.signal,
    });

    const raw = await response.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const detail = data?.error || raw?.slice(0, 300) || `HTTP ${response.status}`;
      throw new Error(`خطأ من خدمة Bytly AI (${response.status}): ${detail}`);
    }

    if (!data?.success) {
      throw new Error(data?.error || "تعذر الحصول على رد من Gemini");
    }

    return data.result;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("انتهت مهلة الاتصال بمساعد Bytly AI. حاول مرة أخرى.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
