import { supabase } from '@/lib/supabaseClient';

function toDisplayText(value, depth = 0) {
  if (value == null) return '';
  if (depth > 8) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '[object Object]' || trimmed === 'Object object' ? '' : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => toDisplayText(item, depth + 1)).filter(Boolean).join('\n');
  }
  if (typeof value === 'object') {
    const object = value;
    const preferredKeys = ['text', 'value', 'content', 'output_text', 'message', 'parts', 'result', 'response'];
    for (const key of preferredKeys) {
      if (object[key] != null) {
        const text = toDisplayText(object[key], depth + 1);
        if (text) return text;
      }
    }
    try {
      return JSON.stringify(object, null, 2);
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

export async function runMarketingAgent({ prompt, context = {} }) {
  const cleanPrompt = String(prompt || '').trim();
  if (!cleanPrompt) throw new Error('يرجى إدخال طلب للوكيل التسويقي.');

  const { data, error } = await supabase.functions.invoke('marketing-agent', {
    body: { prompt: cleanPrompt, context },
  });

  if (error) throw new Error(error.message || 'تعذر الاتصال بوكيل التسويق.');
  if (!data?.success) throw new Error(data?.error || 'تعذر الحصول على نتيجة من وكيل التسويق.');

  return {
    result: normalizeMarketingResult(data.result),
    citations: Array.isArray(data.citations) ? data.citations : [],
    searched: Boolean(data.searched),
    model: normalizeMarketingResult(data.model) || 'gemini-3.6-flash',
  };
}