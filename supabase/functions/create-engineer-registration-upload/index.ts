import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const fields = new Set(["graduation_certificate_url", "saudi_engineers_council_certificate_url"]);
const mimeExtensions: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
    const serviceKey = secretKeys ? JSON.parse(secretKeys)["default"] : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return json({ ok: false, error: "خدمة رفع الشهادات غير مهيأة." }, 500);

    const body = await req.json();
    const uploadSessionId = String(body?.uploadSessionId || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uploadSessionId)) {
      return json({ ok: false, error: "جلسة رفع المستند غير صالحة." }, 400);
    }
    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    if (body?.action === "cleanup") {
      const paths = Array.isArray(body?.paths) ? body.paths.map((path: unknown) => String(path)) : [];
      const safePaths = paths.filter((path: string) =>
        path.startsWith(`registration-temp/${uploadSessionId}/`) &&
        !path.includes("..") &&
        /^registration-temp\/[0-9a-f-]{36}\/[a-z_]+-[0-9a-f-]{8}-[0-9a-f-]{4}-4[0-9a-f-]{3}-[89ab][0-9a-f-]{3}-[0-9a-f-]{12}\.(pdf|jpg|png|webp)$/i.test(path)
      );
      if (safePaths.length) {
        const { error } = await admin.storage.from("registration-documents").remove(safePaths);
        if (error) return json({ ok: false, error: "تعذر تنظيف الملفات المؤقتة." }, 400);
      }
      return json({ ok: true, removed: safePaths.length });
    }
    const field = String(body?.field || "");
    const name = String(body?.name || "");
    const type = String(body?.type || "");
    const size = Number(body?.size);

    if (!fields.has(field)) return json({ ok: false, error: "نوع المستند غير مسموح." }, 400);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uploadSessionId)) {
      return json({ ok: false, error: "جلسة رفع المستند غير صالحة." }, 400);
    }
    if (!name || !Number.isFinite(size) || size <= 0 || size > 10 * 1024 * 1024 || !mimeExtensions[type]) {
      return json({ ok: false, error: "ارفع ملف PDF أو JPG أو PNG أو WEBP لا يتجاوز 10 ميجابايت." }, 400);
    }

    const extension = mimeExtensions[type];
    const path = `registration-temp/${uploadSessionId}/${field}-${crypto.randomUUID()}.${extension}`;
    const { data, error } = await admin.storage.from("registration-documents").createSignedUploadUrl(path, { upsert: false });
    if (error || !data?.token) {
      console.error("create engineer registration upload URL failed", error);
      return json({ ok: false, error: "تعذر تجهيز رابط رفع الشهادة. حاول مرة أخرى." }, 400);
    }

    return json({ ok: true, path: data.path || path, token: data.token, expires_in: 7200 });
  } catch (error) {
    console.error("create engineer registration upload error", error);
    return json({ ok: false, error: "تعذر تجهيز رفع الشهادة." }, 500);
  }
});
