import { supabase } from '@/lib/supabaseClient';

function normalizeResult(value) {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
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
    result: normalizeResult(data.result),
    citations: Array.isArray(data.citations) ? data.citations : [],
    searched: Boolean(data.searched),
    model: data.model || 'gemini-3.6-flash',
  };
}
