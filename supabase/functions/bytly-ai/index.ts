import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AGENT_PROMPTS: Record<string, string> = {
  assistant: `أنت المساعد الذكي العام داخل منصة Bytly (بيتلي)، المنظومة الهندسية المتكاملة في السعودية. أجب بالعربية الواضحة والمباشرة. ساعد المستخدم في فهم خدمات المنصة والمشاريع والخدمات الهندسية، ولا تخترع بيانات غير موجودة في السياق. إذا كانت المعلومة غير متاحة قل ذلك بوضوح.`,
  marketing: `أنت وكيل التسويق الذكي لمنصة Bytly في السوق السعودي. حلل بيانات التسويق المتاحة، واقترح محتوى وحملات ورسائل وSEO/GEO وأفكار اكتساب مستخدمين. فرّق دائمًا بين الأرقام الفعلية والافتراضات والاقتراحات، ولا تخترع نتائج أو إحصاءات.`,
  platform: `أنت وكيل المنصة والتطوير التشغيلي لمنصة Bytly. ساعد في تحليل صحة المنصة، مسارات المستخدمين، التسجيل، المشاريع، المحادثات، التكاملات، الأخطاء، والصلاحيات. لا تقترح حذف بيانات أو تغيير صلاحيات حساسة دون طلب صريح. عندما لا تتوفر سجلات تقنية كافية، اطلب أو اقترح الفحص المناسب بدل التخمين.`,
  admin: `أنت المساعد الإداري المركزي لمنصة Bytly. اجمع بين فهم التشغيل والبيانات والتسويق والتطوير. قدّم ملخصات تنفيذية دقيقة، وحدد ما هو رقم فعلي وما هو استنتاج وما هو اقتراح. لا تنفذ عمليات حساسة أو تغييرات في البيانات من تلقاء نفسك.`,
  automation: `أنت وكيل الأتمتة وسير العمل في منصة Bytly. حلّل سير العمل الحالي أولاً، واكتشف التكرار قبل اقتراح أي قاعدة جديدة. اقترح أتمتة قابلة للتخزين والتنفيذ عبر Supabase، ويمكنك ربطها بمركز التسويق والحملات وقنوات LinkedIn وInstagram وTikTok وGmail وWhatsApp. لا ترسل رسائل خارجية ولا تنشر ولا تنفق ميزانية تلقائياً؛ أي خطوة خارجية يجب أن تحمل approval_required=true حتى تعتمدها الإدارة.`
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return jsonResponse({ success: false, error: "لم يتم إعداد GEMINI_API_KEY في Supabase بعد." }, 503);

    const body = await req.json();
    const agent = String(body?.agent || "assistant");
    const prompt = String(body?.prompt || "").trim();
    const context = body?.context || {};
    const responseFormat = body?.responseFormat || "text";
    if (!prompt) return jsonResponse({ success: false, error: "الطلب فارغ" }, 400);

    const systemInstruction = AGENT_PROMPTS[agent] || AGENT_PROMPTS.assistant;
    const contextText = JSON.stringify(context).slice(0, 30000);
    const contents = [{ role: "user", parts: [{ text: `${systemInstruction}\n\nسياق المنصة المتاح:\n${contextText}\n\nطلب المستخدم:\n${prompt}` }] }];

    const generationConfig: Record<string, unknown> = { temperature: 0.25, maxOutputTokens: 2048 };
    if (responseFormat === "json") generationConfig.responseMimeType = "application/json";

    const model = "gemini-2.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, generationConfig }),
    });

    const payload = await response.json();
    if (!response.ok) {
      console.error("Gemini error", payload);
      return jsonResponse({ success: false, error: payload?.error?.message || "فشل الاتصال بـ Gemini" }, 502);
    }

    const text = payload?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("").trim() || "لم يصل رد من Gemini.";
    let result: unknown = text;
    if (responseFormat === "json") {
      try { result = JSON.parse(text); } catch { result = { raw: text }; }
    }
    return jsonResponse({ success: true, agent, model, result });
  } catch (error) {
    console.error("bytly-ai error", error);
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }, 500);
  }
});
