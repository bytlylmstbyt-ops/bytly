const FROM = process.env.BYTLY_EMAIL_FROM || "Bytly <info@mybytly.com>";
const ADMIN_EMAIL = process.env.BYTLY_ADMIN_EMAIL;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToHtml(value = "") {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

async function resendSend({ to, subject, text, html, idempotencyKey, replyTo }) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject,
      text,
      html: html || textToHtml(text),
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.message || payload?.error?.message || `Resend returned HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function generateReply({ name, subject, message, context = {} }) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured.");
  const system = `أنت وكيل مراسلات العملاء الرسمي لمنصة Bytly (بيتلي)، منصة سعودية للخدمات والمشاريع الهندسية.
اكتب ردًا عربيًا طبيعيًا، إنسانيًا، مهذبًا ومختصرًا، وكأنه صادر من موظف دعم حقيقي.
قواعد إلزامية:
- لا تخترع أسعارًا أو عمولات أو سياسات أو مواعيد أو وعودًا غير موجودة في السياق.
- إذا كانت المعلومة غير متاحة، قل بوضوح إن فريق Bytly سيؤكدها للعميل.
- لا تطلب كلمات مرور أو رموز تحقق أو مفاتيح API.
- لا تذكر أنك نموذج ذكاء اصطناعي إلا إذا سُئلت مباشرة.
- لا تستخدم لغة تسويقية مبالغًا فيها.
- اختم باسم "فريق Bytly".
`;
  const prompt = `${system}

اسم العميل: ${name || "العميل"}
موضوع الرسالة: ${subject || ""}
رسالة العميل:
${message || ""}

السياق الموثوق المتاح:
${JSON.stringify(context).slice(0, 12000)}

اكتب نص الرد فقط.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 1200 },
      }),
    }
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || "Gemini request failed.");
  return payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || "";
}

async function handleNewUser(user) {
  const email = String(user?.email || "").trim().toLowerCase();
  const fullName = String(user?.fullName || "").trim() || "مستخدم جديد";
  const role = String(user?.role || "").trim() || "غير محدد";
  const userId = String(user?.id || email);
  if (!email) throw new Error("User email is required.");
  if (!ADMIN_EMAIL) throw new Error("BYTLY_ADMIN_EMAIL is not configured.");

  const welcomeText =
`مرحبًا ${fullName}،

أهلًا وسهلًا بك في Bytly.

سعداء بانضمامك إلى المنصة، ونتطلع لأن تكون تجربتك معنا بسيطة ومفيدة من البداية.

حسابك أصبح جاهزًا، ويمكنك الآن استكشاف المنصة والبدء في استخدام الخدمات المتاحة لك.

إذا احتجت أي مساعدة أو كان لديك سؤال، يمكنك الرد مباشرة على هذه الرسالة وسيتولى فريق Bytly متابعتك.

مع خالص التحية،
فريق Bytly`;

  const adminText =
`تم تسجيل مستخدم جديد في Bytly.

الاسم: ${fullName}
البريد: ${email}
نوع الحساب: ${role}
وقت التسجيل: ${new Date().toISOString()}
معرّف المستخدم: ${userId}

تم إرسال رسالة ترحيب إلى المستخدم من ${FROM}.`;

  const welcome = await resendSend({
    to: email,
    subject: "مرحبًا بك في Bytly",
    text: welcomeText,
    idempotencyKey: `welcome-user/${userId}`,
    replyTo: "info@mybytly.com",
  });

  const admin = await resendSend({
    to: ADMIN_EMAIL,
    subject: `مستخدم جديد في Bytly — ${fullName}`,
    text: adminText,
    idempotencyKey: `admin-new-user/${userId}`,
    replyTo: "info@mybytly.com",
  });

  return { welcome, admin };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed." });

  try {
    const authorization = String(req.headers.authorization || "");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !authorization.startsWith("Bearer ")) {
    return json(res, 401, { ok: false, error: "Unauthorized." });
  }
  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: authorization,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  const authUser = await userResponse.json().catch(() => ({}));
  if (!userResponse.ok || !authUser?.id) return json(res, 401, { ok: false, error: "Invalid session." });

  const body = req.body || {};
    const action = String(body.action || "").trim();

    if (action === "new_user") {
      const result = await handleNewUser(body.user || {});
      return json(res, 200, { ok: true, action, result });
    }

    if (action === "reply") {
      const to = String(body.to || "").trim().toLowerCase();
      const subject = String(body.subject || "").trim();
      const message = String(body.message || "").trim();
      if (!to || !subject || !message) return json(res, 400, { ok: false, error: "to, subject and message are required." });

      const replyText = await generateReply({
        name: body.name,
        subject,
        message,
        context: body.context || {},
      });

      if (!replyText) throw new Error("The communication agent returned an empty reply.");

      const result = await resendSend({
        to,
        subject: subject.toLowerCase().startsWith("re:") ? subject : `Re: ${subject}`,
        text: replyText,
        idempotencyKey: body.idempotencyKey || `reply/${Date.now()}-${to}`,
        replyTo: "info@mybytly.com",
      });

      return json(res, 200, { ok: true, action, reply: replyText, result });
    }

    return json(res, 400, { ok: false, error: "Unsupported action." });
  } catch (error) {
    console.error("Bytly email agent error:", error);
    return json(res, Number(error?.status) >= 400 ? error.status : 500, {
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected error.",
    });
  }
}
