import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://mybytly.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const VALID_PRICE_IDS = [
  "price_1TbQh4B6BI8uC0Au89E4VzRL","price_1TbQh4B6BI8uC0AupdL39tcG","price_1TbQh4B6BI8uC0Au7VTp4rPf",
  "price_1TtaI3B6BI8uC0AupOhXOnac","price_1TtaI4B6BI8uC0AuEky91mYl","price_1TtaI4B6BI8uC0Au3YdkJTlY",
  "price_1TtaOgB6BI8uC0AuoLaGDBhe","price_1TtaOgB6BI8uC0AuPYrWJL0T","price_1TtaOgB6BI8uC0AuwtKVNleN",
  "price_1TtaI4B6BI8uC0Au133PiiYo","price_1TtaI4B6BI8uC0AuyidDyMj9","price_1TtaI4B6BI8uC0Auf8LmiGct",
  "price_1TtaOgB6BI8uC0AuDavX2zNB","price_1TtaOgB6BI8uC0AuGLUcpcFS","price_1TtaOgB6BI8uC0AuWLVMkAve",
];
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  if (!url || !anonKey || !stripeSecret) return json({ error: "Checkout service is not configured" }, 503);
  // Bytly is not accepting real payments yet. Never create a live checkout session.
  if (!stripeSecret.startsWith("sk_test_")) return json({ error: "الاشتراكات في وضع الاختبار فقط حاليًا، ولم يتم تفعيل الدفع الحقيقي." }, 503);
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);
  const supabase = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return json({ error: "Invalid session" }, 401);
  let body: { price_id?: string; plan_name?: string; provider_type?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const { price_id, plan_name, provider_type } = body;
  if (!price_id || !VALID_PRICE_IDS.includes(price_id)) return json({ error: "Invalid price_id" }, 400);
  if (provider_type !== "contractor" && provider_type !== "supplier") return json({ error: "Unsupported provider type" }, 400);
  const table = provider_type === "contractor" ? "contractors" : "suppliers";
  const { data: provider, error: providerError } = await supabase.from(table).select("id").eq("user_id", auth.user.id).maybeSingle();
  if (providerError) return json({ error: "Unable to verify provider account" }, 403);
  if (!provider) return json({ error: "لا يوجد حساب مقدم خدمة مرتبط بحساب الدخول الحالي." }, 403);
  const originHeader = req.headers.get("origin") || "";
  const allowedOrigins = new Set(["https://mybytly.com", "https://www.mybytly.com", "http://localhost:5173", "http://localhost:3000"]);
  const origin = allowedOrigins.has(originHeader) ? originHeader : "https://mybytly.com";
  const redirectBase = `${origin}/ProviderSubscription?type=${provider_type}`;
  try {
    const stripe = new Stripe(stripeSecret);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: price_id, quantity: 1 }],
      customer_email: auth.user.email,
      success_url: `${redirectBase}&success=true&plan=${encodeURIComponent(plan_name || "")}`,
      cancel_url: `${redirectBase}&canceled=true`,
      metadata: { user_id: auth.user.id, user_email: auth.user.email || "", plan_name: plan_name || "", provider_type },
    });
    return json({ url: session.url });
  } catch (error) {
    console.error("Subscription checkout error:", error instanceof Error ? error.message : error);
    return json({ error: "تعذر إنشاء جلسة الاشتراك. تحقق من إعدادات بوابة الدفع التجريبية." }, 500);
  }
});