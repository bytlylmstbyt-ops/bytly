import { supabase } from "@/lib/supabaseClient";

export async function callGemini({ agent = "assistant", prompt, context = {}, responseFormat = "text" }) {
  if (!prompt?.trim()) throw new Error("يرجى إدخال الطلب");
  const { data: { session } = {} } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke("bytly-ai", {
    body: { agent, prompt, context, responseFormat },
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (error) throw new Error(error.message || "تعذر الاتصال بمساعد الذكاء الاصطناعي");
  if (!data?.success) throw new Error(data?.error || "تعذر الحصول على رد من Gemini");
  return data.result;
}
