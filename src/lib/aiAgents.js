import { supabase } from "@/lib/supabaseClient";
import { callGemini } from "@/lib/geminiClient";

export async function getPlatformSnapshot() {
  const tables = ["profiles", "engineers", "clients", "engineering_firms", "consultants", "projects", "advertisements", "user_conversations", "support_tickets", "disputes"];
  const entries = await Promise.all(tables.map(async table => {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    return [table, error ? { available: false } : { count: count ?? 0 }];
  }));
  return Object.fromEntries(entries);
}

export async function askBytlyAgent({ agent = "assistant", prompt, includePlatformSnapshot = false, context = {}, responseFormat = "text" }) {
  const liveContext = includePlatformSnapshot ? { ...context, platform_snapshot: await getPlatformSnapshot() } : context;
  return callGemini({ agent, prompt, context: liveContext, responseFormat });
}
