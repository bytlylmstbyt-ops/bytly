import { supabase } from '@/lib/supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wbqtgdkubrocnqnykhlt.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_8dsKwVbalFlUNA65FJaWlA_1ch0TKfw';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/bytly-ai`;

function toDisplayText(value, depth = 0) {
  if (value == null || depth > 10) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '[object Object]' || trimmed === 'Object object' ? '' : trimmed;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Error) return toDisplayText(value.message, depth + 1) || toDisplayText(value.cause, depth + 1);
  if (Array.isArray(value)) return value.map((item) => toDisplayText(item, depth + 1)).filter(Boolean).join('\n');
  if (typeof value === 'object') {
    const object = value;
    const preferredKeys = ['message', 'error', 'detail', 'details', 'reason', 'text', 'value', 'content', 'output_text', 'parts', 'result', 'response', 'cause'];
    for (const key of preferredKeys) {
      if (object[key] != null) {
        const text = toDisplayText(object[key], depth + 1);
        if (text) return text;
      }
    }
    try {
      const json = JSON.stringify(object, null, 2);
      return json === '{}' ? '' : json;
    } catch {
      return '';
    }
  }
  return String(value);
}

export function normalizeMarketingResult(value) {
  const text = toDisplayText(value).trim();
  return text || 'لم يُرجع الوكيل نصًا قابلًا للعرض.';
}

function normalizeMarketingError(value, fallback = 'تعذر الحصول على نتيجة من وكيل التسويق.') {
  return toDisplayText(value).trim() || fallback;
}

async function readJsonResponse(response) {
  const raw = await response.text();
  if (!raw) return { raw: '', data: null };
  try { return { raw, data: JSON.parse(raw) }; } catch { return { raw, data: null }; }
}

export async function runMarketingAgent({ prompt, context = {} }) {
  const cleanPrompt = String(prompt || '').trim();
  if (!cleanPrompt) throw new Error('يرجى إدخال طلب للوكيل التسويقي.');

  let session = null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (!error) session = data?.session || null;
  } catch (error) {
    throw new Error(normalizeMarketingError(error, 'تعذر قراءة جلسة تسجيل الدخول.'));
  }

  if (!session?.access_token) {
    throw new Error('يجب تسجيل الدخول بحساب الإدارة قبل تشغيل وكيل التسويق.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        agent: 'marketing',
        prompt: cleanPrompt,
        context: context && typeof context === 'object' ? context : {},
        responseFormat: 'text',
      }),
      signal: controller.signal,
    });

    const { raw, data } = await readJsonResponse(response);
    const serverError = data?.error ?? data?.message ?? data?.details ?? data?.detail;

    if (!response.ok) {
      throw new Error(normalizeMarketingError(serverError, raw || `HTTP ${response.status}`));
    }

    if (!data || data.success !== true) {
      throw new Error(normalizeMarketingError(serverError, 'تعذر الحصول على نتيجة من وكيل التسويق.'));
    }

    const result = normalizeMarketingResult(data.result);
    if (!result || result === 'لم يُرجع الوكيل نصًا قابلًا للعرض.') {
      throw new Error('وصل رد ناجح من وكيل التسويق بدون محتوى قابل للعرض.');
    }

    return {
      result,
      citations: Array.isArray(data.citations) ? data.citations : [],
      searched: Boolean(data.searched),
      model: normalizeMarketingResult(data.model) || 'gemini-3.6-flash',
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('انتهت مهلة وكيل التسويق بعد 90 ثانية.');
    }
    if (error instanceof Error) throw error;
    throw new Error(normalizeMarketingError(error, 'تعذر تشغيل وكيل التسويق.'));
  } finally {
    clearTimeout(timeout);
  }
}
