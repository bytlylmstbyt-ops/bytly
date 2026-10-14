import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const moyasarSecret = Deno.env.get("MOYASAR_SECRET_KEY") || "";
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Payment service is not configured" }, 503);
  // This endpoint intentionally supports test-mode checkout only until a production payment review is complete.
  if (!moyasarSecret.startsWith("sk_test_")) return json({ error: "Moyasar test mode only: configure an sk_test_ secret key" }, 503);

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount < 50 || amount > 100000) {
    return json({ error: "Amount must be between SAR 50 and SAR 100,000" }, 400);
  }
  const roundedAmount = Math.round(amount * 100) / 100;

  // Create the wallet row if this authenticated user has not recharged before.
  const { error: walletError } = await admin.from("wallet_accounts").upsert({
    user_id: user.id,
    currency: "SAR",
    available_balance: 0,
    held_balance: 0,
    status: "active",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id", ignoreDuplicates: true });
  if (walletError) return json({ error: "Could not initialize wallet account" }, 500);

  const { data: order, error: orderError } = await admin.from("wallet_transactions").insert({
    user_id: user.id,
    type: "wallet_recharge",
    amount: roundedAmount,
    currency: "SAR",
    status: "pending",
    description: "شحن محفظة بيتلي عبر Moyasar",
    balance_type: "available",
    direction: "credit",
  }).select("id,amount,currency,status").single();
  if (orderError || !order) return json({ error: "Could not create wallet recharge order" }, 500);

  return json({
    payment_order_id: order.id,
    amount: Number(order.amount),
    currency: "SAR",
    requires_source: true,
    environment: "test",
  });
});
