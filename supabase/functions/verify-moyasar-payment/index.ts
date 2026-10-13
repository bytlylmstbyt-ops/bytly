import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const moyasarSecret = Deno.env.get("MOYASAR_SECRET_KEY") || "";
  if (!moyasarSecret.startsWith("sk_test_")) {
    return json({ error: "Moyasar test mode only: configure an sk_test_ secret key" }, 503);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(supabaseUrl, serviceRole);

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const paymentId = body.payment_id;
  const paymentOrderId = body.payment_order_id;
  if (!paymentId || !paymentOrderId) {
    return json({ error: "payment_id and payment_order_id are required" }, 400);
  }

  const response = await fetch(
    `https://api.moyasar.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: `Basic ${btoa(`${moyasarSecret}:`)}`,
        Accept: "application/json",
      },
    },
  );
  const payment = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json({ error: payment?.message || "Moyasar verification failed" }, 502);
  }

  // Wallet recharge order.
  const { data: walletTx, error: walletError } = await admin
    .from("wallet_transactions")
    .select("id,user_id,amount,currency,status,reference")
    .eq("id", paymentOrderId)
    .eq("user_id", user.id)
    .eq("type", "wallet_recharge")
    .single();

  if (!walletError && walletTx) {
    const expectedAmount = Math.round(Number(walletTx.amount) * 100);
    if (payment.currency !== walletTx.currency || Number(payment.amount) !== expectedAmount) {
      return json({ error: "Payment amount or currency does not match this wallet order" }, 400);
    }

    if (walletTx.status === "completed" && walletTx.reference === payment.id) {
      return json({ paid: true, status: "paid", payment_id: payment.id, already_completed: true });
    }

    if (payment.status !== "paid") {
      const nextStatus = payment.status === "failed" ? "failed" : "pending";
      const { error: updateError } = await admin
        .from("wallet_transactions")
        .update({ reference: payment.id, status: nextStatus })
        .eq("id", walletTx.id)
        .eq("user_id", user.id)
        .eq("status", "pending");
      if (updateError) return json({ error: updateError.message }, 500);
      return json({ paid: false, status: payment.status, payment_id: payment.id });
    }

    // Atomic/idempotent credit: the database function locks the order and
    // credits the wallet only when the pending order is transitioned once.
    const { data: creditResult, error: creditError } = await admin.rpc(
      "complete_wallet_recharge",
      { p_order_id: walletTx.id, p_user_id: user.id, p_payment_id: payment.id },
    );
    if (creditError) return json({ error: "Could not complete wallet recharge safely" }, 500);
    if (!creditResult?.ok) {
      if (creditResult?.already_completed) {
        return json({ paid: true, status: "paid", payment_id: payment.id, already_completed: true });
      }
      return json({ error: "Wallet recharge order could not be completed", reason: creditResult?.reason || "unknown" }, 409);
    }

    return json({
      paid: true,
      status: "paid",
      payment_id: payment.id,
      payment_order_id: walletTx.id,
      amount: Number(walletTx.amount),
      currency: walletTx.currency,
      credited_to: creditResult.credited_to,
    });
  }

  // Existing subscription payment flow.
  const { data: order, error: orderError } = await admin
    .from("subscription_payments")
    .select("id,user_id,subscription_id,plan_id,amount,currency,status,billing_cycle,tier,metadata")
    .eq("id", paymentOrderId)
    .eq("user_id", user.id)
    .single();

  if (orderError || !order) return json({ error: "Payment order not found" }, 404);

  const expectedAmount = Math.round(Number(order.amount) * 100);
  if (payment.currency !== order.currency || Number(payment.amount) !== expectedAmount) {
    return json({ error: "Payment amount or currency does not match this order" }, 400);
  }

  // A gateway payment may settle only one subscription order.
  const { data: reusedPayment, error: reusedPaymentError } = await admin
    .from("subscription_payments")
    .select("id,user_id,subscription_id,status")
    .eq("provider_payment_id", payment.id)
    .maybeSingle();
  if (reusedPaymentError) return json({ error: "Could not validate payment ownership" }, 500);
  if (reusedPayment && reusedPayment.id !== order.id) {
    return json({ error: "This gateway payment is already linked to another order" }, 409);
  }

  // Idempotent retry: return the linked subscription rather than creating another one.
  if (order.status === "completed" && order.subscription_id) {
    const { data: existingSubscription, error: existingSubscriptionError } = await admin
      .from("subscriptions")
      .select("id,status,plan_code,billing_cycle,current_period_end")
      .eq("id", order.subscription_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existingSubscriptionError) return json({ error: "Could not load completed subscription" }, 500);
    if (existingSubscription) {
      return json({ paid: true, status: "paid", payment_id: payment.id, subscription: existingSubscription, already_completed: true });
    }
  }

  const isPaid = payment.status === "paid";
  const { error: paymentUpdateError } = await admin.from("subscription_payments").update({
    provider_payment_id: payment.id,
    status: isPaid ? "completed" : payment.status === "failed" ? "failed" : "initiated",
    payment_status: isPaid ? "completed" : payment.status === "failed" ? "failed" : "pending",
    paid_at: isPaid ? new Date().toISOString() : null,
    metadata: {
      ...(order.metadata || {}),
      moyasar_status: payment.status,
      moyasar_source_type: payment.source?.type || null,
    },
    updated_at: new Date().toISOString(),
  }).eq("id", order.id);
  if (paymentUpdateError) return json({ error: "Could not update payment order" }, 500);

  if (!isPaid) return json({ paid: false, status: payment.status, payment_id: payment.id });

  const start = new Date();
  const end = new Date(start);
  if (order.billing_cycle === "yearly") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);

  const planCode = order.metadata?.plan_code || null;
  const accountType = order.metadata?.account_type || "professional";

  const { error: expireError } = await admin.from("subscriptions")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .in("status", ["trial", "active", "pending"]);
  if (expireError) return json({ error: "Payment verified but previous subscription could not be closed", paid: true, payment_id: payment.id }, 500);

  const { data: subscription, error: subError } = await admin
    .from("subscriptions")
    .insert({
      user_id: user.id,
      account_type: accountType,
      plan_code: planCode,
      billing_cycle: order.billing_cycle,
      status: "active",
      price: order.amount,
      started_at: start.toISOString(),
      trial_end_at: null,
      current_period_start: start.toISOString(),
      current_period_end: end.toISOString(),
      auto_renew: false,
      payment_status: "completed",
      payment_reference: payment.id,
      updated_at: new Date().toISOString(),
    })
    .select("id,status,plan_code,billing_cycle,current_period_end")
    .single();

  if (subError) return json({ error: "Payment verified but subscription activation needs reconciliation", paid: true, payment_id: payment.id }, 500);

  const { error: linkError } = await admin.from("subscription_payments")
    .update({ subscription_id: subscription.id })
    .eq("id", order.id);
  if (linkError) return json({ error: "Subscription activated but payment link needs reconciliation", paid: true, payment_id: payment.id, subscription }, 500);

  return json({ paid: true, status: "paid", payment_id: payment.id, subscription });
});