import { supabase } from "@/lib/supabaseClient";

const TABLES = {
  EngineeringFirm: "engineering_firms",
  ConsultingFirm: "engineering_firms",
  Consultant: "consultants",
  Contractor: "contractors",
  Supplier: "suppliers",
};

export function providerTable(providerKey) {
  return TABLES[providerKey] || null;
}

export async function listProviders(providerKey) {
  const table = providerTable(providerKey);
  if (!table) throw new Error(`Unsupported provider type: ${providerKey}`);
  const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateProvider(providerKey, id, patch) {
  const table = providerTable(providerKey);
  if (!table) throw new Error(`Unsupported provider type: ${providerKey}`);
  const { data, error } = await supabase.from(table).update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteProvider(providerKey, id) {
  const table = providerTable(providerKey);
  if (!table) throw new Error(`Unsupported provider type: ${providerKey}`);
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isCurrentUserAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.email === "bytlylmstbyt@gmail.com") return true;
  const { data } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  return ["admin", "owner", "super_admin"].includes(data?.role);
}
