import { supabase } from '@/lib/supabaseClient';
import { toUserMessage, assertDisplayable } from '@/lib/errorUtils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wbqtgdkubrocnqnykhlt.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_8dsKwVbalFlUNA65FJaWlA_1ch0TKfw';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/bytly-ai`;

export function normalizeMarketingResult(value) {
  return assertDisplayable(value, 'لم يُرجع الوكيل نصًا قابلًا للعرض.');
}

function normalizeMarketingError(value, fallback = 'تعذر الحصول على نتيجة من وكيل التسويق.') {
  return toUserMessage(value, fallback);
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
    if (error) throw new Error(normalizeMarketingError(error, 'تعذر قراءة جلسة تسجيل الدخول.'));
    session = data?.session || null;
  } catch (error) {
    throw new Error(normalizeMarketingError(error, 'تعذر قراءة جلسة تسجيل الدخول.'));
  }

  if (!session?.access_token) throw new Error('يجب تسجيل الدخول بحساب الإدارة قبل تشغيل وكيل التسويق.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ agent: 'marketing', prompt: cleanPrompt, context: context && typeof context === 'object' ? context : {}, responseFormat: 'text' }),
      signal: controller.signal,
    });
    const { raw, data } = await readJsonResponse(response);
    const serverError = data?.error ?? data?.message ?? data?.details ?? data?.detail;
    if (!response.ok) throw new Error(normalizeMarketingError(serverError, raw || `HTTP ${response.status}`));
    if (!data || data.success !== true) throw new Error(normalizeMarketingError(serverError, 'تعذر الحصول على نتيجة من وكيل التسويق.'));
    const result = normalizeMarketingResult(data.result);
    if (!result || result === 'لم يُرجع الوكيل نصًا قابلًا للعرض.') throw new Error('وصل رد ناجح من وكيل التسويق بدون محتوى قابل للعرض.');
    return { result, citations: Array.isArray(data.citations) ? data.citations : [], searched: Boolean(data.searched), model: toUserMessage(data.model, 'النموذج غير محدد') };
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('انتهت مهلة وكيل التسويق بعد 90 ثانية.');
    throw new Error(normalizeMarketingError(error));
  } finally { clearTimeout(timeout); }
}
