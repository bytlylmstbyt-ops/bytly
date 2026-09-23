import { supabase } from "@/lib/supabaseClient";

const ADMIN_EMAIL = "bytlylmstbyt@gmail.com";

async function getActor() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول لإدارة التسويق");
  if (user.email === ADMIN_EMAIL) return user;
  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  if (!["admin", "owner", "super_admin"].includes(profile?.role)) throw new Error("ليس لديك صلاحية إدارة التسويق");
  return user;
}

export async function listSyncStates() {
  await getActor();
  const { data, error } = await supabase.from("sync_states").select("*").order("service", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function listSocialPosts(limit = 100) {
  await getActor();
  const { data, error } = await supabase.from("social_posts").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}

export async function createSocialPost(payload) {
  const user = await getActor();
  const row = { ...payload, created_by: user.id };
  delete row.id;
  delete row.created_date;
  const { data, error } = await supabase.from("social_posts").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function updateSocialPost(id, payload) {
  await getActor();
  const row = { ...payload, updated_at: new Date().toISOString() };
  delete row.id;
  delete row.created_by;
  const { data, error } = await supabase.from("social_posts").update(row).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSocialPost(id) {
  await getActor();
  const { error } = await supabase.from("social_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertSyncState(service, payload = {}) {
  const user = await getActor();
  const { data, error } = await supabase.from("sync_states").upsert({ service, ...payload, created_by: user.id, updated_at: new Date().toISOString() }, { onConflict: "service" }).select().single();
  if (error) throw error;
  return data;
}

export function calculateSocialAnalytics(posts = []) {
  const published = posts.filter((p) => p.status === "published");
  const metrics = published.map((p) => p.metrics || {});
  const sum = (key) => metrics.reduce((n, m) => n + Number(m?.[key] || 0), 0);
  const totalLikes = sum("likes");
  const totalComments = sum("comments");
  const totalShares = sum("shares");
  const totalClicks = sum("clicks");
  const totalReach = sum("reach");
  const totalImpressions = sum("impressions");
  const totalEngagement = totalLikes + totalComments + totalShares + totalClicks;
  const platforms = {};
  published.forEach((post) => {
    const key = post.platform || "unknown";
    if (!platforms[key]) platforms[key] = { total_likes: 0, total_comments: 0, total_engagement: 0, posts_count: 0 };
    const m = post.metrics || {};
    platforms[key].total_likes += Number(m.likes || 0);
    platforms[key].total_comments += Number(m.comments || 0);
    platforms[key].total_engagement += Number(m.likes || 0) + Number(m.comments || 0) + Number(m.shares || 0) + Number(m.clicks || 0);
    platforms[key].posts_count += 1;
  });
  return { success: true, summary: { totalEngagement, totalLikes, totalComments, totalShares, totalClicks, totalReach, totalImpressions }, platforms };
}

export async function getMarketingAnalytics(posts) {
  const source = posts || await listSocialPosts(500);
  return calculateSocialAnalytics(source);
}

export async function testMarketingConnection(platformId) {
  const user = await getActor();

  // LinkedIn is verified through the real Supabase Edge Function, not a local
  // sync flag. The Edge Function uses the managed LinkedIn connection/token.
  if (platformId === "linkedin") {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error("انتهت جلسة الدخول. سجّل الدخول مرة أخرى ثم أعد اختبار LinkedIn.");
    const { data, error } = await supabase.functions.invoke("linkedin-publish", {
      body: { action: "status" },
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    });
    if (error) {
      const details = error?.context?.body || error?.message || "تعذر إرسال طلب فحص LinkedIn.";
      throw new Error(typeof details === "string" ? details : JSON.stringify(details));
    }
    if (data?.ok !== true) {
      return {
        ok: false,
        connected: false,
        platform: platformId,
        statusCode: 200,
        message: data?.error || "تم الوصول إلى الخدمة، لكن اتصال LinkedIn يحتاج إعدادًا.",
      };
    }

    await supabase.from("sync_states").upsert({
      service: "linkedin",
      sync_token: "server-managed",
      last_sync: new Date().toISOString(),
      description: data?.name ? `LinkedIn متصل: ${data.name}` : "LinkedIn متصل عبر الاتصال المُدار",
      created_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "service" });

    return {
      ok: true,
      connected: true,
      platform: platformId,
      message: data?.name ? `تم الاتصال فعليًا بـ LinkedIn: ${data.name}` : "تم الاتصال فعليًا بـ LinkedIn.",
      memberId: data?.memberId || null,
      authorUrn: data?.authorUrn || null,
    };
  }

  const sync = (await supabase.from("sync_states").select("service,last_sync,sync_token").eq("service", platformId).maybeSingle()).data;
  if (!sync) return { ok: false, connected: false, platform: platformId, message: "المنصة غير متصلة بعد" };
  return { ok: Boolean(sync.sync_token), connected: Boolean(sync.sync_token), platform: platformId, message: sync.sync_token ? "الاتصال مسجل" : "المنصة تحتاج إعداد الاتصال" };
}
