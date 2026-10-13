import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "AUTH_REQUIRED" }, 401);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "SERVER_CONFIGURATION_ERROR" }, 500);

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const token = authHeader.slice(7);
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    const user = authData.user;
    if (authError || !user) return json({ error: "INVALID_SESSION" }, 401);

    const body = await req.json();
    const action = body?.action;
    const email = (user.email || "").trim().toLowerCase();
    const displayName = String(user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0] || "User").slice(0, 160);

    if (action === "register") {
      const fullName = String(body.full_name || displayName).trim().slice(0, 160);
      const licenseNumber = String(body.license_number || "").trim().slice(0, 100);
      const city = String(body.city || "").trim().slice(0, 120);
      if (!email || !fullName || !licenseNumber || !city) return json({ error: "NAME_LICENSE_CITY_REQUIRED" }, 400);
      const { data: existing, error: existingError } = await admin.from("surveyor_profiles").select("id,status").eq("user_id", user.id).maybeSingle();
      if (existingError) return json({ error: "PROFILE_LOOKUP_FAILED", detail: existingError.message }, 500);
      if (existing) return json({ error: "SURVEYOR_PROFILE_EXISTS", profile: existing }, 409);
      const profile = {
        user_id: user.id, full_name: fullName, email, license_number: licenseNumber, city,
        phone: String(body.phone || "").trim().slice(0, 40) || null,
        latitude: Number.isFinite(Number(body.latitude)) ? Number(body.latitude) : null,
        longitude: Number.isFinite(Number(body.longitude)) ? Number(body.longitude) : null,
        geofencing_radius_km: Math.max(1, Math.min(500, Number.parseInt(body.geofencing_radius_km, 10) || 50)),
        equipment_checklist: body.equipment_checklist && typeof body.equipment_checklist === "object" ? body.equipment_checklist : {},
        verification_documents: Array.isArray(body.verification_documents) ? body.verification_documents.filter((x: unknown) => typeof x === "string").slice(0, 20) : [],
        years_experience: Math.max(0, Math.min(80, Number.parseInt(body.years_experience, 10) || 0)),
        bio: String(body.bio || "").slice(0, 2000) || null,
        terms_accepted: body.terms_accepted === true,
        terms_accepted_date: body.terms_accepted === true ? new Date().toISOString() : null,
        status: "pending",
      };
      if (profile.latitude !== null && (profile.latitude < -90 || profile.latitude > 90)) return json({ error: "INVALID_LATITUDE" }, 400);
      if (profile.longitude !== null && (profile.longitude < -180 || profile.longitude > 180)) return json({ error: "INVALID_LONGITUDE" }, 400);
      const { data, error } = await admin.from("surveyor_profiles").insert(profile).select("id,user_id,full_name,email,city,status,terms_accepted").single();
      if (error) return json({ error: "PROFILE_CREATE_FAILED", detail: error.message }, 400);
      return json({ success: true, profile: data });
    }

    if (action === "profile") {
      const { data, error } = await admin.from("surveyor_profiles")
        .select("id,user_id,full_name,email,phone,license_number,city,latitude,longitude,geofencing_radius_km,equipment_checklist,is_identity_verified,is_license_verified,verification_documents,profile_image,bio,years_experience,rating,total_jobs,wallet_balance,available_balance,status,is_available,terms_accepted,terms_accepted_date,created_at,updated_at")
        .eq("user_id", user.id).maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ profile: data || null });
    }

    if (action === "accept_terms") {
      const { data, error } = await admin.from("surveyor_profiles")
        .update({ terms_accepted: true, terms_accepted_date: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .select("id,terms_accepted,terms_accepted_date").maybeSingle();
      if (error) return json({ error: error.message }, 400);
      if (!data) return json({ error: "SURVEYOR_PROFILE_NOT_FOUND" }, 404);
      return json({ success: true, profile: data });
    }

    if (action === "create") {
      const latitude = Number(body.latitude);
      const longitude = Number(body.longitude);
      const area = Number(body.property_area_sqm);
      const propertyStatus = body.property_status === "existing_building" ? "existing_building" : "vacant_land";
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(area) || area <= 0) return json({ error: "LOCATION_AND_AREA_REQUIRED" }, 400);
      const result = await admin.rpc("create_survey_request_with_escrow", {
        p_actor_user_id: user.id, p_client_email: email, p_client_name: displayName,
        p_latitude: latitude, p_longitude: longitude, p_address: String(body.address || "").slice(0, 500),
        p_property_area_sqm: area, p_property_status: propertyStatus, p_notes: String(body.notes || "").slice(0, 3000) || null,
      });
      if (result.error) {
        if (result.error.message.includes("INSUFFICIENT_BALANCE")) return json({ error: "INSUFFICIENT_BALANCE" }, 400);
        return json({ error: result.error.message }, 400);
      }
      return json({ success: true, ...result.data });
    }

    if (action === "accept") {
      const requestId = String(body.request_id || "");
      if (!requestId) return json({ error: "REQUEST_ID_REQUIRED" }, 400);
      const { data, error } = await admin.rpc("accept_survey_request", { p_actor_user_id: user.id, p_request_id: requestId });
      if (error) return json({ error: error.message }, 400);
      return json({ success: true, ...data });
    }

    if (action === "submit") {
      const requestId = String(body.request_id || "");
      if (!requestId) return json({ error: "REQUEST_ID_REQUIRED" }, 400);
      const { data, error } = await admin.rpc("submit_survey_deliverable", {
        p_actor_user_id: user.id, p_request_id: requestId,
        p_cad_files: Array.isArray(body.cad_files) ? body.cad_files.filter((x: unknown) => typeof x === "string").slice(0, 30) : [],
        p_visual_files: Array.isArray(body.visual_files) ? body.visual_files.filter((x: unknown) => typeof x === "string").slice(0, 30) : [],
        p_survey_metadata: body.survey_metadata && typeof body.survey_metadata === "object" ? body.survey_metadata : {},
        p_description: String(body.description || "").slice(0, 3000) || null,
      });
      if (error) return json({ error: error.message }, 400);
      return json({ success: true, ...data });
    }

    if (action === "approve") {
      const requestId = String(body.request_id || "");
      if (!requestId) return json({ error: "REQUEST_ID_REQUIRED" }, 400);
      const { data, error } = await admin.rpc("approve_survey_deliverable", { p_actor_user_id: user.id, p_request_id: requestId });
      if (error) return json({ error: error.message }, 400);
      return json({ success: true, ...data });
    }

    if (action === "list") {
      const roleType = body.role_type;
      if (roleType === "client") {
        const { data, error } = await admin.from("survey_requests").select("*,survey_deliverables(*)").eq("client_user_id", user.id).order("created_at", { ascending: false }).limit(50);
        if (error) return json({ error: error.message }, 400);
        return json({ requests: data || [] });
      }
      const { data: profile, error: profileError } = await admin.from("surveyor_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (profileError) return json({ error: profileError.message }, 400);
      if (!profile) return json({ error: "SURVEYOR_PROFILE_NOT_FOUND" }, 404);
      if (roleType === "surveyor") {
        const { data, error } = await admin.from("survey_requests").select("*,survey_deliverables(*)").eq("surveyor_user_id", user.id).order("created_at", { ascending: false }).limit(50);
        if (error) return json({ error: error.message }, 400);
        return json({ requests: data || [] });
      }
      if (roleType === "available") {
        const { data, error } = await admin.from("survey_requests").select("*").eq("status", "broadcasted").order("created_at", { ascending: false }).limit(100);
        if (error) return json({ error: error.message }, 400);
        const requests = (data || []).filter((r: any) => Array.isArray(r.matched_surveyors) && r.matched_surveyors.some((m: any) => m.surveyor_id === profile.id));
        return json({ requests });
      }
      return json({ error: "INVALID_ROLE_TYPE" }, 400);
    }

    if (action === "status") {
      const requestId = String(body.request_id || "");
      if (!requestId) return json({ error: "REQUEST_ID_REQUIRED" }, 400);
      const { data, error } = await admin.from("survey_requests").select("*,survey_deliverables(*)").eq("id", requestId).maybeSingle();
      if (error) return json({ error: error.message }, 400);
      if (!data) return json({ error: "REQUEST_NOT_FOUND" }, 404);
      if (data.client_user_id !== user.id && data.surveyor_user_id !== user.id) return json({ error: "FORBIDDEN" }, 403);
      return json({ request: data, deliverables: data.survey_deliverables || [] });
    }

    return json({ error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "INTERNAL_ERROR" }, 500);
  }
});
