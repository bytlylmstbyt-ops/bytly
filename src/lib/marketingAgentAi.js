import { supabase } from '@/lib/supabaseClient';

function toDisplayText(value, depth = 0) {
  if (value == null) return '';
  if (depth > 10) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '[object Object]' || trimmed === 'Object object' ? '' : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Error) {
    return toDisplayText(value.message, depth + 1) || toDisplayText(value.cause, depth + 1);
  }
  if (Array.isArray(value)) {
    return value.map((item) => toDisplayText(item, depth + 1)).filter(Boolean).join('\n');
  }
  if (typeof value === 'object') {
    const object = value;
    const preferredKeys = [
      'message', 'error', 'detail', 'details', 'reason', 'text', 'value',
      'content', 'output_text', 'parts', 'result', 'response', 'cause',
    ];
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
  const text = toDisplayText(value).trim();
  return text || fallback;
}

export async function runMarketingAgent({ prompt, context = {} }) {
  const cleanPrompt = String(prompt || '').trim();
  if (!cleanPrompt) throw new Error('يرجى إدخال طلب للوكيل التسويقي.');

  let response;
  try {
    response = await supabase.functions.invoke('marketing-agent', {
      body: { prompt: cleanPrompt, context },
    });
  } catch (invokeError) {
    throw new Error(normalizeMarketingError(invokeError, 'تعذر الاتصال بوكيل التسويق.'));
  }

  const { data, error } = response || {};

  if (error) {
    throw new Error(normalizeMarketingError(error, 'تعذر الاتصال بوكيل التسويق.'));
  }

  if (!data?.success) {
    throw new Error(normalizeMarketingError(data?.error ?? data?.message, 'تعذر الحصول على نتيجة من وكيل التسويق.'));
  }

  return {
    result: normalizeMarketingResult(data.result),
    citations: Array.isArray(data.citations) ? data.citations : [],
    searched: Boolean(data.searched),
    model: normalizeMarketingResult(data.model) || 'gemini-3.6-flash',
  };
}