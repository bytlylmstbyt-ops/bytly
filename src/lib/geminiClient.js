import { supabase } from "@/lib/supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://wbqtgdkubrocnqnykhlt.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_8dsKwVbalFlUNA65FJaWlA_1ch0TKfw";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/bytly-ai`;

function toText(value, depth = 0) {
  if (depth > 10 || value == null) return "";
  if (typeof value === "string") {
    const text = value.trim();
    return text === "[object Object]" || text === "Object object" ? "" : text;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((v) => toText(v, depth + 1)).filter(Boolean).join("\n");
  if (typeof value === "object") {
    const object = value;
    for (const key of ["text", "content", "output_text", "message", "result", "response", "output", "parts"]) {
      if (object[key] != null) {
        const text = toText(object[key], depth + 1);
        if (text) return text;
      }
    }
    try { return JSON.stringify(object, null, 2); } catch { return ""; }
  }
  return String(value);
}

async function readResponseBody(response) {
  const raw = await response.text();
  if (!raw) return { raw: "", data: null };
  try { return { raw, data: JSON.parse(raw) }; } catch { return { raw, data: null }; }
}

function errorMessage(data, raw, status) {
  const candidates = [data?.error, data?.message, data?.details, data?.detail, data?.hint];
  for (const value of candidates) {
    const text = toText(value);
    if (text) return text;
  }
  const rawText = raw?.trim();
  if (rawText && rawText !== "[object Object]") return rawText.slice(0, 800);
  return `HTTP ${status}`;
}

export async function callGemini({ agent = "assistant", prompt, context = {}, responseFormat = "text" }) {
  const cleanPrompt = String(prompt || "").trim();
  if (!cleanPrompt) throw new Error("يرجى إدخال الطلب");

  let accessToken = null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (!error) accessToken = data?.session?.access_token || null;
  } catch {
    accessToken = null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const headers = {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
    };

    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        agent,
        prompt: cleanPrompt,
        context: context && typeof context === "object" ? context : {},
        responseFormat,
      }),
      signal: controller.signal,
    });

    const { raw, data } = await readResponseBody(response);

    if (!response.ok) {
      throw new Error(errorMessage(data, raw, response.status));
    }

    if (!data || data.success !== true) {
      throw new Error(errorMessage(data, raw, response.status) || "تعذر الحصول على رد من وكيل Bytly AI.");
    }

    const result = data.result;
    if (responseFormat === "json") return result;
    const text = toText(result);
    if (!text) throw new Error("وصل رد من وكيل Bytly AI بدون محتوى قابل للعرض.");
    return text;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("انتهت مهلة وكيل Bytly AI بعد 60 ثانية. حاول مرة أخرى.");
    if (error instanceof Error) throw error;
    throw new Error(toText(error) || "تعذر تشغيل وكيل Bytly AI.");
  } finally {
    clearTimeout(timeout);
  }
}
