import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const TABLES: Record<string, { table: string; fields: string[]; userField?: string; fixed?: Record<string, unknown> }> = {
  EngineeringFirm: {
    table: "engineering_firms",
    userField: "owner_user_id",
    fields: ["company_name", "email", "commercial_registration", "phone", "city", "country", "website", "team_size", "status"],
    fixed: { entity_type: "engineering_company", is_real: true, source: "supabase" },
  },
  ConsultingFirm: {
    table: "engineering_firms",
    userField: "owner_user_id",
    fields: ["company_name", "email", "commercial_registration", "phone", "city", "country", "website", "team_size", "status"],
    fixed: { entity_type: "consulting_firm", is_real: true, source: "supabase" },
  },
  Consultant: {
    table: "consultants",
    userField: "user_id",
    fields: ["full_name", "email", "consultant_type", "engineers_society_membership_number", "engineering_specialization", "phone", "city", "country", "bio", "status"],
    fixed: { verification_status: "pending" },
  },
  Contractor: {
    table: "contractors",
    userField: "user_id",
    fields: ["company_name", "email", "specialization", "phone", "city", "country", "contractor_type", "commercial_registration", "years_experience", "team_size", "bio", "status"],
  },
  Supplier: {
    table: "suppliers",
    userField: "user_id",
    fields: ["company_name", "email", "specialization", "phone", "city", "country", "supplier_type", "commercial_registration", "years_experience", "website", "bio", "status"],
  },
  Advertiser: {
    table: "advertisers",
    fields: ["company_name", "email", "contact_name", "phone", "city", "country", "category", "subscription_type", "campaign_value", "website", "bio", "status"],
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Server configuration incomplete" }, 500);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

  const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: authData, error: authError } = await callerClient.auth.getUser();
  if (authError || !authData.user) return json({ error: "Invalid session" }, 401);

  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const callerEmail = authData.user.email?.toLowerCase();
  const { data: callerProfile, error: callerProfileError } = await adminClient
    .from("profiles").select("role").eq("user_id", authData.user.id).maybeSingle();
  if (callerProfileError) return json({ error: "Unable to verify administrator role" }, 500);
  const allowed = ["admin", "owner", "super_admin"].includes(callerProfile?.role || "") ||
    callerEmail === "bytlylmstbyt@gmail.com";
  if (!allowed) return json({ error: "Administrator access required" }, 403);

  let body: { type?: string; payload?: Record<string, unknown> };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const config = body.type ? TABLES[body.type] : undefined;
  if (!config || !body.payload || typeof body.payload !== "object" || Array.isArray(body.payload)) {
    return json({ error: "Unsupported provider type or payload" }, 400);
  }

  const payload: Record<string, unknown> = {};
  for (const field of config.fields) {
    const value = body.payload[field];
    if (value !== undefined && value !== null && value !== "") payload[field] = value;
  }
  payload.status = ["approved", "pending", "rejected"].includes(String(payload.status))
    ? payload.status : "pending";

  const email = String(payload.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return json({ error: "A valid provider email is required" }, 400);
  payload.email = email;

  let linkedUserId: string | undefined;
  const { data: linkedProfile, error: profileError } = await adminClient
    .from("profiles").select("user_id,email").ilike("email", email).limit(2);
  if (profileError) return json({ error: "Unable to resolve provider account" }, 500);
  const matches = (linkedProfile || []).filter((p: { user_id: string | null }) => Boolean(p.user_id));
  if (matches.length > 1) return json({ error: "Multiple profiles match this email; resolve account ownership first" }, 409);
  if (matches.length === 1) {
    const candidate = matches[0].user_id as string;
    const { data: targetAuth, error: targetAuthError } = await adminClient.auth.admin.getUserById(candidate);
    if (!targetAuthError && targetAuth.user?.email?.toLowerCase() === email) linkedUserId = candidate;
  }

  if (config.userField && !linkedUserId) {
    return json({ error: "لا يوجد حساب دخول موثّق بهذا البريد. أنشئ حساب مقدم الخدمة أولًا ثم أعد المحاولة؛ لم يتم إنشاء سجل يتيم." }, 409);
  }
  if (config.userField) payload[config.userField] = linkedUserId;
  if (config.fixed) Object.assign(payload, config.fixed);
  if (config.table === "advertisers") payload.created_by = authData.user.id;

  const { data, error } = await adminClient.from(config.table).insert(payload).select("*").single();
  if (error) return json({ error: error.message, code: error.code }, 400);
  return json({ success: true, provider: data });
});