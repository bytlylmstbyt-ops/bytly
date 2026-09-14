import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TABLES = new Set([
  "engineers",
  "clients",
  "engineering_firms",
  "consultants",
  "contractors",
  "suppliers",
  "legal_consultants",
]);

const ROLE_TO_TABLE: Record<string, string> = {
  engineer: "engineers",
  surveyor: "engineers",
  painter: "engineers",
  client: "clients",
  investor: "clients",
  firm: "engineering_firms",
  consultant: "consultants",
  contractor: "contractors",
  supplier: "suppliers",
  legal: "legal_consultants",
};

const PLATFORM_OWNER_ID = "2d1b547d-ba5d-4cdc-a39c-cfb60d2f52bc";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
    const serviceKey = secretKeys
      ? JSON.parse(secretKeys)["default"]
      : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const url = Deno.env.get("SUPABASE_URL");
    if (!url || !serviceKey) return json({ error: "Server registration is not configured" }, 500);

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const table = String(body?.table || "");
    const role = String(body?.role || "");
    const email = String(body?.email || "").trim().toLowerCase();
    const fullName = String(body?.fullName || "").trim();
    const phone = String(body?.phone || "").trim();
    const row = body?.row && typeof body.row === "object" ? { ...body.row } : {};

    const expectedTable = ROLE_TO_TABLE[role];
    if (!TABLES.has(table) || !expectedTable || expectedTable !== table) {
      return json({ error: "Invalid registration type" }, 400);
    }
    if (!email || !fullName || !phone) return json({ error: "الاسم والبريد والهاتف مطلوبة" }, 400);

    // Do not trust client-supplied user_id, identity fields, or account ownership.
    delete row.user_id;
    delete row.id;
    row.email = email;
    row.full_name = fullName;
    row.phone = phone;
    row.is_real = true;
    row.source = "supabase";

    // Prevent duplicate registrations without exposing whether an arbitrary email exists.
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id,user_id,role")
      .eq("email", email)
      .maybeSingle();
    if (existingProfile?.user_id) {
      return json({ error: "هذا البريد مسجل بالفعل. يمكنك تسجيل الدخول." }, 409);
    }

    // Create the Auth identity server-side. A random password is used so no password is ever
    // stored in browser storage; a recovery email is requested immediately so the user can set it.
    const randomPassword = `${crypto.randomUUID()}-${crypto.randomUUID()}!A9`;
    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, name: fullName, role, account_type: role, phone },
    });
    if (authError || !created.user) {
      const message = authError?.message || "تعذر إنشاء حساب الدخول";
      if (/already registered|already exists/i.test(message)) {
        return json({ error: "هذا البريد مسجل بالفعل. يمكنك تسجيل الدخول." }, 409);
      }
      return json({ error: message }, 400);
    }

    const userId = created.user.id;
    row.user_id = userId;

    const { error: profileError } = await admin.from("profiles").upsert({
      user_id: userId,
      full_name: fullName,
      email,
      phone,
      role,
    }, { onConflict: "user_id" });

    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      return json({ error: profileError.message }, 400);
    }

    const { data: saved, error: rowError } = await admin.from(table).insert(row).select("*").single();
    if (rowError) {
      await admin.from("profiles").delete().eq("user_id", userId);
      await admin.auth.admin.deleteUser(userId);
      return json({ error: rowError.message }, 400);
    }

    // Admin notification is secondary: never roll back a successful registration if notification fails.
    try {
      await admin.from("notifications").insert({
        user_id: PLATFORM_OWNER_ID,
        type: "new_registration",
        title: "تسجيل مستخدم جديد في بيتلي",
        body: `${fullName} — ${email} — ${role}`,
        entity_type: "registration",
        entity_id: saved?.id || null,
      });
    } catch (_) {}

    // Give the user a safe way to establish their own password. Failure here must not block signup.
    let passwordSetupEmailSent = false;
    try {
      const result = await admin.auth.resetPasswordForEmail(email, {
        redirectTo: "https://mybytly.com/update-password",
      });
      passwordSetupEmailSent = !result.error;
    } catch (_) {}

    return json({
      ok: true,
      user_id: userId,
      record_id: saved?.id || null,
      password_setup_email_sent: passwordSetupEmailSent,
    });
  } catch (error) {
    console.error("complete-registration error", error);
    return json({ error: error instanceof Error ? error.message : "تعذر إكمال التسجيل" }, 500);
  }
});
